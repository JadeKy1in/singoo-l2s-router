# Singoo L2S-Router — UI Contract

**Version:** 0.3.0
**Purpose:** This document is the API contract between the Singoo backend and any frontend consumer (built-in Jinja2 dashboard, React/Tailwind SPA, mobile app, etc.). The backend exposes a JSON REST API. The SSR dashboard at `/` and `/view/{id}` is an optional consumer of this same API — it can be removed without affecting the backend.

## Architecture Boundary

```
┌─────────────────────────────────────────┐
│  Frontend (any tech)                     │
│  - React/Tailwind SPA                    │
│  - Mobile app                            │
│  - Built-in Jinja2 dashboard (optional)  │
│  - Third-party CRM integration           │
└──────────────┬──────────────────────────┘
               │ JSON over HTTP
               │ Bearer token (optional)
┌──────────────▼──────────────────────────┐
│  Backend (FastAPI)                       │
│  api/handlers.py  — business logic      │
│  agents/          — LLM orchestration   │
│  graph/workflow.py — LangGraph pipeline │
│  storage/         — JSON/SQLite store   │
└─────────────────────────────────────────┘
```

The frontend MUST only communicate through the documented REST endpoints below. Direct filesystem access, direct database queries, or calling internal Python functions are not supported.

---

## 1. Authentication

**Mode:** Bearer token (optional — disabled by default)

When `SINGOO_API_AUTH_TOKEN` is set in the backend environment:
- All `/thread*` endpoints require: `Authorization: Bearer <token>`
- Public paths (no auth): `/`, `/health`, `/docs`, `/openapi.json`

When not configured, all endpoints are public.

**Error response (401):**
```json
{"detail": "Invalid or missing API token"}
```

---

## 2. Endpoints

### 2.1 Health Check

```
GET /health
Auth: none
```

**Response (200):**
```json
{"status": "ok"}
```

---

### 2.2 Create Thread

Creates a new conversation thread. Runs RouterAgent (intent classification) + 1 turn of SalesAgent. Returns the initial assistant reply.

```
POST /thread
Auth: required (if token configured)
Content-Type: application/json
```

**Request:**
```json
{
  "user_message": "I need 100 solar inverters for my factory in Thailand",
  "lead_source": "WhatsApp"
}
```

| Field | Type | Required | Constraints |
|-------|------|:---:|------|
| `user_message` | string | yes | 1–10,000 chars |
| `lead_source` | string | no | max 50 chars, default `"WhatsApp"` |

**Response (201):**
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "intent": "Lead_Gen",
  "status": "in_progress",
  "lead_source": "WhatsApp",
  "turn_count": 1,
  "thread_title": "I need 100 solar inverters for my factory in Thailand",
  "pending_human_input": false,
  "conversation_complete": false,
  "detected_language": "en",
  "lead_export_status": null,
  "assistant_reply": "Thanks for your inquiry! We specialize in new energy equipment. Could you share your target specifications and budget range?",
  "extracted_entities": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string (UUID) | Unique thread identifier — save this for subsequent calls |
| `intent` | string | `"Lead_Gen"`, `"Support"`, or `"Spam"` |
| `status` | string | `"active"`, `"in_progress"`, `"completed"`, `"escalated"`, `"discarded"` |
| `lead_source` | string | Channel the lead came from |
| `turn_count` | integer | Number of sales turns so far |
| `thread_title` | string | Truncated first message (max 83 chars) |
| `pending_human_input` | boolean | `true` if waiting for human agent reply (Support escalation) |
| `conversation_complete` | boolean | `true` when SalesAgent has fully qualified the lead |
| `detected_language` | string\|null | `"zh"`, `"ar"`, `"en"` — detected from first message |
| `lead_export_status` | string\|null | `"pending"`, `"exported"`, `"failed"` |
| `assistant_reply` | string\|null | The SalesAgent's response. Display this to the user. |
| `extracted_entities` | object\|null | ExtractedLead (see §3). `null` until conversation is complete. |

**intent values and UX behavior:**

| intent | Frontend behavior |
|--------|-------------------|
| `Lead_Gen` | Show assistant reply. Enable reply input. Continue multi-turn. |
| `Support` | Show escalation message. Disable reply input. Show "A human agent will contact you." |
| `Spam` | Show discarded message. Disable reply input. No further action. |

---

### 2.3 Reply to Thread

Continue an existing conversation. Adds the user's message and runs 1 turn of SalesAgent (or ExtractorAgent if the conversation is complete).

```
POST /thread/{session_id}/reply
Auth: required
Content-Type: application/json
```

**Request:**
```json
{
  "user_message": "Our budget is around $50,000 and we need delivery within 60 days"
}
```

| Field | Type | Required | Constraints |
|-------|------|:---:|------|
| `user_message` | string | yes | 1–10,000 chars |

