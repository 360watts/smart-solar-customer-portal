"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Sun, Zap, TrendingUp, Cloud, AlertCircle, Cpu, User, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/solar", icon: Sun, label: "Solar" },
  { href: "/consumption", icon: Zap, label: "Consumption" },
  { href: "/history", icon: TrendingUp, label: "History" },
  { href: "/weather", icon: Cloud, label: "Weather" },
  { href: "/alerts", icon: AlertCircle, label: "Alerts", badge: 2 },
  { href: "/device", icon: Cpu, label: "Device" },
];

export default function PortalSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <style>{`
        nav::-webkit-scrollbar {
          width: 7px;
        }
        nav::-webkit-scrollbar-track {
          background: rgba(7, 11, 18, 0.5);
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(47,191,113,0.4) 0%, rgba(47,191,113,0.3) 100%);
          border-radius: 10px;
          border: 2px solid rgba(7, 11, 18, 0.5);
          box-shadow: inset 0 0 6px rgba(47,191,113,0.2);
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(47,191,113,0.6) 0%, rgba(47,191,113,0.5) 100%);
          box-shadow: inset 0 0 8px rgba(47,191,113,0.4), 0 0 12px rgba(47,191,113,0.3);
        }
        nav::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, rgba(47,191,113,0.8) 0%, rgba(47,191,113,0.7) 100%);
        }
      `}</style>
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
        <div className="relative w-8 h-8 shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Sun size={16} className="text-emerald-400" />
          </div>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-3 font-bold text-white text-sm tracking-wide whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              360Watts
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(47,191,113,0.45) rgba(7,11,18,0.5)",
        }}>
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
                      className="text-sm font-medium whitespace-nowrap flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && item.badge && (
                  <span className="text-xs bg-red-500/20 text-red-400 rounded-full px-1.5 py-0.5 leading-none">
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/55 hover:text-white/50 hover:bg-white/4 transition-colors text-xs"
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
              <span className="text-xs font-bold text-emerald-400">J</span>
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
                  <p className="text-xs font-semibold text-white/70 truncate group-hover:text-white/90 transition-colors">John Doe</p>
                  <p className="text-xs text-white/55 truncate group-hover:text-white/65 transition-colors">Pro Plan</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </div>
    </motion.aside>
    </>
  );
}
