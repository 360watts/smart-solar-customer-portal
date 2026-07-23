"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { benefitsData } from "../data";
import { revealVariant, sectionMotionProps, staggerMotionProps, cardMotionProps, reduceMotion } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";

gsap.registerPlugin(useGSAP);

/**
 * These four benefits aren't independent facts — they're one causal chain:
 * solar generation is *what* saves money, cuts footprint, and gives
 * automation something to optimize. A connecting line drawing itself across
 * the row (rather than a generic light-sweep/shine) says that directly: one
 * system, four visible effects, not four unrelated cards.
 *
 * md+ only — the connecting rail assumes the 4-column single-row layout;
 * below md the grid is 2x2 and a horizontal connector wouldn't line up.
 *
 * Triggered by `useInView` at the same threshold as the rest of the page's
 * Framer reveals (see JourneySection/HowItWorksSection history — a GSAP
 * ScrollTrigger scroll-position percentage and a Framer visibility-ratio
 * trigger drift out of sync on the same section; sharing one visibility
 * trigger keeps everything in the same beat).
 */
const RAIL_DURATION = 1.3;

export function Why360wattsSection() {
  const tilt0 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilt1 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilt2 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilt3 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilts = [tilt0, tilt1, tilt2, tilt3];

  const [gridRef, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const lineRef = useRef<SVGLineElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (reduceMotion || !inView || !lineRef.current) return;
      const tl = gsap.timeline();
      tl.fromTo(lineRef.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: RAIL_DURATION, ease: "power1.inOut" }, 0);

      benefitsData.forEach((_, i) => {
        const t = (i / (benefitsData.length - 1)) * RAIL_DURATION;
        const dot = dotRefs.current[i];
        const icon = iconRefs.current[i];
        if (dot) tl.fromTo(dot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)", transformOrigin: "center" }, t);
        if (icon) tl.fromTo(icon, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: "back.out(2.2)" }, t);
      });
    },
    { dependencies: [inView] },
  );

  return (
    <motion.section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-transparent" {...sectionMotionProps}>
      <div className="w-full max-w-7xl mx-auto min-w-0">
        <motion.div className="text-center mb-12 sm:mb-16 md:mb-20" variants={revealVariant}>
          <h2 className="text-[32px] sm:text-[38px] md:text-[44px] lg:text-[48px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 md:mb-4 tracking-[-1.5px]">
            Why 360watts?
          </h2>
          <p className="text-[16px] sm:text-[18px] md:text-[20px] text-[#4a5565] font-['Poppins'] tracking-[-0.5px]">
            Tangible benefits for your home
          </p>
        </motion.div>

        <motion.div ref={gridRef} className="relative min-w-0" {...staggerMotionProps}>
          {/* The connecting rail: one system, four visible effects — not four unrelated facts. */}
          <svg
            aria-hidden
            className="hidden md:block absolute left-[12.5%] right-[12.5%] -top-6 w-[75%] h-6 overflow-visible pointer-events-none"
            viewBox="0 0 300 24"
            preserveAspectRatio="none"
          >
            <line x1="0" y1="12" x2="300" y2="12" stroke="rgba(4,113,58,0.14)" strokeWidth="2" />
            <line
              ref={lineRef}
              x1="0"
              y1="12"
              x2="300"
              y2="12"
              stroke="#04713a"
              strokeWidth="2"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
            />
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                cx={i * 100}
                cy="12"
                r="4"
                fill="#04713a"
                opacity={0}
              />
            ))}
          </svg>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12 min-w-0">
            {benefitsData.map((benefit, index) => {
              const t = tilts[index];
              return (
                <div key={index} style={t.wrapperStyle} className="min-w-0">
                  <motion.div
                    variants={revealVariant}
                    {...(reduceMotion ? {} : cardMotionProps)}
                    style={t.cardStyle}
                    onMouseMove={t.onMouseMove}
                    onMouseLeave={t.onMouseLeave}
                    className="flex flex-col items-center text-center group min-w-0 h-full"
                  >
                    <div
                      ref={(el) => {
                        iconRefs.current[index] = el;
                      }}
                      className="w-20 h-20 sm:w-22.5 sm:h-22.5 md:w-25 md:h-25 bg-linear-to-br from-[#dcfce7] to-[#bbf7d0] rounded-2xl sm:rounded-[20px] flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-[0_4px_20px_rgba(4, 113, 58,0.15)] group-hover:shadow-[0_8px_30px_rgba(4, 113, 58,0.25)] transition-shadow duration-300"
                    >
                      <Image src={benefit.icon} alt="" width={50} height={50} className="w-9.5 h-9.5 sm:w-11.25 sm:h-11.25 md:w-12.5 md:h-12.5" />
                    </div>
                    <h3 className="text-[14px] sm:text-[17px] md:text-[20px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-2 sm:mb-3 leading-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-[12px] sm:text-[14px] md:text-[16px] text-[#4a5565] leading-relaxed font-['Poppins']">
                      {benefit.description}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
