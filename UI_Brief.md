# Singoo L2S-Router -- UI Development Brief / 前端开发需求规格书

**Target Audience / 目标读者:** AI agent tasked with building the Singoo frontend UI.
**Purpose / 用途:** This document is the complete specification for the Singoo frontend. It defines every page, every component, every state, and every user interaction the UI must handle. An AI agent should be able to build a fully functional frontend from this document alone, using `UI_Contract.md` as the API reference.

**Target Audience / 目标读者:** 负责构建 Singoo 前端 UI 的 AI 智能体。
**Purpose / 用途:** 本文档是 Singoo 前端的完整需求规格书，定义了 UI 必须处理的每一个页面、每一个组件、每一种状态和每一种用户交互。AI 智能体仅凭本文档和 `UI_Contract.md` 即可构建功能完整的前端。

---

## 1. Project Context / 项目背景

### 1.1 What Singoo Is / Singoo 是什么

Singoo is a B2B lead-to-sale multi-agent orchestrator. It receives unstructured social media inquiries (WhatsApp, WeChat, etc.), classifies them via AI, engages leads in multi-turn sales conversations with product knowledge, and extracts structured CRM lead data.

Singoo 是一个 B2B 线索到成交的多智能体编排系统。它接收非结构化社媒询盘（WhatsApp、微信等），通过 AI 分类意图，结合产品知识进行多轮销售对话，并提取结构化 CRM 线索数据。

### 1.2 What the Frontend Needs to Do / 前端需要做什么

The frontend is a **management dashboard** for the human operator (sales manager / business owner). It provides:

1. A session list showing all conversations with their status
2. A conversation detail viewer for reading full transcripts
3. Lead data display showing extracted CRM fields
4. The ability to reply to escalated (Support) threads as a human agent
5. The ability to export completed leads to CRM
6. Visual status indicators for quick scanning of lead pipeline health

前端是一个面向人工操作者（销售经理/企业主）的**管理面板**，提供：

1. 会话列表，展示所有对话及其状态
2. 对话详情查看器，阅读完整对话记录
3. 线索数据展示，显示提取的 CRM 字段
4. 以人工客服身份回复已转接（Support）会话的能力
5. 将已完成线索导出至 CRM 的能力
6. 可视化状态指示器，快速掌握线索管线健康状况

### 1.3 Architecture Relationship / 架构关系

```
[React/Tailwind Frontend]  <-- HTTP/JSON -->  [Singoo Backend (FastAPI)]
       (you build this)                        (already built, do not modify)
```

The frontend communicates with the backend exclusively through the REST API documented in `UI_Contract.md`. The frontend must never directly access the filesystem, database, or internal Python functions. All data flows through HTTP endpoints.

前端与后端的通信仅通过 `UI_Contract.md` 中记录的 REST API 进行。前端不得直接访问文件系统、数据库或内部 Python 函数。所有数据通过 HTTP 端点传输。

---

## 2. Pages and Views / 页面与视图

The frontend must implement exactly **3 pages**. No more, no less.

### 2.1 Session List Page (Dashboard) / 会话列表页（首页）

**Route / 路由:** `/`

**Purpose / 目的:** The landing page. Shows all conversation sessions in a sortable, filterable table. This is where the operator spends most of their time scanning the lead pipeline.

**Data Source:** `GET /threads`

**Required Elements:**

| Element | Description |
|---|---|
| Header bar | Project name "Singoo L2S-Router", total session count |
| Session table | Sortable columns: Session ID (truncated to 8 chars), Title, Source, Intent, Status, Turns, Updated At |
| Intent badge | Color-coded: Lead_Gen = green, Support = amber, Spam = gray |
| Status badge | Color-coded: active = blue, in_progress = green, completed = dark blue, escalated = amber, discarded = gray |
| Row click | Each row is clickable, navigates to `/view/{session_id}` |
| Empty state | When no sessions exist: centered message "No sessions yet. Create one via POST /thread" |
| Loading state | Table skeleton or spinner while data loads |
| Error state | Error message with retry button if API call fails |
| Refresh | Manual refresh button, or auto-refresh every 30 seconds |

