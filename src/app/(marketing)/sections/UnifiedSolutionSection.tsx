"use client";

import { useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APP_IMAGES } from "../lib/imageRegistry";
import { revealVariant, sectionMotionProps, staggerMotionProps, cardMotionProps, ctaMotionProps, reduceMotion } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";

/**
 * A quiet, static connecting line between the two cards — not animated.
 * Extends the same drawn-connecting-line language already used in
 * Why360wattsSection and HowItWorksSection, just without motion here.
 *
 * Asymmetric on purpose: Smart Home card sits lower than Solar, not mirrored
 * — two identical twins side by side reads as a template; an offset reads
 * as composed.
 */
export function UnifiedSolutionSection() {
  const tilt1 = use3DTilt({ maxDeg: 6, disabled: reduceMotion });
  const tilt2 = use3DTilt({ maxDeg: 6, disabled: reduceMotion });

  const sectionRef = useRef<HTMLElement>(null);

  // Parallax starts exactly when the section's top touches the fixed navbar
  // — not at an arbitrary viewport percentage — matching the pinned
  // sections' convention (measure the nav's real height, don't guess).
  const [navH, setNavH] = useState(0);
  useLayoutEffect(() => {
    const update = () => setNavH(document.querySelector("nav")?.getBoundingClientRect().height ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: [`start ${navH}px`, "start 30%"] });
  const imgY1 = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const imgY2 = useTransform(scrollYProgress, [0, 1], [10, -10]);

  return (
    <motion.section ref={sectionRef} className="py-8 sm:py-16 md:py-20 px-4 sm:px-6 bg-transparent overflow-hidden" {...sectionMotionProps}>
      <div className="w-full max-w-7xl mx-auto min-w-0">
        <motion.div className="text-center mb-4 sm:mb-8 md:mb-12" variants={revealVariant}>
          <h2 className="text-[22px] sm:text-[35px] md:text-[40px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-1.5 sm:mb-2 tracking-tight sm:tracking-[-1.6px]">
            Our Unified Solution
          </h2>
          <p className="text-[14px] sm:text-[24px] md:text-[27px] text-[#4a5565] font-['Poppins'] tracking-tight sm:tracking-[-1.08px]">
            Two products. One platform for all your energy needs.
          </p>
        </motion.div>

        <motion.div
          className="relative flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-10 lg:gap-16 justify-center items-start mb-6 sm:mb-8"
          {...staggerMotionProps}
        >
          {/* Static connecting line between the two cards */}
          <svg
            aria-hidden
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
          >
            <path d="M 22,16 C 40,8 60,32 78,26" fill="none" stroke="rgba(4,113,58,0.16)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Solar card — leads, sits higher */}
          <div style={tilt1.wrapperStyle} className="relative z-0 w-full md:flex-1 min-w-0">
            <motion.div
              variants={revealVariant}
              {...(reduceMotion ? {} : cardMotionProps)}
              style={tilt1.cardStyle}
              onMouseMove={tilt1.onMouseMove}
              onMouseLeave={tilt1.onMouseLeave}
              className="relative rounded-2xl sm:rounded-[20px] overflow-hidden w-full lg:w-141.75 h-55 sm:h-75 md:h-80 lg:h-85.5"
            >
              <motion.div className="absolute inset-[-6%]" style={reduceMotion ? undefined : { y: imgY1 }}>
                <Image
                  src="/solar-panels-house-roof.jpg"
                  alt="Solar Solutions"
                  fill
                  sizes="(min-width: 1024px) 567px, 100vw"
                  className="object-cover object-center"
                />
              </motion.div>
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-[rgba(204,204,204,0.3)] to-transparent rounded-2xl sm:rounded-[20px]" />
              <div className="absolute inset-0 p-2.5 sm:p-4 md:p-6 lg:p-7.5 flex flex-col justify-start text-left">
                <div className="flex flex-col gap-1.5 sm:gap-3 md:gap-4 lg:gap-4.75 pt-2 sm:pt-4 md:pt-6 lg:pt-6">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
                    <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
                      <circle cx="28" cy="28" r="12" fill="#FFA500" />
                      <path
                        d="M28 8V2M28 54V48M48 28H54M2 28H8M43 13L47 9M9 47L13 43M43 43L47 47M9 9L13 13"
                        stroke="#FFA500"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-1.75 md:gap-2 mt-4 sm:mt-0">
                    <h3 className="text-[16px] sm:text-[22px] md:text-[24px] lg:text-[27px] xl:text-[30px] font-bold text-black font-['Urbanist'] leading-tight md:leading-8 lg:leading-9 drop-shadow-lg">
                      Solar Solutions
                    </h3>
                    <p className="text-black text-[12px] sm:text-[15px] md:text-[16px] lg:text-[16.5px] xl:text-[17px] font-['Poppins'] leading-4 sm:leading-5 opacity-95 drop-shadow-md">
                      Total control. Zero worries.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Smart Home card — offset lower, asymmetric rather than a mirrored twin */}
          <div style={tilt2.wrapperStyle} className="relative z-0 w-full md:flex-1 min-w-0 md:mt-10">
            <motion.div
              variants={revealVariant}
              {...(reduceMotion ? {} : cardMotionProps)}
              style={tilt2.cardStyle}
              onMouseMove={tilt2.onMouseMove}
              onMouseLeave={tilt2.onMouseLeave}
              className="relative rounded-2xl sm:rounded-[20px] overflow-hidden w-full lg:w-141.75 h-55 sm:h-75 md:h-80 lg:h-85.5"
            >
              <motion.div className="absolute inset-[-6%]" style={reduceMotion ? undefined : { y: imgY2 }}>
                <Image
                  src={APP_IMAGES.digitalTablet}
                  alt="Smart Home Solutions"
                  fill
                  sizes="(min-width: 1024px) 567px, 100vw"
                  className="object-cover object-center"
                />
              </motion.div>
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-[rgba(204,204,204,0.75)] to-transparent rounded-2xl sm:rounded-[20px]" />
              <div className="absolute inset-0 p-2.5 sm:p-4 md:p-6 lg:p-7.5 flex flex-col justify-start text-left">
                <div className="flex flex-col gap-1.5 sm:gap-3 md:gap-4 lg:gap-4.75 pt-2 sm:pt-4 md:pt-6 lg:pt-6">
                  <Image src={APP_IMAGES.iconSmartHome} alt="" width={48} height={48} className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                  <div className="flex flex-col gap-1 sm:gap-1.75 md:gap-2 mt-4 sm:mt-0">
                    <h3 className="text-[16px] sm:text-[22px] md:text-[24px] lg:text-[26px] xl:text-[28px] font-bold text-black font-['Urbanist'] leading-tight md:leading-8 lg:leading-9 drop-shadow-lg">
                      Smart Home Solutions
                    </h3>
                    <p className="text-black text-[12px] sm:text-[15px] md:text-[16px] lg:text-[16.5px] xl:text-[17px] font-['Poppins'] leading-4 sm:leading-5 drop-shadow-md">
                      The future of living, powered by intelligence.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="text-center" variants={revealVariant}>
          <motion.a
            href="#solutions-section"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-4 min-h-11 border border-[rgba(74,85,101,0.75)] rounded-[10px] text-[#4a5565] hover:bg-gray-50 transition-colors text-[14px] sm:text-[19px] tracking-[-0.76px]"
            {...ctaMotionProps}
          >
            Know more
            <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  );
}
