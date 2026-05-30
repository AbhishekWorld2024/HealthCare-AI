// Client for the local RAG backend (Express + LangChain.js + Ollama).
//
// The backend streams its response as newline-delimited JSON (NDJSON), so the
// UI can render the AI summary token by token (typewriter effect).
//
// If the backend is unreachable, we fall back to the static patient list so
// the app still works (without the AI summary).

import { findPatient } from './patients'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

/**
 * Stream a patient lookup + AI clinical summary.
 *
 * @param {string} firstName
 * @param {string} lastName
 * @param {object} handlers
 * @param {(patient: object) => void} handlers.onPatient  - matched record (fires once, fast)
 * @param {(token: string) => void}   handlers.onToken    - each streamed text chunk
 * @param {() => void}                handlers.onDone     - generation finished
 * @param {() => void}                handlers.onNotFound - no patient matched
 * @param {(msg: string) => void}     handlers.onError    - generation error
 */
export async function streamPatientSummary(firstName, lastName, handlers) {
  const { onPatient, onToken, onDone, onNotFound, onError } = handlers

  try {
    const res = await fetch(`${API_BASE}/api/patient/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName }),
    })

    if (!res.ok || !res.body) throw new Error(`Backend responded ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // keep the last partial line

      for (const line of lines) {
        if (!line.trim()) continue
        const msg = JSON.parse(line)
        if (msg.type === 'patient') onPatient(msg.patient)
        else if (msg.type === 'token') onToken(msg.token)
        else if (msg.type === 'notfound') onNotFound()
        else if (msg.type === 'done') onDone()
        else if (msg.type === 'error') onError(msg.error)
      }
    }
    return
  } catch (err) {
    // Backend unavailable — fall back to local lookup (no AI description).
    console.warn('RAG backend unavailable, using local data:', err.message)
    const patient = await findPatient(firstName, lastName)
    if (patient) {
      onPatient(patient)
      onDone()
    } else {
      onNotFound()
    }
  }
}
