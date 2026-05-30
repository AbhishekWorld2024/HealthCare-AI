/**
 * Seed the SQLite database from patients.json.
 *
 * Run once (or whenever you change patients.json):
 *   npm run seed
 *
 * It also clears the cached vector index so it gets rebuilt with the new data
 * on the next server start.
 */

import { readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { upsertPatient, countPatients } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEED_FILE = join(__dirname, 'patients.json')
const VECTOR_INDEX = join(__dirname, 'vector-index.json')

const patients = JSON.parse(await readFile(SEED_FILE, 'utf-8'))

for (const p of patients) {
  upsertPatient(p)
}

// Drop the cached embeddings so the index rebuilds from the fresh data.
await rm(VECTOR_INDEX, { force: true })

console.log(`Seeded ${patients.length} patient(s). Total in DB: ${countPatients()}.`)
console.log('Vector index cache cleared — it will rebuild on next "npm start".')
