"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Sun, Moon, Zap, TrendingUp, Cloud, AlertCircle, Cpu, ChevronLeft,
  LogOut, PiggyBank, ShieldCheck, User,
} from "lucide-react";
import { cn, getPlanTierMeta } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSiteQuery } from "@/lib/hooks/useSiteQuery";
import { portalApi } from "@/lib/api";
import { TTL } from "@/lib/portalCache";

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
}

// Grouped like Linear's sidebar (unlabeled top-level item, then labeled
// sections) instead of one flat nine-item list — gives the eye a resting
// point and makes "where am I" scannable at a glance.
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Overview" }] },
  {
    label: "Monitoring",
    items: [
      { href: "/solar", icon: Sun, label: "Solar" },
      { href: "/consumption", icon: Zap, label: "Consumption" },
      { href: "/history", icon: TrendingUp, label: "History" },
      { href: "/weather", icon: Cloud, label: "Weather" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/savings", icon: PiggyBank, label: "Savings" },
      { href: "/alerts", icon: AlertCircle, label: "Alerts" },
      { href: "/device", icon: Cpu, label: "Device" },
      { href: "/care", icon: ShieldCheck, label: "360Care" },
    ],
  },
];

// Memoized so AuthContext updates (e.g. loading flag) don't force a full
// sidebar re-render while the Framer Motion tree is expensive to reconcile.
const PortalSidebar = React.memo(function PortalSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onClickAway = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [profileOpen]);

  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const pathname = usePathname();

  // This sidebar lives in a shared layout that can be served as a static
  // shell across every portal route, so `usePathname()` may briefly disagree
  // between the server-rendered HTML (baked at build/prerender time) and the
  // client's first render (the real current URL) — that mismatch is exactly
  // what triggers a hydration error. Deferring the active-state calculation
  // until after mount guarantees the server and first-client-paint markup
  // are identical (every item inactive); the correct highlight then applies
  // one client-only render later, which is not a hydration diff.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user, logout } = useAuth();
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "C";
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Customer";
  const tier = getPlanTierMeta(user?.plan_type);

  // Live active-alert count for the "Alerts" nav badge — was hardcoded to 2.
  // Same cache key convention / TTL / poll cadence as the Alerts page itself
  // (`alerts:${siteId}`, TTL.summary, 30s) so the badge and the page it
  // points to never disagree about what "active" means.
  const { data: activeAlertCount } = useSiteQuery<number>(
    user?.site_id,
    async (siteId, signal) => {
      const res = await portalApi.getSiteIncidents(siteId, { status: "active", limit: 1 }, signal);
      return res.count;
    },
    { cacheKey: `alerts-badge:${user?.site_id}`, ttl: TTL.summary, autoRefreshSec: 30 },
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 212 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="hidden md:flex flex-col h-full shrink-0 overflow-hidden"
      style={{ background: "var(--sidebar-background)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Header: logo doubles as the collapse/expand toggle — one click
          target instead of a logo plus a separate chevron button. */}
      <div className="flex items-center h-16 px-3 shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-lg group"
        >
          <Image
            src="/final-logo-png-4x-2.png"
            alt="360watts"
            width={25}
            height={18}
            priority
            className="h-5.5 w-auto object-contain transition-opacity group-hover:opacity-0"
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <ChevronLeft size={15} />
          </motion.div>
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-2.5 flex-1 font-bold text-foreground text-base tracking-wide whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              360watts
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav flex-1 py-4 px-2 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "color-mix(in srgb, var(--glow-green) 45%, transparent) var(--sidebar-background)" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`} className={gi > 0 ? "mt-4" : ""}>
            {group.label && !collapsed && (
              <p
                className="px-3 mb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.09em] text-foreground"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {group.label}
              </p>
            )}
            {group.label && collapsed && (
              <div className="mx-3 mb-2" style={{ borderTop: "1px solid var(--sidebar-border)" }} />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = mounted && pathname === item.href;
                const badge = item.href === "/alerts" ? activeAlertCount : item.badge;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={cn(
                        "relative flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors duration-150 group",
                        active ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                      )}
                      style={
                        active
                          ? { background: "color-mix(in srgb, var(--glow-green) 12%, transparent)" }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = "var(--sidebar-accent)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      )}
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
                        <item.icon size={16} className={active ? "text-emerald-400" : ""} />
                      </span>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-[0.875rem] font-medium tracking-[-0.005em] whitespace-nowrap flex-1"
                            style={{ fontFamily: "var(--font-inter)" }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && !!badge && (
                        <span className="text-sm bg-red-500/20 text-red-400 rounded-full px-1.5 py-0.5 leading-none">
                          {badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: profile row + popover */}
      <div className="px-2 pb-3 pt-3 shrink-0 relative" style={{ borderTop: "1px solid var(--sidebar-border)" }} ref={profileRef}>
        <AnimatePresence>
          {profileOpen && !collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-2 right-2 bottom-[calc(100%+6px)] rounded-lg overflow-hidden z-10"
              style={{ background: "var(--sidebar-accent)", border: "1px solid var(--sidebar-border)", boxShadow: "0 12px 28px rgba(0,0,0,0.35)" }}
            >
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--foreground) 5%, transparent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <User size={13} className="shrink-0" />
                My Profile
              </Link>
              <button
                onClick={() => { toggleTheme(); setProfileOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--foreground) 5%, transparent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {isLight ? <Sun size={13} className="shrink-0" /> : <Moon size={13} className="shrink-0" />}
                {isLight ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={() => void logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                style={{ color: "var(--destructive)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--destructive) 8%, transparent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={13} className="shrink-0" />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleTheme}
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {isLight ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <Link href="/profile" title="My Profile">
              <div
                className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[0.625rem] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, var(--primary), #007a55)" }}
              >
                {initials}
              </div>
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 w-full text-left rounded-lg transition-colors"
            style={{ padding: "8px 9px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[0.6875rem] font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, var(--primary), #007a55)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className={cn("text-sm truncate flex items-center gap-1.5", tier.textClass)}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tier.dotClass)} />
                {tier.label}
              </p>
            </div>
          </button>
        )}
      </div>
    </motion.aside>
  );
});

export default PortalSidebar;
