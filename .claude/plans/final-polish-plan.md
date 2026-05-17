# Final Polish Plan — Singoo Interview-Ready Prototype

**Date:** 2026-05-17
**Status:** RED TEAM APPROVED (with corrections incorporated)

---

## Issue 1: Sidebar Dead Links — REWORKED per Red Team

**Red Team findings:**
- Deleting 4 items is safe, but `/new` route becomes orphaned (no sidebar link to it)
- "Soon" items using `<Link to="#">` is semantically wrong — creates hash history entries
- Dashboard + Conversations both pointing to `/` creates dual-active highlight bug

**Revised plan:**

| Nav Item | Dest | Status |
|----------|------|--------|
| Dashboard | `/` | Active (working) |
| New Session | `/new` | Active (working — NEW) |
| Analytics | disabled `<span>` | Disabled + "(Soon)" |
| Settings | disabled `<span>` | Disabled + "(Soon)" |

**Delete:** Conversations (redundant with Dashboard), Integrations, Reports, Team Management, AI Insights.

**Result:** 2 working items + 2 marked "Soon". Clean, honest, no dead `<Link>` tags.

**Files:** `frontend/src/components/layout/Sidebar.tsx`

---

## Issue 2: Failing Test — APPROVED

**Fix:** Change `test_constructor_reads_settings` to assert `client._base_url == settings.llm_base_url.rstrip("/")`. Add a comment explaining the test verifies the constructor delegates to settings, not a hardcoded value.

**Files:** `tests/test_llm_client.py`

---

## Issue 3: TopHeader Decorative Search — APPROVED (with cleanup)

**Fix:** Remove search `<Input>` + `<Search>` icon. Remove unused `Search` import from lucide-react.

**Files:** `frontend/src/components/layout/TopHeader.tsx`

---

## Issue 4: HumanReply `[Human Agent]` Prefix — APPROVED

**Fix:** Remove `[Human Agent] ` prefix from `handle_human_reply` in handlers.py. The MessageBubble already shows role labels.

**Files:** `api/handlers.py`

---

## Issue 5: Missing 404 Catch-All Route — CORRECTED

**Red Team finding:** Plan failed to specify that NotFound must include Sidebar + TopHeader app shell (all other pages render these independently).

**Fix:** Add `<Route path="*" element={<NotFound />} />`. The `NotFound` component wraps content in Sidebar + TopHeader, matching the pattern of every other page.

**Files:** `frontend/src/App.tsx`, `frontend/src/pages/NotFound.tsx` (NEW)

---

## Issue 6: README Screenshots — Not a code change

After all fixes, take 2-3 screenshots for README.

---

## PICA Classification

All changes: **Low risk** — UI polish + 1 test assertion fix.
- PICA-Unit: tsc + vite build (frontend)
- PICA-Security: SKIP
- PICA-Integration: SKIP
- PICA-Regression: pytest (backend) 89/89 expected

---

## Estimated Impact

| Metric | Value |
|--------|-------|
| Files changed | 6 existing, 1 new |
| Tests affected | 1 assertion change |
| Test target | 89/89 |
| Time | ~20 min |
