"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCalculatorModal } from "../lib/CalculatorModalContext";
import { reduceMotion } from "../lib/motion";

const SolarCalculatorSection = dynamic(() =>
  import("../sections/SolarCalculatorSection").then((m) => ({ default: m.SolarCalculatorSection })),
);

/**
 * The calculator lives here now instead of inline in the homepage flow —
 * opened from the nav's "Calculate Savings" button (see MarketingNav),
 * available from any marketing page. This also removes the
 * AppShowcase→SolarCalculator dark-section adjacency that was on the
 * homepage: the calculator no longer sits in the scroll flow at all.
 */
export function CalculatorModal() {
  const { isOpen, close } = useCalculatorModal();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-100 flex items-start sm:items-center justify-center overflow-y-auto py-6 sm:py-10 px-3 sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Solar savings calculator"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} aria-hidden />

          <motion.div
            className="relative w-full max-w-5xl"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <button
              onClick={close}
              aria-label="Close calculator"
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5 text-[#0a0a0a]" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto rounded-[20px] sm:rounded-[28px]">
              <SolarCalculatorSection />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
