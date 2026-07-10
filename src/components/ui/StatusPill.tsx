"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: "active" | "inactive" | "warning" | "error";
  label: string;
  animated?: boolean;
}

export default function StatusPill({
  status,
  label,
  animated = true,
}: StatusPillProps) {
  // bg-*-500/20 + border-*-500/30 stay Tailwind classes (translucent tints
  // read fine in both themes); text color moves to the theme's own semantic
  // tokens instead of a pastel *-300 shade, which has too little contrast
  // against the light theme's white card background.
  const bgBorder = {
    active: "bg-green-500/20 border-green-500/30",
    inactive: "bg-gray-500/20 border-gray-500/30",
    warning: "bg-amber-500/20 border-amber-500/30",
    error: "bg-red-500/20 border-red-500/30",
  };
  const textColor = {
    active: "var(--primary)",
    inactive: "var(--muted-foreground)",
    warning: "var(--secondary)",
    error: "var(--destructive)",
  };

  const pulseColor = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium",
        bgBorder[status]
      )}
      style={{ color: textColor[status] }}
    >
      {animated && (
        <motion.div
          className={cn("w-2 h-2 rounded-full", pulseColor[status])}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {label}
    </div>
  );
}
