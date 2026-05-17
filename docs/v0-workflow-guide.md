# v0.dev Frontend Development Workflow

## Overview

This is a two-person pipeline:

- **You (Human)** — Write prompts, run v0.dev, collect generated code.
- **Claude (AI Agent)** — Transplant v0 output into the Vite project, replace mock data with real API calls, wire up routing, add state handling.

The goal: v0 does the visual design/polish; Claude does the integration plumbing.

---

## Step 1: Prepare Your Inputs for v0

Before opening v0.dev, gather these two files from the project.

### File A: `UI_Brief.md` (already exists)

Path: `projects/singoo/UI_Brief.md`

This is the master spec. It defines every page, every component state, every user interaction. v0 needs context on WHAT to build. Copy the relevant section for the page you're working on.

### File B: `UI_Contract.md` (needs to exist)

If this file was deleted during the dashboard decoupling phase, ask Claude to recreate it. It documents the exact API endpoints the frontend consumes, with request/response JSON shapes. Without this, v0 won't know the data structure to render.

If missing, say: **"Recreate UI_Contract.md from the current app.py and api/ files"** and Claude will write it.

### File C: `_v0_template_1/` (reference for visual consistency)

v0 already generated this template. Give v0 the key files so new pages match the existing look:

- `_v0_template_1/app/globals.css` — color tokens, dark theme
- `_v0_template_1/components/ui/button.tsx` — button variants used throughout
- `_v0_template_1/components/ui/badge.tsx` — badge component
- `_v0_template_1/components/ui/input.tsx` — input styling
- `_v0_template_1/components/ui/card.tsx` — card container
- `_v0_template_1/components/ui/skeleton.tsx` — loading states
- `_v0_template_1/components/dashboard/sidebar.tsx` — sidebar already built
- `_v0_template_1/components/dashboard/top-header.tsx` — top header already built

**Which files to include depends on what page you're building.** For ConversationView, include the ones that affect that page (badge, skeleton, etc.). You don't need to send all of them every time.

---

## Step 2: Assign Tasks to v0 (One Page Per Session)

v0 works best with one focused page per prompt. Do NOT ask for multiple pages in one prompt — quality drops.

### Prompt for ConversationView Page

Copy-paste this into v0 along with the supporting files:

```
Build a Conversation Detail page for a B2B lead management dashboard called "Singoo L2S-Router".

ROUTE: /view/:sessionId

LAYOUT: Full page with the existing Sidebar + TopHeader layout from the attached files.
The main content area has TWO sections stacked vertically:

SECTION 1 — Conversation Area (top, ~65% height):
- A scrollable message list, newest at bottom, auto-scroll on load
- Three message types, visually distinct:
  - USER messages: left-aligned, bg-blue-900/30, blue-200 text
  - ASSISTANT messages: right-aligned, bg-slate-700/50, slate-200 text
  - SYSTEM messages: centered, muted/smaller font, bg-transparent
- Each bubble shows: role label (USER / ASSISTANT / SYSTEM) at top, message content, timestamp (HH:MM:SS, converted from ISO 8601 UTC to local time)
- Empty state: centered "No messages / 暂无消息" if conversation array is empty

SECTION 2 — Lead Data Card (bottom, ~35% height):
- Card header: "Extracted Lead / 提取线索" with a blue "AI Extracted" pill badge
- 2-column grid of field-value pairs:
  - Company Name / 公司名称
  - Contact Name / 联系人
  - Email / 邮箱
  - Phone / 电话
  - Country / 国家
  - Purchase Intent / 购买意向
  - Product Interest / 产品兴趣
  - Lead Score / 线索评分 (large number, color-coded: green >= 70, amber 40-69, red < 40)
  - Score Justification / 评分说明 (small text below score)
  - Missing BANT Fields / 缺失字段 (comma list or green "All covered / 全部覆盖")
  - Notes / 备注
- Null fields: display "--" (em dash)
- Empty state: "Lead data not yet extracted / 线索数据尚未提取" if no lead data

CONDITIONAL ELEMENTS:

1. Human Reply Box (visible ONLY when pending_human_input is true):
   - Amber banner: "This session has been escalated and is waiting for a human response. / 此会话已转接，等待人工回复。"
   - Multi-line textarea (max 10,000 chars)
   - Submit button: "Send Reply / 发送回复"
   - After success: confirmation text, input disabled
   - After error: error message, retry enabled

2. Export Button (visible ONLY when status is "completed" AND extracted_entities exists AND lead_export_status is NOT "exported"):
   - Button: "Export to CRM / 导出至 CRM"
   - Loading: spinner on button
   - Success: button changes to "Exported / 已导出" (green, disabled)
   - Already exported: show "Exported / 已导出" text, no button

STATES TO HANDLE:
- Loading: skeleton message bubbles + skeleton in lead card area
- 404: centered "Session not found / 会话未找到" with back link
- Error: error message with "Retry / 重试" button

STYLE RULES:
- Dark theme: background #0B1120, card #1E293B, text #F1F5F9, border #334155
- Bilingual labels: English first, then " / ", then Chinese
- NO emojis anywhere
- Professional enterprise SaaS look
- Use the attached UI component files for consistency
- 8px border radius on cards, 6px on buttons
- System font stack

DATA SOURCE: The page fetches from GET /thread/{session_id}. See the attached API contract.
```

