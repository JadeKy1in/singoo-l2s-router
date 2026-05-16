"""JSON file-based thread state persistence.

For PoC: reads/writes ThreadState as JSON files keyed by session_id.
Production: swap this module's implementation out for MongoDB while
keeping the same interface.
"""

from __future__ import annotations

import json
import re
import uuid
from pathlib import Path
from typing import Optional

from schemas.state import ThreadState

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


class ThreadStore:
    def __init__(self, base_dir: str = "data/threads") -> None:
        self._base = Path(base_dir).resolve()
        self._base.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _validate_session_id(session_id: str) -> None:
        if not _UUID_RE.match(session_id):
            raise ValueError(f"Invalid session_id format: {session_id!r}")

    def _path(self, session_id: str) -> Path:
        self._validate_session_id(session_id)
        resolved = (self._base / f"{session_id}.json").resolve()
        if not str(resolved).startswith(str(self._base)):
            raise ValueError("Path traversal detected")
        return resolved

    def save(self, state: ThreadState) -> None:
        path = self._path(state.session_id)
        path.write_text(state.model_dump_json(indent=2), encoding="utf-8")

    def load(self, session_id: str) -> Optional[ThreadState]:
        path = self._path(session_id)
        if not path.exists():
            return None
        data = json.loads(path.read_text(encoding="utf-8"))
        return ThreadState.model_validate(data)

    def exists(self, session_id: str) -> bool:
        return self._path(session_id).exists()

    def delete(self, session_id: str) -> None:
        path = self._path(session_id)
        if path.exists():
            path.unlink()

    def list_sessions(self) -> list[str]:
        return [p.stem for p in self._base.glob("*.json")]

    def list_summaries(self) -> list[dict]:
        """Return lightweight summaries for session listing."""
        summaries = []
        for p in sorted(self._base.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                summaries.append({
                    "session_id": data.get("session_id", p.stem),
                    "intent": data.get("intent"),
                    "status": data.get("status"),
                    "thread_title": data.get("thread_title"),
                    "lead_source": data.get("lead_source"),
                    "turn_count": data.get("turn_count", 0),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                })
            except (json.JSONDecodeError, KeyError):
                continue
        return summaries
