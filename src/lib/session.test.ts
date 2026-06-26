import { describe, expect, it } from "vitest";

import {
  buildCustomerSession,
  getPortalAccessDecision,
  type BackendProfile,
} from "./session";

function makeProfile(overrides: Partial<BackendProfile> = {}): BackendProfile {
  return {
    id: 7,
    email: "customer@example.com",
    first_name: "Casey",
    last_name: "Customer",
    user_type: "owner",
    is_staff: false,
    is_superuser: false,
    site_id: "SITE-001",
    memberships: [],
    ...overrides,
  };
}

describe("buildCustomerSession", () => {
  it("prefers the explicit site_id as the active site", () => {
    const session = buildCustomerSession(
      makeProfile({
        site_id: "SITE-ABC",
        memberships: [{ site_id: "SITE-XYZ", site_name: "Fallback", role: "viewer" }],
      }),
    );

    expect(session.activeSiteId).toBe("SITE-ABC");
  });

  it("falls back to the first membership site when site_id is absent", () => {
    const session = buildCustomerSession(
      makeProfile({
        site_id: null,
        user_type: "member",
        memberships: [{ site_id: "SITE-MEMBER", site_name: "Shared Site", role: "viewer" }],
      }),
    );

    expect(session.activeSiteId).toBe("SITE-MEMBER");
  });
});

describe("getPortalAccessDecision", () => {
  it("allows customer sessions into the portal", () => {
    expect(getPortalAccessDecision(makeProfile())).toEqual({
      kind: "allow",
    });
  });

  it("blocks staff users from the customer portal", () => {
    expect(
      getPortalAccessDecision(
        makeProfile({
          is_staff: true,
        }),
      ),
    ).toEqual({
      kind: "redirect-employee",
    });
  });
});