### Prompt for NewThread Page

```
Build a "New Conversation" creation page for a B2B lead management dashboard called "Singoo L2S-Router".

ROUTE: /new

LAYOUT: Centered card on dark background. No sidebar needed — this is a standalone form page.

PAGE TITLE: "New Conversation / 新建会话" at top center.

FORM FIELDS:

1. Lead Source Selector:
   - Label: "Lead Source / 线索来源"
   - Dropdown or text input
   - Default value: "WhatsApp"
   - Max 50 characters

2. Message Textarea:
   - Label: "Initial Inquiry / 初始询盘"
   - Multi-line textarea, placeholder: "Enter the initial inquiry message... / 输入初始询盘消息..."
   - Below the textarea: character count "57 / 10,000"
   - Max 10,000 characters

3. Submit Button:
   - Full-width: "Create / 创建"
   - Disabled when message is empty
   - Shows spinner during API call

STATES:
- Loading: spinner on button, button disabled
- Validation error: inline error text below the field ("Message is required / 消息不能为空")
- API error: error banner below form with "Retry / 重试" button
- Success: redirect happens, no toast needed

NAVIGATION:
- "Back / 返回" link in top-left corner, returns to /

STYLE: Same dark theme as the rest of the app. Professional enterprise look. Bilingual labels. No emojis.

DATA SOURCE: POST /thread. See the attached API contract for request/response shapes.
```

---

## Step 3: What Files to Give Claude After v0 Generates

When v0 finishes, it gives you a zip or a set of files. Give Claude these:

| Required | File | Why |
|----------|------|-----|
| YES | The main page component (e.g., `app/conversation/page.tsx` or whatever v0 names it) | This is the page we're transplanting |
| YES | Any NEW components v0 created specifically for this page | e.g., a `MessageBubble.tsx`, `HumanReplyBox.tsx` |
| OPTIONAL | Updated `components/ui/*.tsx` | Only if v0 created new ones or changed existing ones |
| NO | `layout.tsx`, `globals.css`, `package.json`, config files | Claude already set these up in the Vite project |

**Put everything v0 generated into `_v0_template_1/` (or a subfolder like `_v0_template_2/`).** Tell Claude: "v0 output is in _v0_template_2/ — integrate the ConversationView page."

---

## Step 4: What Claude Will Do

When you hand over the v0 output, Claude will:

1. Read the v0-generated page and any new components
2. Create the equivalent files in `frontend/src/pages/` and `frontend/src/components/`
3. Replace all mock/hardcoded data with `api/client.ts` function calls
4. Replace Next.js patterns (`usePathname`, `Link from next/link`) with React Router equivalents
5. Add the route to `App.tsx`
6. Add the `useApi()` hook wrapper for loading/error/data state
7. Run `npx tsc --noEmit` and `npx vite build` to verify compilation
8. Report what was done and what (if anything) needs manual attention

---

## Quick Reference: File Map

| What v0 gives you | Where Claude puts it in `frontend/` |
|-------------------|-------------------------------------|
| `app/page.tsx` | `src/pages/SessionList.tsx` |
| `app/conversation/page.tsx` | `src/pages/ConversationView.tsx` |
| `app/new/page.tsx` (or wherever) | `src/pages/NewThread.tsx` |
| `components/dashboard/foo.tsx` | `src/components/dashboard/Foo.tsx` |
| `components/ui/bar.tsx` | `src/components/ui/bar.tsx` |
| Custom hooks | `src/hooks/` |
| Types/interfaces | `src/types/index.ts` (merged into existing) |

---

## Workflow Checklist

Per page, the sequence is:

- [ ] 1. Gather files: relevant section of `UI_Brief.md`, `UI_Contract.md`, reference components from `_v0_template_1/`
- [ ] 2. Paste the prompt + files into v0.dev
- [ ] 3. Review v0 output visually (does it look right?)
- [ ] 4. Save v0 output into `_v0_template_N/`
- [ ] 5. Tell Claude: "v0 output is in _v0_template_N/, integrate the [PageName] page"
- [ ] 6. Claude verifies: `tsc --noEmit` + `vite build` pass
- [ ] 7. Start backend (`python -m singoo serve`) + frontend (`npm run dev`) and test in browser
