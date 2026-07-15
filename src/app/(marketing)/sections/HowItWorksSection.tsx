"use client";

import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { APP_IMAGES } from "../lib/imageRegistry";
import { processSteps } from "../data";
import { sectionMotionProps, staggerMotionProps, revealVariant } from "../lib/motion";

/**
 * Two parallel columns (Solar installs, Smart Home sets up) as a plain
 * scroll-reveal grid — no GSAP pin. The previous version pinned this section
 * and scrubbed both tracks horizontally in sync with scroll, matching
 * JourneySection's mechanism. That pin setup (like every GSAP `pin: true`
 * section) inserts a pin-spacer after mount, which registers as a real
 * layout shift the moment it runs — confirmed via a CLS trace where this
 * class of section scored a perfect 1.0. Removing the pin here trades that
 * scroll-jacked moment for a plain, reliable reveal; Journey stays the
 * page's one deliberate pinned signature moment.
 */
export function HowItWorksSection() {
  const columnHeader = (icon: string, title: string, tagline: string, accentFrom: string, accentTo: string, align: "left" | "right") => (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className={`w-11 h-11 md:w-14 md:h-14 bg-linear-to-br ${accentFrom} ${accentTo} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
        <img src={icon} alt={title} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
      </div>
      <div>
        <h3 className="text-xl md:text-2xl font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-0.5px]">{title}</h3>
        <p className="text-xs md:text-sm text-[#4a5565] font-['Poppins']">{tagline}</p>
      </div>
    </div>
  );

  // Explicit desktop grid placement so Solar/Smart Home cards at the same
  // step index land in the same row (equal height via CSS Grid's default
  // row-stretch) while DOM order stays grouped by column (all Solar cards,
  // then all Smart Home cards) for mobile's single-column stack. Tailwind's
  // JIT scanner only picks up literal class strings, not runtime-interpolated
  // ones, hence this lookup table instead of building the class dynamically.
  const GRID_COL = ["", "md:col-start-1", "md:col-start-2"] as const;
  const GRID_ROW = ["", "md:row-start-1", "md:row-start-2", "md:row-start-3"] as const;

  const card = (
    key: string,
    step: (typeof processSteps.solar)[number],
    accentFrom: string,
    accentTo: string,
    column: 1 | 2,
    row: 1 | 2 | 3,
  ) => (
    <motion.div
      key={key}
      variants={revealVariant}
      className={`h-full bg-white rounded-2xl md:rounded-[20px] p-4 md:p-5 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${GRID_COL[column]} ${GRID_ROW[row]}`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm md:text-base font-bold font-['Urbanist'] shrink-0 bg-linear-to-br ${accentFrom} ${accentTo} text-[#0a0a0a]`}>
          {step.number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base md:text-lg text-[#0a0a0a] font-bold font-['Urbanist'] tracking-[-0.5px] leading-tight mb-1">{step.title}</h4>
          <p className="text-xs md:text-sm text-[#4a5565] font-['Poppins'] leading-relaxed">{step.description}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 md:py-24 px-4 sm:px-6"
      style={{
        background:
          "radial-gradient(1200px 520px at 50% -18%, rgba(15,23,42,0.06), transparent 60%), radial-gradient(900px 520px at 110% 12%, rgba(59,130,246,0.10), transparent 66%), linear-gradient(180deg, #f7fff9 0%, #f6fdf8 36%, #eef9f3 72%, #e3f3ea 100%)",
      }}
      aria-label="How does it work"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#04713a] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3b82f6] rounded-full blur-3xl" />
      </div>

      <motion.div className="relative z-10 text-center mb-10 md:mb-14 max-w-2xl mx-auto" {...sectionMotionProps}>
        <div className="inline-block px-3 md:px-6 py-1 md:py-2 bg-linear-to-r from-[#dcfce7] to-[#ddefff] rounded-full mb-3 md:mb-4">
          <span className="text-xs md:text-sm font-semibold text-[#0a0a0a] font-['Urbanist']">Simple &amp; Effective</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold font-['Urbanist'] tracking-[-1.5px] mb-2 bg-linear-to-r from-[#0a0a0a] to-[#4a5565] bg-clip-text text-transparent">
          How Does It Work?
        </h2>
        <p className="text-sm md:text-lg text-[#4a5565] font-['Poppins']">
          Solar and Smart Home run in parallel — one process, two systems
        </p>
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Shared header row — a plain two-column grid leaves the gutter between
            "Solar" and "Smart Home" empty even though the copy above says
            "one process, two systems." A small sync badge sitting on a
            connecting line fills that gap and makes the parallel relationship
            visible, not just stated — same quiet-connecting-line language as
            UnifiedSolutionSection's card pairing. */}
        <div className="relative flex items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="hidden md:block absolute left-0 right-0 top-1/2 h-px bg-black/8 -translate-y-1/2 -z-10" />
          {/* Absolutely centered on the divider line — flex justify-between
              alone won't do this reliably since the two headers' rendered
              widths differ ("Clean energy generation" vs "Intelligent
              automation"), so the middle flex gap isn't true center. */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 shrink-0 rounded-full bg-white border border-black/10 shadow-md items-center justify-center z-10">
            <ArrowLeftRight className="w-4 h-4 text-[#4a5565]" />
          </div>
          {columnHeader(APP_IMAGES.sun21, "Solar", "Clean energy generation", "from-[#dcfce7]", "to-[#bbf7d0]", "left")}
          {columnHeader(APP_IMAGES.smartHouse1, "Smart Home", "Intelligent automation", "from-[#ddefff]", "to-[#bfdbfe]", "left")}
        </div>

        {/* One grid — explicit column/row placement pairs each Solar card
            with its Smart Home counterpart at md+ (CSS Grid stretches every
            item in a row to the same height by default, so paired cards
            always match regardless of copy length, no JS measurement
            needed), while DOM order stays grouped (all Solar, then all Smart
            Home) so mobile's single-column stack doesn't interleave them. */}
        <motion.div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 md:gap-x-12" {...staggerMotionProps}>
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-black/8 -translate-x-1/2" />
          {processSteps.solar.map((step, i) => card(`solar-${i}`, step, "from-[#dcfce7]", "to-[#bbf7d0]", 1, (i + 1) as 1 | 2 | 3))}
          {processSteps.smartHome.map((step, i) => card(`smart-${i}`, step, "from-[#ddefff]", "to-[#bfdbfe]", 2, (i + 1) as 1 | 2 | 3))}
        </motion.div>
      </div>

      <div className="relative z-10 text-center mt-10 md:mt-14">
        <a
          href="#solutions-section"
          className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 border border-[rgba(74,85,101,0.75)] rounded-lg text-[#4a5565] hover:bg-black/5 transition-colors text-sm md:text-base"
        >
          Explore Full Process
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
        </a>
      </div>
    </section>
  );
}
