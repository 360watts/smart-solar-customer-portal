"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "../data";
import { reduceMotion, sectionMotionProps, ctaMotionProps } from "../lib/motion";

/** Sun-rising / sun-setting slide transition variants. */
const slideVariants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: "easeIn" as const } },
};

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-progress: hero content fades out + rises as user scrolls past
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -30]);
  // Optional subtle 3D: content block tilts back slightly as user scrolls (low/experimental)
  const heroRotateX = useTransform(scrollYProgress, [0, 0.5], [0, 2]);
  // Background drifts slower than the page — sun-drenched parallax opening the story.
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (reduceMotion || !isPageVisible) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPageVisible]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  return (
    <motion.section
      ref={sectionRef}
      id="hero-section"
      className="relative mt-[52px] sm:mt-[60px] lg:mt-0 h-[30vh] sm:h-[40vh] md:h-[85vh] lg:h-screen overflow-hidden scroll-mt-20 bg-[#0c1e14]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...sectionMotionProps}
    >
      {/* Background images — instant swap, no animation (performance).
          <picture> serves responsive WebP variants; <img> fallback for older browsers. */}
      {heroSlides.map((slide, index) => (
        <motion.div
          key={index}
          className={`absolute inset-0 ${index === currentSlide ? "" : "hidden"}`}
          style={reduceMotion ? undefined : { y: bgY, scale: bgScale }}
        >
          <picture>
            <source
              type="image/webp"
              srcSet={slide.bgSrcSet}
              sizes="100vw"
            />
            <img
              src={slide.bgFallback}
              alt={
                index === 0
                  ? "Smart energy and sustainable living - 360watts hero"
                  : index === 1
                    ? "Solar power and clean energy - 360watts"
                    : ""
              }
              className="w-full h-full object-cover object-[70%_50%] sm:object-center"
              {...(index === 0
                ? { fetchPriority: "high" as const }
                : { loading: "lazy" as const, decoding: "async" as const })}
            />
          </picture>
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(30,30,30,0.4)] to-[rgba(30,30,30,0.8)]" />

      {/* Text content — scroll-progress fades out; optional subtle 3D tilt on scroll */}
      <motion.div
        className="relative z-10 h-full flex items-center"
        style={reduceMotion ? undefined : { opacity: heroOpacity, y: heroY }}
      >
        <div
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 text-left min-w-0"
          style={reduceMotion ? undefined : { perspective: 1200, transformStyle: "preserve-3d" }}
        >
          <motion.div
            style={
              reduceMotion
                ? undefined
                : { rotateX: heroRotateX, transformStyle: "preserve-3d" }
            }
            className="max-w-3xl"
          >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="px-0 sm:px-0 mr-auto text-left min-w-0"
            >
              <h1 className="text-[18px] sm:text-3xl md:text-4xl lg:text-6xl xl:text-[99px] font-bold text-[rgba(247,255,249,0.8)] font-['Urbanist'] mb-1.5 sm:mb-4 md:mb-6 leading-[1.1] tracking-tight sm:tracking-[-2px] md:tracking-[-3.96px] whitespace-pre-line">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-[13px] sm:text-base md:text-lg lg:text-xl xl:text-[23px] text-white font-['Poppins'] max-w-xl mb-2 sm:mb-6 md:mb-10 leading-relaxed">
                {heroSlides[currentSlide].subtitle}
              </p>
              <motion.div
                {...ctaMotionProps}
                className="inline-flex"
              >
                <Link
                  href="/#contact-section"
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2.5 md:py-3 lg:py-4 min-h-[40px] sm:min-h-[44px] text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold bg-gradient-to-r from-[#00a63e] to-[#007a55] text-white rounded-md sm:rounded-lg md:rounded-xl hover:opacity-90 active:scale-95 transition-all"
                >
                  Get Free Consultation
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      <button
        onClick={prevSlide}
        className="hidden sm:hidden absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 sm:w-12 sm:h-12 bg-white/30 backdrop-blur-md rounded-full items-center justify-center text-white hover:bg-white/40 active:scale-95 transition-all shadow-lg border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-7 h-7 sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden sm:hidden absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 sm:w-12 sm:h-12 bg-white/30 backdrop-blur-md rounded-full items-center justify-center text-white hover:bg-white/40 active:scale-95 transition-all shadow-lg border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-7 h-7 sm:w-6 sm:h-6" />
      </button>

      <div className="absolute bottom-0 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex gap-1.5 sm:gap-2 z-20" role="tablist" aria-label="Hero slides">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === currentSlide}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrentSlide(index)}
            className="min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <span className={`block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"}`} />
          </button>
        ))}
      </div>
    </motion.section>
  );
}
