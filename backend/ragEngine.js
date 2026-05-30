/**
 * RAG engine for HealthCare-AI (JavaScript / Node.js — no Python).
 *
 * Pipeline (all free / local):
 *   1. Load patient records from the SQLite database (db.js)
 *   2. Turn each record into a text "document"
 *   3. Embed the documents with a local Ollama embedding model (nomic-embed-text)
 *   4. Store the vectors in a vector store that is PERSISTED TO DISK
 *      (vector-index.json) so it is NOT re-embedded on every restart
 *   5. On a query, retrieve the matching patient (vector similarity search)
 *      and STREAM a grounded clinical summary from a local Ollama LLM
 *      (Llama 3 / Mistral), token by token.
 *
 * Nothing leaves the machine; there are no API keys or paid services.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { Document } from '@langchain/core/documents'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

import { getAllPatients, findPatientByName, countPatients } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VECTOR_INDEX_FILE = join(__dirname, 'vector-index.json')

// --- Configuration (override via environment variables) ---------------------
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3'
const EMBED_MODEL = process.env.EMBED_MODEL ?? 'nomic-embed-text'

/** Flatten a patient record into a readable block of text for embedding. */
function patientToText(p) {
  const history = (p.history ?? []).map((h) => `- ${h}`).join('\n')
  const meds = (p.medications ?? []).join(', ')
  return [
    `Patient ID: ${p.id}`,
    `Name: ${p.firstName} ${p.lastName}`,
    `Gender: ${p.gender ?? 'Unknown'}`,
    `Date of Birth: ${p.dob ?? 'Unknown'}`,
    `Blood Type: ${p.bloodType ?? 'Unknown'}`,
    `Medical History:\n${history}`,
    `Current Medications: ${meds}`,
    `Last Visit: ${p.lastVisit ?? 'N/A'}`,
  ].join('\n')
}

// System prompt keeps the model grounded and safe.
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a clinical documentation assistant for a healthcare records ' +
      'system. Using ONLY the patient context provided, write a concise, ' +
      'professional 3-4 sentence clinical summary describing the patient, ' +
      'their key conditions, current medications, and most recent visit. ' +
      'Do not invent facts that are not in the context. Do not give medical ' +
      'advice. Write in plain, neutral language.',
  ],
  ['human', 'Patient context:\n{context}\n\nWrite the clinical summary.'],
])

export class RAGEngine {
  constructor() {
    this.vectorStore = null
    this.chain = null
    this.embeddings = null
  }

  /** Load data, build/restore the vector index, and wire up the chain. */
  async init() {
    this.embeddings = new OllamaEmbeddings({
      model: EMBED_MODEL,
      baseUrl: OLLAMA_BASE_URL,
    })

    this.vectorStore = await this.loadOrBuildIndex()

    const llm = new ChatOllama({
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      temperature: 0.2,
    })
    this.chain = prompt.pipe(llm).pipe(new StringOutputParser())
  }

  /**
   * Restore the vector index from disk if the cache exists and matches the
   * current patient count; otherwise embed everything and persist it.
   * This avoids re-embedding on every server restart.
   */
  async loadOrBuildIndex() {
    const patients = getAllPatients()

    if (existsSync(VECTOR_INDEX_FILE)) {
      try {
        const cache = JSON.parse(await readFile(VECTOR_INDEX_FILE, 'utf-8'))
        if (cache.count === countPatients() && Array.isArray(cache.vectors)) {
          const store = new MemoryVectorStore(this.embeddings)
          const documents = cache.documents.map(
            (d) => new Document({ pageContent: d.pageContent, metadata: d.metadata })
          )
          // Re-hydrate with the pre-computed vectors — no embedding calls.
          await store.addVectors(cache.vectors, documents)
          console.log(`Loaded vector index from disk (${cache.count} patients).`)
          return store
        }
        console.log('Vector index is stale — rebuilding.')
      } catch {
        console.log('Vector index cache unreadable — rebuilding.')
      }
    }

    // Build fresh: embed every patient document and persist to disk.
    console.log(`Embedding ${patients.length} patient(s)...`)
    const documents = patients.map(
      (p) =>
        new Document({
          pageContent: patientToText(p),
          metadata: {
            id: p.id,
            firstName: p.firstName.toLowerCase(),
            lastName: p.lastName.toLowerCase(),
          },
        })
    )
    const texts = documents.map((d) => d.pageContent)
    const vectors = await this.embeddings.embedDocuments(texts)

    const store = new MemoryVectorStore(this.embeddings)
    await store.addVectors(vectors, documents)

    await writeFile(
      VECTOR_INDEX_FILE,
      JSON.stringify({
        count: countPatients(),
        vectors,
        documents: documents.map((d) => ({ pageContent: d.pageContent, metadata: d.metadata })),
      })
    )
    console.log('Vector index built and saved to disk.')
    return store
  }

  findPatient(firstName, lastName) {
    return findPatientByName(firstName, lastName)
  }

  /** Retrieve the grounding context for a patient via vector similarity search. */
  async retrieveContext(firstName, lastName, patient) {
    const fn = firstName.trim().toLowerCase()
    const ln = lastName.trim().toLowerCase()
    const results = await this.vectorStore.similaritySearch(
      `${firstName} ${lastName} medical summary`,
      1,
      (doc) => doc.metadata.firstName === fn && doc.metadata.lastName === ln
    )
    return results.length ? results[0].pageContent : patientToText(patient)
  }

  /**
   * Async generator that STREAMS the AI clinical summary token by token.
   * Yields plain text chunks as the local LLM produces them.
   */
  async *streamSummary(firstName, lastName) {
    const patient = this.findPatient(firstName, lastName)
    if (!patient) return

    const context = await this.retrieveContext(firstName, lastName, patient)
    const stream = await this.chain.stream({ context })
    for await (const chunk of stream) {
      yield chunk
    }
  }

  /** Non-streaming variant (kept for completeness / fallback). */
  async generateSummary(firstName, lastName) {
    const patient = this.findPatient(firstName, lastName)
    if (!patient) return { found: false, patient: null, description: null }

    const context = await this.retrieveContext(firstName, lastName, patient)
    const description = await this.chain.invoke({ context })
    return { found: true, patient, description: description.trim() }
  }
}
