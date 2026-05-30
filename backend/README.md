# HealthCare-AI — RAG Backend (100% Free / Local / JavaScript)

Turns a patient name into an **AI-generated clinical summary** using a local
RAG pipeline written entirely in **Node.js** — no Python required.
No paid APIs, no data leaves your machine.

```
React (Vite)  →  Express (Node)  →  Vector store (retrieve)  →  Ollama / Llama 3 (generate)
                      ↑                    ↑                              │
                 SQLite (patients.db)  persisted to disk          streamed token-by-token
                                        (vector-index.json)
```

This is genuine RAG: every patient record is embedded into a vector store, the
relevant record is **retrieved** by similarity search, and the local LLM
**generates** a grounded summary from that retrieved context.

**Key features**
- **SQLite storage** (`patients.db`) — scales to thousands of records, easy to manage.
- **Persistent vector index** (`vector-index.json`) — embeddings are computed once
  and cached to disk, so the server does **not** re-embed on every restart.
- **Streaming responses** — the AI summary is streamed token-by-token (typewriter
  effect) so you see text appear immediately instead of waiting.

---

## Prerequisites (Windows)

1. **Node.js 22.13+** — required for the built-in SQLite module (`node:sqlite`).
   You have v24, which is fine. (No native build tools needed.)
   > On startup you may see a harmless `ExperimentalWarning: SQLite is an
   > experimental feature` — that's just Node noting the built-in SQLite module
   > is still maturing. It does not affect the app.

2. **Ollama** (the local LLM engine) — https://ollama.com/download
   After installing, open a terminal and pull the two models we use:
   ```bash
   ollama pull llama3
   ollama pull nomic-embed-text
   ```
   > `llama3` = the chat model that writes the summary (~8 GB RAM).
   > `nomic-embed-text` = the embedding model for the vector store (small/fast).
   >
   > Low on RAM? Use a lighter chat model instead:
   > ```bash
   > ollama pull mistral
   > ```
   > then set `OLLAMA_MODEL=mistral` before starting (see below).

   Ollama runs in the background at `http://localhost:11434`.

---

## Setup & Run

Open a terminal **inside the `backend` folder**:

```bash
cd backend

REM 1. Install dependencies (one-time)
npm install

REM 2. Load the patient data into SQLite (one-time, or after editing patients.json)
npm run seed

REM 3. Start the API server
npm start
```

When you see `RAG engine ready.` it's good to go. Test it:
```
http://localhost:8000/api/health
```

> **First start** embeds all patients and saves the index to `vector-index.json`.
> Every later start loads that file instantly — no re-embedding.

### Adding / editing patients

1. Edit `patients.json` (add records — it scales to 50, 500, or more).
2. Run `npm run seed` again — this updates SQLite and clears the cached index.
3. Restart with `npm start` — the index rebuilds from the new data.

---

## Configuration (optional)

Override defaults with environment variables before `npm start`:

| Variable          | Default              | Purpose                        |
|-------------------|----------------------|--------------------------------|
| `OLLAMA_MODEL`    | `llama3`             | Chat model that writes summary |
| `EMBED_MODEL`     | `nomic-embed-text`   | Embedding model for retrieval  |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint            |
| `PORT`            | `8000`               | API server port                |

Example (Windows):
```bash
set OLLAMA_MODEL=mistral
npm start
```

---

## Running the full app

You need **two terminals**:

| Terminal | Folder        | Command                          |
|----------|---------------|----------------------------------|
| 1        | `backend`     | `npm run seed` then `npm start`  |
| 2        | project root  | `npm run dev`                    |

Open the frontend at `http://localhost:5173`, search a patient
(e.g. **John Doe**), and you'll see the AI-generated clinical summary.

> If the backend is **not** running, the frontend automatically falls back to
> the static patient data (without the AI summary), so the app never breaks.
