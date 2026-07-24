"use client";

import { m, useReducedMotion } from "framer-motion";
import { Sun } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface AssistantOrbProps {
  open: boolean;
  hasUnread: boolean;
  onClick: () => void;
}

// Idle animation runs a handful of cycles after mount/close, then rests —
// a floating widget sitting on a dashboard people leave open all day
// shouldn't animate forever; that reads as an attention-seeking tell in
// peripheral vision rather than a considered detail. It re-arms whenever
// there's something new to signal (handled via hasUnread instead).
const IDLE_CYCLES = 3;
const IDLE_CYCLE_MS = 2600;

const AssistantOrb = forwardRef<HTMLButtonElement, AssistantOrbProps>(function AssistantOrb(
  { open, hasUnread, onClick },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const [idleActive, setIdleActive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    setIdleActive(true);
    timerRef.current = setTimeout(() => setIdleActive(false), IDLE_CYCLES * IDLE_CYCLE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reduceMotion]);

  // New content while closed re-arms the idle animation briefly so it reads
  // as a distinct "something's here" signal rather than ambient motion.
  useEffect(() => {
    if (hasUnread && !open) setIdleActive(true);
  }, [hasUnread, open]);

  return (
    <m.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={open ? "Close assistant" : "Open assistant"}
      aria-expanded={open}
      className={cn(
        "fixed z-40 flex items-center justify-center rounded-full",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4",
        "md:bottom-6 md:right-6",
      )}
      style={{
        width: 52,
        height: 52,
        background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, black))",
        color: "var(--primary-foreground)",
        boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent)",
      }}
      whileTap={reduceMotion ? undefined : { scale: 0.88, rotate: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {idleActive && !reduceMotion && (
        <m.span
          aria-hidden
          className="absolute inset-[-5px] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0 60%, var(--secondary) 85%, transparent 100%)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <m.span
        className="relative z-10"
        animate={
          reduceMotion
            ? undefined
            : idleActive
              ? { rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }
              : { rotate: 0, scale: 1 }
        }
        transition={{ duration: 2.6, repeat: idleActive ? Infinity : 0, ease: "easeInOut" }}
      >
        <Sun size={22} strokeWidth={2} />
      </m.span>

      {hasUnread && !open && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full"
          style={{ background: "var(--secondary)", boxShadow: "0 0 0 2px var(--card)" }}
        />
      )}
    </m.button>
  );
});

export default AssistantOrb;
