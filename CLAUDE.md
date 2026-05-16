# Singoo L2S-Router (Lead-to-Sale Multi-Agent Orchestrator)

**Scope:** This file governs the Singoo project. Fall back to root `CLAUDE.md` for global workflow rules, PICA protocol, and modular architecture standards.

**Status:** PoC Complete (Phase 0-5). 89 tests passing.

## Project Identity

A multi-agent B2B lead-to-sale orchestrator PoC. Simulates overseas B2B marketing: social media interaction → AI sales reception → CRM lead extraction.

## Architecture

Event-Driven State Graph (LangGraph) with Document-Based Thread State (Pydantic).

```
app.py (FastAPI, 8 endpoints + auth middleware + dashboard at /)
  │
  ▼
graph/workflow.py (LangGraph StateGraph, mock_mode-aware routing)
  ├── router_node → agents/router.py (DeepSeek V4 Flash + language detection)
  ├── sales_node  → agents/sales.py (DeepSeek V4 Pro + ChromaDB RAG)
  ├── extractor_node → agents/extractor.py (DeepSeek V4 Pro + BANT correction)
  ├── escalate_node (set pending_human_input)
  └── discard_node
```

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env  # fill in API key
python -m uvicorn app:app --reload --port 8000
# Dashboard: http://127.0.0.1:8000/
# API Docs: http://127.0.0.1:8000/docs
```

## Commands

```bash
python -m singoo serve          # Start server
python -m singoo test           # Run tests
python -m singoo stats          # Session statistics
python -m singoo export-all     # Export pending leads (dry run)
python -m singoo export-all --execute  # Actual export
docker-compose up -d            # Docker deployment
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /thread | Create thread, router + 1 turn sales |
| POST | /thread/{id}/reply | Continue conversation |
| POST | /thread/{id}/human-reply | Human agent responds to escalation |
| POST | /thread/{id}/export | Export lead to CRM webhook |
| GET | / | Dashboard (session list) |
| GET | /view/{id} | Conversation viewer |
| GET | /threads | List all sessions |
| GET | /threads/pending-export | Unexported leads |
| GET | /thread/{id} | Full thread detail + transcript |
| GET | /health | Health check |

## Model Routing

| Node | Model | Purpose |
|------|-------|---------|
| RouterAgent | deepseek-v4-flash | Intent classification (Lead_Gen / Support / Spam) |
| SalesAgent | deepseek-v4-pro | Multi-turn B2B sales + RAG |
| DataExtractorAgent | deepseek-v4-pro | Structured CRM extraction + BANT correction |

## Key Design Decisions

- **Reasoning model awareness**: DeepSeek V4 generates `reasoning_content` before `content`. All agents budget extra `max_tokens` and fall back to `reasoning_content` when `content` is empty.
- **Single-turn sales in real mode**: Workflow exits after each sales turn for multi-turn API interaction. Mock mode loops for test compatibility.
- **BANT score correction**: LLM assigns base score; deterministic code deducts weights for missing BANT fields (Budget: -15, Authority: -10, Need: -10, Timeline: -10, Contact: -15).
- **Storage abstraction**: `ThreadStore` interface with JSON and SQLite backends, swap via `SINGOO_STORE_BACKEND`.

## Architecture: API-First

The backend exposes a JSON REST API. The built-in dashboard (`dashboard.py` + `templates/`) is an OPTIONAL SSR consumer — it calls the same handler functions as the REST endpoints. Any frontend (React/Tailwind SPA, mobile app) can replace it by implementing the contract in `UI_Contract.md`.

## Directory Structure

```
projects/singoo/
├── __main__.py           # CLI entry
├── app.py                # FastAPI (100 lines) — endpoint registration only
├── auth.py               # Bearer token middleware
├── dashboard.py          # Optional SSR frontend (calls api/handlers.py)
├── UI_Contract.md        # API contract for frontend consumers
├── Dockerfile / docker-compose.yml
├── api/handlers.py       # Business logic (all data access goes through here)
├── api/models.py         # Request/response Pydantic models
├── agents/               # Router, Sales, Extractor, LLMClient, Prompts
├── graph/workflow.py     # LangGraph StateGraph
├── rag/knowledge_base.py # ChromaDB
├── storage/              # JSON + SQLite backends (ThreadStore interface)
├── templates/            # Jinja2 SSR templates (dashboard.html, viewer.html)
├── schemas/              # Pydantic models + enums
├── config/settings.py    # Pydantic BaseSettings
├── tests/                # 89 tests in 13 files
└── data/                 # knowledge/ + threads/ + chroma/
```