**Response (200):** Same schema as `POST /thread` response (see §2.2).

**Error responses:**
- `404` — session_id not found
- `400` — thread is already complete (`{"detail": "Thread is already complete"}`)

---

### 2.4 Human Reply to Escalated Thread

When a Support thread is escalated, a human agent can reply through this endpoint. Marks the thread as completed.

```
POST /thread/{session_id}/human-reply
Auth: required
Content-Type: application/json
```

**Request:**
```json
{
  "user_message": "We'll send a technician to your site within 48 hours."
}
```

| Field | Type | Required | Constraints |
|-------|------|:---:|------|
| `user_message` | string | yes | 1–10,000 chars |

**Response (200):** Same schema as `POST /thread` response (see §2.2). Note: `assistant_reply` will contain the human agent's message prefixed with `[Human Agent]`.

**Error responses:**
- `404` — session_id not found
- `400` — thread is not in escalated state (`{"detail": "Thread is not escalated"}`)

---

### 2.5 Get Thread Detail

Full thread detail including the complete conversation transcript and extracted lead data.

```
GET /thread/{session_id}
Auth: required
```

**Response (200):**
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "intent": "Lead_Gen",
  "status": "completed",
  "lead_source": "WhatsApp",
  "turn_count": 5,
  "max_turns": 5,
  "thread_title": "I need 100 solar inverters for my factory in Thailand",
  "pending_human_input": false,
  "conversation_complete": true,
  "detected_language": "en",
  "lead_export_status": "pending",
  "conversation": [
    {
      "role": "user",
      "content": "I need 100 solar inverters for my factory in Thailand",
      "timestamp": "2026-05-16T12:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Thanks for your inquiry! ...",
      "timestamp": "2026-05-16T12:00:02.000Z"
    }
  ],
  "extracted_entities": {
    "company_name": "Thai Solar Co.",
    "contact_name": "Somsak Lee",
    "contact_email": "somsak@thaisolar.example.com",
    "contact_phone": "+66-81-234-5678",
    "country": "Thailand",
    "purchase_intent": "high",
    "product_interest": "Solar Inverter 50kW",
    "lead_score": 75,
    "score_justification": "Base 75, 3/5 BANT filled, -25 penalty → 75",
    "missing_info": ["authority", "timeline"],
    "notes": "Customer needs 100 units. Budget discussed (~$50k). Requires technical spec sheet."
  },
  "created_at": "2026-05-16T12:00:00.000Z",
  "updated_at": "2026-05-16T12:03:30.000Z"
}
```

**Error:** `404` — session_id not found

---

### 2.6 List All Threads

Returns lightweight summaries of all sessions, newest first. Use this for the session list sidebar/dashboard.

```
GET /threads
Auth: required
```

**Response (200):**
```json
[
  {
    "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "intent": "Lead_Gen",
    "status": "completed",
    "thread_title": "I need 100 solar inverters...",
    "lead_source": "WhatsApp",
    "turn_count": 5,
    "created_at": "2026-05-16T12:00:00.000Z",
    "updated_at": "2026-05-16T12:03:30.000Z"
  }
]
```

---

### 2.7 Export Lead to CRM

Triggers CRM webhook export for a completed lead. Idempotent — returns error if already exported.

```
POST /thread/{session_id}/export
Auth: required
```

**Response (200):**
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "export_status": "exported",
  "lead": {
    "company_name": "Thai Solar Co.",
    "contact_name": "Somsak Lee",
    "contact_email": "somsak@thaisolar.example.com",
    "contact_phone": "+66-81-234-5678",
    "country": "Thailand",
    "purchase_intent": "high",
    "product_interest": "Solar Inverter 50kW",
    "lead_score": 75,
    "missing_info": ["authority", "timeline"],
    "notes": "..."
  }
}
```

**Error responses:**
- `404` — session_id not found
- `400` — no lead data or already exported
- `502` — CRM webhook failed

---

### 2.8 List Pending Exports

Threads with completed leads that haven't been exported yet.

```
GET /threads/pending-export
Auth: required
```

**Response (200):**
```json
[
  {
    "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "intent": "Lead_Gen",
    "status": "completed",
    "lead_score": 75,
    "company_name": "Thai Solar Co.",
    "export_status": "pending"
  }
]
```

---

## 3. Data Types

### 3.1 ExtractedLead

The structured CRM lead record produced by DataExtractorAgent.

```typescript
interface ExtractedLead {
  company_name: string | null;       // max 200 chars
  contact_name: string | null;       // max 200 chars
  contact_email: string | null;      // email format or null
  contact_phone: string | null;      // max 50 chars
  country: string | null;            // max 100 chars
  purchase_intent: "high" | "medium" | "low" | null;
  product_interest: string | null;   // max 500 chars
  lead_score: number | null;         // 0–100
  score_justification: string | null; // max 500 chars
  missing_info: string[];            // BANT fields still missing
  notes: string | null;              // max 2000 chars
}
```

