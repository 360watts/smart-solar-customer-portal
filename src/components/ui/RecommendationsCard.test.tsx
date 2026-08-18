// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import { RecommendationsCard } from "./RecommendationsCard";
import { portalApi, type CustomerRecommendation } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  portalApi: {
    getRecommendations: vi.fn(),
    updateRecommendation: vi.fn(),
  },
}));

const mockRec: CustomerRecommendation = {
  id: 1,
  rec_type: "wallet_usage",
  category: "billing_financial",
  title: "Test rec",
  body: "Body text",
  priority: 5,
  state: "active",
  context: {},
  created_at: "2026-08-14T00:00:00Z",
  dismissed_at: null,
  acted_on_at: null,
  expires_at: null,
};

describe("RecommendationsCard", () => {
  afterEach(cleanup);

  it("renders the first recommendation's content immediately, no click needed", async () => {
    vi.mocked(portalApi.getRecommendations).mockResolvedValue({ data: [mockRec] } as never);
    render(<RecommendationsCard siteId="test_site" />);
    await waitFor(() => expect(screen.getByText("Recommendations")).toBeInTheDocument());
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Test rec")).toBeInTheDocument();
  });

  it("renders nothing when there are no active recommendations", async () => {
    vi.mocked(portalApi.getRecommendations).mockResolvedValue({ data: [] } as never);
    const { container } = render(<RecommendationsCard siteId="test_site" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("dismisses a recommendation and removes it from the list", async () => {
    vi.mocked(portalApi.getRecommendations).mockResolvedValue({ data: [mockRec] } as never);
    vi.mocked(portalApi.updateRecommendation).mockResolvedValue({
      data: { ...mockRec, state: "dismissed" },
    } as never);
    render(<RecommendationsCard siteId="test_site" />);
    await waitFor(() => expect(screen.getByText("Test rec")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    await waitFor(() => expect(screen.queryByText("Test rec")).not.toBeInTheDocument());
    expect(portalApi.updateRecommendation).toHaveBeenCalledWith("test_site", 1, "dismissed");
  });

  it("marks a recommendation helpful and removes it from the list", async () => {
    vi.mocked(portalApi.getRecommendations).mockResolvedValue({ data: [mockRec] } as never);
    vi.mocked(portalApi.updateRecommendation).mockResolvedValue({
      data: { ...mockRec, state: "acted_on" },
    } as never);
    render(<RecommendationsCard siteId="test_site" />);
    await waitFor(() => expect(screen.getByText("Test rec")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /mark helpful/i }));

    await waitFor(() => expect(screen.queryByText("Test rec")).not.toBeInTheDocument());
    expect(portalApi.updateRecommendation).toHaveBeenCalledWith("test_site", 1, "acted_on");
  });
});