**Sorting Behavior:**
- Default sort: `updated_at` descending (newest first) -- this is what the API returns
- User can click column headers to sort by: Intent, Status, Turns
- Client-side sort is acceptable (the full list is small for PoC)

**Filtering Behavior (optional for v1, required for v2):**
- Filter by intent (dropdown: All / Lead_Gen / Support / Spam)
- Filter by status (dropdown: All / active / in_progress / completed / escalated / discarded)

### 2.2 Conversation Detail Page / 对话详情页

**Route / 路由:** `/view/{session_id}`

**Purpose / 目的:** Shows the full conversation transcript and extracted lead data for a single session.

**Data Source:** `GET /thread/{session_id}`

**Required Elements:**

| Element | Description |
|---|---|
| Back button | "Back to sessions" link returning to `/` |
| Header bar | Session ID (truncated to 8 chars), Intent badge, Status badge, Turn count (e.g., "3/5") |
| Conversation area | Scrollable message list, newest messages at bottom |
| Message bubbles | User messages: left-aligned, one color. Assistant messages: right-aligned, different color. System messages: centered, muted, smaller font |
| Message metadata | Each bubble shows: role label (USER / ASSISTANT), timestamp (HH:MM:SS format) |
| Timestamp conversion | Backend returns ISO 8601 UTC; convert to local time for display |
| Auto-scroll | Scroll to bottom when new messages load |
| Empty conversation | "No messages" text if conversation array is empty (should not happen, but handle it) |

**Lead Data Card (shown BELOW the conversation):**

| Element | Description |
|---|---|
| Section header | "Extracted Lead / 提取线索" |
| Grid layout | 2-column grid showing field-value pairs |
| Fields to display | Company Name, Contact Name, Email, Phone, Country, Purchase Intent, Product Interest, Lead Score, Missing BANT Fields, Notes |
| Lead score visual | Large number (24px+) with color: green >= 70, amber 40-69, red < 40 |
| Score justification | Small text below the score showing the BANT penalty breakdown |
| Missing fields | Show as comma-separated list, or "None" if empty |
| Null fields | Display "--" (em dash) for any null field value |
| No lead data | If `extracted_entities` is null: show "Lead data not yet extracted / 线索数据尚未提取" |

**Human Reply Area (shown ONLY when `pending_human_input` is true):**

| Element | Description |
|---|---|
| Context banner | "This session has been escalated and is waiting for a human response. / 此会话已转接，等待人工回复。" |
| Text input | Multi-line textarea (max 10,000 chars) |
| Submit button | "Send Reply / 发送回复" |
| Success | After successful reply, show confirmation and disable input |
| Error | Show error message, allow retry |

**Data Source for Human Reply:** `POST /thread/{session_id}/human-reply`

**Export Button (shown ONLY when the session is completed with lead data AND not yet exported):**

| Element | Description |
|---|---|
| Button label | "Export to CRM / 导出至 CRM" |
| Success state | Button changes to "Exported / 已导出" with check icon, disabled |
| Error state | Error toast/message if CRM webhook fails (502) |
| Already exported | Button hidden, show "Exported / 已导出" text |

**Data Source for Export:** `POST /thread/{session_id}/export`

**Loading / Error / Empty states for this page:**

| State | Display |
|---|---|
| Loading | Spinner in conversation area |
| 404 (session not found) | Centered "Session not found / 会话未找到" with back link |
| Other errors | Error message with retry button |

### 2.3 Create Thread Page (New Conversation) / 创建会话页

**Route / 路由:** `/new`

**Purpose / 目的:** Allows the operator to manually create a new conversation (simulating an incoming social media inquiry for testing/demo purposes).

