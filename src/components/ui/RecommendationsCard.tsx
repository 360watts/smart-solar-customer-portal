"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
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

  async function handleDismiss(recId: number) {
    const prev = recs;
    setRecs((current) => current.filter((r) => r.id !== recId));
    try {
      await portalApi.updateRecommendation(siteId, recId, "dismissed");
    } catch {
      setRecs(prev);
    }
  }

  if (loading || recs.length === 0) return null;

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--foreground) 8%, transparent)" }}
        >
          <Lightbulb size={18} style={{ color: "var(--muted-foreground)" }} />
        </div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
          Recommendations
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {recs.map((rec) => (
          <li
            key={rec.id}
            className="p-3 rounded-lg bg-foreground/[0.03] border border-border flex items-start justify-between gap-3"
          >
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[rec.category] ?? rec.category}
              </span>
              <h3 className="text-base font-medium text-foreground mt-0.5">{rec.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{rec.body}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(rec.id)}
              aria-label={`Dismiss: ${rec.title}`}
              className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default RecommendationsCard;
