# Singoo L2S-Router — Demo Pitch

**Role Target:** Senior AI Agent PM
**Audience:** CTO & CEO
**Artifact:** Strategic Portfolio — AI-Native PoC Delivery

---

## 1. Business Focus (The Hook)

### The Pain Point

Chinese foreign-trade enterprises lose 40-60% of inbound leads within 72 hours. The bottleneck is not lead volume — it is the **human-labor gap between marketing capture and sales response**. A WhatsApp inquiry from a Thai factory owner arrives at 2 AM Beijing time. An overworked sales rep replies with a template 14 hours later. The lead goes cold.

This PoC — **Singoo L2S-Router** — attacks exactly this gap.

### What It Does

Singoo is a **multi-agent orchestration hub** that simulates a complete B2B foreign-trade pipeline:

```
Social Inquiry → AI Triage → AI Sales (with product knowledge) → CRM Lead Extraction
```

A single unstructured message ("I need 100 solar inverters for my Thailand factory") triggers three AI agents working in sequence:

1. **Router Agent** classifies intent: Lead / Support / Spam (sub-second, lightweight model)
2. **Sales Agent** engages in multi-turn conversation, pulling real product specs from a vector knowledge base, asking BANT qualifying questions, adapting to the buyer's language
3. **Extractor Agent** reads the full conversation and produces structured CRM data — company name, contact, budget, timeline, lead score — ready for a human closer

For Support requests, the system **escalates to a human agent** with full context. For Spam, it discards silently — zero human cost.

### The Bigger Picture: Agent Matrix

This single use case proves a broader architecture. The same pattern — **Router → Domain Agent → Extractor** — extends to:

| Vertical | Router Classifies | Domain Agent Handles | Extractor Produces |
|---|---|---|---|
| Customer Support | Complaint / Inquiry / Urgent | Knowledge-base RAG + escalation rules | Ticket JSON for Zendesk |
| Supply Chain | RFQ / Order Status / Exception | Inventory-aware negotiation agent | Purchase order JSON |
| HR Onboarding | Policy Question / Document Request / Payroll | Handbook RAG + workflow trigger | Employee record update |

Singoo is the first cell in a **synergistic Agent Matrix** — each vertical shares the same orchestration backbone, the same memory architecture, the same human-in-the-loop protocol. Build one, scale to ten.

---

## 2. Architectural Elegance (The CTO Hook)

### Event-Driven State Graph

We chose **LangGraph's StateGraph** over a linear pipeline or a monolithic LLM call. Why:

- **Foreign trade is a state machine.** A lead progresses through discrete states: `active → in_progress → completed / escalated / discarded`. Each state transition is a business event that can be observed, audited, and intercepted.
- **Human-in-the-loop is native.** At any node (e.g., Support escalation), the graph pauses, sets `pending_human_input = True`, and waits. No polling, no webhooks — the state IS the contract.
- **Resumability.** The graph exits after every sales turn. The next API call resumes from the saved state. This means a conversation can span hours or days with zero in-memory state on the server.

```
START → [router_node] → Lead_Gen → [sales_node] → END (wait)
                                  → Support  → [escalate_node] → END (wait)
                                  → Spam     → [discard_node] → END
```

### Document-Based Thread State (JSONB)

We modeled the entire conversation as a single JSON document (`ThreadState`) flowing through the graph:

```json
{
  "session_id": "uuid",
  "global_context": [{"role": "user", "content": "..."}],
  "intent": "Lead_Gen",
  "extracted_entities": {
    "company_name": "Thai Solar Co.",
    "lead_score": 75,
    "missing_info": ["authority"]
  },
  "current_agent": "Sales_Agent",
  "status": "in_progress"
}
```

**Why this matters for scalability:**
- **Schema-free iteration.** During PoC, we added `detected_language`, `conversation_complete`, `lead_export_status`, and `intent_set` across 5 phases — zero migrations, zero downtime. The Pydantic model evolved; the JSON persisted.
- **Agent-agnostic payload.** The same `ThreadState` is consumed by Router, Sales, and Extractor agents without coupling. New agents (e.g., a "Fraud Detector") can be inserted into the graph as new nodes that read and mutate the same document.
- **Auditability.** Every state transition is a saved JSON file (or SQLite row). For regulated industries, this is a compliance goldmine.

