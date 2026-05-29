/**
 * RAG engine for HealthCare-AI (JavaScript / Node.js — no Python).
 *
 * Pipeline (all free / local):
 *   1. Load patient records from patients.json
 *   2. Turn each record into a text "document"
 *   3. Embed the documents with a local Ollama embedding model (nomic-embed-text)
 *   4. Store the vectors in an in-memory LangChain vector store
 *   5. On a query, retrieve the matching patient (vector similarity search)
 *      and ask a local Ollama LLM (Llama 3 / Mistral) to write a grounded
 *      clinical description.
 *
 * Nothing leaves the machine; there are no API keys or paid services.
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { Document } from '@langchain/core/documents'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PATIENTS_FILE = join(__dirname, 'patients.json')

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
    this.patients = []
    this.vectorStore = null
    this.chain = null
  }

  /** Load data, build the vector index, and wire up the generation chain. */
  async init() {
    this.patients = JSON.parse(await readFile(PATIENTS_FILE, 'utf-8'))

    const embeddings = new OllamaEmbeddings({
      model: EMBED_MODEL,
      baseUrl: OLLAMA_BASE_URL,
    })

    const documents = this.patients.map(
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

    // Embed + index every patient record in the vector store.
    this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings)

    const llm = new ChatOllama({
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      temperature: 0.2,
    })
    this.chain = prompt.pipe(llm).pipe(new StringOutputParser())
  }

  findPatient(firstName, lastName) {
    const fn = firstName.trim().toLowerCase()
    const ln = lastName.trim().toLowerCase()
    return (
      this.patients.find(
        (p) => p.firstName.toLowerCase() === fn && p.lastName.toLowerCase() === ln
      ) ?? null
    )
  }

  /**
   * Retrieve the patient from the vector store and generate an AI clinical
   * description with the local LLM.
   * Returns: { found, patient, description }
   */
  async generateSummary(firstName, lastName) {
    const patient = this.findPatient(firstName, lastName)
    if (!patient) return { found: false, patient: null, description: null }

    const fn = firstName.trim().toLowerCase()
    const ln = lastName.trim().toLowerCase()

    // RAG retrieval: vector similarity search, filtered to this patient.
    const results = await this.vectorStore.similaritySearch(
      `${firstName} ${lastName} medical summary`,
      1,
      (doc) => doc.metadata.firstName === fn && doc.metadata.lastName === ln
    )
    const context = results.length ? results[0].pageContent : patientToText(patient)

    // Augment + generate with the local LLM.
    const description = await this.chain.invoke({ context })

    return { found: true, patient, description: description.trim() }
  }
}
