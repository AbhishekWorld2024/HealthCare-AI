"""
RAG engine for the HealthCare-AI app.

Pipeline (all free / local):
  1. Load patient records from patients.json
  2. Turn each record into a text "document"
  3. Embed the documents with a local HuggingFace model (all-MiniLM-L6-v2)
  4. Store the vectors in a local ChromaDB collection
  5. On a query, retrieve the matching patient and ask a local Ollama LLM
     (Llama 3 / Mistral) to write a natural-language clinical description.

Nothing leaves the machine and there are no API keys or paid services.
"""

import json
import os
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama

# --- Configuration (override via environment variables if you like) ---------
BASE_DIR = Path(__file__).resolve().parent
PATIENTS_FILE = BASE_DIR / "patients.json"
CHROMA_DIR = str(BASE_DIR / "chroma_store")

EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

COLLECTION_NAME = "patients"


def _patient_to_text(p: dict) -> str:
    """Flatten a patient record into a readable block of text for embedding."""
    history = "\n".join(f"- {h}" for h in p.get("history", []))
    meds = ", ".join(p.get("medications", []))
    return (
        f"Patient ID: {p['id']}\n"
        f"Name: {p['firstName']} {p['lastName']}\n"
        f"Gender: {p.get('gender', 'Unknown')}\n"
        f"Date of Birth: {p.get('dob', 'Unknown')}\n"
        f"Blood Type: {p.get('bloodType', 'Unknown')}\n"
        f"Medical History:\n{history}\n"
        f"Current Medications: {meds}\n"
        f"Last Visit: {p.get('lastVisit', 'N/A')}"
    )


# --- System prompt: keep the model grounded and safe ------------------------
PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a clinical documentation assistant for a healthcare records "
            "system. Using ONLY the patient context provided, write a concise, "
            "professional 3-4 sentence clinical summary describing the patient, "
            "their key conditions, current medications, and most recent visit. "
            "Do not invent facts that are not in the context. Do not give medical "
            "advice. Write in plain, neutral language.",
        ),
        ("human", "Patient context:\n{context}\n\nWrite the clinical summary."),
    ]
)


class RAGEngine:
    """Builds the vector index and answers patient summary queries."""

    def __init__(self):
        self.patients = self._load_patients()
        self.embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
        self.vectorstore = self._build_index()
        self.llm = ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.2)

    def _load_patients(self) -> list[dict]:
        with open(PATIENTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    def _build_index(self) -> Chroma:
        """Embed every patient record into a persistent Chroma collection."""
        documents = [
            Document(
                page_content=_patient_to_text(p),
                metadata={
                    "id": p["id"],
                    "firstName": p["firstName"].lower(),
                    "lastName": p["lastName"].lower(),
                },
            )
            for p in self.patients
        ]
        return Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            collection_name=COLLECTION_NAME,
            persist_directory=CHROMA_DIR,
        )

    def _find_patient(self, first_name: str, last_name: str) -> dict | None:
        fn, ln = first_name.strip().lower(), last_name.strip().lower()
        for p in self.patients:
            if p["firstName"].lower() == fn and p["lastName"].lower() == ln:
                return p
        return None

    def generate_summary(self, first_name: str, last_name: str) -> dict:
        """
        Retrieve the patient from the vector store (filtered by name) and ask
        the local LLM to generate a clinical description.
        """
        patient = self._find_patient(first_name, last_name)
        if patient is None:
            return {"found": False, "patient": None, "description": None}

        # RAG retrieval: pull the matching document's content as grounding context.
        results = self.vectorstore.similarity_search(
            query=f"{first_name} {last_name} medical summary",
            k=1,
            filter={
                "$and": [
                    {"firstName": {"$eq": first_name.strip().lower()}},
                    {"lastName": {"$eq": last_name.strip().lower()}},
                ]
            },
        )
        context = results[0].page_content if results else _patient_to_text(patient)

        # Augment + generate with the local LLM.
        chain = PROMPT | self.llm
        response = chain.invoke({"context": context})
        description = response.content.strip()

        return {"found": True, "patient": patient, "description": description}
