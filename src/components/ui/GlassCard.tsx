import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "green" | "amber" | "none";
}

export default function GlassCard({
  children,
  className,
  glow = "none",
}: GlassCardProps) {
  return (
    <div
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
