"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { APP_IMAGES } from "../lib/imageRegistry";
import { appScreens } from "../data";
import { sectionMotionProps } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One phone, four states, told the same way JourneySection tells its story:
 * a pinned horizontal track of full panels, each panel centering its own
 * content in whatever space is available — not a phone held fixed in a
 * bounded grid cell with crossfading content, which kept fighting sizing
 * across viewport heights. Each panel here gets the full flex-1 row height
 * to center into, so the phone can be sized simply (a fraction of the row's
 * own height) instead of computed through several layers of grid/flex
 * stretch math.
 *
 * Light palette (Journey stays the page's one dark signature moment) but the
 * same click-to-jump horizon-marker convention.
 *
 * Mobile/reduced-motion: same content, plain stacked list, no pin.
 */
export function AppScreensSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const steps = appScreens.length;

  // Both the pinned track and the static fallback are always in the DOM,
  // switched by CSS (motion-safe:md:*) instead of a post-mount JS state flip
  // — see JourneySection.tsx for the full rationale (a client-only `enabled`
  // boolean produces two different rendered frames across the SSR→hydration
  // boundary, which Chrome's Layout Instability API counts as a real CLS
  // shift; this section's pinned tree scored a perfect 1.0 in a CLS trace).
  useGSAP(() => {
    if (!trackRef.current || !sectionRef.current) return;
    const track = trackRef.current;
    const section = sectionRef.current;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const getScrollDistance = () => track.scrollWidth - section.clientWidth;

        const tween = gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + getScrollDistance() * 1.1,
            scrub: 0.3,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              setActiveIndex(Math.min(steps - 1, Math.max(0, Math.floor(self.progress * steps))));
            },
          },
        });

        return () => tween.scrollTrigger?.kill();
      }, section);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  const goTo = (index: number) => {
    const st = ScrollTrigger.getAll().find((t) => t.trigger === sectionRef.current);
    if (!st) return;
    const targetProgress = (index + 0.5) / steps;
    window.scrollTo({ top: st.start + targetProgress * (st.end - st.start), behavior: "smooth" });
  };

  return (
    <div id="app">
      {/* Static fallback — mobile + reduced-motion. Visible by default,
          hidden only once BOTH md+ and motion-safe apply (matches the GSAP
          matchMedia condition above exactly). */}
      <section className="motion-safe:md:hidden px-3 sm:px-4 md:px-6 py-12 sm:py-16">
        <Header />
        <div className="space-y-10 max-w-md mx-auto">
          {appScreens.map((screen, i) => (
            <div key={i} className="text-center">
              <div className="relative w-60 sm:w-64 mx-auto aspect-[329/636] mb-4">
                <Image src={screen.image} alt={screen.title} fill sizes="256px" className="absolute inset-[10%] w-[80%] h-[80%] object-cover rounded-[20px]" />
                <Image src={APP_IMAGES.phone1401} alt="" fill sizes="256px" className="pointer-events-none object-cover" />
              </div>
              <h3 className="text-[18px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-0.5px] mb-2">{screen.title}</h3>
              <p className="text-sm font-['Poppins'] text-[#4a5565] leading-relaxed">{screen.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pinned horizontal track — hidden by default, shown only once BOTH
          md+ and motion-safe apply. */}
      <section
        ref={sectionRef}
        className="hidden motion-safe:md:flex relative h-screen overflow-hidden flex-col pt-20 md:pt-24"
        style={{
          background:
            "radial-gradient(1200px 520px at 50% -18%, rgba(15,23,42,0.06), transparent 60%), radial-gradient(900px 520px at 110% 12%, rgba(59,130,246,0.10), transparent 66%), linear-gradient(180deg, #f7fff9 0%, #f6fdf8 36%, #eef9f3 72%, #e3f3ea 100%)",
        }}
        aria-label="360watts App"
      >
        <Header compact />

        {/* Bounded row — every panel below centers its content into exactly
            this much space, so phone sizing is just "a fraction of this row's
            height," not several layers of grid/flex stretch math. */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <div ref={trackRef} className="flex h-full">
            {appScreens.map((screen, i) => (
              <div key={i} className="shrink-0 w-screen h-full flex items-center justify-center px-6">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16 max-w-5xl">
                  <div className="shrink-0 relative h-[50vh] md:h-[60vh] max-h-125 w-auto aspect-[329/636]">
                    <Image src={screen.image} alt={screen.title} fill sizes="(min-width: 768px) 40vh, 50vh" className="absolute inset-[10%] w-[80%] h-[80%] object-cover rounded-[20px]" priority={i === 0} />
                    <Image src={APP_IMAGES.phone1401} alt="360watts app on phone" fill sizes="(min-width: 768px) 40vh, 50vh" className="pointer-events-none z-10 object-cover" />
                  </div>
                  <div className="text-center md:text-left max-w-sm">
                    <h3 className="text-xl sm:text-2xl md:text-[32px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-1px] mb-3">{screen.title}</h3>
                    <p className="text-sm sm:text-base md:text-xl font-['Poppins'] text-[#4a5565] leading-relaxed">{screen.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Markers — click to jump, same convention as JourneySection's horizon markers */}
        <div className="shrink-0 flex justify-center gap-2 py-4 md:py-6">
          {appScreens.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Jump to ${appScreens[i].title}`}
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
      </section>
    </div>
  );
}

function Header({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div className={compact ? "shrink-0 text-center mb-3 md:mb-4" : "text-center mb-6 sm:mb-10 md:mb-12"} {...sectionMotionProps}>
      <h2 className={compact ? "text-[32px] md:text-[56px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-2px] mb-2" : "text-[42px] sm:text-[80px] md:text-[99px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-3.96px] mb-2 sm:mb-4"}>
        360watts App
      </h2>
      <p className="text-[16px] sm:text-[20px] text-[#0a0a0a]/50 font-['Poppins'] tracking-[-0.92px]">Our Unified App Ecosystem</p>
    </motion.div>
  );
}
