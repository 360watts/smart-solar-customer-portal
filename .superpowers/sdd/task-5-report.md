# Task 5 Report: Frontend — server-auth + route handlers

## Summary

Successfully implemented password setup server-side authentication functions and route handler for the staff-created account onboarding flow. All changes follow the exact specifications from task-5-brief.md. Build completed without errors.

## Changes Made

### 1. Modified: `src/lib/server-auth.ts`

Added two new exported functions after `registerCustomerFromInvite` (line 419):

- **`getPasswordSetupInfo(token: string)`**: Fetches password setup info (email, first_name, expires_at) from the backend. Returns null if the link is invalid or expired.

- **`completePasswordSetup(token: string, password: string)`**: Sends the password to the backend, handles token resolution, and returns session data with tokens. Includes proper error handling for network timeouts and backend errors.

Both functions follow the established patterns in the codebase (similar to `loginCustomer` and `registerCustomerFromInvite`).

### 2. Created: `src/app/api/auth/set-password/[token]/route.ts`

New Next.js Route Handler with:
- **GET handler**: Validates the password setup link and returns metadata (email, first_name, expires_at) for the password form to display.
- **POST handler**: Accepts password submission, validates CSRF via `isSameOriginRequest`, calls `completePasswordSetup`, and applies session cookies/cache.

Mirrors the existing `register/route.ts` pattern (unauthenticated entry point).

## Build Verification

**Command run:**
```bash
npm run build
```

**Output:**
```
> next build
✓ Compiled successfully in 10.1s
  Running TypeScript ...
  Finished TypeScript in 11.3s ...
  ...
✓ Generating static pages using 3 workers (25/25) in 654ms
```

**Result:** Build succeeded with no TypeScript errors. The new route `/api/auth/set-password/[token]` appears in the final route list.

Pre-existing warning (informational only):
- `EMPLOYEE_APP_URL is not set` — this is expected in dev/local mode; production provides this var.

## Git Commit

**Command:**
```bash
git add src/lib/server-auth.ts src/app/api/auth/set-password/
git commit -m "feat: add password-setup server-auth functions and route handler"
```

**Commit hash:** `c5c3bb5`

**Files changed:**
- Modified: `src/lib/server-auth.ts` (+56 lines)
- Created: `src/app/api/auth/set-password/[token]/route.ts` (+70 lines)

## Self-Review

✅ **Specification adherence:** Code matches the brief exactly, including:
  - Function signatures and return types
  - Error handling patterns (timeouts, network errors, backend errors)
  - Session resolution and cookie application
  - CSRF protection via `isSameOriginRequest`

✅ **Code consistency:** Follows existing patterns:
  - Mirrors `loginCustomer` error handling and token resolution
  - Route handler mirrors `register/route.ts` structure
  - Uses existing helper functions (`backendFetch`, `resolveSessionFromTokens`, etc.)

✅ **Type safety:** All TypeScript inferred types and explicitly typed as needed

✅ **Security:**
  - Network error detection (AbortError for timeouts)
  - CSRF validation on POST
  - Proper session establishment via `resolveSessionFromTokens`
  - Employee accounts rejected with `redirect-employee` logic

✅ **No deviations:** Implementation follows the brief exactly as provided.

## Dependencies on Other Tasks

- **Task 6** (React page component) will call the route handler at `/api/auth/set-password/[token]/` and display the password setup form.
- No blockers identified. The route handler and server-auth functions are ready for Task 6 implementation.

## Final-review fix

**Finding:** `getPasswordSetupInfo(token)` called `backendFetch(...)` without try/catch, allowing network failures (timeout, DNS error, connection reset) to propagate as unhandled exceptions instead of returning the expected `null`, which would be converted to a clean 404 by the route handler.

**Change:** Wrapped the `backendFetch` call in try/catch block. On any network error, the function returns `null` (matching the existing behavior when `!response.ok`). This mirrors the pattern in the sibling `completePasswordSetup` function immediately below it, but simpler: `completePasswordSetup` throws a descriptive error with `isNetworkError` property for its caller to distinguish, while `getPasswordSetupInfo`'s caller (the GET handler) already treats `null` as 404, which is correct for network failures too.

**Exact change:**
```typescript
// Before: unprotected backendFetch call
const response = await backendFetch(`/api/auth/password-setup/${token}/`, { method: "GET" });

// After: wrapped in try/catch
let response: Response;
try {
  response = await backendFetch(`/api/auth/password-setup/${token}/`, { method: "GET" });
} catch {
  return null;
}
```

**Verification command:**
```bash
npx tsc --noEmit
```

**Result:** No TypeScript errors. Compilation succeeds with the new error handling in place.

**Commit:** `bb28f12` — `fix: handle network failures gracefully in getPasswordSetupInfo`
