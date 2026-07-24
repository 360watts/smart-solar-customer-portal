import { useCallback, useEffect, useRef, useState } from "react";

import type { AssistantMessage } from "@/components/assistant/types";

const MAX_TURNS = 10;

export type SSEEvent =
  | { type: "token"; text: string }
  | { type: "error"; message: string }
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
      if (!trimmed || streaming) return;

      const userMsg: AssistantMessage = { id: makeId(), role: "user", content: trimmed, ts: Date.now() };
      const assistantId = makeId();
      const assistantMsg: AssistantMessage = { id: assistantId, role: "assistant", content: "", ts: Date.now() };
      activeIdRef.current = assistantId;

      // Read the current history from the ref (kept in sync below) rather
      // than trying to capture it as a side effect inside the setMessages
      // updater — that updater's execution isn't guaranteed to run before
      // the code right after this call, so the request could go out with
      // an empty/stale history on the very first message of a session.
      const historyForRequest = [...messagesRef.current, userMsg].slice(-(MAX_TURNS * 2));
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      try {
        const res = await fetch("/api/backend/ai/user-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForRequest.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

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

        readLoop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSSEBuffer(buf);
          buf = remainder;

          for (const event of events) {
            if (event.type === "done") continue;
            if (event.type === "error") {
              replaceMessage(assistantId, { content: event.message, isError: true });
              sawError = true;
              break readLoop;
            }
            sawAnyToken = true;
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

        if (!sawAnyToken) {
          replaceMessage(assistantId, { content: "No response generated. Please try again." });
        }
      } catch {
        if (controller.signal.aborted) {
          // Deliberate cancel (unmount / panel close / new send) — not a user-facing error.
          return;
        }
        const hasPartial = pendingTextRef.current.length > 0;
        flushPending();
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
        setStreaming(false);
      }
    },
    [streaming, replaceMessage, flushPending, scheduleFlush],
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
