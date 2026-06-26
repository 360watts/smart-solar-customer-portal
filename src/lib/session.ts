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
}

export interface CustomerSession {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string | null;
    memberships: SessionMembership[];
  };
  activeSiteId: string | null;
}

export type PortalAccessDecision =
  | { kind: "allow" }
  | { kind: "redirect-employee" };

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
    },
    activeSiteId,
  };
}

export function getPortalAccessDecision(profile: Pick<BackendProfile, "is_staff" | "is_superuser">): PortalAccessDecision {
  if (profile.is_staff || profile.is_superuser) {
    return { kind: "redirect-employee" };
  }

  return { kind: "allow" };
}
