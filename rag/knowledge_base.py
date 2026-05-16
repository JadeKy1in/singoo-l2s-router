"""ChromaDB knowledge base for the RAG-powered Sales Agent.

Loads product spec .md files from data/knowledge/, chunks by paragraph,
indexes with ChromaDB embeddings, and queries by similarity.

Falls back to mock docs if ChromaDB or the embedding endpoint is unreachable.
"""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from config.settings import settings

logger = logging.getLogger(__name__)

_MOCK_DOCS = [
    "Solar Inverter 50kW: High-efficiency grid-tie inverter, 98.5% peak efficiency, IP65 rated.",
    "EV Charger 120kW: DC fast charger, CCS2/CHAdeMO, OCPP 2.0 compliant.",
    "Battery Storage 200kWh: LiFePO4 chemistry, 6000 cycles, modular rack design.",
    "Smart Meter DTS353: Three-phase, RS485/Modbus, accuracy class 0.5S.",
]


class KnowledgeBase:
    """ChromaDB-backed vector store for product documentation.

    On first query, loads .md files from docs_path, chunks them,
    and upserts into a persistent Chroma collection.
    """

    def __init__(
        self,
        docs_path: str = "data/knowledge",
        collection_name: str = "singoo_products",
    ) -> None:
        self._docs_path = Path(docs_path)
        self._collection_name = collection_name
        self._client: chromadb.PersistentClient | None = None
        self._collection: chromadb.Collection | None = None
        self._loaded = False
        self._mock_docs: list[str] = _MOCK_DOCS.copy()

    async def load(self) -> None:
        """Index all .md files into ChromaDB. Idempotent — skips if already loaded."""
        if self._loaded:
            return
        self._docs_path.mkdir(parents=True, exist_ok=True)
        md_files = sorted(self._docs_path.glob("*.md"))
        if not md_files:
            self._loaded = True
            return
        try:
            self._client = chromadb.PersistentClient(
                path="data/chroma",
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            # Reset collection to ensure fresh embedding with current backend
            try:
                self._client.delete_collection(self._collection_name)
            except Exception:
                pass
            self._collection = self._client.get_or_create_collection(
                name=self._collection_name,
            )
            docs = []
            ids = []
            for fpath in md_files:
                text = fpath.read_text(encoding="utf-8").strip()
                if not text:
                    continue
                # Chunk by double newline (paragraphs)
                chunks = [c.strip() for c in text.split("\n\n") if c.strip()]
                for chunk in chunks:
                    doc_id = hashlib.md5(chunk.encode()).hexdigest()[:16]
                    docs.append(chunk)
                    ids.append(doc_id)
            if docs:
                self._collection.add(documents=docs, ids=ids)
            self._loaded = True
        except Exception as exc:
            logger.warning("ChromaDB indexing failed, using mock docs: %s", exc)
            self._collection = None
            self._loaded = True

    async def query(self, query_text: str, top_k: int = 3) -> list[str]:
        """Return top-k relevant document chunks for the query."""
        if not self._loaded:
            await self.load()
        if self._collection is not None:
            try:
                results = self._collection.query(
                    query_texts=[query_text], n_results=top_k
                )
                docs = results.get("documents", [[]])[0]
                if docs:
                    return docs
            except Exception as exc:
                logger.warning("ChromaDB query failed, falling back to mock: %s", exc)
        return self._mock_docs[:top_k]
