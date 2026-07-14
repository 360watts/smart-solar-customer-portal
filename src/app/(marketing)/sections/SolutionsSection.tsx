"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { APP_IMAGES } from "../lib/imageRegistry";
import { reduceMotion, revealVariant, sectionMotionProps, staggerMotionProps } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";
import { JourneySection } from "./JourneySection";
import { AppScreensSection } from "./AppScreensSection";

export function SolutionsSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [solutionsVideoRef, solutionsVideoInView] = useInView({ triggerOnce: false, threshold: 0.2 });

  // solarInView still drives the sun-glint sweep on the Solar photo below.
  const [solarSectionRef, solarInView] = useInView({ threshold: 0.4 });

  // Split editorial layout for Solar/Smart Home: image gets its own honestly
  // proportioned frame (no more forcing a portrait photo into a squashed
  // landscape band) while the feature list becomes real stacked content
  // instead of tiny floating labels — reusing the same tilt/parallax
  // utilities as UnifiedSolutionSection rather than adding another
  // GSAP-pinned scroll-jack section on top of Journey/AppShowcase/AppScreens.
  const tiltSolar = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tiltHome = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const solarImgRef = useRef<HTMLDivElement>(null);
  const homeImgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: solarImgProgress } = useScroll({ target: solarImgRef, offset: ["start end", "end start"] });
  const { scrollYProgress: homeImgProgress } = useScroll({ target: homeImgRef, offset: ["start end", "end start"] });
  const solarImgY = useTransform(solarImgProgress, [0, 1], [-20, 20]);
  const homeImgY = useTransform(homeImgProgress, [0, 1], [-20, 20]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (solutionsVideoInView) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [solutionsVideoInView]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setProgress((p) => ({ ...p, current: video.currentTime }));
    const onDurationChange = () => setProgress((p) => ({ ...p, duration: video.duration || 0 }));
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    if (video.duration) setProgress((p) => ({ ...p, duration: video.duration }));
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  const toggleMute = () => setIsMuted((m) => !m);
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !progress.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    video.currentTime = x * progress.duration;
  };

  return (
    <section id="solutions-section" className="scroll-mt-20 overflow-hidden">
      <div
        className="min-h-screen text-[#0a0a0a] w-full min-w-0"
        style={{
          background:
            "radial-gradient(1200px 520px at 50% -18%, rgba(15,23,42,0.06), transparent 60%), radial-gradient(900px 520px at 110% 12%, rgba(59,130,246,0.10), transparent 66%), linear-gradient(180deg, #f7fff9 0%, #f6fdf8 36%, #eef9f3 72%, #e3f3ea 100%)",
        }}
      >
        {/* Video Hero — dark "cinema" backdrop (same unified palette as Hero/AppShowcase/Journey)
            gives this its own moment instead of floating, unframed, in the light wash below it. */}
        <section
          ref={solutionsVideoRef}
          className="relative w-full min-w-0 flex flex-col items-center justify-center py-10 sm:py-16 md:py-20 px-4 sm:px-6 bg-linear-to-b from-[#0f2f1e] via-[#0c1e14] to-[#0f2418]"
        >
          <motion.div
            className="text-center mb-6 sm:mb-8 md:mb-10"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion || solutionsVideoInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="eyebrow text-[#2FBF71]">See it in action</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Urbanist'] text-white tracking-tight mt-2">
              360watts, at work
            </h2>
          </motion.div>

          <motion.div
            className="group relative w-full max-w-200 aspect-video overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-white/10 bg-transparent z-10 min-w-0"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            animate={reduceMotion || solutionsVideoInView ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay={solutionsVideoInView}
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              poster={APP_IMAGES.solutionsSolarHouse}
            >
              <source src={APP_IMAGES.solutionsVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#0c1e14]/40 pointer-events-none" />
            {/* Media controls — visible on hover or when paused */}
            <div
              className={`absolute inset-0 z-20 flex flex-col justify-end bg-linear-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
              }`}
              style={{ pointerEvents: showControls || !isPlaying ? "auto" : "none" }}
            >
              <div className="flex items-center gap-2 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="shrink-0 rounded-full bg-white/20 hover:bg-white/30 text-white p-2 transition-colors min-w-11 min-h-11 flex items-center justify-center"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="shrink-0 rounded-full bg-white/20 hover:bg-white/30 text-white p-2 transition-colors min-w-11 min-h-11 flex items-center justify-center"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div
                  className="flex-1 min-w-0 h-1.5 sm:h-2 rounded-full bg-white/30 cursor-pointer overflow-hidden"
                  onClick={seek}
                  onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLDivElement).click()}
                  role="progressbar"
                  aria-label="Video progress"
                  aria-valuenow={progress.duration ? Math.round(progress.current) : 0}
                  aria-valuemin={0}
                  aria-valuemax={progress.duration ? Math.round(progress.duration) : 0}
                  tabIndex={0}
                >
                  <div
                    className="h-full bg-white rounded-full transition-[width] duration-150"
                    style={{ width: progress.duration ? `${(progress.current / progress.duration) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Smart Solar Solutions — editorial split layout. The source photo
            is a portrait crop (1314×1920); previously it was force-cropped
            into a short landscape band via object-cover, losing most of the
            frame. Here it gets an honestly-proportioned portrait frame
            instead, and the four features become real stacked nameplate
            rows (not tiny floating labels), giving this section deliberate,
            un-skippable scroll weight of its own between the two large
            pinned sections on either side (Journey before AppShowcase,
            AppScreens after). */}
        <motion.section id="solar" ref={solarSectionRef} className="px-4 sm:px-6 py-8 sm:py-10 md:py-12 border-b border-black/5" {...sectionMotionProps}>
          <div className="w-full max-w-6xl mx-auto min-w-0">
            <motion.div className="text-center md:text-left space-y-1.5 mb-5 md:mb-6 max-w-2xl mx-auto md:mx-0" variants={revealVariant}>
              <span className="eyebrow text-[#b4881f]">On your roof</span>
              <p className="text-[26px] sm:text-[32px] md:text-[38px] font-['Urbanist'] text-[#0a0a0a] font-bold">Smart Solar Solutions</p>
              <p className="text-[13px] sm:text-[14px] md:text-[15px] font-['Poppins'] text-[#4a5565]">
                We design, install, and maintain high-performance solar systems tailored for your home
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5 md:gap-8 items-center">
              <motion.div ref={solarImgRef} variants={revealVariant} style={tiltSolar.wrapperStyle} className="relative w-full max-w-xs md:max-w-none mx-auto md:mx-0">
                <motion.div
                  style={tiltSolar.cardStyle}
                  onMouseMove={tiltSolar.onMouseMove}
                  onMouseLeave={tiltSolar.onMouseLeave}
                  className="relative h-[269px] sm:h-[307px] md:h-[346px] rounded-[20px] md:rounded-3xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.12)]"
                >
                  <motion.div className="absolute inset-[-6%]" style={reduceMotion ? undefined : { y: solarImgY }}>
                    <img
                      src={APP_IMAGES.solutionsSolarHouse}
                      alt="Solar house"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </motion.div>
                  {!reduceMotion && (
                    <motion.div
                      className="absolute top-0 -left-1/3 w-1/3 h-full bg-white/25 -skew-x-12 pointer-events-none"
                      style={{ mixBlendMode: "overlay" }}
                      initial={{ x: "-40%" }}
                      animate={solarInView ? { x: "480%" } : undefined}
                      transition={{ duration: 1.7, ease: "easeInOut", delay: 0.4 }}
                    />
                  )}
                </motion.div>
              </motion.div>

              <motion.div className="space-y-2 sm:space-y-2.5" {...staggerMotionProps}>
                <SolarRow title="End-to-End" caption="From design to installation to maintenance" />
                <SolarRow title="Remote performance monitoring" caption="Track your system 24/7" />
                <SolarRow title="Maintenance & warranty" caption="Guaranteed performance and support" />
                <SolarRow title="Flexible models" caption="Subscription or purchase options" />
              </motion.div>
            </div>

            <div className="mt-5 md:mt-6 flex justify-center md:justify-start">
              <a
                href="#contact-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#04713a] text-white font-['Urbanist'] font-bold text-[16px] sm:text-[17px] px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity"
              >
                Enquire Solar Plans
              </a>
            </div>
          </div>
        </motion.section>

        {/* Journey — pinned, scroll-scrubbed sun-arc sequence (see JourneySection.tsx) */}
        <JourneySection />

        {/* Smart Home Solutions — "live status chip" language: this is
            ambient software watching and adjusting in the background, so its
            callouts read like notification/presence chips (pulsing dot,
            glass blur, blue accent) rather than a hardware plate. Same card
            anchoring as Solar above, different material — the pairing is
            the point. */}
        <motion.section id="smart-home" className="px-4 sm:px-6 py-8 sm:py-10 md:py-12" {...sectionMotionProps}>
          <div className="w-full max-w-6xl mx-auto">
            <motion.div className="text-center md:text-right space-y-1.5 mb-5 md:mb-6 max-w-2xl mx-auto md:ml-auto md:mr-0" variants={revealVariant}>
              <span className="eyebrow text-[#2563eb]">In your home</span>
              <p className="text-[26px] sm:text-[32px] md:text-[38px] font-['Urbanist'] text-[#0a0a0a] font-bold">Smart home solutions</p>
              <p className="text-[13px] sm:text-[14px] md:text-[15px] font-['Poppins'] text-[#4a5565]">
                Our intelligent automation connects your home's devices to your solar flow.
              </p>
            </motion.div>

            {/* image on the right on desktop (mirrors Solar's left placement — a
                real zig-zag between the two products, not decoration), stacks
                image-first on mobile */}
            <div className="grid md:grid-cols-2 gap-5 md:gap-8 items-center">
              <motion.div className="space-y-2 sm:space-y-2.5 order-2 md:order-1" {...staggerMotionProps}>
                <StatusRow title="Device Scheduling" caption="Automate based on your routine" />
                <StatusRow title="Seamless Integration" caption="Works with existing smart devices" />
                <StatusRow title="Cross Device Automation" caption="All devices work together" />
                <StatusRow title="Predictive Energy Routines" caption="AI learns your patterns" />
              </motion.div>

              <motion.div ref={homeImgRef} variants={revealVariant} style={tiltHome.wrapperStyle} className="relative w-full max-w-sm md:max-w-none mx-auto md:mx-0 order-1 md:order-2">
                <motion.div
                  style={tiltHome.cardStyle}
                  onMouseMove={tiltHome.onMouseMove}
                  onMouseLeave={tiltHome.onMouseLeave}
                  className="relative h-[269px] sm:h-[307px] md:h-[346px] rounded-[20px] md:rounded-3xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.12)]"
                >
                  <motion.div className="absolute inset-[-6%]" style={reduceMotion ? undefined : { y: homeImgY }}>
                    <img
                      src={APP_IMAGES.solutionsSmartHomeScene}
                      alt="Smart home"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            <div className="mt-5 md:mt-6 flex justify-center md:justify-end">
              <a
                href="#contact-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#2563eb] text-white font-['Urbanist'] font-bold text-[16px] sm:text-[17px] px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity"
              >
                Enquire Smart Home
              </a>
            </div>
          </div>
        </motion.section>

        {/* "Smarter Living" used to live here as its own rail, re-describing the
            same smart-home setup flow already covered by HowItWorksSection's
            Smart Home column — folded in there instead of existing twice. */}

        <AppScreensSection />

        {/* CTA Section — eases back to #f7fff9 by its own bottom so the seam
            into AboutSection (flat bg-[#f7fff9]) matches exactly; the parent
            wrapper's gradient is still deepening toward #e3f3ea at this
            depth, which would otherwise leave a visible mismatch at the
            SolutionsSection/AboutSection boundary. */}
        <motion.section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-linear-to-b from-transparent to-[#f7fff9]" {...sectionMotionProps}>
          <motion.div className="w-full max-w-4xl mx-auto text-center" variants={revealVariant}>
            <h2 className="text-[28px] sm:text-[36px] md:text-[40px] lg:text-5xl font-bold text-[#0a0a0a] font-['Urbanist'] mb-4 sm:mb-6">
              Want to explore the future?
            </h2>
            <p className="text-[16px] sm:text-[18px] md:text-xl text-[#4a5565] mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto font-['Poppins']">
              Let's discuss how our solutions can transform your home or business.
            </p>
            <div className="flex flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="#contact-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-linear-to-r from-orange-400 to-orange-600 text-white font-bold px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-[10px] hover:opacity-90 transition-opacity text-[14px] sm:text-[15px] md:text-base"
              >
                Chat with us
              </a>
              <button
                onClick={() => window.location.href = `tel:9087610051`}
                className="border-2 border-[#0a0a0a] text-[#0a0a0a] font-bold px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-[10px] hover:bg-black/5 transition-colors text-[14px] sm:text-[15px] md:text-[16px]"
              >
                Call us
              </button>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </section>

  );
}

/** Solar's "equipment nameplate" row — mono caption, corner notch, amber
 *  accent bar: a physical spec plate, not an app tooltip. Real stacked
 *  content (not an absolutely-positioned label) so the section has honest,
 *  un-skippable scroll weight of its own. */
function SolarRow({ title, caption }: { title: string; caption: string }) {
  return (
    <motion.div
      variants={revealVariant}
      className="relative overflow-hidden flex items-center gap-3 bg-[#fdf8ee] border border-black/10 rounded-xl px-4 py-2.5"
    >
      <span className="absolute top-0 left-0 w-3 h-3 bg-[#0c1e14] [clip-path:polygon(0_0,100%_0,0_100%)]" />
      <div className="h-6 w-[3px] bg-[#E9B949] rounded-full shrink-0" />
      <div>
        <p className="font-['Urbanist'] font-bold uppercase tracking-[0.02em] text-[14px] sm:text-[15px] text-[#0a0a0a]">{title}</p>
        <p className="font-mono text-[11px] sm:text-[12px] text-[#0a0a0a]/60 mt-1">{caption}</p>
      </div>
    </motion.div>
  );
}

/** Smart Home's "live status" row — glass blur, blue accent, a pulsing
 *  presence dot: software watching in the background, not a static label. */
function StatusRow({ title, caption }: { title: string; caption: string }) {
  return (
    <motion.div
      variants={revealVariant}
      className="flex items-start gap-3 bg-white/70 backdrop-blur-md border border-[#3B82F6]/25 rounded-2xl px-4 py-2.5 shadow-[0_8px_20px_rgba(37,99,235,0.08)]"
    >
      <span className="relative mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#3B82F6]">
        {!reduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-full bg-[#3B82F6]"
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </span>
      <div>
        <p className="font-['Urbanist'] font-bold text-[14px] sm:text-[15px] text-[#0a0a0a]">{title}</p>
        <p className="font-['Poppins'] text-[12px] sm:text-[13px] text-[#0a0a0a]/60 mt-0.5">{caption}</p>
      </div>
    </motion.div>
  );
}
