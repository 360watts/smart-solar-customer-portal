"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, Bell, Cpu, Mail, MessageSquare, ShieldCheck, Wifi,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
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
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-primary/50 placeholder:text-white/30";

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
          <p className="text-base text-red-300">{error || "Profile data is unavailable."}</p>
        </GlassCard>
      </div>
    );
  }

  const deviceUsagePct = profile.device_limit > 0
    ? Math.min(100, Math.round((profile.total_devices_count / profile.device_limit) * 100))
    : 0;

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
          <p className="text-base text-red-300">{error}</p>
        </GlassCard>
      )}

      {/* ── 1. Identity Card ── */}
      <GlassCard glow={tier.glow ? "amber" : "green"}>
        <div className="flex items-center gap-5 flex-wrap">
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

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-white truncate">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-base text-white/50 mt-0.5 truncate">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
                    : "bg-white/5 border-white/10 text-white/60",
                )}
              >
                <BadgeCheck size={14} />
                {tier.label}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm text-white/35 uppercase tracking-wide">Customer since</p>
            <p className="text-base text-white/70 font-mono">{formatDate(profile.date_joined)}</p>
            {profile.customer_id && (
              <p className="text-sm text-white/35 font-mono mt-1">{profile.customer_id}</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── 2. Plan & Usage ── */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4">Plan &amp; Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-white/40 uppercase tracking-wide">Devices</span>
              <span className="font-mono text-sm text-white">{profile.total_devices_count} / {profile.device_limit}</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", tier.glow ? "bg-amber-400" : "bg-emerald-400")}
                style={{ width: `${deviceUsagePct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", profile.plan_features.can_access_ai ? "bg-emerald-400" : "bg-white/20")} />
              <span className={profile.plan_features.can_access_ai ? "text-white/75" : "text-white/35"}>AI insights &amp; recommendations</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", profile.plan_features.can_view_history_90d ? "bg-emerald-400" : "bg-white/20")} />
              <span className={profile.plan_features.can_view_history_90d ? "text-white/75" : "text-white/35"}>90-day history &amp; trends</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 3. Your System ── */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Wifi size={16} className="text-emerald-400" /> Your System
        </h3>
        <div className="space-y-3">
          {[
            { label: "Site", value: site?.site_name ?? "—" },
            { label: "Solar Capacity", value: site ? `${site.capacity_kw} kWp` : "—" },
            { label: "Gateway Serial", value: site?.serial ?? "—" },
            { label: "Connectivity", value: site?.connectivity_type ?? "—" },
            { label: "Account ID", value: user?.site_id ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/40 uppercase tracking-wide">{label}</span>
              <span className="font-mono text-base text-white">{value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── 4. Equipment ── */}
      {equipment.length > 0 && (
        <GlassCard>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu size={16} className="text-emerald-400" /> Equipment
          </h3>
          <div className="space-y-3">
            {equipment.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                <div className="min-w-0">
                  <p className="text-base text-white truncate">
                    {item.make} {item.model_name}
                    <span className="ml-2 text-sm text-white/35 uppercase tracking-wide">{item.kind}</span>
                  </p>
                  <p className="text-sm text-white/40 font-mono truncate">{item.serial_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-white/35">Warranty until</p>
                  <p className="text-sm text-white/60 font-mono">{formatDate(item.warranty_expires_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── 5. Contact & Preferences ── */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" /> Contact &amp; Preferences
        </h3>
        <div className="space-y-3">
          {[
            { label: "Phone", value: profile.phone || "—" },
            { label: "Address", value: profile.address || "—" },
            { label: "Timezone", value: profile.timezone },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 gap-4">
              <span className="text-sm text-white/40 uppercase tracking-wide shrink-0">{label}</span>
              <span className="text-base text-white text-right truncate">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-white/40 uppercase tracking-wide flex items-center gap-1.5"><Mail size={13} /> Email Alerts</span>
            <StatusPill
              status={profile.email_notifications_enabled ? "active" : "inactive"}
              label={profile.email_notifications_enabled ? "Enabled" : "Disabled"}
              animated={false}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-white/40 uppercase tracking-wide flex items-center gap-1.5"><MessageSquare size={13} /> SMS Alerts</span>
            <StatusPill
              status={profile.sms_notifications_enabled ? "active" : "inactive"}
              label={profile.sms_notifications_enabled ? "Enabled" : "Disabled"}
              animated={false}
            />
          </div>
        </div>
      </GlassCard>

      {/* ── 6. Edit Profile ── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Edit Profile</h3>
          <button
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
            className="px-4 py-1.5 rounded-lg text-base font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary"
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/40 mb-1.5">First Name</label>
              <input
                type="text"
                value={editFirst}
                onChange={(e) => setEditFirst(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-white/40 mb-1.5">Last Name</label>
              <input
                type="text"
                value={editLast}
                onChange={(e) => setEditLast(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/40 mb-1.5">Phone</label>
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
              className="mt-3 text-base text-emerald-400"
            >
              Saved ✓
            </motion.p>
          )}
          {saveState === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-base text-red-400"
            >
              Failed to save. Please try again.
            </motion.p>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* ── 7. Change Password ── */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm text-white/40 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/40 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/40 mb-1.5">Confirm New Password</label>
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
                className="text-base text-red-400"
              >
                {pwError}
              </motion.p>
            )}
            {pwState === "saved" && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-base text-emerald-400"
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
            {pwState === "saving" ? "Updating…" : "Update Password"}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
