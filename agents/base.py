from __future__ import annotations

from abc import ABC, abstractmethod

from schemas.state import ThreadState


class BaseAgent(ABC):
    """Contract for all pipeline agents.

    Each agent receives a ThreadState, performs its task (classification,
    conversation, extraction), mutates the state in place, and returns it
    for the next LangGraph node.
    """

    @abstractmethod
    async def run(self, state: ThreadState) -> ThreadState:
        ...
