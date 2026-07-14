"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { APP_IMAGES } from "../lib/imageRegistry";
import { processSteps, processStoryThemes } from "../data";
import { reduceMotion, sectionMotionProps } from "../lib/motion";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Same mechanism as JourneySection — one pinned, GSAP-scrubbed track — but
 * light palette (this section isn't Journey's dark signature moment; that
 * stays unique to Journey) and TWO tracks side by side, since Solar and
 * Smart Home install in parallel, not as one linear sequence.
 *
 * Both tracks move on the exact same tween, and each card's highlight is
 * set via `gsap.set` in the same onUpdate tick that moves the tracks — not
 * a separate React-state-driven CSS transition. That decoupling was the
 * root cause of the earlier bug where the "Stage X of 3" label and the
 * visually-highlighted card fell out of sync under fast scrolling; driving
 * everything from one callback makes that class of bug structurally
 * impossible here.
 *
 * Desktop/tablet only — mobile/reduced-motion gets the same content as a
 * plain stacked pair of columns, no pin (matches JourneySection's
 * convention: touch scroll-jacking is disorienting).
 */
export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const solarTrackRef = useRef<HTMLDivElement>(null);
  const smartTrackRef = useRef<HTMLDivElement>(null);
  const solarCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const smartCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const steps = processSteps.solar.length;

  useLayoutEffect(() => {
    setEnabled(!reduceMotion && window.matchMedia("(min-width: 768px)").matches);
  }, []);

  useGSAP(
    () => {
      if (!enabled || !sectionRef.current || !solarTrackRef.current || !smartTrackRef.current) return;
      const section = sectionRef.current;
      const solarTrack = solarTrackRef.current;
      const smartTrack = smartTrackRef.current;

      const ctx = gsap.context(() => {
        const getDist = () => solarTrack.scrollWidth - solarTrack.parentElement!.clientWidth;

        const setActive = (refs: (HTMLDivElement | null)[], color: string, idx: number) => {
          refs.forEach((el, i) => {
            if (!el) return;
            gsap.set(el, {
              borderColor: i === idx ? color : "rgba(0,0,0,0)",
              opacity: i === idx ? 1 : 0.55,
              scale: i === idx ? 1 : 0.97,
            });
          });
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + getDist() * 1.15,
            scrub: 0.3,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const p = self.progress;
              const idx = Math.min(steps - 1, Math.floor(p * steps));
              setActiveIndex(idx);
              setActive(solarCardRefs.current, "#04713a", idx);
              setActive(smartCardRefs.current, "#3b82f6", idx);
            },
          },
        });
        tl.to([solarTrack, smartTrack], { x: () => -getDist(), ease: "none" }, 0);

        return () => tl.scrollTrigger?.kill();
      }, section);

      return () => ctx.revert();
    },
    { dependencies: [enabled] },
  );

  const goTo = (i: number) => {
    const st = ScrollTrigger.getAll().find((t) => t.trigger === sectionRef.current);
    if (!st) return;
    window.scrollTo({ top: st.start + (st.end - st.start) * (i / (steps - 1)), behavior: "smooth" });
  };

  const solarCard = (step: (typeof processSteps.solar)[number], index: number) => (
    <div key={index} className="shrink-0 w-full h-full flex items-center px-1 md:px-2">
      <div
        ref={enabled ? (el) => { solarCardRefs.current[index] = el; } : undefined}
        className="w-full bg-linear-to-r from-white to-[#f7fff9] rounded-2xl md:rounded-[20px] p-4 md:p-6 border-2 border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-lg font-bold font-['Urbanist'] shrink-0 bg-linear-to-br from-[#dcfce7] to-[#bbf7d0] text-[#0a0a0a]">
            {step.number}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base md:text-xl text-[#0a0a0a] font-bold font-['Urbanist'] tracking-[-0.5px] leading-tight mb-1.5 md:mb-2">{step.title}</h4>
            <p className="text-xs md:text-[15px] text-[#4a5565] font-['Poppins'] leading-relaxed">{step.description}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const smartCard = (step: (typeof processSteps.smartHome)[number], index: number) => (
    <div key={index} className="shrink-0 w-full h-full flex items-center px-1 md:px-2">
      <div
        ref={enabled ? (el) => { smartCardRefs.current[index] = el; } : undefined}
        className="w-full bg-linear-to-r from-white to-[#f7fff9] rounded-2xl md:rounded-[20px] p-4 md:p-6 border-2 border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-lg font-bold font-['Urbanist'] shrink-0 bg-linear-to-br from-[#ddefff] to-[#bfdbfe] text-[#0a0a0a]">
            {step.number}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base md:text-xl text-[#0a0a0a] font-bold font-['Urbanist'] tracking-[-0.5px] leading-tight mb-1.5 md:mb-2">{step.title}</h4>
            <p className="text-xs md:text-[15px] text-[#4a5565] font-['Poppins'] leading-relaxed">{step.description}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!enabled) {
    // Static fallback: mobile + reduced-motion. Same content, plain stacked columns.
    return (
      <section className="py-8 px-4 sm:px-6 bg-transparent">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-linear-to-r from-[#dcfce7] to-[#ddefff] rounded-full mb-3">
            <span className="text-[11px] font-semibold text-[#0a0a0a] font-['Urbanist']">Simple &amp; Effective</span>
          </div>
          <h2 className="text-[28px] font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-1px] mb-2">How Does It Work?</h2>
          <p className="text-sm text-[#4a5565] font-['Poppins']">Solar and Smart Home run in parallel — one process, two systems</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <img src={APP_IMAGES.sun21} alt="Solar" className="w-8 h-8 object-contain" />
              <h3 className="font-bold font-['Urbanist']">Solar</h3>
            </div>
            {processSteps.solar.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-black/5">
                <p className="font-bold font-['Urbanist'] text-sm mb-1">{step.number}. {step.title}</p>
                <p className="text-xs text-[#4a5565] font-['Poppins']">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <img src={APP_IMAGES.smartHouse1} alt="Smart Home" className="w-8 h-8 object-contain" />
              <h3 className="font-bold font-['Urbanist']">Smart Home</h3>
            </div>
            {processSteps.smartHome.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-black/5">
                <p className="font-bold font-['Urbanist'] text-sm mb-1">{step.number}. {step.title}</p>
                <p className="text-xs text-[#4a5565] font-['Poppins']">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="#solutions-section" className="inline-flex items-center gap-2 px-4 py-2.5 border border-[rgba(74,85,101,0.75)] rounded-lg text-[#4a5565] text-sm">
            Explore Full Process
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden"
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

      <motion.div className="relative z-10 text-center pt-20 md:pt-24 px-4" {...sectionMotionProps}>
        <div className="inline-block px-3 md:px-6 py-1 md:py-2 bg-linear-to-r from-[#dcfce7] to-[#ddefff] rounded-full mb-3 md:mb-4">
          <span className="text-xs md:text-sm font-semibold text-[#0a0a0a] font-['Urbanist']">Simple &amp; Effective</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-1.5px] mb-2 bg-linear-to-r from-[#0a0a0a] to-[#4a5565] bg-clip-text text-transparent">
          How Does It Work?
        </h2>
        <p className="text-sm md:text-lg text-[#4a5565] font-['Poppins'] max-w-xl mx-auto mb-3">
          Solar and Smart Home run in parallel — one process, two systems
        </p>
        <span className="eyebrow text-[#04713a]">
          Stage {activeIndex + 1} of {steps} — {processStoryThemes[activeIndex]}
        </span>
      </motion.div>

      <div className="relative z-10 flex mt-8 md:mt-10" style={{ height: "38vh" }}>
        <div className="w-1/2 border-r border-black/5 flex flex-col px-3 md:px-8 lg:px-16">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 shrink-0">
            <div className="w-9 h-9 md:w-14 md:h-14 bg-linear-to-br from-[#dcfce7] to-[#bbf7d0] rounded-xl flex items-center justify-center shadow-lg">
              <img src={APP_IMAGES.sun21} alt="Solar" className="w-5 h-5 md:w-8 md:h-8 object-contain" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-0.5px]">Solar</h3>
              <p className="text-[10px] md:text-sm text-[#4a5565] font-['Poppins']">Clean energy generation</p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative min-h-0">
            <div ref={solarTrackRef} className="flex h-full">
              {processSteps.solar.map((step, i) => solarCard(step, i))}
            </div>
          </div>
        </div>

        <div className="w-1/2 flex flex-col px-3 md:px-8 lg:px-16">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 shrink-0">
            <div className="w-9 h-9 md:w-14 md:h-14 bg-linear-to-br from-[#ddefff] to-[#bfdbfe] rounded-xl flex items-center justify-center shadow-lg">
              <img src={APP_IMAGES.smartHouse1} alt="Smart Home" className="w-5 h-5 md:w-8 md:h-8 object-contain" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-0.5px]">Smart Home</h3>
              <p className="text-[10px] md:text-sm text-[#4a5565] font-['Poppins']">Intelligent automation</p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative min-h-0">
            <div ref={smartTrackRef} className="flex h-full">
              {processSteps.smartHome.map((step, i) => smartCard(step, i))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared markers — click to jump, like JourneySection's horizon markers */}
      <div className="relative z-10 flex justify-center gap-2 mt-6 md:mt-10">
        {Array.from({ length: steps }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Jump to stage ${i + 1}: ${processStoryThemes[i]}`}
            className="group relative flex items-center justify-center w-6 h-6 -mx-1"
          >
            <span
              className={`block rounded-full transition-colors duration-200 ${
                i === activeIndex ? "w-6 h-2 bg-[#04713a]" : "w-2 h-2 bg-black/15 group-hover:bg-black/30"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="relative z-10 text-center mt-4 md:mt-6">
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
