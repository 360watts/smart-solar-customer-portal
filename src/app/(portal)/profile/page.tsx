"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, Cpu, KeyRound, Mail, MessageSquare, Pencil, ShieldCheck, Zap,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import SiteMembersCard from "@/components/profile/SiteMembersCard";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi } from "@/lib/api";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { TTL } from "@/lib/portalCache";
import { getPlanTierMeta, cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  customer_id: string | null;
  subscription_status: string;
  device_limit: number;
  total_devices_count: number;
  plan_features: { can_access_ai: boolean; can_view_history_90d: boolean };
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  timezone: string;
  date_joined: string;
  avatar_url: string | null;
}

interface Site {
  capacity_kw: number;
  site_name: string;
  serial: string | null;
  connectivity_type: string;
}

interface Equipment {
  make: string;
  model_name: string;
  serial_number: string;
  installed_at: string | null;
  warranty_expires_at: string | null;
  kind: "Inverter" | "Panel" | "Battery";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
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
  "w-full bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground";

/** Eyebrow-style card heading — a quiet uppercase label so the data carries the card. */
function CardTitle({ icon, className, children }: { icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4", className)}>
      {icon}
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
interface ProfileData { profile: Profile; site: Site | null; equipment: Equipment[] }

export default function ProfilePage() {
  const { user } = useAuth();
  const tier = getPlanTierMeta(user?.plan_type);

  const { data, loading, error } = useSiteQuery<ProfileData>(
    user?.site_id,
    async (siteId) => {
      const [profileRes, gatewayRes, equipmentRes] = await Promise.all([
        portalApi.getProfile(),
        portalApi.getGatewayStatus(siteId),
        portalApi.getEquipment(siteId).catch(() => null),
      ]);
      const raw = profileRes.data as {
        first_name?: string; last_name?: string; email?: string; mobile_number?: string;
        address?: string; customer_id?: string | null; subscription_status?: string;
        device_limit?: number; total_devices_count?: number;
        plan_features?: { can_access_ai?: boolean; can_view_history_90d?: boolean };
        email_notifications_enabled?: boolean; sms_notifications_enabled?: boolean;
        timezone?: string; date_joined?: string; avatar_url?: string | null;
      };
      const profile: Profile = {
        first_name: raw.first_name ?? "",
        last_name: raw.last_name ?? "",
        email: raw.email ?? "",
        phone: raw.mobile_number ?? "",
        address: raw.address ?? "",
        customer_id: raw.customer_id ?? null,
        subscription_status: raw.subscription_status ?? "trial",
        device_limit: raw.device_limit ?? 5,
        total_devices_count: raw.total_devices_count ?? 0,
        plan_features: {
          can_access_ai: raw.plan_features?.can_access_ai ?? false,
          can_view_history_90d: raw.plan_features?.can_view_history_90d ?? false,
        },
        email_notifications_enabled: raw.email_notifications_enabled ?? true,
        sms_notifications_enabled: raw.sms_notifications_enabled ?? false,
        timezone: raw.timezone ?? "Asia/Kolkata",
        date_joined: raw.date_joined ?? "",
        avatar_url: raw.avatar_url ?? null,
      };

      const rawGateway = gatewayRes?.data as Record<string, unknown> | null;
      const site: Site | null = rawGateway
        ? {
            capacity_kw: Number(rawGateway.solar_kwp) || 0,
            site_name: String(rawGateway.site_name || "Solar Site"),
            serial: (rawGateway.serial as string) ?? null,
            connectivity_type:
              ((rawGateway.devices as Array<{ connectivity_type?: string }> | undefined)?.[0]
                ?.connectivity_type) || "—",
          }
        : null;

      const rawEquipment = equipmentRes?.data as {
        inverters?: Array<{ make: string; model_name: string; serial_number: string; installed_at: string | null; warranty_expires_at: string | null }>;
        batteries?: Array<{ make: string; model_name: string; serial_number: string; installed_at: string | null; warranty_expires_at: string | null }>;
        panels?: Array<{ make: string; model_name: string; serial_number: string; installed_at: string | null; warranty_expires_at: string | null }>;
      } | null;
      const equipment: Equipment[] = [
        ...(rawEquipment?.inverters ?? []).map((e) => ({ ...e, kind: "Inverter" as const })),
        ...(rawEquipment?.panels ?? []).map((e) => ({ ...e, kind: "Panel" as const })),
        ...(rawEquipment?.batteries ?? []).map((e) => ({ ...e, kind: "Battery" as const })),
      ];

      return { profile, site, equipment };
    },
    { cacheKey: `profile:${user?.site_id}`, ttl: TTL.static },
  );

  const profile = data?.profile ?? null;
  const site = data?.site ?? null;
  const equipment = data?.equipment ?? [];

  // Edit form — seeded from loaded profile
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (profile && !editFirst && !editLast) {
      setEditFirst(profile.first_name);
      setEditLast(profile.last_name);
      setEditPhone(profile.phone ?? "");
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwState, setPwState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  const isDirty =
    profile !== null &&
    (editFirst !== profile.first_name ||
      editLast !== profile.last_name ||
      editPhone !== (profile.phone ?? ""));

  const initials =
    profile
      ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
      : "";

  async function handleSave() {
    if (!isDirty) return;
    setSaveState("saving");
    try {
      await portalApi.updateProfile({
        first_name: editFirst,
        last_name: editLast,
        mobile_number: editPhone,
      });
      setEditFirst(editFirst);
      setEditLast(editLast);
      setEditPhone(editPhone);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

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

  const deviceUsagePct = profile && profile.device_limit > 0
    ? Math.min(100, Math.round((profile.total_devices_count / profile.device_limit) * 100))
    : 0;

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" className="space-y-4" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          <h1 className="page-title mb-6">Profile</h1>
          <GlassCard>
            <div className="animate-pulse flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-foreground/10 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-foreground/10 rounded w-1/3" />
                <div className="h-4 bg-foreground/10 rounded w-1/2" />
              </div>
            </div>
          </GlassCard>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-4">
              {[...Array(2)].map((_, i) => (
                <GlassCard key={i}>
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-foreground/10 rounded w-1/3" />
                    <div className="h-4 bg-foreground/10 rounded w-2/3" />
                    <div className="h-4 bg-foreground/10 rounded w-1/2" />
                  </div>
                </GlassCard>
              ))}
            </div>
            <div className="lg:col-span-5 space-y-4">
              {[...Array(2)].map((_, i) => (
                <GlassCard key={i}>
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-foreground/10 rounded w-1/2" />
                    <div className="h-4 bg-foreground/10 rounded w-2/3" />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </motion.div>
      ) : !profile ? (
        <motion.div key="empty" className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="page-title mb-6">Profile</h1>
          <GlassCard>
            <p className="text-base" style={{ color: "var(--destructive)" }}>{error || "Profile data is unavailable."}</p>
          </GlassCard>
        </motion.div>
      ) : (
    <motion.div
      key="content"
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="page-title mb-6">Profile</h1>

      {error && (
        <GlassCard>
          <p className="text-base" style={{ color: "var(--destructive)" }}>{error}</p>
        </GlassCard>
      )}

      {/* ── Identity band ── */}
      <GlassCard glow={tier.glow ? "amber" : "green"} className="relative overflow-hidden">
        {/* soft brand aura behind the avatar */}
        <div
          aria-hidden
          className={cn(
            "absolute -top-24 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none",
            tier.glow ? "bg-amber-400/10" : "bg-emerald-400/10",
          )}
        />
        <div className="relative flex items-center gap-5 flex-wrap">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={initials}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-border"
              />
            ) : (
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center border",
                  tier.glow
                    ? "bg-amber-500/20 border-amber-500/40"
                    : "bg-emerald-500/20 border-emerald-500/40",
                )}
              >
                <span className={cn("font-display text-2xl font-bold", tier.glow ? "text-amber-300" : "text-emerald-300")}>
                  {initials}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-foreground truncate">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-base text-muted-foreground mt-0.5 truncate">{profile.email}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusPill
                status={profile.subscription_status === "active" ? "active" : profile.subscription_status === "trial" ? "warning" : "inactive"}
                label={profile.subscription_status.charAt(0).toUpperCase() + profile.subscription_status.slice(1)}
                animated={profile.subscription_status === "active"}
              />
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium",
                  tier.glow
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    : "bg-foreground/5 border-border text-muted-foreground",
                )}
              >
                <BadgeCheck size={14} />
                {tier.label}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.14em]">Customer since</p>
            <p className="text-base text-foreground font-mono mt-1">{formatDate(profile.date_joined)}</p>
            {profile.customer_id && (
              <p className="text-sm text-muted-foreground font-mono mt-1">{profile.customer_id}</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── Bento: system on the left, account settings on the right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left rail — the physical installation */}
        <div className="lg:col-span-7 space-y-4">
          {/* System nameplate */}
          <GlassCard className="relative overflow-hidden">
            <CardTitle icon={<Zap size={13} className="text-emerald-400" />}>System nameplate</CardTitle>

            <div className="flex items-end justify-between gap-4 pb-4 mb-4 border-b border-border">
              <div>
                <p className="stat-number text-4xl glow-text-green">
                  {site ? site.capacity_kw : "—"}
                  <span className="text-lg ml-1.5 font-semibold text-muted-foreground">kWp</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">{site?.site_name ?? "No site linked"}</p>
              </div>
              <StatusPill
                status={site?.serial ? "active" : "inactive"}
                label={site?.serial ? "Gateway linked" : "No gateway"}
                animated={Boolean(site?.serial)}
              />
            </div>

            <div className="space-y-0">
              {[
                { label: "Gateway serial", value: site?.serial ?? "—" },
                { label: "Connectivity", value: site?.connectivity_type ?? "—" },
                { label: "Account ID", value: user?.site_id ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-mono text-sm text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Equipment */}
          {equipment.length > 0 && (
            <GlassCard>
              <CardTitle icon={<Cpu size={13} className="text-emerald-400" />}>Equipment</CardTitle>
              <div className="space-y-0">
                {equipment.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-base text-foreground truncate">
                        {item.make} {item.model_name}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono truncate mt-0.5">{item.serial_number}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-xs uppercase tracking-wide text-muted-foreground bg-foreground/5 border border-border rounded-full px-2.5 py-0.5 mb-1">
                        {item.kind}
                      </span>
                      <p className="text-sm text-muted-foreground font-mono">
                        Warranty {formatDate(item.warranty_expires_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Site members */}
          {user?.site_id && <SiteMembersCard siteId={user.site_id} />}
        </div>

        {/* Right rail — plan, contact, account settings */}
        <div className="lg:col-span-5 space-y-4">
          {/* Plan & usage */}
          <GlassCard>
            <CardTitle icon={<BadgeCheck size={13} className={tier.glow ? "text-amber-400" : "text-emerald-400"} />}>
              Plan &amp; usage
            </CardTitle>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground">Devices</span>
                  <span className="font-mono text-sm text-foreground">{profile.total_devices_count} / {profile.device_limit}</span>
                </div>
                <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", tier.glow ? "bg-amber-400" : "bg-emerald-400")}
                    style={{ width: `${deviceUsagePct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", profile.plan_features.can_access_ai ? "bg-emerald-400" : "bg-foreground/20")} />
                  <span className={profile.plan_features.can_access_ai ? "text-foreground" : "text-muted-foreground"}>AI insights &amp; recommendations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", profile.plan_features.can_view_history_90d ? "bg-emerald-400" : "bg-foreground/20")} />
                  <span className={profile.plan_features.can_view_history_90d ? "text-foreground" : "text-muted-foreground"}>90-day history &amp; trends</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Contact & preferences */}
          <GlassCard>
            <CardTitle icon={<ShieldCheck size={13} className="text-emerald-400" />}>Contact &amp; preferences</CardTitle>
            <div className="space-y-0">
              {[
                { label: "Phone", value: profile.phone || "—" },
                { label: "Address", value: profile.address || "—" },
                { label: "Timezone", value: profile.timezone },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-border gap-4">
                  <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                  <span className="text-sm text-foreground text-right truncate">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail size={13} /> Email alerts</span>
                <StatusPill
                  status={profile.email_notifications_enabled ? "active" : "inactive"}
                  label={profile.email_notifications_enabled ? "Enabled" : "Disabled"}
                  animated={false}
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><MessageSquare size={13} /> SMS alerts</span>
                <StatusPill
                  status={profile.sms_notifications_enabled ? "active" : "inactive"}
                  label={profile.sms_notifications_enabled ? "Enabled" : "Disabled"}
                  animated={false}
                />
              </div>
            </div>
          </GlassCard>

          {/* Edit profile */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <CardTitle icon={<Pencil size={13} className="text-emerald-400" />} className="mb-0">Edit profile</CardTitle>
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
                  <label className="block text-sm text-muted-foreground mb-1.5">First name</label>
                  <input
                    type="text"
                    value={editFirst}
                    onChange={(e) => setEditFirst(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Last name</label>
                  <input
                    type="text"
                    value={editLast}
                    onChange={(e) => setEditLast(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

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

          {/* Change password */}
          <GlassCard>
            <CardTitle icon={<KeyRound size={13} className="text-emerald-400" />}>Change password</CardTitle>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">New password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Confirm new password</label>
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
                className="mt-2 w-full py-3 rounded-lg text-base font-semibold bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pwState === "saving" ? "Updating…" : "Update password"}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
