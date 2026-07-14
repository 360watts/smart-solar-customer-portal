"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * "Sun's path" journey — the sun arcs across a horizon while five stations
 * (the onboarding steps) slide past beneath it, pinned and scroll-scrubbed.
 * Ties the site's core metaphor (a day's arc) directly to "here's what
 * happens when you sign up," instead of a fifth instance of the icon-card
 * grid used everywhere else on the page.
 *
 * Desktop/tablet only — horizontal pin-scroll on touch scroll is disorienting,
 * so mobile and reduced-motion both fall back to a plain stacked list.
 */
const STEPS = [
  { n: "01", title: "Online Proposal", desc: "Upload your bills and location to get your solar proposal with a 3D layout." },
  { n: "02", title: "Site Assessment", desc: "Our team validates your design and finalizes the proposal." },
  { n: "03", title: "Professional Installation", desc: "We manage everything — installation, commissioning, and subsidy paperwork." },
  { n: "04", title: "Smart Monitoring", desc: "Control generation, savings, and system health from anywhere, in one app." },
  { n: "05", title: "Ongoing Support", desc: "With 360Care, stay worry-free — we cover all maintenance." },
];

const ARC_HEIGHT = 120;

export function JourneySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [navH, setNavH] = useState(0);

  useLayoutEffect(() => {
    const updateNavH = () => setNavH(document.querySelector("nav")?.getBoundingClientRect().height ?? 0);
    updateNavH();
    window.addEventListener("resize", updateNavH);
    return () => window.removeEventListener("resize", updateNavH);
  }, []);

  // Both the pinned track and the static fallback are always in the DOM,
  // switched by CSS (motion-safe:md:*) instead of a post-mount JS state flip
  // — a client-only `enabled` boolean starts false on every load (no `window`
  // during SSR) and only flips true after hydration, which means the SSR
  // paint and the corrected paint are two different rendered frames with
  // different layouts. Chrome's Layout Instability API counts that as a
  // real shift (confirmed via a PageSpeed-style CLS trace: this section's
  // pinned tree scored a perfect 1.0 shift). CSS media queries are resolved
  // before the first paint, so there's only ever one rendered layout.
  // gsap.matchMedia() mirrors the same condition for the GSAP side, and
  // — unlike the old one-shot `enabled` check — also re-evaluates live if
  // the viewport crosses the breakpoint or the OS motion preference changes.
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
            end: () => "+=" + getScrollDistance() * 1.15,
            scrub: 0.25,
            pin: true,
            anticipatePin: 1,
            fastScrollEnd: true,
            preventOverlaps: true,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const p = self.progress;
              setActiveIndex(Math.min(STEPS.length - 1, Math.round(p * (STEPS.length - 1))));
              if (sunRef.current) {
                // x/y are transform-only (no reflow) — animating `left` here
                // instead would move the element every scroll tick via a
                // layout-triggering property, which Chrome's Layout
                // Instability API counts as a real layout shift each frame
                // (CLS explicitly excludes transform-driven movement).
                gsap.set(sunRef.current, {
                  x: p * section.clientWidth,
                  y: -Math.sin(p * Math.PI) * ARC_HEIGHT,
                });
              }
            },
          },
        });

        return () => tween.scrollTrigger?.kill();
      }, section);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  const goTo = (i: number) => {
    const st = ScrollTrigger.getAll().find((t) => t.trigger === sectionRef.current);
    if (!st) return;
    const y = st.start + (st.end - st.start) * (i / (STEPS.length - 1));
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <>
      {/* Static fallback — mobile + reduced-motion. Visible by default, hidden
          only once BOTH md+ and motion-safe apply (matches the GSAP
          matchMedia condition above exactly). */}
      <section className="motion-safe:md:hidden px-4 sm:px-6 py-16 bg-[#0c1e14]">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Urbanist'] text-white tracking-tight mb-3">
            Your journey to smarter solar
          </h2>
          <p className="text-[#9fb3a8] font-['Poppins']">From assessment to ongoing support, we&apos;re with you every step of the way.</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-2xl font-bold font-['Urbanist'] text-[#2FBF71] shrink-0">{s.n}</span>
              <div>
                <h3 className="font-['Urbanist'] font-bold text-white mb-1">{s.title}</h3>
                <p className="text-[#9fb3a8] font-['Poppins'] text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pinned sun-arc sequence — hidden by default, shown only once BOTH
          md+ and motion-safe apply. */}
      <section
        ref={sectionRef}
        className="hidden motion-safe:md:block relative h-screen overflow-hidden bg-[#0c1e14]"
        aria-label="Your journey to smarter solar"
      >
        {/* ambient glow — reuses the site's existing blurred-orb motif, boosted for a dark ground */}
        <div className="absolute inset-0 opacity-[0.14] pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#2FBF71] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#E9B949] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center" style={{ paddingTop: navH + 24 }}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Urbanist'] text-white tracking-tight leading-tight mb-3">
            Your journey to smarter solar
          </h2>
          <p className="text-[#9fb3a8] font-['Poppins'] text-lg">Scroll — the sun will walk you through it.</p>
        </div>

        {/* the sun, arcing across the pinned viewport in sync with scroll progress */}
        <div
          ref={sunRef}
          className="absolute top-1/2 left-0 z-10 -translate-x-1/2 pointer-events-none"
        >
          <div className="w-10 h-10 rounded-full bg-[#E9B949]" style={{ boxShadow: "0 0 60px 18px rgba(233,185,73,0.55)" }} />
        </div>

        {/* horizon line + station markers */}
        <div className="absolute left-0 right-0 top-[62%] h-px bg-linear-to-r from-transparent via-[#2FBF71]/40 to-transparent z-10" />
        <div className="absolute left-0 right-0 top-[62%] z-20 flex justify-between px-[8%] -translate-y-1/2">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              onClick={() => goTo(i)}
              aria-label={`Jump to step ${i + 1}: ${s.title}`}
              className="group relative flex items-center justify-center w-6 h-6 -mx-3"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-3.5 h-3.5 bg-[#2FBF71]" : "w-2 h-2 bg-white/25 group-hover:bg-white/50"
                }`}
                style={i === activeIndex ? { boxShadow: "0 0 16px 4px rgba(47,191,113,0.6)" } : undefined}
              />
            </button>
          ))}
        </div>

        {/* horizontally-scrubbed track of station panels */}
        <div className="absolute inset-0 flex items-center z-10" style={{ top: "14%" }}>
          <div ref={trackRef} className="flex">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="journey-panel shrink-0 w-screen h-full flex items-center justify-center px-6"
              >
                <div className={`max-w-md transition-opacity duration-500 ${i === activeIndex ? "opacity-100" : "opacity-40"}`}>
                  <span className="block font-['Urbanist'] font-bold text-[96px] sm:text-[120px] leading-none text-[#2FBF71]/25 select-none mb-4">
                    {s.n}
                  </span>
                  <h3 className="text-3xl font-bold font-['Urbanist'] text-white mb-3">{s.title}</h3>
                  <p className="text-[#9fb3a8] font-['Poppins'] text-lg leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
