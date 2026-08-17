"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Lightbulb, ThumbsUp, X } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { portalApi, type CustomerRecommendation } from "@/lib/api";

const CATEGORY_LABELS: Record<CustomerRecommendation["category"], string> = {
  usage_savings: "Usage & Savings",
  billing_financial: "Billing & Financial",
  system_health: "System Health",
};

export function RecommendationsCard({ siteId }: { siteId: string }) {
  const [recs, setRecs] = useState<CustomerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    portalApi
      .getRecommendations(siteId, controller.signal)
      .then((res) => setRecs(res.data))
      .catch(() => {
        // ponytail: silent on abort/error, empty-state render covers it; add
        // toast/error banner if this proves confusing in practice.
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [siteId]);

  async function handleFeedback(recId: number, state: "dismissed" | "acted_on") {
    const prev = recs;
    setRecs((current) => current.filter((r) => r.id !== recId));
    try {
      await portalApi.updateRecommendation(siteId, recId, state);
    } catch {
      setRecs(prev);
    }
  }

  if (loading || recs.length === 0) return null;

  return (
    <GlassCard>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2"
      >
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--glow-amber) 12%, transparent)" }}
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Lightbulb
            size={18}
            style={{
              color: "var(--glow-amber)",
              filter:
                "drop-shadow(0 0 2px color-mix(in srgb, var(--glow-amber) 90%, transparent)) drop-shadow(0 0 8px color-mix(in srgb, var(--glow-amber) 60%, transparent))",
            }}
          />
        </motion.div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium flex-1 text-left min-w-0">
          Recommendations
        </p>
        <span
          className="shrink-0 text-xs font-medium rounded-full px-2 py-0.5"
          style={{
            color: "var(--glow-amber)",
            background: "color-mix(in srgb, var(--glow-amber) 12%, transparent)",
          }}
        >
          {recs.length}
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 transition-transform duration-200"
          style={{ color: "var(--muted-foreground)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {expanded && (
        <ul className="flex flex-col gap-3 mt-4">
          {recs.map((rec) => (
            <li
              key={rec.id}
              className="p-3 rounded-lg bg-foreground/[0.03] border border-border flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[rec.category] ?? rec.category}
                </span>
                <h3 className="text-base font-medium text-foreground mt-0.5 break-words">{rec.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 break-words">{rec.body}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleFeedback(rec.id, "acted_on")}
                  aria-label={`Mark helpful: ${rec.title}`}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ThumbsUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(rec.id, "dismissed")}
                  aria-label={`Dismiss: ${rec.title}`}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export default RecommendationsCard;