**Required Elements:**

| Element | Description |
|---|---|
| Header | "New Conversation / 新建会话" |
| Lead source selector | Dropdown or text input, default "WhatsApp", max 50 chars |
| Message input | Multi-line textarea, placeholder: "Enter the initial inquiry message... / 输入初始询盘消息..." |
| Character count | Show current/max (max: 10,000 characters) |
| Submit button | "Create / 创建" |
| Loading state | Button shows spinner during API call |
| Success | Redirect to `/view/{session_id}` on 201 response |
| Validation error | Show field-level error if message is empty or too long |
| API error | Show error message, allow retry |

**Data Source:** `POST /thread`

---

## 3. User Interaction Flows / 用户交互流程

### 3.1 Flow A: Review a Lead Gen Session / 查看销售线索会话

```
1. Operator opens / (Session List)
2. Sees sessions sorted by most recent first
3. Clicks a row with "Lead_Gen" intent and "completed" status
4. Navigates to /view/{session_id}
5. Reads the conversation transcript (user/assistant messages)
6. Scrolls down to see extracted lead data (company, contact, score, missing fields)
7. If lead is not yet exported, clicks "Export to CRM"
8. Button changes to "Exported" with success state
```

### 3.2 Flow B: Respond to Escalated Support Session / 回复转接的售后会话

```
1. Operator opens / (Session List)
2. Sees a row with "Support" intent and "escalated" status (amber badge)
3. Clicks the row, navigates to /view/{session_id}
4. Sees the conversation transcript
5. Below the conversation, sees the Human Reply input area with context banner
6. Types a response: "We will send a technician to your site within 48 hours."
7. Clicks "Send Reply"
8. Button shows loading, then success confirmation
9. Reply input is now disabled; session status changed to "completed"
```

### 3.3 Flow C: Create a Test Conversation / 创建测试会话

```
1. Operator navigates to /new
2. Selects lead source: "WhatsApp" (default)
3. Types: "I need 100 solar inverters for my factory in Thailand"
4. Character count updates: 57 / 10,000
5. Clicks "Create"
6. Button shows spinner
7. On success (201), redirects to /view/{new_session_id}
8. Sees the new conversation with the assistant's first reply
```

### 3.4 Flow D: Spam Session Handling / 垃圾消息处理

```
1. Operator opens / (Session List)
2. Sees a row with "Spam" intent and "discarded" status (gray badge)
3. Clicks to view -- sees the conversation content
4. No lead data, no reply input, no export button
5. This is a read-only archive view
```

---

## 4. Component States / 组件状态

Every data-displaying component must handle these 4 states:

### 4.1 Loading State / 加载状态

| Context | Display |
|---|---|
| Initial page load | Full-page spinner or skeleton (gray placeholder blocks matching layout) |
| Table loading | Skeleton rows (5-8 gray bars) |
| Conversation loading | Skeleton message bubbles (alternating left/right gray blocks) |
| Button action (export, reply, create) | Button shows spinner, text changes to "..." variant, button disabled |

### 4.2 Empty State / 空状态

| Context | Display |
|---|---|
| No sessions | Centered illustration/icon + "No sessions yet / 暂无会话" + hint text |
| No messages in conversation | "No messages / 暂无消息" (edge case, should not happen in practice) |
| No lead data extracted | "Lead data not yet extracted / 线索数据尚未提取" |
| No missing BANT fields | "All BANT fields covered / 全部 BANT 字段已覆盖" (green text) |

### 4.3 Error State / 错误状态

| HTTP Status | Display |
|---|---|
| 400 Bad Request | Toast or inline error: "Invalid request: {detail}" |
| 401 Unauthorized | Full-page "Authentication required / 需要认证" with login prompt |
| 404 Not Found | Full-page "Session not found / 会话未找到" with link back to / |
| 500 / 502 / Network error | Toast: "Server error. Please try again. / 服务器错误，请重试。" with retry button |
| Timeout (>30s) | Toast: "Request timed out. Please try again. / 请求超时，请重试。" |

