# AI Assistant Widget — Design Spec

**Date:** 2026-07-24
**Repo:** `smart-solar-customer-portal`
**Status:** Approved, ready for implementation plan

## Purpose

A floating AI assistant widget for the customer portal, letting customers ask
conversational questions about their own solar system — generation, battery
status, alerts, forecasts — using live telemetry the backend already exposes.
Same idea as the existing staff-only `AiChat.tsx` (in `smart-solar-react-frontend`),
scoped to a customer's own site(s) instead of the whole fleet.

Not in scope: general support-ticket triage, FAQ knowledge base, or any bridge
into the existing Help/ticketing flow. This is data-question Q&A only.

## Backend integration (no Django changes; one new Route Handler)

Reuses `POST /api/ai/user-chat/` on `smart-solar-django-backend`
(`api/views/ai.py::user_chat`) exactly as it exists today — but per this
repo's own convention ("Never call the Django backend directly from client
components — go through `api/auth/*` or `api/backend/*` Route Handlers so
`API_BASE_URL` and tokens stay server-side"), the widget does not fetch
Django directly. It hits a new Next.js Route Handler,
`src/app/api/backend/ai/user-chat/route.ts`, which:

- Reads the httpOnly session cookie server-side (same pattern as the existing
  `api/backend/*` proxy routes), attaches the real JWT when calling Django.
- Proxies the SSE response through untouched — `Response` with a streamed
  body, forwarding `Content-Type: text/event-stream` and piping Django's
  stream reader straight to the client response, no buffering.
- This is the one genuinely new piece of backend-adjacent work in this
  feature — everything else is client-side. Confirm at implementation time
  that Next's Route Handlers support a passthrough `ReadableStream` response
  (they do, via returning `new Response(djangoResponse.body, {...})`), since
  this repo's existing `api/backend/*` proxies were written for regular JSON
  responses, not streaming ones — this is a new pattern for the proxy layer,
  not a copy-paste of an existing route.

Once proxied, the request/response contract from the client's point of view:

- **Auth:** transparent — the browser's httpOnly cookie rides along with the
  same-origin fetch to `/api/backend/ai/user-chat`; no token handling in the
  widget at all.
- **Request:** `{ messages: [{role, content}, ...] }`. Client trims to the last
  10 turns before sending (Django also self-trims at `MAX_TURNS = 10`, but
  trimming client-side avoids sending dead payload over the proxy hop).
- **Response:** Server-Sent Events, token-by-token, relayed by the proxy.
  A `[KEEPALIVE]` sentinel may appear in the stream and must be filtered —
  same logic as `smart-solar-react-frontend/src/features/staff/AiChat.tsx`'s
  `normalizeStreamFragment`, ported (not imported — separate repo) into
  `useAssistantStream`.
- **Known error responses to handle** (originate from Django, pass through
  the proxy unchanged):
  - `403` — if `request.user.is_staff` (shouldn't happen for a real customer
    session, but handle without crashing)
  - `503` — `OPENROUTER_API_KEY` not configured
  - `400` — empty `messages`
- **No plan-gating in the UI.** The endpoint's docstring says "Requires basic
  or premium plan" but the code only blocks staff accounts — there is no
  actual plan check. The widget must not invent a client-side restriction the
  server doesn't enforce; show it to every authenticated customer. If
  plan-gating is wanted later, it belongs in the backend as a real check.
- **Data already available to the assistant** (confirmed by reading the
  endpoint): all the user's sites' latest telemetry (PV/battery/grid/load),
  today's generation, active alerts, solar + load forecasts, weather, recent
  history. No new backend work needed for "how much did I generate today" /
  "why is my battery low" style questions.

## Architecture & placement

- New component `AiAssistantWidget.tsx`, mounted once in
  `src/app/(portal)/layout.tsx`, outside individual page content — matching
  how the staff frontend's `AiChat.tsx` is mounted outside `<Routes>`.
- This means the widget persists across client-side navigation between portal
  pages (Solar → Consumption → Alerts, etc.) without remounting or losing
  conversation state.
- **Session persistence:** conversation state (messages array) is serialized
  to `sessionStorage` under a single key (e.g. `360w-assistant-thread`) on
  every change, and hydrated from it on mount. This means:
  - Survives client-side navigation (via the root mount, for free)
  - Survives a hard page refresh within the same tab (via sessionStorage)
  - Clears on tab close (sessionStorage semantics) — no backend thread model
    needed, matching how `user_chat` actually works today (stateless, client
    resends full history each turn each time).
- No new Django model or Django route — the only new route is the
  streaming-proxy Route Handler described above, which is this repo's own
  Next.js layer, not the Django backend.

## Component structure

