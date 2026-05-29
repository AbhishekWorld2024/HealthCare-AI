/**
 * Express server exposing the RAG engine to the React frontend.
 *
 * Run with:
 *   npm install
 *   npm start
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
    return res.status(503).json({
      found: false,
      patient: null,
      description: null,
      error: 'Engine not ready',
    })
  }

  const { firstName, lastName } = req.body ?? {}
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' })
  }

  try {
    const result = await engine.generateSummary(firstName, lastName)
    res.json(result)
  } catch (err) {
    console.error('Summary generation failed:', err)
    res.status(500).json({ found: false, patient: null, description: null, error: err.message })
  }
})

// Build the index + connect to the model once at startup.
console.log('Building RAG index and connecting to Ollama... (first run may take a moment)')
engine = new RAGEngine()
await engine.init()
console.log('RAG engine ready.')

app.listen(PORT, () => {
  console.log(`HealthCare-AI RAG API listening on http://localhost:${PORT}`)
})