**Error handling principles:**
- Never show raw error stack traces to the user
- Always provide a retry action for transient errors
- Use toast notifications for non-blocking errors; full-page states for fatal errors
- Every error message must be bilingual (EN / ZH)

### 4.4 Success State / 成功状态

| Action | Feedback |
|---|---|
| Export lead | Button changes to "Exported / 已导出" (green, disabled) |
| Human reply sent | Confirmation text replaces input area: "Reply sent. Session completed. / 回复已发送，会话已完成。" |
| Thread created | Redirect to conversation view (no toast needed) |

---

## 5. Design Constraints / 设计约束

### 5.1 Visual Style / 视觉风格

| Aspect / 方面 | Requirement / 要求 |
|---|---|
| Tone / 风格 | Professional, serious, enterprise SaaS. Not playful. / 专业、严肃、企业级 SaaS 风格，非娱乐化 |
| Color scheme / 配色 | Dark theme preferred (dark blue/gray background -- `#0f172a`, card background -- `#1e293b`, text -- `#e2e8f0`). Light theme acceptable as alternative. |
| Typography / 字体 | System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Corner radius / 圆角 | 8px for cards, 4-6px for buttons and inputs |
| Shadows / 阴影 | Subtle, used only for elevated elements (modals, dropdowns) |
| Spacing / 间距 | 16px base grid, 24px section padding |

### 5.2 Responsiveness / 响应式

| Breakpoint | Behavior |
|---|---|
| >= 1024px (Desktop) | Full layout: sidebar + main content (if sidebar exists), 2-column lead grid |
| 768-1023px (Tablet) | Single column, lead grid stays 2-column |
| < 768px (Mobile) | Single column, lead grid collapses to 1-column, table becomes card list |

### 5.3 Accessibility / 无障碍

- All interactive elements must be keyboard-focusable
- Color is not the only indicator of status -- badges include text labels
- Form inputs have associated labels
- `alt` text on any icons/illustrations (use `aria-label` for icon-only buttons)

### 5.4 Language / 语言

- All UI text must be **bilingual (EN + ZH)**. English first, Chinese second, separated by ` / `.
- Example: "Export to CRM / 导出至 CRM"
- Timestamps: display in local timezone, format `HH:MM:SS` for messages, `YYYY-MM-DD HH:MM` for session list
- Numbers: use Western Arabic numerals (0-9)

### 5.5 Emoji Policy / Emoji 政策

**Zero emojis.** No emojis in any UI text, button labels, status messages, or notifications. Use text and color alone for visual communication.

---

## 6. Technical Requirements / 技术要求

### 6.1 Recommended Stack / 推荐技术栈

| Layer | Recommendation | Rationale |
|---|---|---|
| Framework | React 18+ with TypeScript | Type safety, broad ecosystem |
| Build tool | Vite | Fast HMR, simple config |
| Styling | Tailwind CSS 3+ | Utility-first, matches the "serious enterprise" aesthetic |
| Routing | React Router v6 | Client-side routing for SPA |
| HTTP client | `fetch` (native) or `axios` | Simple, no GraphQL needed |
| State management | React Context + `useReducer` | Sufficient for this app's complexity. No Redux needed. |
| Toast notifications | `react-hot-toast` or similar | For success/error feedback |

Alternative: Vue 3 + Vite + Tailwind if the developer prefers Vue.

### 6.2 Project Scaffold Requirements / 项目脚手架要求

