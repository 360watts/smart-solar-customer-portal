## Task 5: Frontend — server-auth + route handlers

**Files:**
- Modify: `src/lib/server-auth.ts` — add two functions after `registerCustomerFromInvite` (currently ends ~line 419)
- Create: `src/app/api/auth/set-password/[token]/route.ts`

**Interfaces:**
- Consumes: `backendFetch`, `resolveSessionFromTokens`, `applySessionCookies`, `applySessionCache`, `clearSessionCookies`, `isSameOriginRequest` (all already exported from `src/lib/server-auth.ts`)
- Produces: `getPasswordSetupInfo(token: string): Promise<{ email: string; first_name: string; expires_at: string } | null>`, `completePasswordSetup(token: string, password: string): Promise<SessionResolution & { tokens?: Partial<TokenPair> }>`

- [ ] **Step 1: Add server-auth functions**

In `src/lib/server-auth.ts`, add after `registerCustomerFromInvite` (after its closing brace, currently line 419), before the `// ── Logout ──` comment:

```typescript
// ── Password setup (staff-created accounts — see api/password_setup.py) ───────

export async function getPasswordSetupInfo(
  token: string,
): Promise<{ email: string; first_name: string; expires_at: string } | null> {
  const response = await backendFetch(`/api/auth/password-setup/${token}/`, { method: "GET" });
  if (!response.ok) return null;
  return (await response.json()) as { email: string; first_name: string; expires_at: string };
}

export async function completePasswordSetup(
  token: string,
  password: string,
): Promise<SessionResolution & { tokens?: Partial<TokenPair> }> {
  let response: Response;
  try {
    response = await backendFetch(`/api/auth/password-setup/${token}/`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw Object.assign(
      new Error(isTimeout ? "Request timed out. Please try again." : "Cannot reach the server. Please try again later."),
      { isNetworkError: true },
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (data as { error?: string; detail?: string }).error ??
      (data as { error?: string; detail?: string }).detail ??
      "Unable to set password.";
    throw new Error(message);
  }

  const setupData = (await response.json()) as { tokens?: TokenPair };
  const tokens = setupData.tokens;

  if (!tokens?.access || !tokens.refresh) {
    throw new Error("Backend did not return session tokens.");
  }

  const sessionResolution = await resolveSessionFromTokens(tokens);
  if (sessionResolution.kind === "authenticated") {
    return {
      ...sessionResolution,
      tokens: {
        refresh: tokens.refresh,
        ...(sessionResolution.tokens ?? {}),
        access: sessionResolution.tokens?.access ?? tokens.access,
      },
    };
  }

  return { ...sessionResolution, tokens };
}
```

- [ ] **Step 2: Create the route handler**

Create `src/app/api/auth/set-password/[token]/route.ts`:

```typescript
import { NextResponse } from "next/server";

import {
  applySessionCache,
  applySessionCookies,
  clearSessionCookies,
  completePasswordSetup,
  getPasswordSetupInfo,
  isSameOriginRequest,
} from "@/lib/server-auth";

// Unauthenticated entry point — mirrors src/app/api/auth/register/route.ts.
// The customer has no session yet; this is how they get one for the first time.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const info = await getPasswordSetupInfo(token);
  if (!info) {
    return NextResponse.json({ message: "This link has expired or is invalid." }, { status: 404 });
  }
  return NextResponse.json(info);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }

  const { token } = await params;

  try {
    const { password } = (await request.json()) as { password?: string };
    if (!password) {
      return NextResponse.json({ message: "Password is required." }, { status: 400 });
    }

    const result = await completePasswordSetup(token, password);

    if (result.kind === "redirect-employee") {
      const response = NextResponse.json(
        { message: "Employee accounts must use the employee application." },
        { status: 403 },
      );
      return clearSessionCookies(response);
    }

    if (result.kind !== "authenticated") {
      const response = NextResponse.json(
        { message: "Unable to establish a customer session." },
        { status: 401 },
      );
      return clearSessionCookies(response);
    }

    let response = NextResponse.json({ session: result.session });
    response = applySessionCookies(response, result.tokens ?? {});
    return applySessionCache(response, result.session);
  } catch (error) {
    const isNetworkError =
      error instanceof Error && (error as Error & { isNetworkError?: boolean }).isNetworkError;

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to set password." },
      { status: isNetworkError ? 503 : 400 },
    );
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors in the new/modified files. (Full build also catches the page from Task 6 if done first — run this again after Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/server-auth.ts src/app/api/auth/set-password/
git commit -m "feat: add password-setup server-auth functions and route handler"
```

---

