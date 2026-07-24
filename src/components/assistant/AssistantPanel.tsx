"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

interface AssistantPanelProps {
  open: boolean;
  fullscreen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}

const MOBILE_QUERY = "(max-width: 640px)";

/** Below this viewport width the panel is always fullscreen, regardless of
 * the user's own toggle — a bottom-right slide-in panel doesn't work as a
 * layout on a phone screen. */
function subscribeToMobileQuery(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getMobileQuerySnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function useForcedMobileFullscreen(): boolean {
  // useSyncExternalStore, not useState+useEffect — this is exactly the
  // "subscribe to an external system" case, and getServerSnapshot=false
  // keeps the initial server-rendered markup consistent (mobile-forced
  // fullscreen never applies until the client can check matchMedia).
  return useSyncExternalStore(subscribeToMobileQuery, getMobileQuerySnapshot, () => false);
}

export default function AssistantPanel({ open, fullscreen, onClose, triggerRef, children }: AssistantPanelProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const forceMobileFullscreen = useForcedMobileFullscreen();
  const isFullscreen = fullscreen || forceMobileFullscreen;

  // Focus management: move focus into the panel on open, trap Tab within it,
  // close on Escape, and return focus to the orb on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    const first = focusables()[0];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(focusables());
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Snapshot triggerRef.current now — by the time this cleanup runs, the
    // ref itself may point somewhere else (e.g. component re-render).
    const fallbackFocusTarget = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      (previouslyFocusedRef.current ?? fallbackFocusTarget)?.focus();
    };
  }, [open, onClose, triggerRef]);

  const width = isFullscreen ? "100vw" : "min(360px, calc(100vw - 32px))";
  const height = isFullscreen ? "100dvh" : "min(520px, calc(100dvh - 140px))";
  const bottom = isFullscreen ? 0 : "calc(4.75rem + env(safe-area-inset-bottom) + 8px)";
  const right = isFullscreen ? 0 : "1rem";
  const radius = isFullscreen ? 0 : 18;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="360watts Assistant"
          className="fixed z-50 flex flex-col overflow-hidden shadow-2xl"
          style={{
            width,
            height,
            bottom,
            right,
            borderRadius: radius,
            background: "var(--glass-bg, color-mix(in srgb, var(--card) 90%, transparent))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            transformOrigin: "bottom right",
          }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 30, rotate: -1.5 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, rotate: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          transition={reduceMotion ? { duration: 0.15 } : { type: "spring", bounce: 0.42, duration: 0.5 }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
