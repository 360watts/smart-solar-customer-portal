"use client";

import type React from "react";
import { ThumbsUp, X } from "lucide-react";
import type { CustomerRecommendation } from "@/lib/api";
import { StoryVisual } from "./StoryVisual";

const CATEGORY_LABELS: Record<CustomerRecommendation["category"], string> = {
  usage_savings: "Usage & Savings",
  billing_financial: "Billing & Financial",
  system_health: "System Health",
};

const CATEGORY_ACCENT: Record<CustomerRecommendation["category"], string> = {
  usage_savings: "var(--glow-amber)",
  billing_financial: "#8b7cf6",
  system_health: "var(--glow-green)",
};

export function StoryCard({
  rec,
  onFeedback,
}: {
  rec: CustomerRecommendation;
  onFeedback: (recId: number, state: "dismissed" | "acted_on") => void;
}) {
  const accent = CATEGORY_ACCENT[rec.category] ?? "var(--glow-amber)";

  return (
    <li
      data-story-card
      className="story-card group relative min-w-[85%] sm:min-w-[320px] snap-start rounded-xl overflow-hidden flex flex-col gap-3 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-14px_var(--card-accent)]"
      style={
        {
          scrollSnapAlign: "start",
          background: "color-mix(in srgb, var(--foreground) 4%, transparent)",
          backdropFilter: "blur(10px)",
          border: `1px solid color-mix(in srgb, ${accent} 22%, var(--glass-border, transparent))`,
          boxShadow: `0 1px 0 0 color-mix(in srgb, ${accent} 15%, transparent) inset`,
          "--card-accent": accent,
        } as React.CSSProperties
      }
    >
      <div
        className="h-[3px] w-full shrink-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)`, opacity: 0.7 }}
      />

      <div className="px-4 pb-4 flex flex-col gap-3">
        <div className="absolute top-4 right-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onFeedback(rec.id, "acted_on")}
            aria-label={`Mark helpful: ${rec.title}`}
            className="p-1.5 rounded-full bg-background/70 text-muted-foreground hover:text-foreground hover:scale-110 transition-all"
          >
            <ThumbsUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onFeedback(rec.id, "dismissed")}
            aria-label={`Dismiss: ${rec.title}`}
            className="p-1.5 rounded-full bg-background/70 text-muted-foreground hover:text-foreground hover:scale-110 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <span className="text-xs font-medium uppercase tracking-wider pr-16" style={{ color: accent }}>
          {CATEGORY_LABELS[rec.category] ?? rec.category}
        </span>

        <StoryVisual rec={rec} />

        <div>
          <h3 className="text-base font-medium text-foreground break-words">{rec.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 break-words">{rec.body}</p>
        </div>
      </div>
    </li>
  );
}

export default StoryCard;
