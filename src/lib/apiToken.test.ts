import { describe, it, expect, vi, beforeEach } from "vitest";

import { getApiToken, setApiToken, onSessionExpired, notifySessionExpired } from "./apiToken";

describe("apiToken", () => {
  beforeEach(() => {
    setApiToken(null);
    onSessionExpired(null);
  });

  it("stores and clears the token", () => {
    expect(getApiToken()).toBeNull();
    setApiToken("abc");
    expect(getApiToken()).toBe("abc");
    setApiToken(null);
    expect(getApiToken()).toBeNull();
  });

  it("notifySessionExpired is a no-op with no handler registered", () => {
    expect(() => notifySessionExpired()).not.toThrow();
  });

  it("calls the registered handler exactly once per notify", () => {
    const handler = vi.fn();
    onSessionExpired(handler);
    notifySessionExpired();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("un-registering stops future notifications", () => {
    const handler = vi.fn();
    onSessionExpired(handler);
    onSessionExpired(null);
    notifySessionExpired();
    expect(handler).not.toHaveBeenCalled();
  });
});
