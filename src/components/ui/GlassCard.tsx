import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "green" | "amber" | "none";
  style?: React.CSSProperties;
}

export default function GlassCard({
  children,
  className,
  glow = "none",
  style,
}: GlassCardProps) {
  return (
    <div
      style={style}
      className={cn(
        "glass rounded-xl p-6",
        glow === "green" && "glass-green",
        glow === "amber" && "glass-amber",
        className
      )}
    >
      {children}
    </div>
  );
}
