"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, Bell, KeyRound, Mail, Pencil, ShieldCheck, Zap,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import SiteMembersCard from "@/components/profile/SiteMembersCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
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
  push_notifications_enabled: boolean;
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
interface ProfileData { profile: Profile; site: Site | null }

export default function ProfilePage() {
  const { user } = useAuth();
  const tier = getPlanTierMeta(user?.plan_type);

  const { data, loading, error } = useSiteQuery<ProfileData>(
    user?.site_id,
    async (siteId) => {
      const [profileRes, gatewayRes] = await Promise.all([
        portalApi.getProfile(),
        portalApi.getGatewayStatus(siteId),
      ]);
      const raw = profileRes.data as {
        first_name?: string; last_name?: string; email?: string; mobile_number?: string;
        address?: string; customer_id?: string | null; subscription_status?: string;
        device_limit?: number; total_devices_count?: number;
        plan_features?: { can_access_ai?: boolean; can_view_history_90d?: boolean };
        email_notifications_enabled?: boolean; sms_notifications_enabled?: boolean;
        push_notifications_enabled?: boolean;
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
        push_notifications_enabled: raw.push_notifications_enabled ?? true,
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

      return { profile, site };
    },
    { cacheKey: `profile:${user?.site_id}`, ttl: TTL.static },
  );

  // Local overrides for fields changed via the edit modal — the loaded
  // `profile` comes from a cached query, so we layer confirmed edits on top
  // rather than refetching.
  const [overrides, setOverrides] = useState<Partial<Profile>>({});
  const profile = data?.profile ? { ...data.profile, ...overrides } : null;
  const site = data?.site ?? null;

  // Optimistic toggle, same override-layer pattern as the edit-modal flow
  // above — reverts on a failed save rather than leaving the UI lying.
  async function toggleNotificationPref(
    field: "email_notifications_enabled" | "sms_notifications_enabled" | "push_notifications_enabled",
  ) {
    if (!profile) return;
    const next = !profile[field];
    setOverrides((prev) => ({ ...prev, [field]: next }));
    try {
      await portalApi.updateProfile({ [field]: next });
    } catch {
      setOverrides((prev) => ({ ...prev, [field]: !next }));
    }
  }

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const initials =
    profile
      ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
      : "";

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

          <div className="text-right shrink-0 flex flex-col items-end gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.14em]">Customer since</p>
              <p className="text-base text-foreground font-mono mt-1">{formatDate(profile.date_joined)}</p>
              {profile.customer_id && (
                <p className="text-sm text-muted-foreground font-mono mt-1">{profile.customer_id}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary cursor-pointer"
              >
                <Pencil size={13} /> Edit profile
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-foreground/5 hover:bg-foreground/10 border border-border text-foreground cursor-pointer"
              >
                <KeyRound size={13} /> Change password
              </button>
            </div>
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
              {(
                [
                  { field: "email_notifications_enabled" as const, icon: <Mail size={13} />, label: "Email alerts" },
                  { field: "push_notifications_enabled" as const, icon: <Bell size={13} />, label: "Push alerts" },
                ]
              ).map(({ field, icon, label }, i, arr) => (
                <div
                  key={field}
                  className={cn("flex items-center justify-between py-2.5", i < arr.length - 1 && "border-b border-border")}
                >
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">{icon} {label}</span>
                  <button onClick={() => toggleNotificationPref(field)} className="cursor-pointer">
                    <StatusPill
                      status={profile[field] ? "active" : "inactive"}
                      label={profile[field] ? "Enabled" : "Disabled"}
                      animated={false}
                    />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>

      <AnimatePresence>
        {showEditModal && profile && (
          <EditProfileModal
            initialFirst={profile.first_name}
            initialLast={profile.last_name}
            currentEmail={profile.email}
            currentPhone={profile.phone}
            onClose={() => setShowEditModal(false)}
            onSaved={(updates) => {
              setOverrides((prev) => ({ ...prev, ...updates }));
              setShowEditModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      </AnimatePresence>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
