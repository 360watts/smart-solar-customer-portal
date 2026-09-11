import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoadSession } = vi.hoisted(() => ({ mockLoadSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ loadSession: mockLoadSession }));

// api.ts imports axios for real here (no mock) so axios.isAxiosError works
// against the synthetic errors below.
import { getApiToken, onSessionExpired } from "./apiToken";
import { handle401 } from "./api";

function axiosError(status: number, retried = false) {
  return {
    isAxiosError: true,
    response: { status },
    config: { _retried: retried, url: "/api/sites/x/telemetry/" },
  };
}

describe("handle401", () => {
  beforeEach(() => {
    mockLoadSession.mockReset();
    onSessionExpired(null);
  });

  it("passes through non-401 errors untouched", async () => {
    const err = axiosError(500);
    const retry = vi.fn();
    await expect(handle401(err, retry)).rejects.toBe(err);
    expect(retry).not.toHaveBeenCalled();
    expect(mockLoadSession).not.toHaveBeenCalled();
  });

  it("does not retry twice — a 401 with _retried already set is rejected immediately", async () => {
    const err = axiosError(401, true);
    const retry = vi.fn();
    await expect(handle401(err, retry)).rejects.toBe(err);
    expect(mockLoadSession).not.toHaveBeenCalled();
  });

  it("on a first 401, refreshes the session and retries once with the new token", async () => {
    mockLoadSession.mockResolvedValue({ status: "authenticated", accessToken: "fresh-token" });
    const err = axiosError(401);
    const retry = vi.fn().mockReturnValue("retried-response");

    const result = await handle401(err, retry);

    expect(getApiToken()).toBe("fresh-token");
    expect(retry).toHaveBeenCalledWith(err.config);
    expect(err.config._retried).toBe(true);
    expect(result).toBe("retried-response");
  });

  it("clears the token and notifies session-expired when the refresh comes back unauthenticated", async () => {
    mockLoadSession.mockResolvedValue({ status: "unauthenticated", session: null });
    const expiredHandler = vi.fn();
    onSessionExpired(expiredHandler);
    const err = axiosError(401);

    await expect(handle401(err, vi.fn())).rejects.toBe(err);

    expect(getApiToken()).toBeNull();
    expect(expiredHandler).toHaveBeenCalledTimes(1);
  });

  it("notifies session-expired when the session refresh call itself throws", async () => {
    mockLoadSession.mockRejectedValue(new Error("network down"));
    const expiredHandler = vi.fn();
    onSessionExpired(expiredHandler);
    const err = axiosError(401);

    await expect(handle401(err, vi.fn())).rejects.toBe(err);
    expect(expiredHandler).toHaveBeenCalledTimes(1);
  });
});
