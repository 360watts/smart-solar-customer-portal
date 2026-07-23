"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { APP_IMAGES } from "../lib/imageRegistry";
import { appFeatures } from "../data";
import { reduceMotion } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** One phone mockup per feature, maps 1-to-1 with appFeatures. */
const slides = [
  { image: APP_IMAGES.image8, alt: "360watts app – real-time solar analytics" },
  { image: APP_IMAGES.image7, alt: "360watts app – smart device control" },
  { image: APP_IMAGES.image4, alt: "360watts app – bill tracking" },
  { image: APP_IMAGES.image5, alt: "360watts app – energy health insights" },
];

/** 3D carousel: full circle loop (360 / n). */
const ANGLE_PER_SLIDE = 360 / slides.length;
/** Smooth ease-out so rotation decelerates into place (no snap). */
const EASE_CAROUSEL = [0.22, 1, 0.36, 1] as const;
const TRANSITION_DURATION = 0.75;
/** Focal point: scale and opacity for non-center cards (depth of field). */
const CENTER_SCALE = 1;
const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.72;
/** Swipe threshold (px) for mobile. */
const SWIPE_THRESHOLD = 50;
/** Tilt non-front screens 45° toward viewer so they are visible. */
const SIDE_TILT_DEG = 45;

/** Sizing by breakpoint: mobile (<768), tablet (768–1023), desktop (1024+). */
const SIZING = {
  mobile: { phoneW: 172, radius: 160, perspective: 800, viewportW: 300 },
  tablet: { phoneW: 200, radius: 190, perspective: 900, viewportW: 360 },
  desktop: { phoneW: 232, radius: 220, perspective: 1000, viewportW: 429 },
} as const;

