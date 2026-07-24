import { describe, expect, it } from "vitest";

import { normalizeStreamFragment, parseSSEBuffer } from "./useAssistantStream";

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
