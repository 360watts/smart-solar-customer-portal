"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { portalApi, type InviteDetails } from "@/lib/api";
import { loginWithPassword, registerWithInvite, AuthRequestError } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

type PageState =
  | { type: "loading" }
  | { type: "invite"; details: InviteDetails }
  | { type: "not_found" }
  | { type: "already_used" }
  | { type: "accepted" }
  | { type: "email_mismatch" }
  | { type: "already_member" }
  | { type: "error"; message: string };

type AuthMode = "choose" | "login" | "signup";

const ROLE_LABELS: Record<string, string> = { viewer: "Viewer", co_owner: "Co-owner" };

const inputClass =
  "w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4 py-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-[#0b1119] border border-border p-8 text-center"
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

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const isAuthenticated = !!user;

  const [state, setState] = useState<PageState>({ type: "loading" });
  const [accepting, setAccepting] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("choose");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState({ type: "not_found" });
      return;
    }
    portalApi
      .getInviteDetails(token)
      .then(({ data }) => {
        setState({ type: "invite", details: data });
        setLoginEmail(data.invite_email || "");
        setSignupEmail(data.invite_email || "");
      })
      .catch(() => setState({ type: "not_found" }));
  }, [token]);

  const acceptAndRedirect = useCallback(async () => {
    if (!token) return;
    await portalApi.acceptInvite(token);
    setState({ type: "accepted" });
    setTimeout(() => router.push("/dashboard"), 1800);
  }, [token, router]);

  function classifyAcceptError(err: unknown): PageState {
    const backendMessage =
      err && typeof err === "object" && "response" in err
        ? ((err as { response?: { status?: number; data?: { error?: string } } }).response)
        : undefined;
    const status = backendMessage?.status;
    const message = backendMessage?.data?.error?.toLowerCase() ?? "";

    if (status === 403 || message.includes("different email")) return { type: "email_mismatch" };
    if (status === 409 || message.includes("already")) return { type: "already_member" };
    if (status === 410) return { type: "already_used" };
    return { type: "error", message: backendMessage?.data?.error || "Something went wrong. Please try again." };
  }

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    try {
      await acceptAndRedirect();
    } catch (err) {
      setState(classifyAcceptError(err));
    } finally {
      setAccepting(false);
    }
  }, [acceptAndRedirect]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await loginWithPassword(loginEmail, loginPassword);
      await refreshSession();
      await acceptAndRedirect();
    } catch (err) {
      if (err instanceof AuthRequestError) setLoginError(err.message);
      else setLoginError("Sign in failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);
    try {
      await registerWithInvite({
        invite_token: token!,
        email: signupEmail,
        password: signupPassword,
        first_name: signupFirstName,
        last_name: signupLastName,
      });
      await refreshSession();
      await acceptAndRedirect();
    } catch (err) {
      if (err instanceof AuthRequestError) setSignupError(err.message);
      else setSignupError("Registration failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  }

  if (state.type === "loading") {
    return (
      <Card>
        <Wordmark />
        <div className="w-9 h-9 mx-auto mb-4 rounded-full border-2 border-border border-t-emerald-400 animate-spin" />
        <p className="text-muted-foreground text-sm">Verifying your invitation…</p>
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
          This invitation link has expired or is no longer valid. Ask the site owner to resend a fresh invitation.
        </p>
      </Card>
    );
  }

  if (state.type === "already_used") {
    return (
      <Card>
        <Wordmark />
        <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Already accepted</h2>
        <p className="text-muted-foreground text-sm">This invite has already been used or revoked.</p>
      </Card>
    );
  }

  if (state.type === "accepted") {
    return (
      <Card>
        <Wordmark />
        <CheckCircle2 size={44} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Welcome aboard</h2>
        <p className="text-muted-foreground text-sm">Your invitation has been accepted. Redirecting…</p>
      </Card>
    );
  }

  if (state.type === "email_mismatch") {
    return (
      <Card>
        <Wordmark />
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Wrong account</h2>
        <p className="text-muted-foreground text-sm">
          This invite was sent to a different email address. Sign in with the invited account to accept.
        </p>
      </Card>
    );
  }

  if (state.type === "already_member") {
    return (
      <Card>
        <Wordmark />
        <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Already a member</h2>
        <p className="text-muted-foreground text-sm">You already have access to this site.</p>
      </Card>
    );
  }

  if (state.type === "error") {
    return (
      <Card>
        <Wordmark />
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">{state.message}</p>
      </Card>
    );
  }

  const { details } = state;
  const InviteHeader = (
    <div className="mb-7 text-center">
      <p className="text-xs tracking-widest uppercase text-emerald-400 mb-2">You&apos;ve been invited</p>
      <h1 className="text-2xl font-semibold text-foreground mb-3">Join {details.site_name}</h1>
      <div className="flex items-center justify-center flex-wrap gap-2 text-sm text-muted-foreground">
        <span>Invited by</span>
        <strong className="text-foreground font-medium">{details.invited_by}</strong>
        <span>·</span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
          {ROLE_LABELS[details.role] ?? details.role}
        </span>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return (
      <Card>
        <Wordmark />
        {InviteHeader}
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 mb-5 text-left">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-semibold text-emerald-400 shrink-0">
            {user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Accepting as</p>
            <p className="text-sm text-foreground font-medium">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 transition-colors cursor-pointer"
        >
          {accepting ? "Accepting…" : "Accept invitation"}
        </button>
      </Card>
    );
  }

  if (authMode === "login") {
    return (
      <Card>
        <Wordmark />
        {InviteHeader}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <AnimatePresence>
            {loginError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {loginError}
              </motion.p>
            )}
          </AnimatePresence>
          <div>
            <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Email</label>
            <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showLoginPw ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowLoginPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
              >
                {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 transition-colors cursor-pointer"
            >
              {loginLoading ? "Signing in…" : "Sign in & accept"}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("choose")}
              className="w-full rounded-xl border border-border text-muted-foreground hover:text-foreground py-2.5 transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
        </form>
      </Card>
    );
  }

  if (authMode === "signup") {
    return (
      <Card>
        <Wordmark />
        {InviteHeader}
        <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
          <AnimatePresence>
            {signupError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {signupError}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">First name</label>
              <input required value={signupFirstName} onChange={(e) => setSignupFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Last name</label>
              <input value={signupLastName} onChange={(e) => setSignupLastName(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Email</label>
            <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showSignupPw ? "text" : "password"}
                required
                minLength={8}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowSignupPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
              >
                {showSignupPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={signupLoading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 transition-colors cursor-pointer"
            >
              {signupLoading ? "Creating account…" : "Create account & accept"}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("choose")}
              className="w-full rounded-xl border border-border text-muted-foreground hover:text-foreground py-2.5 transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <Wordmark />
      {InviteHeader}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground tracking-wide">TO ACCEPT</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => setAuthMode("login")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 transition-colors cursor-pointer"
        >
          Sign in
        </button>
        <button
          onClick={() => setAuthMode("signup")}
          className="w-full rounded-xl border border-border text-muted-foreground hover:text-foreground py-2.5 transition-colors cursor-pointer"
        >
          Create account
        </button>
      </div>
    </Card>
  );
}
