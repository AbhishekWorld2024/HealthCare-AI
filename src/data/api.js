// Client for the local RAG backend (FastAPI + LangChain + Ollama).
// Falls back to the static patient list if the backend is not running,
// so the app still works without the AI service.

import { findPatient } from './patients'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

/**
 * Look up a patient by name and get an AI-generated clinical description.
 * Returns: { found, patient, description }
 */
export async function getPatientSummary(firstName, lastName) {
  try {
    const res = await fetch(`${API_BASE}/api/patient/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName }),
    })

    if (!res.ok) throw new Error(`Backend responded ${res.status}`)

    const data = await res.json()
    return { ...data, source: 'rag' }
  } catch (err) {
    // Backend unavailable — fall back to local lookup (no AI description).
    console.warn('RAG backend unavailable, using local data:', err.message)
    const patient = await findPatient(firstName, lastName)
    return {
      found: Boolean(patient),
      patient: patient ?? null,
      description: null,
      source: 'local',
    }
  }
}