### Storage Abstraction

The storage layer (`ThreadStore` interface) was implemented twice — JSON file-based for PoC agility, then SQLite (with indexed columns for intent, status, export_status) for query performance. The API layer never changed. This proves the pattern: **start with files, swap to a database when you need queries, swap to a data warehouse when you need analytics** — the business logic doesn't care.

### Technology Surface

| Layer | Choice | Rationale |
|---|---|---|
| Orchestration | LangGraph (Python) | Native state machine with checkpointing |
| LLM | DeepSeek V4 (Flash/Pro) | Reasoning models with `reasoning_content` fallback |
| RAG | ChromaDB + OpenAI Embeddings | In-memory vector search, zero-infra for PoC |
| API | FastAPI | Async-native, auto-generated OpenAPI docs |
| Storage | JSON → SQLite | Interface abstraction enables backend swapping |
| Frontend | Jinja2 SSR | Zero-build dashboard at `/` |
| Auth | Bearer Token Middleware | Optional, zero-config when disabled |
| Deployment | Docker + docker-compose | Single command: `docker-compose up` |

### The DeepSeek V4 Discovery

DeepSeek V4 is a **reasoning model** — it spends tokens on internal reasoning (`reasoning_content`) before producing visible output (`content`). Our initial `max_tokens=10` for the Router produced empty content because all 10 tokens were consumed by reasoning. The fix — increasing to 256 and adding `reasoning_content` as a fallback — is an example of **model-aware prompt engineering** that separates a production system from a toy demo.

---

## 3. Clear AI Boundaries (Separation of Concerns)

This is not a "GPT wrapper." The LLM is one component in a deterministic orchestration framework. Here is exactly what each layer owns:

### What the LLM/Agent Handles (Semantic, Non-Deterministic)

| Agent | LLM Responsibility | Model |
|---|---|---|
| **RouterAgent** | Classify unstructured buyer intent (Lead_Gen / Support / Spam) from natural language. Handle Chinese, Arabic, Spanish, French input without translation middleware. | `deepseek-v4-flash` |
| **SalesAgent** | Generate contextually-relevant sales responses using RAG-retrieved product specs. Ask BANT qualifying questions. Detect when the conversation is complete and signal extraction. | `deepseek-v4-pro` |
| **ExtractorAgent** | Parse full conversation into structured BANT fields (company, contact, budget, timeline, lead score). Handle ambiguous or incomplete information. | `deepseek-v4-pro` |

### What Deterministic Code Handles (Rule-Based, Reliable)

| Layer | Responsibility |
|---|---|
| **LangGraph Workflow** | Routing logic (`route_after_router`, `route_after_sales`). State transitions. Turn counting. Idempotency guard (skip Router on continuation). |
| **BANT Score Correction** | After LLM extraction, deterministic code adjusts `lead_score` based on BANT field coverage: each missing field deducts a fixed weight (Budget: -15, Authority: -10, etc.). LLM provides a base score; code enforces the formula. |
| **Language Detection** | CJK and Arabic character-set regex detection — no LLM call needed for language classification. Purely deterministic. |
| **Output Guards** | Empty reply detection (< 10 chars → safe fallback). JSON repair retry loop (parse error → corrective prompt → retry). `[CONVERSATION_COMPLETE]` token parsing. |
| **Storage & Persistence** | UUID validation, path traversal prevention (`resolve()` guard), SQLite parameterized queries, JSON serialization. |
| **Auth Middleware** | Bearer token validation against `SecretStr`. Public path whitelist (`/`, `/health`, `/docs`). |
| **Retry Logic** | Tenacity exponential backoff (3 attempts, 2-30s) for 5xx and timeout errors. Non-retryable errors (4xx) fail fast. |

### The Principle