```
singoo-ui/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── api/
│   │   └── client.ts         # HTTP client with base URL config, auth header
│   ├── pages/
│   │   ├── SessionList.tsx   # GET /threads
│   │   ├── ConversationView.tsx  # GET /thread/{id}, POST reply, POST export
│   │   └── NewThread.tsx     # POST /thread
│   ├── components/
│   │   ├── Badge.tsx         # Intent badge, Status badge
│   │   ├── MessageBubble.tsx # Single conversation message
│   │   ├── LeadCard.tsx      # Extracted lead data grid
│   │   ├── HumanReplyBox.tsx # Reply input for escalated sessions
│   │   ├── ExportButton.tsx  # Export action with state handling
│   │   ├── Skeleton.tsx      # Loading skeleton components
│   │   └── ErrorState.tsx    # Reusable error display with retry
│   ├── hooks/
│   │   ├── useApi.ts         # Generic fetch hook with loading/error/data states
│   │   └── useThread.ts      # Thread-specific hook
│   └── types/
│       └── index.ts          # TypeScript interfaces matching API responses
```

### 6.3 API Client Configuration / API 客户端配置

```typescript
// api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN || "";

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(API_AUTH_TOKEN ? { Authorization: `Bearer ${API_AUTH_TOKEN}` } : {}),
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail);
  }
  return response.json();
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
```

### 6.4 State Management Pattern / 状态管理模式

Each page component should use a pattern like:

```typescript
type PageState<T> =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "success"; data: T };
```

Render paths:
- `loading` -> show Skeleton/spinner
- `error` -> show ErrorState with retry
- `success` with empty data -> show EmptyState
- `success` with data -> show actual content

### 6.5 Routing Table / 路由表

| Path | Component | Data Dependency |
|---|---|---|
| `/` | `SessionList` | `GET /threads` |
| `/view/:sessionId` | `ConversationView` | `GET /thread/{id}` |
| `/new` | `NewThread` | (none until form submit) |
| `*` (404) | `NotFound` | (static) |

---

## 7. API Reference / API 参考

The complete API contract is in `UI_Contract.md`. Here is a quick-reference summary for the frontend developer:

### 7.1 Endpoints Used by the Frontend / 前端使用的端点

| Method | Path | Used In | Request Body | Response Key Fields |
|---|---|---|---|---|
| `GET` | `/threads` | SessionList | -- | `[{session_id, intent, status, thread_title, turn_count, updated_at}]` |
| `GET` | `/thread/{id}` | ConversationView | -- | `{session_id, intent, status, turn_count, conversation[], extracted_entities{}, pending_human_input, lead_export_status}` |
| `POST` | `/thread` | NewThread | `{user_message, lead_source?}` | `{session_id, assistant_reply, intent, status}` |
| `POST` | `/thread/{id}/human-reply` | HumanReplyBox | `{user_message}` | `{session_id, status}` |
| `POST` | `/thread/{id}/export` | ExportButton | -- | `{session_id, export_status, lead}` |
| `GET` | `/health` | App (optional) | -- | `{status: "ok"}` |

### 7.2 Key TypeScript Interfaces / 关键 TypeScript 接口

```typescript
interface SessionSummary {
  session_id: string;
  intent: "Lead_Gen" | "Support" | "Spam" | null;
  status: "active" | "in_progress" | "completed" | "escalated" | "discarded" | null;
  thread_title: string | null;
  lead_source: string | null;
  turn_count: number;
  created_at: string | null;
  updated_at: string | null;
}

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;  // ISO 8601
}

interface ExtractedLead {
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  purchase_intent: "high" | "medium" | "low" | null;
  product_interest: string | null;
  lead_score: number | null;
  score_justification: string | null;
  missing_info: string[];
  notes: string | null;
}

interface ThreadDetail {
  session_id: string;
  intent: string | null;
  status: string | null;
  lead_source: string | null;
  turn_count: number;
  max_turns: number;
  thread_title: string | null;
  pending_human_input: boolean;
  conversation_complete: boolean;
  detected_language: string | null;
  lead_export_status: "pending" | "exported" | "failed" | null;
  conversation: ConversationMessage[];
  extracted_entities: ExtractedLead | null;
  created_at: string | null;
  updated_at: string | null;
}
```

