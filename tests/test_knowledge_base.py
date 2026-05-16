"""PICA-Unit: KnowledgeBase tests (temp dir + ephemeral Chroma)."""

import tempfile
from pathlib import Path

import pytest

from rag.knowledge_base import KnowledgeBase


def _write_md(directory: Path, name: str, content: str) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / name).write_text(content, encoding="utf-8")


class TestKnowledgeBase:
    @pytest.mark.asyncio
    async def test_load_from_temp_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs_dir = Path(tmp) / "docs"
            _write_md(docs_dir, "product.md", "Solar Inverter 50kW.\n\nHigh efficiency.\n\nIP65 rated.")

            kb = KnowledgeBase(docs_path=str(docs_dir), collection_name="test_load")
            await kb.load()
            assert kb._loaded is True

    @pytest.mark.asyncio
    async def test_query_returns_mock_when_no_chroma(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs_dir = Path(tmp) / "empty_docs"
            kb = KnowledgeBase(docs_path=str(docs_dir), collection_name="test_query")
            results = await kb.query("solar inverter", top_k=2)
            assert isinstance(results, list)
            assert len(results) > 0
            assert any("Solar" in r for r in results)

    @pytest.mark.asyncio
    async def test_load_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs_dir = Path(tmp) / "docs"
            _write_md(docs_dir, "product.md", "EV Charger 120kW.\n\nCCS2 compatible.")

            kb = KnowledgeBase(docs_path=str(docs_dir), collection_name="test_idem")
            await kb.load()
            first_loaded = kb._loaded
            await kb.load()  # second call should be no-op
            assert kb._loaded == first_loaded

    @pytest.mark.asyncio
    async def test_empty_dir_does_not_crash(self):
        with tempfile.TemporaryDirectory() as tmp:
            empty_dir = Path(tmp) / "nothing"
            empty_dir.mkdir()
            kb = KnowledgeBase(docs_path=str(empty_dir), collection_name="test_empty")
            await kb.load()
            assert kb._loaded is True
