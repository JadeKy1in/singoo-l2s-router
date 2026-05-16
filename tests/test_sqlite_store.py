"""PICA-Unit: SQLite store tests."""

import tempfile
from pathlib import Path

import pytest

from schemas.state import ThreadState
from storage.sqlite_store import SqliteStore


@pytest.fixture
def store():
    with tempfile.TemporaryDirectory() as tmp:
        s = SqliteStore(db_path=str(Path(tmp) / "test.db"))
        yield s
        # Force close all connections on Windows
        import gc
        gc.collect()


class TestSqliteStore:
    def test_save_and_load(self, store):
        state = ThreadState(lead_source="WhatsApp")
        state.add_message("user", "Hello")
        store.save(state)

        loaded = store.load(state.session_id)
        assert loaded is not None
        assert loaded.session_id == state.session_id
        assert len(loaded.global_context) == 1

    def test_load_missing_returns_none(self, store):
        assert store.load("00000000-0000-0000-0000-000000000000") is None

    def test_exists(self, store):
        state = ThreadState()
        assert not store.exists(state.session_id)
        store.save(state)
        assert store.exists(state.session_id)

    def test_delete(self, store):
        state = ThreadState()
        store.save(state)
        store.delete(state.session_id)
        assert not store.exists(state.session_id)

    def test_list_sessions(self, store):
        s1 = ThreadState()
        s2 = ThreadState()
        store.save(s1)
        store.save(s2)
        sessions = store.list_sessions()
        assert s1.session_id in sessions
        assert s2.session_id in sessions

    def test_list_summaries(self, store):
        state = ThreadState(lead_source="Email")
        store.save(state)
        summaries = store.list_summaries()
        assert len(summaries) == 1
        assert summaries[0]["session_id"] == state.session_id

    def test_invalid_uuid_rejected(self, store):
        with pytest.raises(ValueError, match="Invalid session_id"):
            store.load("not-a-uuid")

    def test_roundtrip_preserves_full_state(self, store):
        state = ThreadState(
            lead_source="Phone",
            intent="Lead_Gen",
            thread_title="Test thread",
        )
        state.add_message("user", "Buy panels")
        state.add_message("assistant", "Which model?")
        store.save(state)

        loaded = store.load(state.session_id)
        assert loaded.lead_source == "Phone"
        assert loaded.intent == "Lead_Gen"
        assert loaded.thread_title == "Test thread"
        assert len(loaded.global_context) == 2
