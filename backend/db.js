/**
 * SQLite data layer for HealthCare-AI.
 *
 * Uses Node's BUILT-IN SQLite module (`node:sqlite`) — no native compilation,
 * no Visual Studio build tools, no extra npm packages. Requires Node 22.13+
 * (you have v24, which includes it).
 *
 * Patient records live in a local SQLite database file (patients.db) instead
 * of a flat JSON file. This scales comfortably to thousands of records and
 * lets you add / edit / delete patients with simple SQL — no cloud, no server.
 *
 * `history` and `medications` are arrays, so they are stored as JSON strings
 * in TEXT columns and parsed back into arrays on read.
 */

import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_FILE = join(__dirname, 'patients.db')

const db = new DatabaseSync(DB_FILE)
db.exec('PRAGMA journal_mode = WAL;')

// Create the table on first use.
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id          TEXT PRIMARY KEY,
    firstName   TEXT NOT NULL,
    lastName    TEXT NOT NULL,
    dob         TEXT,
    gender      TEXT,
    bloodType   TEXT,
    history     TEXT,   -- JSON array
    medications TEXT,   -- JSON array
    lastVisit   TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_patients_name
    ON patients (lower(firstName), lower(lastName));
`)

/** Convert a raw DB row into a patient object with parsed arrays. */
function rowToPatient(row) {
  if (!row) return null
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    dob: row.dob,
    gender: row.gender,
    bloodType: row.bloodType,
    history: JSON.parse(row.history ?? '[]'),
    medications: JSON.parse(row.medications ?? '[]'),
    lastVisit: row.lastVisit,
  }
}

/** Insert or replace a patient record. */
export function upsertPatient(p) {
  const stmt = db.prepare(`
    INSERT INTO patients
      (id, firstName, lastName, dob, gender, bloodType, history, medications, lastVisit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      firstName=excluded.firstName, lastName=excluded.lastName, dob=excluded.dob,
      gender=excluded.gender, bloodType=excluded.bloodType, history=excluded.history,
      medications=excluded.medications, lastVisit=excluded.lastVisit
  `)
  stmt.run(
    p.id,
    p.firstName,
    p.lastName,
    p.dob ?? null,
    p.gender ?? null,
    p.bloodType ?? null,
    JSON.stringify(p.history ?? []),
    JSON.stringify(p.medications ?? []),
    p.lastVisit ?? null
  )
}

/** Return every patient. */
export function getAllPatients() {
  const rows = db.prepare('SELECT * FROM patients ORDER BY lastName, firstName').all()
  return rows.map(rowToPatient)
}

/** Find one patient by exact (case-insensitive) first + last name. */
export function findPatientByName(firstName, lastName) {
  const row = db
    .prepare(
      'SELECT * FROM patients WHERE lower(firstName) = lower(?) AND lower(lastName) = lower(?)'
    )
    .get(firstName.trim(), lastName.trim())
  return rowToPatient(row)
}

/** How many patients are stored (used to detect a stale vector index). */
export function countPatients() {
  return db.prepare('SELECT COUNT(*) AS n FROM patients').get().n
}

export default db
