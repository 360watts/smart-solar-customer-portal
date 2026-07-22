"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Sun, Zap, AlertCircle, Menu, TrendingUp, Cloud, PiggyBank, Cpu, ShieldCheck, User, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}

// Four highest-traffic destinations get a permanent tab; everything else
// lives behind "More" — matches the desktop sidebar's item set, just
// re-prioritized for a much narrower strip.
const TABS: TabItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/solar", icon: Sun, label: "Solar" },
  { href: "/consumption", icon: Zap, label: "Consumption" },
  { href: "/alerts", icon: AlertCircle, label: "Alerts" },
];

const MORE_ITEMS: TabItem[] = [
  { href: "/history", icon: TrendingUp, label: "History" },
  { href: "/weather", icon: Cloud, label: "Weather" },
  { href: "/savings", icon: PiggyBank, label: "Savings" },
  { href: "/device", icon: Cpu, label: "Device" },
  { href: "/care", icon: ShieldCheck, label: "360Care" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Same hydration-safety pattern as PortalSidebar: defer active-state
  // rendering until after mount so server/client markup matches.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!moreOpen) return;
    const onClickAway = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [moreOpen]);

  const moreActive = mounted && MORE_ITEMS.some((item) => item.href === pathname);

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed left-0 right-0 bottom-0 z-50 md:hidden rounded-t-2xl overflow-hidden"
            style={{ background: "var(--sidebar-background)", borderTop: "1px solid var(--sidebar-border)" }}
          >
            <div className="flex items-center justify-between px-4 h-12" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
              <span className="text-sm font-semibold text-foreground">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {MORE_ITEMS.map((item) => {
                const active = mounted && pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium",
                      active ? "text-emerald-400" : "text-foreground/75"
                    )}
                    style={active ? { background: "color-mix(in srgb, var(--glow-green) 12%, transparent)" } : undefined}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className="flex md:hidden fixed left-0 right-0 bottom-0 z-30 items-stretch"
        style={{
          background: "var(--sidebar-background)",
          borderTop: "1px solid var(--sidebar-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {TABS.map((item) => {
          const active = mounted && pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[0.625rem] font-medium",
                active ? "text-emerald-400" : "text-foreground/60"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[0.625rem] font-medium",
            moreActive ? "text-emerald-400" : "text-foreground/60"
          )}
        >
          <Menu size={18} />
          More
        </button>
      </nav>
    </>
  );
}
