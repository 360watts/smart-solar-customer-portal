"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subscription_plan: string;
  avatar_url: string | null;
}

interface Site {
  capacity_kw: number;
  site_name: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-white/30";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const { user } = useAuth();

  // Data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit form
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwState, setPwState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        setError("");
        const [profileRes, siteRes] = await Promise.all([
          portalApi.getProfile(),
          user?.site_id ? portalApi.getGatewayStatus(user.site_id) : Promise.resolve(null),
        ]);
        const rawProfile = profileRes.data as {
          first_name?: string;
          last_name?: string;
          email?: string;
          mobile_number?: string;
          plan_type?: string;
          avatar_url?: string | null;
        };
        const p: Profile = {
          first_name: rawProfile.first_name ?? "",
          last_name: rawProfile.last_name ?? "",
          email: rawProfile.email ?? "",
          phone: rawProfile.mobile_number ?? "",
          subscription_plan: rawProfile.plan_type ?? "Customer Plan",
          avatar_url: rawProfile.avatar_url ?? null,
        };
        setProfile(p);
        setEditFirst(p.first_name);
        setEditLast(p.last_name);
        setEditPhone(p.phone ?? "");
        if (siteRes) {
          const rawSite = siteRes.data as Record<string, unknown>;
          setSite({
            capacity_kw: Number(rawSite.solar_kwp) || 0,
            site_name: String(rawSite.site_name || "Solar Site"),
          });
        }
      } catch {
        setError("We could not load your account details right now.");
        setProfile(null);
        setSite(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.site_id]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const isDirty =
    profile !== null &&
    (editFirst !== profile.first_name ||
      editLast !== profile.last_name ||
      editPhone !== (profile.phone ?? ""));

  const initials =
    profile
      ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
      : "";

  // ---------------------------------------------------------------------------
  // Save profile
  // ---------------------------------------------------------------------------
  async function handleSave() {
    if (!isDirty) return;
    setSaveState("saving");
    try {
      await portalApi.updateProfile({
        first_name: editFirst,
        last_name: editLast,
        mobile_number: editPhone,
      });
      setProfile((p) => p ? { ...p, first_name: editFirst, last_name: editLast, phone: editPhone } : p);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  // ---------------------------------------------------------------------------
  // Change password
  // ---------------------------------------------------------------------------
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwState("saving");
    try {
      await portalApi.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });
      setPwState("saved");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwState("idle"), 2500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to change password.";
      setPwError(msg);
      setPwState("error");
      setTimeout(() => setPwState("idle"), 3000);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground font-display mb-6">Profile</h1>
        {[...Array(4)].map((_, i) => (
          <GlassCard key={i}>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground font-display mb-6">Profile</h1>
        <GlassCard>
          <p className="text-sm text-red-300">{error || "Profile data is unavailable."}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl font-bold text-foreground font-display mb-6">Profile</h1>

      {error && (
        <GlassCard>
          <p className="text-sm text-red-300">{error}</p>
        </GlassCard>
      )}

      {/* ── 1. Account Card ── */}
      <GlassCard glow="green">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={initials}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center">
                <span className="font-display text-xl font-bold text-emerald-300">{initials}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-white truncate">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm text-white/50 mt-0.5 truncate">{profile.email}</p>
            <div className="mt-2">
              <StatusPill
                status={profile.subscription_plan === "premium" ? "active" : "inactive"}
                label={profile.subscription_plan || "Free Plan"}
                animated={profile.subscription_plan === "premium"}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 2. System Summary ── */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4">Your System</h3>
        <div className="space-y-3">
          {[
            { label: "Site", value: site?.site_name ?? "—" },
            { label: "Solar Capacity", value: site ? `${site.capacity_kw} kWp` : "—" },
            { label: "Account", value: user?.site_id ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-xs text-white/40 uppercase tracking-wide">{label}</span>
              <span className="font-mono text-sm text-white">{value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── 3. Edit Profile ── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Edit Profile</h3>
          <button
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary"
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">First Name</label>
              <input
                type="text"
                value={editFirst}
                onChange={(e) => setEditFirst(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Last Name</label>
              <input
                type="text"
                value={editLast}
                onChange={(e) => setEditLast(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Phone</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className={inputClass}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {/* Save feedback */}
        <AnimatePresence>
          {saveState === "saved" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-sm text-emerald-400"
            >
              Saved ✓
            </motion.p>
          )}
          {saveState === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-sm text-red-400"
            >
              Failed to save. Please try again.
            </motion.p>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* ── 4. Change Password ── */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <AnimatePresence>
            {pwError && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-400"
              >
                {pwError}
              </motion.p>
            )}
            {pwState === "saved" && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-emerald-400"
              >
                Password changed ✓
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={pwState === "saving"}
            className="mt-2 w-full py-3 rounded-lg text-sm font-semibold bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pwState === "saving" ? "Updating…" : "Update Password"}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
