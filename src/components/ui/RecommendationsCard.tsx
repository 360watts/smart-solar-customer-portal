"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import GlassCard from "@/components/ui/GlassCard";
import { StoryCard } from "@/components/ui/recommendations/StoryCard";
import { portalApi, type CustomerRecommendation } from "@/lib/api";

export function RecommendationsCard({ siteId }: { siteId: string }) {
  const [recs, setRecs] = useState<CustomerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const stripRef = useRef<HTMLUListElement>(null);

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

  useGSAP(
    () => {
      const cards = stripRef.current?.querySelectorAll("[data-story-card]");
      if (!cards || cards.length === 0) return;
      const reduced =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 20, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: reduced ? 0 : 0.55,
          stagger: reduced ? 0 : 0.08,
          ease: "back.out(1.6)",
        },
      );
    },
    { dependencies: [recs.length], scope: stripRef },
  );

  function handleScroll() {
    const strip = stripRef.current;
    if (!strip || !strip.firstElementChild) return;
    const cardWidth = (strip.firstElementChild as HTMLElement).offsetWidth + 12; // + gap-3
    setActiveDot(Math.round(strip.scrollLeft / cardWidth));
  }

  if (loading || recs.length === 0) return null;

  return (
    <GlassCard>
      <div className="w-full flex items-center gap-2">
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
      </div>

      <ul
        ref={stripRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory mt-4 -mx-2 px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "x mandatory",
          maskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
        }}
      >
        {recs.map((rec) => (
          <StoryCard key={rec.id} rec={rec} onFeedback={handleFeedback} />
        ))}
      </ul>

      {recs.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1">
          {recs.map((rec, i) => (
            <span
              key={rec.id}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{
                background: i === activeDot ? "var(--glow-amber)" : "color-mix(in srgb, var(--muted-foreground) 30%, transparent)",
              }}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default RecommendationsCard;
