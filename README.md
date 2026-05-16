# Singoo L2S-Router

**Multi-agent B2B lead-to-sale orchestrator.** AI-powered social inquiry triage → RAG sales engagement → CRM lead extraction. Built with LangGraph + DeepSeek V4.

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Tests](https://img.shields.io/badge/tests-89%20passed-green.svg)](.)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PoC](https://img.shields.io/badge/status-PoC%20Complete-brightgreen.svg)](.)

---

## What It Does

Chinese foreign-trade enterprises lose 40-60% of inbound leads within 72 hours — not from lack of volume, but from the human-labor gap between marketing capture and sales response. A WhatsApp inquiry from a Thai factory owner arrives at 2 AM Beijing time. An overworked sales rep replies with a template 14 hours later. The lead goes cold.

Singoo attacks this gap with a **3-agent orchestration pipeline**:

```
Social Inquiry → [Router Agent] → [Sales Agent + RAG] → [Extractor Agent] → CRM JSON
```

1. **Router Agent** — Classifies intent (Lead / Support / Spam) in sub-second, with multi-language detection (Chinese, Arabic, Spanish, French, English)
2. **Sales Agent** — Engages in multi-turn B2B conversation, pulling real product specs from a ChromaDB knowledge base, asking BANT qualifying questions (Budget, Authority, Need, Timeline)
3. **Extractor Agent** — Reads the full conversation and produces structured CRM data with lead scoring and BANT coverage analysis

**Support requests** escalate to a human agent with full context. **Spam** is silently discarded — zero human cost.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/singoo-l2s-router.git
cd singoo-l2s-router
pip install -r requirements.txt

# Configure your LLM endpoint
cp .env.example .env
# Edit .env: set SINGOO_ROUTER_MODEL, SINGOO_SALES_MODEL, SINGOO_EXTRACTOR_MODEL,
# SINGOO_LLM_BASE_URL, and SINGOO_LLM_API_KEY

# Start the server (mock mode — no LLM cost)
python -m singoo serve

# Dashboard: http://127.0.0.1:8000/
# API Docs:  http://127.0.0.1:8000/docs
```

### CLI Commands

```bash
python -m singoo serve              # Start FastAPI server
python -m singoo test               # Run all 89 tests
python -m singoo stats              # Session statistics
python -m singoo export-all         # Dry-run lead export
python -m singoo export-all --execute  # Export to CRM webhook
```

### Docker

```bash
docker-compose up -d
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (replaceable)                  │
│  - Built-in Jinja2 SSR dashboard         │
│  - React/Tailwind SPA (contract in UI_Contract.md) │
└──────────────┬──────────────────────────┘
               │ JSON over HTTP
┌──────────────▼──────────────────────────┐
│  FastAPI (app.py)                        │
│  api/handlers.py — business logic       │
│  api/models.py  — request/response       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  LangGraph StateGraph (graph/workflow.py) │
│                                           │
│  START → router_node → sales_node → END  │
│            │              │               │
│            ├─ Support → escalate_node    │
│            └─ Spam    → discard_node     │
│                          │               │
│                     extractor_node       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Agents (agents/)                        │
│  RouterAgent    — deepseek-v4-flash      │
│  SalesAgent     — deepseek-v4-pro + RAG  │
│  ExtractorAgent — deepseek-v4-pro + BANT │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Storage (storage/)                      │
│  ThreadStore (JSON) / SqliteStore        │
│  KnowledgeBase (ChromaDB)               │
└─────────────────────────────────────────┘
```

### Key Design Decisions

- **API-First.** The backend exposes a JSON REST API. The built-in Jinja2 dashboard is an optional consumer — replace it with React/Vue/mobile without touching backend code. See [`UI_Contract.md`](UI_Contract.md).
- **Reasoning model aware.** DeepSeek V4 generates `reasoning_content` before `content`. All agents budget extra `max_tokens` and fall back to `reasoning_content` when `content` is empty.
- **BANT score correction.** LLM assigns a base score; deterministic code deducts weights for missing BANT fields (Budget: -15, Authority: -10, Need: -10, Timeline: -10, Contact: -15).
- **Storage abstraction.** `ThreadStore` interface with JSON and SQLite backends, swappable via `SINGOO_STORE_BACKEND`.
- **Multi-turn by design.** The workflow exits after each sales turn in real mode for multi-turn API interaction. Mock mode loops for zero-cost testing.

### LLM vs Deterministic Code — Clear Boundary

| LLM Handles (Semantic) | Code Handles (Structural) |
|---|---|
| Intent classification | Graph routing logic |
| Sales conversation + RAG | BANT score correction formula |
| CRM field extraction | Language detection (CJK/Arabic regex) |
| Conversation-complete signal | Empty reply guard (< 10 chars → fallback) |
| Natural language understanding | Retry with exponential backoff (tenacity) |

> **LLMs handle semantic ambiguity. Code handles structural guarantees.**

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/thread` | Create thread, router + 1 turn sales |
| `POST` | `/thread/{id}/reply` | Continue conversation |
| `POST` | `/thread/{id}/human-reply` | Human agent responds to escalation |
| `POST` | `/thread/{id}/export` | Export lead to CRM webhook |
| `GET` | `/` | Dashboard (session list) |
| `GET` | `/view/{id}` | Conversation viewer |
| `GET` | `/threads` | List all sessions |
| `GET` | `/threads/pending-export` | Unexported leads |
| `GET` | `/thread/{id}` | Full thread detail + transcript |
| `GET` | `/health` | Health check |

Full contract with JSON schemas: [`UI_Contract.md`](UI_Contract.md)

---

## Project Structure

```
singoo-l2s-router/
├── README.md
├── UI_Contract.md         # API contract for frontend consumers
├── Demo_Pitch.md          # Strategic portfolio narrative
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
│
├── __main__.py            # CLI entry (serve / test / stats / export-all)
├── app.py                 # FastAPI — endpoint registration (100 lines)
├── auth.py                # Bearer token middleware
├── dashboard.py           # Optional Jinja2 SSR frontend
│
├── api/
│   ├── handlers.py        # Business logic
│   └── models.py          # Pydantic request/response models
│
├── agents/
│   ├── base.py            # BaseAgent ABC
│   ├── router.py          # Intent classification + language detection
│   ├── sales.py           # RAG-powered multi-turn sales
│   ├── extractor.py       # Structured CRM extraction + BANT correction
│   ├── llm_client.py      # Async HTTP client with retry
│   └── prompts.py         # Prompt templates (EN + ZH)
│
├── graph/
│   └── workflow.py        # LangGraph StateGraph pipeline
│
├── rag/
│   └── knowledge_base.py  # ChromaDB vector store
│
├── schemas/
│   ├── state.py           # ThreadState, Message, ExtractedLead
│   └── enums.py           # IntentType, ThreadStatus, AgentType
│
├── storage/
│   ├── thread_store.py    # JSON file-based persistence
│   └── sqlite_store.py    # SQLite persistence (swappable)
│
├── config/
│   └── settings.py        # Pydantic BaseSettings (SINGOO_ prefix)
│
├── templates/
│   ├── dashboard.html     # Session list UI
│   └── viewer.html        # Conversation viewer UI
│
└── tests/                 # 89 tests in 13 files
    ├── conftest.py        # Forces mock mode
    ├── test_api.py        # End-to-end HTTP tests
    ├── test_handlers.py   # Handler unit tests
    ├── test_workflow.py   # Workflow integration tests
    ├── test_extractor.py  # Extractor + BANT correction tests
    ├── test_router_lang.py    # Language detection + classification
    ├── test_knowledge_base.py # RAG knowledge base tests
    ├── test_llm_client.py     # LLM client tests
    ├── test_auth.py           # Auth middleware tests
    ├── test_state_schema.py   # Schema validation tests
    ├── test_thread_store.py   # JSON store tests
    └── test_sqlite_store.py   # SQLite store tests
```

## Configuration

All settings via environment variables with `SINGOO_` prefix:

| Variable | Default | Description |
|----------|---------|-------------|
| `SINGOO_ROUTER_MODEL` | `mock` | Model for intent classification |
| `SINGOO_SALES_MODEL` | `mock` | Model for sales conversation |
| `SINGOO_EXTRACTOR_MODEL` | `mock` | Model for CRM extraction |
| `SINGOO_LLM_BASE_URL` | `http://localhost:8000/v1` | LLM API base URL |
| `SINGOO_LLM_API_KEY` | (empty) | LLM API key |
| `SINGOO_HOST` | `127.0.0.1` | Server bind address |
| `SINGOO_PORT` | `8000` | Server port |
| `SINGOO_MAX_TURNS` | `5` | Max conversation turns |
| `SINGOO_MOCK_MODE` | `true` | Skip LLM calls, use mock responses |
| `SINGOO_STORE_BACKEND` | `json` | `json` or `sqlite` |
| `SINGOO_API_AUTH_TOKEN` | (empty) | Bearer token for `/thread*` routes |
| `SINGOO_CRM_WEBHOOK_URL` | (empty) | Lead export webhook URL |

---

## Development

```bash
# Run tests
python -m singoo test

# With coverage
pip install pytest-cov
pytest tests/ --cov=. --cov-report=html

# Start dev server with auto-reload
python -m uvicorn app:app --reload --port 8000
```

### Mock Mode

Set `SINGOO_MOCK_MODE=true` (default) for zero-cost development. All 89 tests run in under 5 seconds with no API calls. The router uses keyword matching; the sales agent returns a fixed template; the extractor returns mock lead data.

To use real LLMs, set `SINGOO_MOCK_MODE=false` and configure the model names and API endpoint.

---

## The Agent Matrix (Beyond This PoC)

This same pattern — **Router → Domain Agent → Extractor** — extends to other verticals:

| Vertical | Router Classifies | Domain Agent | Extractor Produces |
|---|---|---|---|
| Customer Support | Complaint / Inquiry / Urgent | KB RAG + escalation rules | Ticket JSON |
| Supply Chain | RFQ / Order Status / Exception | Inventory-aware negotiation | Purchase Order JSON |
| HR Onboarding | Policy / Documents / Payroll | Handbook RAG + workflow trigger | Employee Record |

Singoo is the first cell in a synergistic Agent Matrix — same orchestration backbone, same memory architecture, same human-in-the-loop protocol.

---

## Credits

Built with [Claude Code](https://claude.ai/code), May 2026. 0 lines of code written by hand. 89 tests. Production-ready PoC in 5 phases.
