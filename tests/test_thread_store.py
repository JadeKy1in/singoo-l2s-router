"""PICA-Unit: Thread store persistence tests."""

import tempfile
from pathlib import Path

import pytest

from schemas.enums import IntentType, ThreadStatus
from schemas.state import ThreadState
from storage.thread_store import ThreadStore


@pytest.fixture
def store():
    with tempfile.TemporaryDirectory() as tmp:
        yield ThreadStore(base_dir=tmp)


class TestThreadStore:
    def test_save_and_load(self, store):
        state = ThreadState(lead_source="WhatsApp")
        state.add_message("user", "Hello")
        store.save(state)

        loaded = store.load(state.session_id)
        assert loaded is not None
        assert loaded.session_id == state.session_id
        assert loaded.lead_source == "WhatsApp"
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
        assert store.exists(state.session_id)
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
