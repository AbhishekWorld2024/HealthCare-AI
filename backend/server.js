/**
 * Express server exposing the RAG engine to the React frontend.
 *
 * Run with:
 *   npm install
 *   npm run seed   (first time, loads patients.json into SQLite)
 *   npm start
 *
 * The /api/patient/summary endpoint STREAMS its response as newline-delimited
 * JSON (NDJSON) so the frontend can render the AI summary token by token:
 *   {"type":"patient","patient":{...}}   <- sent first, instantly
 *   {"type":"token","token":"John"}      <- repeated as the LLM generates
 *   {"type":"done"}                      <- end of stream
 *   {"type":"notfound"}                  <- if no patient matched
 */

import express from 'express'
import cors from 'cors'

import { RAGEngine } from './ragEngine.js'

const PORT = process.env.PORT ?? 8000

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
)

let engine = null

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ready: engine !== null })
})

app.post('/api/patient/summary', async (req, res) => {
  if (!engine) {
    return res.status(503).json({ type: 'error', error: 'Engine not ready' })
  }

  const { firstName, lastName } = req.body ?? {}
  if (!firstName || !lastName) {
    return res.status(400).json({ type: 'error', error: 'firstName and lastName are required' })
  }

  // Stream newline-delimited JSON.
  res.setHeader('Content-Type', 'application/x-ndjson')
  res.setHeader('Cache-Control', 'no-cache')

  const send = (obj) => res.write(JSON.stringify(obj) + '\n')

  const patient = engine.findPatient(firstName, lastName)
  if (!patient) {
    send({ type: 'notfound' })
    return res.end()
  }

  // Send the structured record immediately so the card renders right away.
  send({ type: 'patient', patient })

  try {
    for await (const token of engine.streamSummary(firstName, lastName)) {
      send({ type: 'token', token })
    }
    send({ type: 'done' })
  } catch (err) {
    console.error('Streaming failed:', err)
    send({ type: 'error', error: err.message })
  }
  res.end()
})

// Build / restore the index and connect to the model once at startup.
console.log('Starting RAG engine... (embeds patients on first run, then caches to disk)')
engine = new RAGEngine()
await engine.init()
console.log('RAG engine ready.')

app.listen(PORT, () => {
  console.log(`HealthCare-AI RAG API listening on http://localhost:${PORT}`)
})
