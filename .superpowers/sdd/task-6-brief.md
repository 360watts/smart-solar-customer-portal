## Task 6: Frontend — set-password page

**Files:**
- Create: `src/app/set-password/[token]/page.tsx`

**Interfaces:**
- Consumes: `fetch("/api/auth/set-password/${token}")` (GET, Task 5), `fetch("/api/auth/set-password/${token}", { method: "POST" })` (Task 5)

- [ ] **Step 1: Write the page**

Create `src/app/set-password/[token]/page.tsx`, adapted from `src/app/invite/[token]/page.tsx` — same `Card`/`Wordmark` shell and Tailwind classes, but no invite/site/login-mode machinery (this is a first-time activation, not joining an existing site):

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type PageState =
  | { type: "loading" }
  | { type: "form"; email: string; firstName: string }
  | { type: "not_found" }
  | { type: "success" }
  | { type: "error"; message: string };

const inputClass =
  "w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4 py-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center"
      >
        {children}
      </motion.div>
    </div>
  );
}

function Wordmark() {
  return (
    <p className="text-sm font-semibold tracking-widest uppercase text-emerald-400 mb-8">360Watts</p>
  );
}

export default function SetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const router = useRouter();
  const { refreshSession } = useAuth();

  const [state, setState] = useState<PageState>({ type: "loading" });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState({ type: "not_found" });
      return;
    }
    fetch(`/api/auth/set-password/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setState({ type: "not_found" });
          return;
        }
        const data = (await res.json()) as { email: string; first_name: string };
        setState({ type: "form", email: data.email, firstName: data.first_name });
      })
      .catch(() => setState({ type: "not_found" }));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/set-password/${token}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setFormError(data.message ?? "Unable to set password. Please try again.");
        setSubmitting(false);
        return;
      }
      await refreshSession();
      setState({ type: "success" });
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setFormError("Unable to set password. Please try again.");
      setSubmitting(false);
    }
  }

  if (state.type === "loading") {
    return (
      <Card>
        <Wordmark />
        <div className="w-9 h-9 mx-auto mb-4 rounded-full border-2 border-border border-t-emerald-400 animate-spin" />
        <p className="text-muted-foreground text-sm">Verifying your link…</p>
      </Card>
    );
  }

  if (state.type === "not_found") {
    return (
      <Card>
        <Wordmark />
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Link expired</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This link has expired or has already been used. Contact 360Watts support for a new one.
        </p>
      </Card>
    );
  }

  if (state.type === "success") {
    return (
      <Card>
        <Wordmark />
        <CheckCircle2 size={44} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">You&apos;re all set</h2>
        <p className="text-muted-foreground text-sm">Password created. Redirecting to your dashboard…</p>
      </Card>
    );
  }

  const { email, firstName } = state;
  return (
    <Card>
      <Wordmark />
      <div className="mb-7 text-center">
        <p className="text-xs tracking-widest uppercase text-emerald-400 mb-2">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </p>
        <h1 className="text-2xl font-semibold text-foreground mb-3">Set your password</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        <AnimatePresence>
          {formError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {formError}
            </motion.p>
          )}
        </AnimatePresence>
        <div>
          <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 transition-colors cursor-pointer"
        >
          {submitting ? "Setting password…" : "Set password & continue"}
        </button>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, then in another terminal create a test customer account via the Django backend (or the React `Users.tsx` staff form against a local backend) and copy the token from the logged/emailed link. Visit `http://localhost:3000/set-password/<token>` and confirm:
- Loading state briefly shows, then the form renders with the correct email/first name.
- Submitting a password under 8 characters is blocked by the `minLength={8}` HTML validation.
- Submitting a valid password shows the success state and redirects to `/dashboard` logged in.
- Revisiting the same URL after success shows "Link expired."

- [ ] **Step 4: Commit**

```bash
git add src/app/set-password/
git commit -m "feat: add set-password page for staff-created accounts"
```

---

## Verification (full plan)

1. Backend: `python3 manage.py test tests --settings=localapi.test_settings -v 2` — full suite green.
2. Backend: `python3 scripts/check_api_conventions.py` — no new violations.
3. Frontend: `npm run build && npm run lint` — clean.
4. Manual end-to-end (staging or local-with-real-SMTP-creds): create a customer account via `Users.tsx` → confirm the welcome email contains a `/set-password/<token>` link, not a password → complete the flow → confirm login works afterward → confirm the link is dead on a second visit → confirm logging in with the account *before* completing setup returns the `PASSWORD_NOT_SET` error, not "deactivated."
