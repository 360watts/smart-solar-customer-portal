"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Sun, Moon, Zap, TrendingUp, Cloud, AlertCircle, Cpu, ChevronLeft,
  LogOut, PiggyBank, ShieldCheck, User, ChevronDown,
} from "lucide-react";
import { cn, getPlanTierMeta } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

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
      { href: "/alerts", icon: AlertCircle, label: "Alerts", badge: 2 },
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
  const profilePanelRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (profileOpen && profilePanelRef.current) {
      profilePanelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [profileOpen]);
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  // Pause the infinite pulse animation when the tab is hidden to avoid wasting
  // CPU/GPU on an animation the user cannot see.
  const [tabVisible, setTabVisible] = useState(true);
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

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    // Scrollbar styles are in globals.css (sidebar-nav class) so they aren't
    // re-injected as a <style> tag on every render.
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="hidden md:flex flex-col h-full shrink-0 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, var(--sidebar-background) 0%, color-mix(in srgb, var(--sidebar-background) 90%, var(--background) 10%) 100%)",
          borderRight: "1px solid var(--sidebar-border)",
          boxShadow: "2px 0 24px color-mix(in srgb, var(--foreground) 6%, transparent)",
        }}
      >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
          {/* Soft ambient bloom behind the mark, on-theme instead of a white chip */}
          <motion.div
            className="absolute inset-[-6px] rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--glow-green) 35%, transparent) 0%, transparent 70%)", opacity: "var(--glow-alpha)" }}
            animate={tabVisible ? { scale: [1, 1.25, 1], opacity: [0.7, 0.35, 0.7] } : { scale: 1, opacity: 0.55 }}
            transition={tabVisible ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
          />
          <Image
            src="/final-logo-png-4x-2.png"
            alt="360watts"
            width={25}
            height={18}
            priority
            className="relative h-5.5 w-auto object-contain logo-glow"
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-3 font-bold text-foreground text-base tracking-wide whitespace-nowrap"
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
                className="px-3 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--muted)", fontFamily: "var(--font-nav)" }}
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
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={cn(
                        "relative flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer transition-colors duration-150 group",
                        active
                          ? "text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        active
                          ? {
                              background: "color-mix(in srgb, var(--glow-green) 12%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--glow-green) 22%, transparent)",
                            }
                          : { border: "1px solid transparent" }
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
                          style={{ filter: "drop-shadow(0 0 4px #2FBF71)" }}
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      )}
                      {/* Icon chip — Geist's "icon gets its own tinted solid fill"
                          treatment rather than a bare glyph floating in the row */}
                      <span
                        className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors"
                        style={{
                          background: active ? "color-mix(in srgb, var(--glow-green) 18%, transparent)" : "transparent",
                        }}
                      >
                        <item.icon size={16} className={cn("transition-colors", active ? "text-emerald-400" : "")} />
                      </span>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-[0.875rem] font-semibold tracking-[0.01em] whitespace-nowrap flex-1"
                            style={{ fontFamily: "var(--font-nav)" }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && item.badge && (
                        <span className="text-sm bg-red-500/20 text-red-400 rounded-full px-1.5 py-0.5 leading-none">
                          {item.badge}
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

      {/* Bottom */}
      <div className="px-2 pb-4 shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)", paddingTop: "12px" }}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <ChevronLeft size={15} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapsed rail: icon-only theme toggle + profile link, matching the
            staff layout's collapsed-sidebar pattern (StaffLayout.tsx:487-522). */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 pt-1">
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
                style={{ background: "linear-gradient(135deg, var(--primary), #007a55)", boxShadow: "0 2px 6px color-mix(in srgb, var(--primary) 35%, transparent)" }}
              >
                {initials}
              </div>
            </Link>
          </div>
        ) : (
          // Expanded: a single profile button (avatar + name + tier + chevron)
          // that toggles a dropdown with Profile / theme / sign-out — matching
          // StaffLayout.tsx:533-609 instead of three permanently-visible rows.
          <div>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2.5 w-full text-left rounded-xl transition-colors"
              style={{
                padding: "9px 10px",
                border: "1px solid color-mix(in srgb, var(--glow-green) 20%, transparent)",
                background: "color-mix(in srgb, var(--glow-green) 6%, transparent)",
              }}
            >
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[0.6875rem] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, var(--primary), #007a55)", boxShadow: "0 2px 8px color-mix(in srgb, var(--primary) 32%, transparent)" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className={cn("text-sm truncate flex items-center gap-1.5", tier.textClass)}>
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", tier.dotClass)}
                    style={tier.glow ? { boxShadow: "0 0 6px currentColor" } : undefined}
                  />
                  {tier.label}
                </p>
              </div>
              <ChevronDown
                size={12}
                className="shrink-0 text-emerald-400 transition-transform"
                style={{ transform: profileOpen ? "rotate(180deg)" : "none" }}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  ref={profilePanelRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1.5 overflow-hidden rounded-xl"
                  style={{ background: "var(--sidebar-accent)", border: "1px solid var(--sidebar-border)" }}
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--foreground) 5%, transparent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <User size={13} className="shrink-0" />
                    My Profile
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
          </div>
        )}
      </div>
    </motion.aside>
    </>
  );
});

export default PortalSidebar;
