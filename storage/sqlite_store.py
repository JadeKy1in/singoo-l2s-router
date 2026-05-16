"""SQLite-based thread state persistence.

Same interface as ThreadStore. Swappable via config.
"""

from __future__ import annotations

import json
import sqlite3
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from schemas.state import ThreadState

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS threads (
    session_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    intent TEXT,
    status TEXT,
    thread_title TEXT,
    lead_source TEXT,
    turn_count INTEGER DEFAULT 0,
    lead_score INTEGER,
    company_name TEXT,
    export_status TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intent ON threads(intent);
CREATE INDEX IF NOT EXISTS idx_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_export ON threads(export_status);
CREATE INDEX IF NOT EXISTS idx_updated ON threads(updated_at);
"""


class SqliteStore:
    def __init__(self, db_path: str = "data/singoo.db") -> None:
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(str(self._db_path)) as conn:
            conn.executescript(SCHEMA)
            conn.commit()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def save(self, state: ThreadState) -> None:
        now = datetime.now(timezone.utc).isoformat()
        state.updated_at = datetime.now(timezone.utc)
        lead = state.extracted_entities
        with self._connect() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO threads
                   (session_id, data, intent, status, thread_title, lead_source,
                    turn_count, lead_score, company_name, export_status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    state.session_id,
                    state.model_dump_json(),
                    state.intent,
                    state.status,
                    state.thread_title,
                    state.lead_source,
                    state.turn_count,
                    lead.lead_score if lead else None,
                    lead.company_name if lead else None,
                    state.lead_export_status,
                    state.created_at.isoformat() if state.created_at else now,
                    now,
                ),
            )
            conn.commit()

    def load(self, session_id: str) -> Optional[ThreadState]:
        if not _UUID_RE.match(session_id):
            raise ValueError(f"Invalid session_id format: {session_id!r}")
        with self._connect() as conn:
            row = conn.execute(
                "SELECT data FROM threads WHERE session_id = ?", (session_id,)
            ).fetchone()
            if row is None:
                return None
            return ThreadState.model_validate_json(row["data"])

    def exists(self, session_id: str) -> bool:
        if not _UUID_RE.match(session_id):
            return False
        with self._connect() as conn:
            row = conn.execute(
                "SELECT 1 FROM threads WHERE session_id = ?", (session_id,)
            ).fetchone()
            return row is not None

    def delete(self, session_id: str) -> None:
        if not _UUID_RE.match(session_id):
            return
        with self._connect() as conn:
            conn.execute("DELETE FROM threads WHERE session_id = ?", (session_id,))
            conn.commit()

    def list_sessions(self) -> list[str]:
        with self._connect() as conn:
            rows = conn.execute("SELECT session_id FROM threads").fetchall()
            return [r["session_id"] for r in rows]

    def list_summaries(self) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """SELECT session_id, intent, status, thread_title, lead_source,
                          turn_count, created_at, updated_at
                   FROM threads ORDER BY updated_at DESC"""
            ).fetchall()
            return [dict(r) for r in rows]