> **LLMs handle semantic ambiguity. Code handles structural guarantees.**

The LLM decides *what the buyer means*. The code decides *what happens next*. This boundary means:
- The LLM can be swapped (DeepSeek → GPT-4 → Claude) without touching business logic
- The workflow can be audited step-by-step (every state transition is a saved artifact)
- Failures are isolated: a bad LLM extraction still produces a valid `ExtractedLead` with `missing_info` populated

---

## 4. The Agentic Dev Process (Meta-Skill Demo)

### How I Built This Without Writing Code

This PoC was developed through **AI agent orchestration**, not traditional manual coding. I acted as the **AI Agent PM** — the human in the loop who defines scope, reviews architecture, validates output, and maintains strategic alignment. The AI agent (Claude Code) executed all implementation.

### The Memory Bank Protocol

I maintained 6 core markdown files that functioned as the **persistent context layer** between human intent and AI execution:

| File | Role |
|---|---|
| `projectBrief.md` | The non-negotiable success criteria. Every phase was validated against these 3 core requirements. |
| `productContext.md` | User stories and persona definitions. The AI agent used these to calibrate prompt engineering (e.g., "respond in the customer's language"). |
| `systemPatterns.md` | Architecture decisions (Event-Driven State Graph, Document-Based Thread State). This was the "why" behind every technical choice. |
| `CLAUDE.md` | Project-specific constraints, commands, and development rules. The AI agent loaded this on every session start. |
| `progress.md` (×11) | Phase-by-phase checkpoint files. Each recorded completed tasks, test results, and architectural decisions. Used for crash recovery and context handoff between sessions. |
| `Demo_Pitch.md` | This document. The strategic translation of technical artifacts into business narrative. |

### The Development Rhythm

Each phase followed a strict protocol enforced by the root `CLAUDE.md`:

```
1. Plan (Architecture Agent) → 2. Decompose (Implementation Plan)
   → 3. Execute (Code Generation) → 4. PICA Audit (Unit → Security → Integration → Regression)
   → 5. Progress Checkpoint → 6. Commit
```

Key metrics from this process:

| Metric | Value |
|---|---|
| Development Phases | 5 (Init → LLM → Multi-turn → Hardening → Production) |
| Total Prompts / Agent Interactions | ~60 exchanges across 5 sessions |
| Code Generated | 26 source files, 13 test files, 2,707 lines |
| Test Coverage | 89 tests, 0 failures, 0 regressions |
| Bugs Found & Fixed During Dev | 6 (model token sizing, LangGraph dict serialization, ChromaDB indexing, Jinja2 caching, Windows SQLite locking, reasoning model content fallback) |
| Human Code Written | 0 lines |
| Human Decisions Made | Model selection, architecture approval, phase scope definition, PICA gate sign-off |

### What This Proves

1. **I can define AI agent scope precisely.** The AI agent never wandered into over-engineering because the Memory Bank files constrained its context window to exactly what mattered.

2. **I understand AI-native testing.** The PICA protocol (Unit → Security → Integration → Regression) caught 6 bugs before any code reached a commit. The `mock_mode` flag decoupled tests from LLM costs — all 89 tests run in under 5 seconds with zero API spend.

3. **I can translate between business and architecture.** The same person who wrote the `projectBrief.md` success criteria also designed the LangGraph state machine. This is the PM-Engineer bridge that AI-native development requires.

4. **I can recover from AI agent failures.** When the DeepSeek V4 reasoning model returned empty content (all tokens consumed by `reasoning_content`), I debugged the raw API response, identified the root cause, and directed the agent to implement the fix. This is not "prompt and pray" — it is systematic AI debugging.

5. **I can scale this pattern.** The Agent Matrix concept (Section 1) is not speculation. The Singoo architecture — StateGraph + Document State + Agent Interface + Storage Abstraction — is a **platform template** that can be cloned for any vertical with the same orchestration backbone.

---

*Built with Claude Code, May 2026.*
*0 lines of code written by hand. 89 tests. Production-ready PoC in 5 phases.*
