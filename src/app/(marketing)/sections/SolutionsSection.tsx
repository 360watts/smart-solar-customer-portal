"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Wrench } from "../components/icons/Wrench";
import { APP_IMAGES } from "../lib/imageRegistry";
import { reduceMotion, revealVariant, sectionMotionProps, staggerMotionProps } from "../lib/motion";

export function SolutionsSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [solutionsVideoRef, solutionsVideoInView] = useInView({ triggerOnce: false, threshold: 0.2 });

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
        {/* Video Hero */}
        <section ref={solutionsVideoRef} className="relative w-full min-w-0 flex justify-center items-center h-[280px] sm:h-[400px] md:h-[500px] lg:h-auto py-0 lg:py-12 px-4 sm:px-6">
          <div
            className="group relative w-full max-w-[1000px] aspect-video overflow-hidden shadow-xl border border-black/10 bg-transparent z-10 min-w-0"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
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
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f7fff9]/30 pointer-events-none" />
            {/* Media controls — visible on hover or when paused */}
            <div
              className={`absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
              }`}
              style={{ pointerEvents: showControls || !isPlaying ? "auto" : "none" }}
            >
              <div className="flex items-center gap-2 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="flex-shrink-0 rounded-full bg-white/20 hover:bg-white/30 text-foreground p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex-shrink-0 rounded-full bg-white/20 hover:bg-white/30 text-foreground p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          </div>
        </section>

        {/* Solution selector below video */}
        <section className="px-6 py-10">
          <div className="w-full max-w-4xl mx-auto min-w-0 flex justify-center gap-4 flex-wrap">
            {[
              { key: "solar", label: "Smart Solar", target: "solar" },
              { key: "smart-home", label: "Smart Home", target: "smart-home" },
              { key: "app", label: "App", target: "app" },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                type="button"
                onClick={() => {
                  const el = document.getElementById(tab.target);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-6 py-3 rounded-[10px] font-['Urbanist'] font-bold text-[19px] transition-all border border-black/10 shadow-sm bg-white text-[#0a0a0a] hover:bg-black/5"
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Smart solar solutions — style matched to Smart home solutions block */}
        <motion.section id="solar" className="px-4 sm:px-6 py-12 sm:py-14 md:py-16 border-b border-black/5" {...sectionMotionProps}>
          <motion.div className="w-full max-w-6xl mx-auto min-w-0 text-center space-y-2 sm:space-y-3 mb-8 sm:mb-10" variants={revealVariant}>
            <p className="text-[32px] sm:text-[40px] md:text-[50px] font-['Urbanist'] text-[#0a0a0a] font-bold">Smart Solar Solutions</p>
            <p className="text-[14px] sm:text-[15px] md:text-[17px] font-['Poppins'] text-[#4a5565]">
              We design, install, and maintain high-performance solar systems tailored for your home
            </p>
          </motion.div>
        </motion.section>

        {/* Solar hero image with callouts */}
        <motion.section className="px-6 pb-16" {...sectionMotionProps}>
          <motion.div className="w-full max-w-5xl mx-auto min-w-0 rounded-[20px] md:rounded-[24px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.12)] relative" variants={revealVariant}>
            <img
              src={APP_IMAGES.solutionsSolarHouse}
              alt="Solar house"
              className="w-full h-[400px] sm:h-[600px] md:h-[800px] lg:h-[1000px] object-cover object-bottom"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 pointer-events-none block">
              <motion.div
                className="absolute left-[5%] sm:left-[10%] top-[5%] bg-[rgba(255,255,255,0.8)] border border-[rgba(0,0,0,0.4)] rounded-[12px] sm:rounded-[16px] md:rounded-[20px] lg:rounded-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-1 sm:p-3 md:p-4 lg:p-6 w-[140px] sm:w-[200px] md:w-[240px] lg:w-[280px]"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <div className="w-3 h-3 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-[rgba(157,221,180,0.47)] rounded flex items-center justify-center"><Wrench property1="variant-2" vector="vector-2.svg" /></div>
                  <p className="font-['Urbanist'] font-bold text-[9px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#0a0a0a]">End-to-End</p>
                </div>  
                <p className="font-['Poppins'] text-[7px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-[rgba(0,0,0,0.7)]">From design to installation to maintenance</p>
              </motion.div>
              <motion.div
                className="absolute right-[5%] sm:right-[10%] top-[15%] bg-[rgba(255,255,255,0.8)] border border-[rgba(0,0,0,0.4)] rounded-[12px] sm:rounded-[16px] md:rounded-[20px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-1 sm:p-3 md:p-4 w-[140px] sm:w-[200px] md:w-[240px] lg:w-[280px]"
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={reduceMotion ? undefined : { duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <div className="w-3 h-3 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-[rgba(157,221,180,0.47)] rounded flex items-center justify-center"><Wrench property1="variant-3" slidersHorizontalVector="vector-3.svg" /></div>
                  <p className="font-['Urbanist'] font-bold text-[9px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#0a0a0a]">Remote performance monitoring</p>
                </div>
                <p className="font-['Poppins'] text-[7px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-[rgba(0,0,0,0.7)]">Track your system 24/7</p>
              </motion.div>
              <motion.div
                className="absolute right-[5%] sm:right-[10%] bottom-[50%] bg-[rgba(255,255,255,0.8)] border border-[rgba(0,0,0,0.4)] rounded-[12px] sm:rounded-[16px] md:rounded-[20px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-1 sm:p-3 md:p-4 w-[140px] sm:w-[200px] md:w-[240px] lg:w-[280px]"
                animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                transition={reduceMotion ? undefined : { duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              >
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <div className="w-3 h-3 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-[rgba(157,221,180,0.47)] rounded flex items-center justify-center"><Wrench property1="variant-3" slidersHorizontalVector="vector-3.svg" /></div>
                  <p className="font-['Urbanist'] font-bold text-[9px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#0a0a0a]">Maintenance & warranty</p>
                </div>
                <p className="font-['Poppins'] text-[7px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-[rgba(0,0,0,0.7)]">Guaranteed performance and support</p>
              </motion.div>
              <motion.div
                className="absolute left-[5%] sm:left-[10%] bottom-[62%] bg-[rgba(255,255,255,0.8)] border border-[rgba(0,0,0,0.4)] rounded-[12px] sm:rounded-[16px] md:rounded-[20px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-2 sm:p-3 md:p-4 w-[140px] sm:w-[200px] md:w-[240px] lg:w-[280px]"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={reduceMotion ? undefined : { duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
              >
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <div className="w-3 h-3 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-[rgba(157,221,180,0.47)] rounded flex items-center justify-center"><Wrench property1="default" vector="vector-2.svg" /></div>
                  <p className="font-['Urbanist'] font-bold text-[9px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#0a0a0a]">Flexible models</p>
                </div>
                <p className="font-['Poppins'] text-[7px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-[rgba(0,0,0,0.7)]">Subscription or purchase options</p>
              </motion.div>
            </div>
          </motion.div>
          <div className="w-full max-w-5xl mx-auto min-w-0 mt-6 flex justify-center">
            <a
              href="#contact-section"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[rgba(0,0,0,0.75)] text-foreground font-['Urbanist'] font-bold text-[19px] px-6 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
            >
              Enquire Solar Plans
            </a>
          </div>
        </motion.section>

        {/* Journey */}
        <motion.section className="px-6 pb-20" {...sectionMotionProps}>
          <motion.div className="w-full max-w-6xl mx-auto min-w-0 text-center mb-12" variants={revealVariant}>
            <h2 className="text-[32px] sm:text-[38px] md:text-[44px] lg:text-[48px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 md:mb-4 tracking-[-1.5px]">Your journey to smarter solar</h2>
            <p className="text-[18px] text-[#4a5565] font-['Poppins']">
              From assessment to ongoing support, we're with you every step of the way
            </p>
          </motion.div>
          <motion.div className="w-full max-w-6xl mx-auto min-w-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5 md:gap-6" {...staggerMotionProps}>
            {[
              { title: "Online Proposal", desc: "Upload your bills and location to get your solar proposal with 3D layout." },
              { title: "Site Assessment", desc: "Our team validates your design & finalizes proposal." },
              { title: "Professional Installation", desc: "Our team manages everything, from installation, commissioning & subsidy." },
              { title: "Smart Monitoring", desc: "Control solar generation, savings, and system health - all in one app and from anywhere." },
              { title: "Ongoing Support", desc: "With 360Care, stay worry-free. We cover all maintenance." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={revealVariant}
                className="bg-white rounded-[16px] md:rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 px-3 sm:px-4 py-4 sm:py-5 flex flex-col items-center text-center gap-2 sm:gap-3"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#fdc700] to-[#ff6900] flex items-center justify-center text-foreground font-bold text-base sm:text-lg md:text-xl">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="font-['Urbanist'] font-bold text-[13px] sm:text-[14px] md:text-[16px] text-[#0a0a0a]">{item.title}</p>
                <p className="font-['Poppins'] text-[10px] sm:text-[11px] md:text-[12px] text-[#4a5565] leading-[1.4]">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Smart home solutions */}
        <motion.section id="smart-home" className="px-4 sm:px-6 py-12 sm:py-14 md:py-16" {...sectionMotionProps}>
          <motion.div className="w-full max-w-6xl mx-auto text-center space-y-2 sm:space-y-3 mb-8 sm:mb-10" variants={revealVariant}>
            <p className="text-[32px] sm:text-[40px] md:text-[50px] font-['Urbanist'] text-[#0a0a0a] font-bold">Smart home solutions</p>
            <p className="text-[14px] sm:text-[15px] md:text-[17px] font-['Poppins'] text-[#4a5565]">
              Our intelligent automation connects your home's devices to your solar flow.
            </p>
          </motion.div>

          <motion.div className="relative w-full max-w-6xl mx-auto rounded-[24px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.12)]" variants={revealVariant}>
            <img
              src={APP_IMAGES.solutionsSmartHomeScene}
              alt="Smart home"
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 pointer-events-none block">
              <motion.div
                className="absolute left-[5%] sm:left-[10%] top-[10%] sm:top-[15%] bg-white/94 rounded-[6px] sm:rounded-[8px] md:rounded-[10px] lg:rounded-[12px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1 md:py-2 lg:py-3 shadow border border-black/5 max-w-[100px] sm:max-w-[120px] md:max-w-[160px] lg:max-w-[180px] xl:max-w-[210px]"
                animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                transition={reduceMotion ? undefined : { duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <p className="font-['Urbanist'] font-bold text-[8px] sm:text-[10px] md:text-[12px] lg:text-[13px] xl:text-[14px]">Device Scheduling</p>
                <p className="font-['Poppins'] text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px] text-[#3f3f3f] leading-tight">Automate based on your routine</p>
              </motion.div>
              <motion.div
                className="absolute right-[15%] sm:right-[10%] md:right-[20%] top-[32%] sm:top-[35%] bg-white/94 rounded-[6px] sm:rounded-[8px] md:rounded-[10px] lg:rounded-[12px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1 md:py-2 lg:py-3 shadow border border-black/5 max-w-[110px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[200px] xl:max-w-[230px] text-right"
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={reduceMotion ? undefined : { duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <p className="font-['Urbanist'] font-bold text-[8px] sm:text-[10px] md:text-[12px] lg:text-[13px] xl:text-[14px]">Predictive Energy Routines</p>
                <p className="font-['Poppins'] text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px] text-[#3f3f3f] leading-tight">AI learns your patterns</p>
              </motion.div>
              <motion.div
                className="absolute left-[40%] sm:left-[35%] md:left-[45%] top-[10%] sm:top-[15%] bg-white/94 rounded-[6px] sm:rounded-[8px] md:rounded-[10px] lg:rounded-[12px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1 md:py-2 lg:py-3 shadow border border-black/5 max-w-[105px] sm:max-w-[130px] md:max-w-[170px] lg:max-w-[190px] xl:max-w-[220px]"
                animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                transition={reduceMotion ? undefined : { duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              >
                <p className="font-['Urbanist'] font-bold text-[8px] sm:text-[10px] md:text-[12px] lg:text-[13px] xl:text-[14px]">Seamless Integration</p>
                <p className="font-['Poppins'] text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px] text-[#3f3f3f] leading-tight">Works with existing smart devices</p>
              </motion.div>
              <motion.div
                className="absolute left-[23%] sm:left-[20%] md:left-[28%] bottom-[55%] sm:bottom-[56%] bg-white/94 rounded-[6px] sm:rounded-[8px] md:rounded-[10px] lg:rounded-[12px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1 md:py-2 lg:py-3 shadow border border-black/5 max-w-[105px] sm:max-w-[130px] md:max-w-[170px] lg:max-w-[190px] xl:max-w-[220px] text-center"
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={reduceMotion ? undefined : { duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              >
                <p className="font-['Urbanist'] font-bold text-[8px] sm:text-[10px] md:text-[12px] lg:text-[13px] xl:text-[14px]">Cross Device Automation</p>
                <p className="font-['Poppins'] text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px] text-[#3f3f3f] leading-tight">All devices work together</p>
              </motion.div>
            </div>
          </motion.div>
          <div className="w-full max-w-6xl mx-auto mt-10 flex justify-center">
            <a
              href="#contact-section"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#0a0a0a] text-foreground font-['Urbanist'] font-bold text-[17px] px-6 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
            >
              Enquire Smart Home
            </a>
          </div>
        </motion.section>

        {/* Smarter Living */}
        <motion.section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" {...sectionMotionProps}>
          <motion.div className="w-full max-w-6xl mx-auto text-center mb-10 sm:mb-12 md:mb-16" variants={revealVariant}>
            <h2 className="text-[30px] sm:text-[40px] md:text-[50px] lg:text-[54px] font-['Urbanist'] font-bold tracking-[-1px] sm:tracking-[-2px] text-[#0a0a0a] mb-3 sm:mb-4">
              Smarter Living, Simplified
            </h2>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#4a5565] font-['Poppins'] max-w-3xl mx-auto">
              Transform your home into an intelligent, energy-efficient haven
            </p>
          </motion.div>
          <motion.div className="w-full max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5 md:gap-6" {...staggerMotionProps}>
            {[
              { title: "Smart-Home Planning", desc: "We understand your lifestyle and automation needs - from high-load appliances up to a full home." },
              { title: "Smart devices", desc: "We suggest a list of smart devices for your automation. You can expand to new devices as you wish." },
              { title: "Device Integration", desc: "Our 360watts app effortlessly recognizes lighting, security, and smart appliances, keeping you connected from anywhere." },
              { title: "Automation Setup", desc: "The 360watts app guides you effortlessly in automation setup. Let AI suggest automations, or you can set them up manually." },
              { title: "Continuous Support", desc: "We keep our 360watts app updated to latest AI/ML developments. You can reach us for any technical support anytime." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={revealVariant}
                className="bg-white rounded-[16px] md:rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 px-3 sm:px-4 py-4 sm:py-5 flex flex-col items-center text-center gap-2 sm:gap-3"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#51a2ff] to-[#615fff] flex items-center justify-center text-foreground font-bold text-base sm:text-lg md:text-xl">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="font-['Urbanist'] font-bold text-[13px] sm:text-[14px] md:text-[16px] text-[#0a0a0a]">{item.title}</p>
                <p className="font-['Poppins'] text-[10px] sm:text-[11px] md:text-[12px] text-[#4a5565] leading-[1.4]">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* 360watts App */}
        <section id="app" className="px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="w-full max-w-7xl mx-auto">
            {/* Header */}
            <motion.div className="text-center mb-6 sm:mb-10 md:mb-12 lg:mb-16" {...sectionMotionProps}>
              <h2 className="text-[42px] sm:text-[80px] md:text-[99px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-3.96px] mb-2 sm:mb-4">360watts App</h2>
              <p className="text-[16px] sm:text-[23px] text-[#0a0a0a]/50 font-['Poppins'] tracking-[-0.92px] mb-4 sm:mb-6">Our Unified App Ecosystem</p>
              <div className="max-w-2xl mx-auto">
                <p className="text-[16px] sm:text-[23px] text-[#0a0a0a]/60 font-['Poppins'] tracking-[-0.92px] leading-relaxed">
                  The 360watts app bridges solar and smart living. View real-time energy flows, control devices, and get actionable insights - all in one dashboard.
                </p>
              </div>
            </motion.div>

            {/* Phone Grid Layout */}
            <div className="space-y-0">
              {/* Real-time Insights - First row */}
              <motion.div className="flex flex-row items-center gap-8 lg:gap-10" {...sectionMotionProps}>
                <div className="flex-1 text-center px-2 sm:text-center sm:px-6">
                  <h3 className="text-[18px] sm:text-[28px] lg:text-[30px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-1.2px] mb-4">
                    Real-time Insights
                  </h3>
                  <p className="text-[10px] sm:text-[20px] lg:text-[24px] font-['Poppins'] text-[#4a5565] tracking-[-0.96px] leading-relaxed">
                    Monitor your energy generation, consumption, and savings live, all in one intuitive dashboard.
                  </p>
                </div>
                <div className="flex-shrink-0 relative w-[176px] sm:w-[380px] lg:w-[370px] aspect-[329/636]">
                  {/* App Screenshot */}
                  <img src={APP_IMAGES.solutionsAppPhoneInsights} alt="Real-time Insights" className="absolute inset-[10%] w-[80%] h-[80%] object-cover rounded-[20px]" loading="lazy" decoding="async" />
                  {/* Phone Frame Overlay */}
                  <img src={APP_IMAGES.phone1401} alt="360watts app on phone" className="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" />
                </div>
              </motion.div>
              {/* Smart Scheduling - Second row */}
              <motion.div className="flex flex-row-reverse items-center gap-8 lg:gap-10" {...sectionMotionProps}>
                <div className="flex-1 text-center px-1 sm:text-center sm:px-6">
                  <h3 className="text-[18px] sm:text-[28px] lg:text-[30px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-1.2px] mb-2">Smart Scheduling</h3>
                  <p className="text-[10px] sm:text-[20px] lg:text-[24px] font-['Poppins'] text-[#4a5565] tracking-[-0.96px] leading-relaxed">
                    Automatically run high-load devices when solar power is abundant to maximize efficiency and reduce costs.
                  </p>
                </div>
                <div className="flex-shrink-0 relative w-[176px] sm:w-[380px] lg:w-[370px] aspect-[329/636]">
                  {/* App Screenshot */}
                  <img src={APP_IMAGES.solutionsAppPhoneMonitor} alt="Smart Scheduling" className="absolute inset-[14%] top-[10%] w-[75%] h-[80%] object-cover rounded-[10px]" loading="lazy" decoding="async" />
                  {/* Phone Frame Overlay */}
                  <img src={APP_IMAGES.phone1401} alt="360watts app on phone" className="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" />
                </div>
              </motion.div>

              {/* Routines and Modes - Third row (zig-zag) */}
              <motion.div className="flex flex-row items-center gap-8 lg:gap-10" {...sectionMotionProps}>
                <div className="flex-1 text-center px-2 sm:text-center sm:px-6">
                  <h3 className="text-[18px] sm:text-[28px] lg:text-[30px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-1.2px] mb-4">Routines and Modes</h3>
                  <p className="text-[10px] sm:text-[20px] lg:text-[24px] font-['Poppins'] text-[#4a5565] tracking-[-0.96px] leading-relaxed">
                    Set your home to match your daily life. Lights, fans, and devices adjust automatically to your routine.
                  </p>
                </div>
                <div className="flex-shrink-0 relative w-[160px] sm:w-[380px] lg:w-[370px] aspect-[329/636]">
                  {/* App Screenshot */}
                  <img src={APP_IMAGES.solutionsAppPhoneModes} alt="Routines and Modes" className="absolute inset-[11.5%] top-[8.5%] w-[77%] h-[83%] object-cover rounded-[20px]" loading="lazy" decoding="async" />
                  {/* Phone Frame Overlay */}
                  <img src={APP_IMAGES.phone1401} alt="360watts app on phone" className="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" />
                </div>
              </motion.div>

              {/* Maintenance and Care - Fourth row (zig-zag) */}
              <motion.div className="flex flex-row-reverse items-center gap-8 lg:gap-10" {...sectionMotionProps}>
                <div className="flex-1 text-center px-2 sm:text-center sm:px-6">
                  <h3 className="text-[18px] sm:text-[28px] lg:text-[30px] font-['Urbanist'] font-bold text-[#0a0a0a] tracking-[-1.2px] mb-4">Maintenance and Care</h3>
                  <p className="text-[10px] sm:text-[20px] lg:text-[24px] font-['Poppins'] text-[#4a5565] tracking-[-0.96px] leading-relaxed">
                    Easily book service appointments and keep your solar and smart systems performing at their best.
                  </p>
                </div>
                <div className="flex-shrink-0 relative w-[176px] sm:w-[380px] lg:w-[370px] aspect-[329/636]">
                  {/* App Screenshot */}
                  <img src={APP_IMAGES.solutionsAppPhoneHero} alt="Maintenance and Care" className="absolute inset-[14.5%] top-[9%] bottom-[6%] w-[75%] object-cover rounded-[20px]" loading="lazy" decoding="async" />
                  {/* Phone Frame Overlay */}
                  <img src={APP_IMAGES.phone1401} alt="360watts app on phone" className="absolute inset-2 w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" />
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6" {...sectionMotionProps}>
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
                className="bg-gradient-to-r from-orange-400 to-orange-600 text-foreground font-bold px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-[10px] hover:opacity-90 transition-opacity text-[14px] sm:text-[15px] md:text-base"
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
