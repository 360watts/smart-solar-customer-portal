"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sun,
  AlertCircle,
  Zap,
  Droplet,
  TrendingUp,
  Cloud,
  Cpu,
  User,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/solar", icon: Sun, label: "Solar" },
  { href: "/consumption", icon: Zap, label: "Consumption" },
  { href: "/history", icon: TrendingUp, label: "History" },
  { href: "/weather", icon: Cloud, label: "Weather" },
  { href: "/alerts", icon: AlertCircle, label: "Alerts" },
  { href: "/device", icon: Cpu, label: "Device" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function PortalSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden glass rounded-lg p-2"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <motion.nav
        animate={{ width: isOpen ? 240 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden md:flex flex-col gap-4 glass-green m-3 rounded-2xl p-4",
          "border-l-2 border-primary/20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-12 mb-4">
          <motion.div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sun size={24} className="text-primary" />
          </motion.div>
          {isOpen && (
            <span className="ml-3 font-bold text-lg text-foreground font-syne">
              360W
            </span>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg",
                "transition-all duration-200 cursor-pointer",
                "hover:bg-primary/10"
              )}
            >
              <item.icon size={20} className="text-muted-foreground group-hover:text-primary" />
              {isOpen && (
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Bottom section */}
        {isOpen && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/20"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  John Doe
                </p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            </div>
          </div>
        )}
      </motion.nav>
    </>
  );
}
