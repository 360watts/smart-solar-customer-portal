import { describe, expect, it } from "vitest";

import { buildHistory, normalizeStreamFragment, parseSSEBuffer } from "./useAssistantStream";

describe("normalizeStreamFragment", () => {
  it("passes through ordinary text", () => {
    expect(normalizeStreamFragment("hello")).toBe("hello");
  });

  it("drops a bare [KEEPALIVE] fragment", () => {
    expect(normalizeStreamFragment("[KEEPALIVE]")).toBeNull();
  });

  it("drops an empty fragment", () => {
    expect(normalizeStreamFragment("")).toBeNull();
  });

  it("collapses non-breaking spaces to regular spaces", () => {
    expect(normalizeStreamFragment("a b")).toBe("a b");
  });
});

describe("parseSSEBuffer", () => {
  it("extracts a single complete token line and keeps the remainder", () => {
    const { events, remainder } = parseSSEBuffer("data: hello\ndata: wor");
    expect(events).toEqual([{ type: "token", text: "hello" }]);
    expect(remainder).toBe("data: wor");
  });

  it("filters out [KEEPALIVE] lines without emitting an event", () => {
    const { events } = parseSSEBuffer("data: [KEEPALIVE]\ndata: real token\n");
    expect(events).toEqual([{ type: "token", text: "real token" }]);
  });

  it("emits a done event for [DONE] and stops treating it as text", () => {
    const { events } = parseSSEBuffer("data: last\ndata: [DONE]\n");
    expect(events).toEqual([
      { type: "token", text: "last" },
      { type: "done" },
    ]);
  });

  it("emits an error event and strips the '[ERROR] ' prefix", () => {
    const { events } = parseSSEBuffer("data: [ERROR] backend exploded\n");
    expect(events).toEqual([{ type: "error", message: "backend exploded" }]);
  });

  it("falls back to a generic message when [ERROR] has no text", () => {
    const { events } = parseSSEBuffer("data: [ERROR]\n");
    expect(events).toEqual([{ type: "error", message: "Something went wrong." }]);
  });

  it("unescapes literal \\n sequences within a token into real newlines", () => {
    const { events } = parseSSEBuffer("data: line one\\nline two\n");
    expect(events).toEqual([{ type: "token", text: "line one\nline two" }]);
  });

  it("ignores non-data lines entirely", () => {
    const { events, remainder } = parseSSEBuffer(": comment\nevent: message\ndata: ok\n");
    expect(events).toEqual([{ type: "token", text: "ok" }]);
    expect(remainder).toBe("");
  });

  it("accumulates a partial line across two calls", () => {
    const first = parseSSEBuffer("data: par");
    expect(first.events).toEqual([]);
    const second = parseSSEBuffer(first.remainder + "tial token\n");
    expect(second.events).toEqual([{ type: "token", text: "partial token" }]);
  });
});

describe("buildHistory", () => {
  const msg = (role: "user" | "assistant", content: string, isError?: boolean) => ({
    id: content,
    role,
    content,
    ts: 0,
    isError,
  });

  it("drops error bubbles and empty placeholders", () => {
    expect(
      buildHistory([msg("user", "hi"), msg("assistant", "The assistant is temporarily unavailable.", true), msg("assistant", "")]),
    ).toEqual([{ role: "user", content: "hi" }]);
  });

  it("keeps only the last 20 messages", () => {
    const many = Array.from({ length: 30 }, (_, i) => msg("user", `m${i}`));
    const out = buildHistory(many);
    expect(out).toHaveLength(20);
    expect(out[0].content).toBe("m10");
  });
});

describe("parseSSEBuffer follow-up chips", () => {
  it("turns a `: suggest` comment frame into a suggest event, ignoring bad JSON", () => {
    const ok = parseSSEBuffer(': suggest ["Per-site","Why lower?"]\n\ndata: [DONE]\n');
    expect(ok.events).toEqual([{ type: "suggest", items: ["Per-site", "Why lower?"] }, { type: "done" }]);
    expect(parseSSEBuffer(": suggest {oops\n").events).toEqual([]);
  });
});