---

## 8. What the Frontend Must NOT Do / 前端不能做的事

1. **Do NOT modify the backend.** The FastAPI server is the source of truth. All changes happen through API calls.
2. **Do NOT implement its own LLM calls.** The backend handles all AI logic. The frontend only displays results.
3. **Do NOT store conversation state locally.** Session state lives on the backend. The frontend fetches it fresh on each page load.
4. **Do NOT add features beyond this spec.** No chat input for Lead_Gen sessions (that's for the end-user, not the operator dashboard). No real-time WebSocket (the API is request/response). No analytics dashboard (that's Phase 2).
5. **Do NOT use emojis.** Anywhere. Ever.

---

## 9. Acceptance Checklist / 验收清单

Before declaring the frontend complete, verify every item:

### Session List Page / 会话列表页
- [ ] Loads session data from `GET /threads` on mount
- [ ] Shows loading skeleton while fetching
- [ ] Shows error state with retry on API failure
- [ ] Shows empty state when no sessions exist
- [ ] Displays all sessions in a table sorted by most recent first
- [ ] Color-coded intent badges (Lead_Gen / Support / Spam) with text labels
- [ ] Color-coded status badges with text labels
- [ ] Clicking a row navigates to `/view/{session_id}`
- [ ] Manual refresh button works
- [ ] Bilingual labels (EN / ZH) throughout

### Conversation Detail Page / 对话详情页
- [ ] Loads session data from `GET /thread/{id}` on mount
- [ ] Shows loading skeleton while fetching
- [ ] Shows 404 state when session not found
- [ ] Shows error state with retry on other API failures
- [ ] Back button navigates to `/`
- [ ] Header shows session ID (truncated), intent badge, status badge, turn count
- [ ] Conversation area shows all messages with role labels and timestamps
- [ ] User and assistant messages visually distinct (alignment and color)
- [ ] System messages centered and muted
- [ ] Lead data card displays all ExtractedLead fields when present
- [ ] Lead score uses color coding (green/amber/red)
- [ ] Null lead fields display "--"
- [ ] Missing BANT fields shown as list or "None"
- [ ] "Lead data not yet extracted" shown when extracted_entities is null

### Human Reply (escalated sessions) / 人工回复（转接会话）
- [ ] Human reply area ONLY visible when `pending_human_input` is true
- [ ] Context banner explains escalation
- [ ] Text input accepts up to 10,000 characters
- [ ] Submit calls `POST /thread/{id}/human-reply`
- [ ] Loading state on button during API call
- [ ] Success: confirmation shown, input disabled
- [ ] Error: message shown, retry possible

### Export Button / 导出按钮
- [ ] ONLY visible when session is completed AND has lead data AND not yet exported
- [ ] Calls `POST /thread/{id}/export` on click
- [ ] Loading state during API call
- [ ] Success: button changes to "Exported / 已导出" (disabled)
- [ ] Error: toast notification with retry option
- [ ] "Exported / 已导出" text shown when already exported (button hidden)

### Create Thread Page / 创建会话页
- [ ] Navigable at `/new` (link from header or navigation)
- [ ] Lead source input with default "WhatsApp"
- [ ] Message textarea with character count (max 10,000)
- [ ] "Create" button validates non-empty input
- [ ] Loading state on button during API call
- [ ] On 201: redirect to `/view/{session_id}`
- [ ] On error: show error message, allow retry

### Cross-cutting / 全局
- [ ] All UI text is bilingual (EN / ZH)
- [ ] Zero emojis anywhere
- [ ] Dark theme applied consistently
- [ ] Responsive layout works at 1024px, 768px, and 375px widths
- [ ] Keyboard navigation works for all interactive elements
- [ ] No console errors or warnings
- [ ] API base URL configurable via environment variable
- [ ] Auth token configurable via environment variable
