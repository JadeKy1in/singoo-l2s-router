"""LangGraph StateGraph for the Singoo L2S-Router pipeline.

Node flow (multi-turn with HITL):

    START
      │
      ▼
    [router_node]  ←── idempotent: skips LLM on continuation
      │
      ├── intent=Lead_Gen ──► [sales_node] ──► END (wait for user reply)
      │                         │
      │                         └── (if complete) ──► [extractor_node] ──► END
      ├── intent=Support  ──► [escalate_node] ──► END (wait for human)
      │
      └── intent=Spam    ──► [discard_node] ──► END
"""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from agents.router import RouterAgent
from agents.sales import SalesAgent
from agents.extractor import DataExtractorAgent
from config.settings import settings
from schemas.enums import IntentType, AgentType, ThreadStatus
from schemas.state import ThreadState

_router = RouterAgent()
_sales = SalesAgent()
_extractor = DataExtractorAgent()


# --- Node functions ---

async def router_node(state: ThreadState) -> ThreadState:
    if state.intent_set:
        # Continuation — intent already determined, skip LLM
        state.current_agent = AgentType.ROUTER
        return state
    return await _router.run(state)


async def sales_node(state: ThreadState) -> ThreadState:
    return await _sales.run(state)


async def extractor_node(state: ThreadState) -> ThreadState:
    return await _extractor.run(state)


async def escalate_node(state: ThreadState) -> ThreadState:
    state.status = ThreadStatus.ESCALATED
    state.current_agent = AgentType.HUMAN
    state.pending_human_input = True
    return state


async def discard_node(state: ThreadState) -> ThreadState:
    state.status = ThreadStatus.DISCARDED
    return state


# --- Routing logic ---

def route_after_router(state: ThreadState) -> str:
    # Continuation of an in-progress conversation — skip to sales
    if state.status == ThreadStatus.IN_PROGRESS:
        return "sales_node"

    intent = state.intent
    if intent == IntentType.LEAD_GEN:
        return "sales_node"
    elif intent == IntentType.SUPPORT:
        return "escalate_node"
    else:
        return "discard_node"


def route_after_sales(state: ThreadState) -> str:
    if state.conversation_complete:
        return "extractor_node"
    if state.current_agent == AgentType.EXTRACTOR:
        return "extractor_node"
    if state.turn_count >= state.max_turns:
        return "extractor_node"
    # Mock mode: loop to completion (tests expect full pipeline in one call)
    if settings.mock_mode:
        return "sales_node"
    # Real mode: stop after 1 turn for multi-turn interaction
    return END


def route_after_escalate(state: ThreadState) -> str:
    if state.pending_human_input:
        return END  # wait for human
    return END


# --- Graph builder ---

def create_workflow() -> StateGraph:
    builder = StateGraph(ThreadState)

    builder.add_node("router_node", router_node)
    builder.add_node("sales_node", sales_node)
    builder.add_node("extractor_node", extractor_node)
    builder.add_node("escalate_node", escalate_node)
    builder.add_node("discard_node", discard_node)

    builder.set_entry_point("router_node")

    builder.add_conditional_edges("router_node", route_after_router, {
        "sales_node": "sales_node",
        "escalate_node": "escalate_node",
        "discard_node": "discard_node",
    })
    builder.add_conditional_edges("sales_node", route_after_sales, {
        "sales_node": "sales_node",
        "extractor_node": "extractor_node",
        END: END,
    })

    builder.add_edge("extractor_node", END)
    builder.add_edge("escalate_node", END)
    builder.add_edge("discard_node", END)

    return builder