```
AiAssistantWidget.tsx        — root: owns state, mounts orb + panel
├── AssistantOrb.tsx         — floating trigger button (sparkle glyph, idle animation)
├── AssistantPanel.tsx       — slide-in container (compact / fullscreen sizes,
│                              mirrors staff AiChat's PanelSize pattern)
│   ├── AssistantHeader.tsx  — title, online status dot, size-toggle, close
│   ├── AssistantMessages.tsx— scrollable list; renders user/bot bubbles + typing indicator
│   │   └── MessageBubble.tsx — single message; bot replies render through
│   │                           react-markdown + remark-gfm + syntax-highlighter
│   │                           (already used by staff AiChat) since kWh/currency
│   │                           tables and lists benefit from real markdown
│   ├── QuickPrompts.tsx     — chip row, shown only when messages.length === 0
│   └── AssistantComposer.tsx — text input + send button
├── useAssistantStream.ts    — hook: fetch + SSE-parse + token-accumulate loop,
│                              pure logic, no DOM — independently unit-testable
└── useAssistantSession.ts   — hook: sessionStorage read/write + hydration,
                               pure logic — independently unit-testable
```

This follows the repo's existing hook-extraction convention (`useSiteQuery`,
`useCareFaults`, etc.) — logic lives in testable hooks, components stay thin.

### Quick prompts

Shown only when the conversation is empty, replaced by the real thread once
the first message sends. Four customer-relevant chips, tappable to send
immediately:

- "How much did I generate today?"
- "Is my system healthy?"
- "Why is my battery low?"
- "How am I doing this month?"

## Visual design & motion (Option B — expressive)

Confirmed via an interactive artifact demo comparing three motion treatments
(subtle / expressive / minimal) built with the portal's real color and glass
tokens from `globals.css` — Option B ("expressive, showcase-level") was
selected.

- **Palette/surfaces:** no new tokens — uses existing `--card`, `--glass-bg`,
  `--glass-blur`, `--border`, `--primary` (emerald), `--secondary` (amber)
  exactly as defined in `src/app/globals.css`, in both light and dark theme
  variants (the demo verified both via the theme toggle).
- **Typography:** existing portal fonts via `next/font` — `Unbounded` (display),
  `DM Sans` (body), `JetBrains Mono` (labels/status) — no new font loaded.
- **Panel open/close:** spring overshoot scale + translate + slight rotate,
  transform-origin bottom-right so it visually emerges from the orb.
- **Message entrance:** slide-up + scale-in with the same overshoot spring,
  staggered per message.
- **Typing indicator:** amber-tinted gradient-shifting bubble background +
  bouncing 3-dot amber dots.
- **Orb icon:** an animated 4-point sparkle glyph (✦) — not a mascot/character,
  not the placeholder mic icon from the earlier demo. Emerald core with an
  amber glint on one point. Idle animation: slow back-and-forth rotation +
  gentle breathing scale, plus a rotating conic-gradient accent ring as the
  "available" signal. Press micro-interaction: scale + slight rotate.
- **Send button:** scale + rotate press feedback.
- **Implementation:** Framer Motion (`framer-motion@^12.42.0`, already a
  dependency — no new package). `AnimatePresence` for message enter/exit and
  panel mount/unmount; real spring transitions (`type: "spring"`) rather than
  hand-tuned cubic-beziers. The sparkle glyph's rotation/pulse is a simple
  looping `animate` prop — no SVG-morphing library needed, Framer Motion alone
  covers everything Option B requires. anime.js was evaluated but not added,
  to avoid a second animation dependency for one glyph.
- **Accessibility:** all spring/stagger animations collapse to simple opacity
  fades when `prefers-reduced-motion` is set, via Framer Motion's
  `useReducedMotion` hook.

## Streaming behavior

Responses render token-by-token as they stream in (not buffered-then-revealed)
— matches the staff `AiChat.tsx` behavior and avoids dead air on longer answers.

## Error handling

- **Stream fetch fails / network error:** one bot-bubble error message
  ("Couldn't reach the assistant — check your connection and try again");
  composer stays usable; prior history is not cleared.
- **503 (AI not configured):** same bubble pattern, message tailored
  ("The assistant is temporarily unavailable").
- **400 (defensive, shouldn't occur from this client):** generic fallback
  bubble, same pattern.
- **Streaming interrupted mid-response:** keep whatever partial text arrived;
  append a small inline "(response cut off)" marker rather than silently
  truncating with no indication.
- **sessionStorage read fails / corrupted JSON:** catch and start with an
  empty conversation — never crash the widget over a storage hiccup.
- **No automatic retry-with-backoff.** A manual re-send (user retypes, or a
  "try again" affordance on the failed bubble) is sufficient for a chat UI —
  matches this repo's preference for explicit user-triggered retries over
  silent automatic ones.

## Testing

Following the repo's existing convention (`TrendChart.test.ts` — focused unit
tests on extractable logic, not full component-render suites):

- `useAssistantStream` — SSE chunk parsing, `[KEEPALIVE]` filtering,
  partial-token accumulation, error-path returns. No DOM required.
- `useAssistantSession` — sessionStorage read/write/hydrate, including the
  corrupted-JSON fallback path.
- `MessageBubble` — markdown rendering smoke test.
- No E2E — this repo has no Playwright wiring (per CLAUDE.md), consistent
  with the rest of the codebase.

**Verification before calling implementation done:** `tsc --noEmit`,
`next build`, `npm test` (new + existing), manual check in both themes and
with reduced-motion enabled.
