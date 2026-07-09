"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APP_IMAGES } from "../lib/imageRegistry";
import { revealVariant, sectionMotionProps, staggerMotionProps, cardMotionProps, ctaMotionProps, reduceMotion } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";

export function UnifiedSolutionSection() {
  const tilt1 = use3DTilt({ maxDeg: 6, disabled: reduceMotion });
  const tilt2 = use3DTilt({ maxDeg: 6, disabled: reduceMotion });

  // Two separate cards converge into "one platform" as the section scrolls into view —
  // solar and smart-home drift together like the story's problem resolving into a system.
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 30%"],
  });
  const convergeLeft = useTransform(scrollYProgress, [0, 1], [-36, 0]);
  const convergeRight = useTransform(scrollYProgress, [0, 1], [36, 0]);
  const plusScale = useTransform(scrollYProgress, [0.6, 1], [0.4, 1]);
  const plusOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

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

        <motion.div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-28.25 justify-center items-stretch mb-6 sm:mb-8" {...staggerMotionProps}>
          <motion.div
            style={reduceMotion ? undefined : { x: convergeLeft }}
            className="w-full md:flex-1 min-w-0"
          >
          <div style={tilt1.wrapperStyle} className="w-full min-w-0">
            <motion.div
              variants={revealVariant}
              {...(reduceMotion ? {} : cardMotionProps)}
              style={tilt1.cardStyle}
              onMouseMove={tilt1.onMouseMove}
              onMouseLeave={tilt1.onMouseLeave}
              className="relative rounded-2xl sm:rounded-[20px] overflow-hidden w-full lg:w-141.75 h-55 sm:h-75 md:h-80 lg:h-85.5"
            >
            <picture>
              <source type="image/webp" srcSet="/solar-panels-house-roof.webp" />
              <img
                src="/solar-panels-house-roof.jpg"
                alt="Solar Solutions"
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            </picture>
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
          </motion.div>

          <motion.div
            style={reduceMotion ? undefined : { scale: plusScale, opacity: plusOpacity }}
            className="hidden md:flex items-center justify-center w-8 md:w-12 h-8 md:h-12 text-[#4a5565] text-3xl md:text-5xl font-light mt-20 md:mt-24"
          >
            +
          </motion.div>

          <motion.div
            style={reduceMotion ? undefined : { x: convergeRight }}
            className="w-full md:flex-1 min-w-0"
          >
          <div style={tilt2.wrapperStyle} className="w-full min-w-0">
            <motion.div
              variants={revealVariant}
              {...(reduceMotion ? {} : cardMotionProps)}
              style={tilt2.cardStyle}
              onMouseMove={tilt2.onMouseMove}
              onMouseLeave={tilt2.onMouseLeave}
              className="relative rounded-2xl sm:rounded-[20px] overflow-hidden w-full lg:w-141.75 h-55 sm:h-75 md:h-80 lg:h-85.5"
            >
            <img
              src={APP_IMAGES.digitalTablet}
              alt="Smart Home Solutions"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-[rgba(204,204,204,0.75)] to-transparent rounded-2xl sm:rounded-[20px]" />
            <div className="absolute inset-0 p-2.5 sm:p-4 md:p-6 lg:p-7.5 flex flex-col justify-start text-left">
              <div className="flex flex-col gap-1.5 sm:gap-3 md:gap-4 lg:gap-4.75 pt-2 sm:pt-4 md:pt-6 lg:pt-6">
                <img
                  src={APP_IMAGES.iconSmartHome}
                  alt=""
                  className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12"
                />
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