type Breakpoint = keyof typeof SIZING;

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function AppShowcaseSection() {
  const [currentAppSlide, setCurrentAppSlide] = useState(0);
  // Always starts at "desktop" so the first client render matches the SSR
  // output exactly (no `window` at SSR time) — same hydration-mismatch class
  // as the GSAP pin gate below, just for inline carousel sizing instead of
  // the pin condition. Corrected to the real viewport immediately on mount.
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const touchStartX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Pinned via GSAP ScrollTrigger (not CSS `position: sticky`) on
  // desktop/tablet so each slide gets real dwell time instead of flying past
  // within the section's own short height. ScrollTrigger's pin uses
  // `position: fixed` under the hood, which — unlike `sticky` — isn't broken
  // by the `overflow-x-hidden` on <main> in page.tsx (any ancestor with a
  // non-visible overflow silently breaks `position: sticky` for all
  // descendants in every major browser; `fixed` doesn't have that problem).
  // Mobile/reduced-motion keep the original short section, click/swipe-only
  // control (matches every other pinned section's convention).
  //
  // The pin condition is gated with gsap.matchMedia() below rather than a
  // client-only `enabled` boolean: a state flip that starts false on every
  // load (no `window` during SSR) means the SSR paint and the
  // hydration-corrected paint are two different rendered frames, which
  // Chrome's Layout Instability API counts as a real CLS shift (confirmed
  // via a CLS trace: this section scored two perfect 1.0 shifts — one for
  // the pin gate, one for the nav-height padding below). matchMedia
  // resolves synchronously against the same CSS breakpoint, so there's only
  // ever one rendered layout, and it also re-evaluates live on resize.
  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint(window.innerWidth));
    update(); // sync to the real viewport once on mount — was previously only wired to resize
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const section = sectionRef.current;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + (slides.length - 1) * window.innerHeight * 0.6,
        scrub: 0.3,
        pin: true,
        anticipatePin: 1,
        onUpdate(self) {
          const p = self.progress;
          setCurrentAppSlide(Math.min(slides.length - 1, Math.max(0, Math.floor(p * slides.length))));
        },
      });

      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  const { phoneW, radius, perspective, viewportW } = SIZING[breakpoint];
  const phoneH = useMemo(() => Math.round(phoneW * (636 / 329)), [phoneW]);

  /** Direct, immediate slide set — used for touch swipe and the non-pinned fallback. */
  const setSlide = (index: number) => {
    setCurrentAppSlide((Math.max(0, index) + slides.length) % slides.length);
  };

  /** Scrolls the page to the point in the pinned scroll range that lands on `index` —
   *  scroll stays the single source of truth; clicking just moves the scrollbar there. */
  const goTo = (index: number) => {
    const st = ScrollTrigger.getAll().find((t) => t.trigger === sectionRef.current);
    if (!st) {
      setSlide(index);
      return;
    }
    const targetProgress = (index + 0.5) / slides.length;
    window.scrollTo({ top: st.start + targetProgress * (st.end - st.start), behavior: "smooth" });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      setSlide(currentAppSlide + (dx > 0 ? -1 : 1));
    }
  };

  return (
    <section
      ref={sectionRef}
      className="pt-12 sm:pt-20 md:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 bg-linear-to-b from-[#0f2418] via-[#0c1e14] to-[#0f2f1e] overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto min-w-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left: feature list — highlights the active slide, click to jump */}
          <div className="text-white min-w-0">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-['Urbanist'] mb-4 sm:mb-6">
              One App. For Everything.
            </h2>
            <div className="space-y-6">
              {appFeatures.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={`flex items-start gap-4 w-full text-left transition-opacity duration-500 ease-out min-h-11 py-1 ${
                    index === currentAppSlide ? "opacity-100" : "opacity-50 hover:opacity-75"
                  }`}
                >
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <Image src={feature.icon} alt="" width={28} height={28} className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xl font-['Poppins']">
                      {feature.title}
                    </h3>
                    <p className="text-white font-['Poppins']">{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: 3D wheel — center straight (no tilt), focal depth, smooth transition, swipe on mobile */}
          <div className="flex flex-col items-center min-w-0 overflow-visible">
            <div
              className="relative mx-auto overflow-visible shrink-0 touch-pan-y shadow-none"
              style={{
                width: viewportW,
                height: phoneH,
                perspective,
                perspectiveOrigin: "50% 50%",
                boxShadow: "none",
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <motion.div
                className="absolute left-1/2 top-1/2"
                style={{
                  width: 0,
                  height: 0,
                  marginLeft: 0,
                  marginTop: 0,
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  rotateY: -currentAppSlide * ANGLE_PER_SLIDE,
                }}
                transition={{
                  type: "tween",
                  duration: reduceMotion ? 0 : TRANSITION_DURATION,
                  ease: EASE_CAROUSEL,
                }}
              >
                {slides.map((slide, i) => {
                  const isCenter = i === currentAppSlide;
                  let relativeDeg = (i - currentAppSlide) * ANGLE_PER_SLIDE;
                  while (relativeDeg > 180) relativeDeg -= 360;
                  while (relativeDeg < -180) relativeDeg += 360;
                  const isBack = Math.abs(Math.abs(relativeDeg) - 180) < 5;
                  const tiltOffset = (relativeDeg === 0 || isBack) ? 0 : -SIDE_TILT_DEG * (relativeDeg > 0 ? 1 : -1);
                  const rotateY = i * ANGLE_PER_SLIDE + tiltOffset;
                  return (
                  <div
                    key={i}
                    className="absolute left-0 top-0 shadow-none"
                    style={{
                      width: phoneW,
                      height: phoneH,
                      boxShadow: "none",
                      left: "50%",
                      top: "50%",
                      marginLeft: -phoneW / 2,
                      marginTop: -phoneH / 2,
                      transformStyle: "preserve-3d",
                      transform: `rotateY(${rotateY}deg) translateZ(${radius}px) scale(${isCenter ? CENTER_SCALE : SIDE_SCALE})`,
                      opacity: isCenter ? 1 : SIDE_OPACITY,
                      backfaceVisibility: "visible",
                      WebkitBackfaceVisibility: "visible",
                      transition: `opacity ${TRANSITION_DURATION}s cubic-bezier(0.22, 1, 0.36, 1), transform ${TRANSITION_DURATION}s cubic-bezier(0.22, 1, 0.36, 1)`,
                    }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      sizes="(min-width: 768px) 260px, 200px"
                      className="absolute inset-[8%] left-[13%] w-[75%] h-[83%] object-cover rounded-[20px] pointer-events-none"
                    />
                    <Image
                      src={APP_IMAGES.phone1401}
                      alt="360watts mobile app"
                      fill
                      sizes="(min-width: 768px) 260px, 200px"
                      className="pointer-events-none z-10 object-cover"
                    />
                  </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Dot indicators — lower, well below the carousel */}
            <div className="flex items-center justify-center gap-2 mt-10 sm:mt-16 pt-4 relative z-10" role="tablist" aria-label="App screenshots">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === currentAppSlide}
                  aria-label={slide.alt}
                  onClick={() => goTo(i)}
                  className="group min-w-11 min-h-11 flex items-center justify-center transition-transform duration-300 ease-out hover:scale-110 active:scale-95"
                >
                  <span
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      i === currentAppSlide ? "bg-white w-6" : "bg-white/40 w-2 group-hover:bg-white/70"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