**`missing_info` possible values:** `"budget"`, `"authority"`, `"need"`, `"timeline"`, `"contact"`

### 3.2 Conversation Message

```typescript
interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;          // max 10,000 chars
  timestamp: string;        // ISO 8601 datetime
}
```

### 3.3 Session Summary

```typescript
interface SessionSummary {
  session_id: string;       // UUID
  intent: string | null;    // "Lead_Gen" | "Support" | "Spam"
  status: string | null;    // "active" | "in_progress" | "completed" | "escalated" | "discarded"
  thread_title: string | null;
  lead_source: string | null;
  turn_count: number;
  created_at: string | null;  // ISO 8601
  updated_at: string | null;  // ISO 8601
}
```

---

## 4. Typical Frontend Flow

### Lead Generation (Happy Path)

```
1. User types: "I need 100 solar inverters"
   → POST /thread { user_message: "...", lead_source: "Web Chat" }
   ← 201 { session_id: "xxx", intent: "Lead_Gen", assistant_reply: "Thanks! What's your budget?", ... }

2. Display assistant_reply. User types: "$50,000 budget, 60 days delivery"
   → POST /thread/xxx/reply { user_message: "$50,000 budget..." }
   ← 200 { assistant_reply: "Great. Who's the decision maker?", ... }

3. Continue multi-turn until conversation_complete === true
   ← 200 { conversation_complete: true, status: "completed", extracted_entities: {...} }

4. Display extracted lead data. Show "Export to CRM" button.
   → POST /thread/xxx/export
   ← 200 { export_status: "exported", lead: {...} }
```

### Support Escalation Flow

```
1. User types: "My inverter is broken"
   → POST /thread { user_message: "My inverter is broken" }
   ← 201 { intent: "Support", status: "escalated", pending_human_input: true, assistant_reply: null }

2. Frontend: Show "A human agent will contact you shortly" message. Disable reply input.
   The thread is now waiting for a human agent.

3. (Later, human agent uses the dashboard or API)
   → POST /thread/xxx/human-reply { user_message: "We'll send a technician tomorrow" }
   ← 200 { status: "completed" }
```

### Spam Flow

```
1. User types: "hello"
   → POST /thread { user_message: "hello" }
   ← 201 { intent: "Spam", status: "discarded" }

2. Frontend: Show "This inquiry has been closed" or simply auto-archive. No reply needed.
```

---

## 5. Frontend Implementation Notes

### State Machine

The frontend should model the thread as a state machine:

```
ACTIVE → IN_PROGRESS → COMPLETED (Lead_Gen)
                     → ESCALATED  (Support) → COMPLETED (human reply)
                     → DISCARDED  (Spam)
```

### Reply Input Rules

Show the reply input ONLY when ALL of:
- `status` is `"in_progress"` or `"active"`
- `pending_human_input` is `false`
- `conversation_complete` is `false`
- `intent` is `"Lead_Gen"`

### Polling vs. Event-Driven

This API is request/response only. There is no WebSocket or SSE for real-time updates. The frontend should:

- For multi-turn conversations: Each turn is a blocking request/response cycle. The user sends a message, waits for the assistant reply, then sends the next.
- For status changes: Poll `GET /thread/{id}` to detect external state changes (e.g., human agent replies to an escalated thread).

### Error Handling

| HTTP Status | Meaning | Frontend Action |
|:---:|---|---|
| 201 | Thread created | Display assistant_reply |
| 200 | Success | Display response data |
| 400 | Bad request | Show detail message to user |
| 401 | Unauthorized | Redirect to login or show auth error |
| 404 | Not found | Show "Session not found" |
| 502 | CRM webhook failed | Show "Export failed, please retry" |

### Timestamp Display

All timestamps are ISO 8601 UTC (`2026-05-16T12:00:00.000Z`). Convert to local timezone for display. The `timestamp` field in conversation messages is the full datetime; for compact display, extract `HH:MM:SS` from positions 11-19.

---

## 6. Backend Configuration (for Frontend Devs)

The backend is configured via environment variables prefixed with `SINGOO_`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SINGOO_HOST` | `127.0.0.1` | Bind address |
| `SINGOO_PORT` | `8000` | Server port |
| `SINGOO_API_AUTH_TOKEN` | (empty) | If set, all `/thread*` endpoints require `Bearer` token |
| `SINGOO_MAX_TURNS` | `5` | Max conversation turns before auto-extraction |
| `SINGOO_STORE_BACKEND` | `json` | `"json"` or `"sqlite"` |
| `SINGOO_CRM_WEBHOOK_URL` | (empty) | If set, export calls POST lead data to this URL |

Start the server: `python -m singoo serve --port 8000`
API docs (auto-generated): `http://127.0.0.1:8000/docs`
