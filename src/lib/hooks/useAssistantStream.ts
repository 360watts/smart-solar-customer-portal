import { useCallback, useEffect, useRef, useState } from "react";

import type { AssistantMessage } from "@/components/assistant/types";
import { getApiToken, setApiToken } from "@/lib/apiToken";
import { loadSession } from "@/lib/auth";

// Same direct-to-Mumbai rationale as src/lib/api.ts — this used to go through
// the /api/backend/ai/user-chat Vercel proxy.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

const MAX_TURNS = 10;

export type SSEEvent =
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "suggest"; items: string[] }
  | { type: "done" };

/** Same SSE token-cleanup rule as the staff frontend's AiChat.tsx
 * (normalizeStreamFragment) — collapses non-breaking spaces and drops
 * whitespace-only / bare-keepalive fragments. Ported, not imported:
 * separate repo, no shared package between the two frontends. */
export function normalizeStreamFragment(fragment: string): string | null {
  // The staff frontend's version of this function (AiChat.tsx) has the same
  // regex written as a literal ASCII space — a no-op that doesn't actually
  // collapse non-breaking spaces despite its own comment claiming it does.
  // Using the real U+00A0 here so this copy does what the comment says.
  const cleaned = fragment.replace(/ /g, " ");
  if (cleaned === "" || cleaned.trim() === "[KEEPALIVE]") return null;
  return cleaned;
}

/**
 * Pure SSE-buffer parser — takes whatever text has accumulated so far
 * (including a possibly-incomplete trailing line) and returns the events
 * found in the complete lines, plus the leftover partial line to prepend
 * next time. No fetch/React/DOM involved, so this is unit-testable on its
 * own without a real stream or a hook-rendering harness (this repo has
 * neither testing-library nor a jsdom vitest environment configured — see
 * TrendChart.test.ts for the established pattern of testing only the
 * extractable pure logic, not the component/hook shell around it).
 */
