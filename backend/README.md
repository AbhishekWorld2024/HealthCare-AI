# HealthCare-AI — RAG Backend (100% Free / Local / JavaScript)

Turns a patient name into an **AI-generated clinical summary** using a local
RAG pipeline written entirely in **Node.js** — no Python required.
No paid APIs, no data leaves your machine.

```
React (Vite)  →  Express (Node)  →  Vector store (retrieve)  →  Ollama / Llama 3 (generate)
                                     ↑ Ollama embeddings (nomic-embed-text)
```

This is genuine RAG: every patient record is embedded into a vector store, the
relevant record is **retrieved** by similarity search, and the local LLM
**generates** a grounded summary from that retrieved context.

---

## Prerequisites (Windows)

1. **Node.js 18+** — you already have this for the React app.

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

REM 2. Start the API server
npm start
```

When you see `RAG engine ready.` it's good to go. Test it:
```
http://localhost:8000/api/health
```

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

| Terminal | Folder        | Command         |
|----------|---------------|-----------------|
| 1        | `backend`     | `npm start`     |
| 2        | project root  | `npm run dev`   |

Open the frontend at `http://localhost:5173`, search a patient
(e.g. **John Doe**), and you'll see the AI-generated clinical summary.

> If the backend is **not** running, the frontend automatically falls back to
> the static patient data (without the AI summary), so the app never breaks.
