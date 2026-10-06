# Test scenarios: customer AI assistant (portal widget)

**Feature:** floating assistant widget (`src/components/assistant/*`, `src/lib/hooks/useAssistantStream.ts`) calling `POST /api/ai/user-chat/` directly. Server-side scenarios: `smart-solar-django-backend/docs/test-scenarios/ai-assistant.md`.
**Design:** `docs/superpowers/specs/2026-07-24-ai-assistant-widget-design.md` (see its "Superseded" note).
**Test files:** `src/lib/hooks/useAssistantStream.test.ts`, `src/components/assistant/planAllowsAssistant.test.ts`. This repo has no jsdom/testing-library, so only extracted pure logic is unit-tested; hook behaviour is covered by live checks.

**Status values:** `planned` / `written` / `passing` / `live-verified`. Update the Status column in the same change that adds or fixes a test.

## 1. SSE parsing and history (pure logic)

| ID | Given | When | Then | Type | Pri | Status |
|---|---|---|---|---|---|---|
| P1 | Buffer with a complete line and a partial one | `parseSSEBuffer` | Event for the complete line; partial returned as remainder | unit | P0 | passing |
| P2 | `[KEEPALIVE]` line | Parsed | No event | unit | P1 | passing |
| P3 | `[DONE]` / `[ERROR] msg` lines | Parsed | `done` / `error` events | unit | P0 | passing |
| P4 | Token with escaped `\n` | Parsed | Real newline | unit | P1 | passing |
| H1 | Messages include an error bubble and an empty placeholder | `buildHistory` | Both dropped (never sent back to the model) | unit | P0 | passing |
| H2 | 30 messages | `buildHistory` | Last 20 kept | unit | P2 | passing |

## 2. Plan gating

| ID | Given | When | Then | Type | Pri | Status |
|---|---|---|---|---|---|---|
| G1 | `plan_type` basic or premium | `planAllowsAssistant` | true | unit | P0 | passing |
| G2 | free, null, undefined | `planAllowsAssistant` | false | unit | P0 | passing |
| G3 | Free-tier customer | Opens the orb | Panel opens, prompts and composer disabled, upgrade note shown, **no network request** | live | P0 | planned |
| G4 | Basic customer | Opens the orb | Fully functional | live | P0 | planned |

## 3. Stream behaviour (live; needs a mocked or real endpoint)

| ID | Given | When | Then | Type | Pri | Status |
|---|---|---|---|---|---|---|
| ST1 | Tokens streaming, connection drops | Fetch rejects | Partial answer kept with "(response cut off)", not replaced by an error | live | P0 | planned |
| ST2 | Stream closes without `[DONE]` after some tokens | Reader ends | Message marked cut off | live | P1 | planned |
| ST3 | Connection fails before any token | Fetch rejects | Error bubble "Couldn't reach the assistant" | live | P1 | planned |
| ST4 | Access token expired (idle > 55 min) | Sends a message | One 401, session refreshed, request retried, answer streams | live | P0 | planned |
| ST5 | Refresh also fails | Sends a message | "Your session needs a refresh" bubble | live | P1 | planned |
| ST6 | Previous reply was an error bubble | Sends the next message | Request body contains no error text | live | P0 | planned |
| ST7 | Reply streaming | Panel closed | Stream aborted; partial kept as cut-off, or empty bubble removed | live | P1 | planned |
| ST8 | Two sends in the same tick (double Enter) | Both fire | Only one request goes out | live | P1 | planned |
| ST9 | Previous stream aborted with unflushed text | New message sent | Old text does not appear in the new reply | live | P1 | planned |
| ST10 | 403 / 429 / 503 | Response status | Matching friendly copy, composer stays usable | live | P1 | planned |

## 4. Accessibility and layout

| ID | Check | Status |
|---|---|---|
| X1 | Focus moves into panel on open, returns to orb on close; Tab trapped; Escape closes | planned |
| X2 | Answer announced once per turn in the `aria-live` region | planned |
| X3 | `prefers-reduced-motion` collapses springs to fades | planned |
| X4 | Below 640 px the panel is fullscreen in light and dark themes | planned |
