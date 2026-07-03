export interface SessionMembership {
  site_id: string;
  site_name: string;
  role: string;
}

export interface BackendProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type?: string | null;
  is_staff?: boolean;
  is_superuser?: boolean;
  site_id?: string | null;
  memberships?: SessionMembership[];
  plan_type?: string | null;
  subscription_status?: string | null;
}

export interface CustomerSession {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string | null;
    memberships: SessionMembership[];
    plan_type: string | null;
    subscription_status: string | null;
  };
  activeSiteId: string | null;
}

export type PortalAccessDecision =
  | { kind: "allow" }
  | { kind: "redirect-employee" };

// User types that belong in the staff/employee app, not the customer portal.
const EMPLOYEE_USER_TYPES = new Set(["employee", "technician", "admin", "staff", "manager"]);

export function buildCustomerSession(profile: BackendProfile): CustomerSession {
  const memberships = profile.memberships ?? [];
  const activeSiteId = profile.site_id ?? memberships[0]?.site_id ?? null;

  return {
    user: {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      user_type: profile.user_type ?? null,
      memberships,
      plan_type: profile.plan_type ?? null,
      subscription_status: profile.subscription_status ?? null,
    },
    activeSiteId,
  };
}

export function validateProfile(data: unknown): BackendProfile {
  if (!data || typeof data !== "object") {
    throw new Error("Profile response is not an object.");
  }
  const p = data as Record<string, unknown>;
  if (typeof p.id !== "number") throw new Error("Profile missing field: id");
  if (typeof p.email !== "string") throw new Error("Profile missing field: email");
  if (typeof p.first_name !== "string") throw new Error("Profile missing field: first_name");
  if (typeof p.last_name !== "string") throw new Error("Profile missing field: last_name");
  return p as unknown as BackendProfile;
}

export function getPortalAccessDecision(
  profile: Pick<BackendProfile, "is_staff" | "is_superuser" | "user_type">,
): PortalAccessDecision {
  if (profile.is_staff || profile.is_superuser) {
    return { kind: "redirect-employee" };
  }
  if (profile.user_type && EMPLOYEE_USER_TYPES.has(profile.user_type.toLowerCase())) {
    return { kind: "redirect-employee" };
  }
  return { kind: "allow" };
}
