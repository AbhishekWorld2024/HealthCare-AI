# HealthCare-AI — RAG Backend (100% Free / Local)

This backend turns a patient name into an **AI-generated clinical summary** using
a local RAG pipeline. No paid APIs, no data leaves your machine.

```
React (Vite)  →  FastAPI  →  ChromaDB (retrieve)  →  Ollama / Llama 3 (generate)
                              ↑ HuggingFace embeddings (all-MiniLM-L6-v2)
```

---

## Prerequisites (Windows)

1. **Python 3.10+** — https://www.python.org/downloads/
   (During install, tick **"Add python.exe to PATH"**.)

2. **Ollama** (the local LLM engine) — https://ollama.com/download
   After installing, open a terminal and pull a model:
   ```bash
   ollama pull llama3
   ```
   > Llama 3 (8B) needs ~8 GB RAM. If your machine is smaller, use a lighter model:
   > ```bash
   > ollama pull mistral
   > ```
   > then set `OLLAMA_MODEL=mistral` (see step 4 below).

   Ollama runs automatically in the background at `http://localhost:11434`.

---

## Setup & Run

Open a terminal **inside the `backend` folder**:

```bash
cd backend

REM 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate

REM 2. Install dependencies (one-time, downloads packages)
pip install -r requirements.txt

REM 3. Start the API server
uvicorn main:app --reload --port 8000
```

The **first startup is slow** (it downloads the embedding model and builds the
vector index). When you see `RAG engine ready.` it's good to go.

Test it:
```
http://localhost:8000/api/health
```

---

## Using a different model

The defaults can be overridden with environment variables before starting:

```bash
set OLLAMA_MODEL=mistral
uvicorn main:app --reload --port 8000
```

| Variable          | Default                                    |
|-------------------|--------------------------------------------|
| `OLLAMA_MODEL`    | `llama3`                                   |
| `OLLAMA_BASE_URL` | `http://localhost:11434`                   |
| `EMBED_MODEL`     | `sentence-transformers/all-MiniLM-L6-v2`   |

---

## Running the full app

You need **two terminals**:

| Terminal | Folder      | Command                                   |
|----------|-------------|-------------------------------------------|
| 1        | `backend`   | `uvicorn main:app --reload --port 8000`   |
| 2        | project root| `npm run dev`                             |

Then open the frontend at `http://localhost:5173`, search a patient
(e.g. **John Doe**), and you'll see the AI-generated clinical summary.

> If the backend is **not** running, the frontend automatically falls back to
> the static patient data (without the AI summary), so the app never breaks.
