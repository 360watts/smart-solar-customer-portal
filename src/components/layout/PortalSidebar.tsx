"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Sun, Zap, TrendingUp, Cloud, AlertCircle, Cpu, ChevronLeft,
  LogOut, PiggyBank, ShieldCheck,
} from "lucide-react";
import { cn, getPlanTierMeta } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/solar", icon: Sun, label: "Solar" },
  { href: "/consumption", icon: Zap, label: "Consumption" },
  { href: "/history", icon: TrendingUp, label: "History" },
  { href: "/savings", icon: PiggyBank, label: "Savings" },
  { href: "/weather", icon: Cloud, label: "Weather" },
  { href: "/alerts", icon: AlertCircle, label: "Alerts", badge: 2 },
  { href: "/device", icon: Cpu, label: "Device" },
  { href: "/care", icon: ShieldCheck, label: "360Care" },
];

// Memoized so AuthContext updates (e.g. loading flag) don't force a full
// sidebar re-render while the Framer Motion tree is expensive to reconcile.
const PortalSidebar = React.memo(function PortalSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  // Pause the infinite pulse animation when the tab is hidden to avoid wasting
  // CPU/GPU on an animation the user cannot see.
  const [tabVisible, setTabVisible] = useState(true);
  const pathname = usePathname();
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
          background: "linear-gradient(180deg, rgba(7,11,18,0.98) 0%, rgba(6,10,16,0.95) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
          {/* Soft ambient bloom behind the mark, on-theme instead of a white chip */}
          <motion.div
            className="absolute inset-[-6px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(47,191,113,0.35) 0%, rgba(47,191,113,0) 70%)" }}
            animate={tabVisible ? { scale: [1, 1.25, 1], opacity: [0.7, 0.35, 0.7] } : { scale: 1, opacity: 0.55 }}
            transition={tabVisible ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
          />
          <Image
            src="/final-logo-png-4x-2.png"
            alt="360watts"
            width={25}
            height={18}
            priority
            className="relative h-[22px] w-auto object-contain logo-glow"
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-3 font-bold text-white text-base tracking-wide whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              360watts
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav flex-1 py-4 px-2 space-y-0.5 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(47,191,113,0.45) rgba(7,11,18,0.5)" }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group",
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-white/60 hover:text-white/70 hover:bg-white/4"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full"
                    style={{ filter: "drop-shadow(0 0 4px #2FBF71)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
                <item.icon size={17} className={cn("shrink-0 transition-colors", active ? "text-emerald-400" : "")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[15px] font-semibold tracking-[0.01em] whitespace-nowrap flex-1"
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
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 shrink-0 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/55 hover:text-white/50 hover:bg-white/4 transition-colors text-sm"
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

        {/* Avatar — clickable profile link */}
        <Link href="/profile">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
              "hover:bg-emerald-500/8 group",
              collapsed ? "justify-center" : ""
            )}
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/25 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
                  <span className="text-sm font-bold text-emerald-400">{initials}</span>
                </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0"
                >
                  <p className="text-sm font-semibold text-white/70 truncate group-hover:text-white/90 transition-colors">{displayName}</p>
                  <p className={cn("text-sm truncate flex items-center gap-1.5", tier.textClass)}>
                    <span
                      className={cn("w-1.5 h-1.5 rounded-full shrink-0", tier.dotClass)}
                      style={tier.glow ? { boxShadow: "0 0 6px currentColor" } : undefined}
                    />
                    {tier.label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
        <button
          onClick={() => void logout()}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/55 hover:text-white/80 hover:bg-white/4 transition-colors",
            collapsed ? "justify-center" : "",
          )}
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
    </>
  );
});

export default PortalSidebar;