export function parseSSEBuffer(buf: string): { events: SSEEvent[]; remainder: string } {
  const lines = buf.split("\n");
  const remainder = lines.pop() ?? "";
  const events: SSEEvent[] = [];

  for (const line of lines) {
    // `: suggest ["a","b"]` is an SSE comment frame (older clients ignore it).
    if (line.startsWith(": suggest ")) {
      try {
        const items = (JSON.parse(line.slice(10)) as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 3);
        if (items.length) events.push({ type: "suggest", items });
      } catch {
        /* malformed chip frame: show the answer without chips */
      }
      continue;
    }
    if (!line.startsWith("data: ")) continue;
    const token = line.slice(6);
    if (token === "[DONE]") {
      events.push({ type: "done" });
      continue;
    }
    if (token === "[KEEPALIVE]") continue;
    if (token.startsWith("[ERROR]")) {
      events.push({ type: "error", message: token.slice(8) || "Something went wrong." });
      continue;
    }
    const clean = normalizeStreamFragment(token.replace(/\\n/g, "\n"));
    if (clean === null) continue;
    events.push({ type: "token", text: clean });
  }

  return { events, remainder };
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Conversation payload for the backend: error bubbles and empty placeholders
 * are UI-only and must not be fed back to the model as if it had said them. */
export function buildHistory(messages: AssistantMessage[]): { role: string; content: string }[] {
  return messages
    .filter((m) => !m.isError && m.content.trim() !== "")
    .slice(-(MAX_TURNS * 2))
    .map((m) => ({ role: m.role, content: m.content }));
}

const ERROR_COPY: Record<number, string> = {
  401: "Your session needs a refresh — please reload the page.",
  403: "The assistant isn't available for this account right now.",
  429: "You're sending messages a bit fast — please wait a moment and try again.",
  503: "The assistant is temporarily unavailable.",
  400: "Something went wrong with that request.",
};

export function useAssistantStream() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Synchronous guard — the `streaming` state value captured by the callback
  // is stale if two sends land in the same tick.
  const streamingRef = useRef(false);

  // Always-current mirror of `messages`, read synchronously in sendMessage —
  // see the comment there for why this replaced reading state inside a
  // setMessages updater.
  const messagesRef = useRef<AssistantMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Streaming performance: tokens can arrive many times a second. Rather than
  // calling setMessages on every single SSE token (a full re-render per
  // token), accumulate into a ref and flush to React state at most once per
  // animation frame — the UI still looks like it's streaming, but re-render
  // count is capped to display refresh rate instead of token rate.
  const pendingTextRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  // True once any token of the current reply has arrived (flushed or not).
  const receivedRef = useRef(false);

  const flushPending = useCallback(() => {
    rafRef.current = null;
    if (!pendingTextRef.current || !activeIdRef.current) return;
    const chunk = pendingTextRef.current;
    pendingTextRef.current = "";
    const id = activeIdRef.current;
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], content: next[idx].content + chunk };
      return next;
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(flushPending);
  }, [flushPending]);

  const replaceMessage = useCallback((id: string, patch: Partial<AssistantMessage>) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const setInitialMessages = useCallback((initial: AssistantMessage[]) => {
    setMessages(initial);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;
      streamingRef.current = true;

      const userMsg: AssistantMessage = { id: makeId(), role: "user", content: trimmed, ts: Date.now() };
      const assistantId = makeId();
      const assistantMsg: AssistantMessage = { id: assistantId, role: "assistant", content: "", ts: Date.now() };
      activeIdRef.current = assistantId;
      // Drop anything left over from a previous (aborted/errored) stream so it
      // can't flush into this reply.
      pendingTextRef.current = "";
      receivedRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Read the current history from the ref (kept in sync below) rather
      // than trying to capture it as a side effect inside the setMessages
      // updater — that updater's execution isn't guaranteed to run before
      // the code right after this call, so the request could go out with
      // an empty/stale history on the very first message of a session.
      const historyForRequest = buildHistory([...messagesRef.current, userMsg]);
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      const post = () => {
        const token = getApiToken();
        return fetch(`${API_BASE_URL}/api/ai/user-chat/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: historyForRequest }),
          signal: controller.signal,
        });
      };

      try {
        let res = await post();

        // The access token lives ~55 min; this raw fetch bypasses api.ts's
        // axios 401 interceptor, so refresh once here and retry.
        if (res.status === 401) {
          const session = await loadSession();
          if (session.status === "authenticated" && session.accessToken) {
            setApiToken(session.accessToken);
            res = await post();
          }
        }

        if (!res.ok) {
          const copy = ERROR_COPY[res.status] ?? "Something went wrong. Please try again.";
          replaceMessage(assistantId, { content: copy, isError: true });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          replaceMessage(assistantId, { content: "Couldn't read the response. Please try again.", isError: true });
          return;
        }

        const decoder = new TextDecoder();
        let buf = "";
        let sawAnyToken = false;
        let sawError = false;
        let sawDone = false;
        let suggestions: string[] = [];

        readLoop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSSEBuffer(buf);
          buf = remainder;

          for (const event of events) {
            if (event.type === "done") {
              sawDone = true;
              continue;
            }
            if (event.type === "suggest") {
              suggestions = event.items;
              continue;
            }
            if (event.type === "error") {
              replaceMessage(assistantId, { content: event.message, isError: true });
              sawError = true;
              break readLoop;
            }
            sawAnyToken = true;
            receivedRef.current = true;
            pendingTextRef.current += event.text;
            scheduleFlush();
          }
        }

        if (sawError) return;

        // Final flush so the last partial chunk isn't lost waiting for a
        // frame that will never come once the stream is done.
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        flushPending();
        if (suggestions.length) replaceMessage(assistantId, { suggestions });

        if (!sawAnyToken) {
          replaceMessage(assistantId, { content: "No response generated. Please try again." });
        } else if (!sawDone) {
          // Stream closed without the [DONE] sentinel — the reply is truncated.
          replaceMessage(assistantId, { cutOff: true });
        }
      } catch {
        // Anything already received (on screen or still pending) is a partial
        // answer worth keeping; only an empty bubble is an error / removable.
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        flushPending();
        const hasPartial = receivedRef.current;
        if (controller.signal.aborted) {
          // Deliberate cancel (unmount / panel close) — not a user-facing error.
          if (hasPartial) replaceMessage(assistantId, { cutOff: true });
          else setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }
        replaceMessage(
          assistantId,
          hasPartial
            ? { cutOff: true }
            : {
                content: "Couldn't reach the assistant — check your connection and try again.",
                isError: true,
              },
        );
      } finally {
        activeIdRef.current = null;
        abortRef.current = null;
        streamingRef.current = false;
        setStreaming(false);
      }
    },
    [replaceMessage, flushPending, scheduleFlush],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Cancel any in-flight stream on unmount — avoids a dangling reader and a
  // state update after the component is gone.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { messages, streaming, sendMessage, cancel, setInitialMessages };
}
