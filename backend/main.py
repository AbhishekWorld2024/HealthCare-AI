"""
FastAPI server exposing the RAG engine to the React frontend.

Run with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_engine import RAGEngine

app = FastAPI(title="HealthCare-AI RAG API")

# Allow the Vite dev server (and any localhost port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build the index + load the model once at startup (slow the first time only).
engine: RAGEngine | None = None


@app.on_event("startup")
def startup():
    global engine
    print("Building RAG index and loading models... (first run may take a minute)")
    engine = RAGEngine()
    print("RAG engine ready.")


class SearchRequest(BaseModel):
    firstName: str
    lastName: str


@app.get("/api/health")
def health():
    return {"status": "ok", "ready": engine is not None}


@app.post("/api/patient/summary")
def patient_summary(req: SearchRequest):
    """
    Returns the matched patient record plus an AI-generated clinical
    description produced by the local RAG + LLM pipeline.
    """
    if engine is None:
        return {"found": False, "patient": None, "description": None, "error": "Engine not ready"}
    return engine.generate_summary(req.firstName, req.lastName)
