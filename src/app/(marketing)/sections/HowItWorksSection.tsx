"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APP_IMAGES } from "../lib/imageRegistry";
import { processSteps } from "../data";
import { revealVariant, sectionMotionProps, staggerMotionProps, cardMotionProps, ctaMotionProps, reduceMotion } from "../lib/motion";

const COLUMN_TILT_DEG = 2.5;

export function HowItWorksSection() {
  const [activeCard, setActiveCard] = useState<"solar" | "smartHome" | null>(null);

  return (
    <motion.section className="py-8 sm:py-20 md:py-24 px-4 sm:px-6 relative overflow-hidden bg-transparent" {...sectionMotionProps}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00a63e] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3b82f6] rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10 min-w-0">
        <motion.div className="text-center mb-6 sm:mb-16 md:mb-20" variants={revealVariant}>
          <div className="inline-block px-3 sm:px-6 py-1 sm:py-2 bg-gradient-to-r from-[#dcfce7] to-[#ddefff] rounded-full mb-3 sm:mb-6">
            <span className="text-[11px] sm:text-[14px] md:text-[16px] font-semibold text-[#0a0a0a] font-['Urbanist']">
              Simple & Effective
            </span>
          </div>
          <h2 className="text-[18px] sm:text-[44px] md:text-[56px] font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-1.5px] mb-2 sm:mb-4 bg-gradient-to-r from-[#0a0a0a] to-[#4a5565] bg-clip-text text-transparent">
            How Does It Work?
          </h2>
          <p className="text-[10px] sm:text-[18px] md:text-[20px] text-[#4a5565] font-['Poppins'] max-w-2xl mx-auto">
            Simple steps to transform your home into a Smart Home, sustainable powerhouse
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 md:gap-8 lg:gap-12"
          {...staggerMotionProps}
          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        >
          <motion.div
            variants={revealVariant}
            {...(reduceMotion ? {} : cardMotionProps)}
            animate={{
              rotateY: !reduceMotion && activeCard === "solar" ? COLUMN_TILT_DEG : 0,
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className={`bg-white/80 backdrop-blur-sm rounded-[20px] sm:rounded-[28px] md:rounded-[32px] p-3 sm:p-7 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border-2 transition-shadow duration-500 cursor-pointer ${
              activeCard === "solar"
                ? "border-[#00a63e] shadow-[0_20px_60px_rgba(0,166,62,0.2)]"
                : "border-transparent"
            }`}
            onMouseEnter={() => setActiveCard("solar")}
            onMouseLeave={() => setActiveCard(null)}
          >
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-10">
              <div className="w-[36px] h-[36px] sm:w-[80px] sm:h-[80px] md:w-[90px] md:h-[90px] bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] rounded-[12px] sm:rounded-[20px] flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                <img
                  src={APP_IMAGES.sun21}
                  alt="Solar"
                  className="w-[20px] h-[20px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] object-contain"
                />
              </div>
              <div>
                <h3 className="text-[14px] sm:text-[29px] md:text-[32px] font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-0.8px]">
                  Solar
                </h3>
                <p className="text-[9px] sm:text-[13px] md:text-[14px] text-[#4a5565] font-['Poppins'] leading-4 sm:leading-5 opacity-95 drop-shadow-md">
                  Clean energy generation
                </p>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-[#dcfce7] to-[#bbf7d0] rounded-full mb-4 sm:mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00a63e] to-[#007a55] w-full transform origin-left transition-transform duration-1000 ease-out" />
            </div>

            <div className="space-y-3 sm:space-y-4">
              {processSteps.solar.map((step, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-r from-white to-[#f7fff9] rounded-[16px] sm:rounded-[20px] p-3 sm:p-5 border-2 border-transparent hover:border-[#dcfce7] hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="w-[22px] h-[22px] sm:w-[48px] sm:h-[48px] md:w-[50px] md:h-[50px] rounded-full flex items-center justify-center text-[10px] sm:text-[19px] md:text-[20px] font-bold font-['Urbanist'] flex-shrink-0 bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] text-[#0a0a0a] group-hover:scale-110 transition-all duration-300">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[12px] sm:text-[19px] md:text-[22px] text-[#0a0a0a] font-bold font-['Urbanist'] tracking-[-0.5px] leading-tight sm:leading-7">
                        {step.title}
                      </h4>
                      <div className="mt-2 sm:mt-3">
                        <p className="text-[10px] sm:text-[15px] md:text-[16px] text-[#4a5565] font-['Poppins'] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={revealVariant}
            {...(reduceMotion ? {} : cardMotionProps)}
            animate={{
              rotateY: !reduceMotion && activeCard === "smartHome" ? -COLUMN_TILT_DEG : 0,
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className={`bg-white/80 backdrop-blur-sm rounded-[20px] sm:rounded-[28px] md:rounded-[32px] p-3 sm:p-7 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border-2 transition-shadow duration-500 cursor-pointer ${
              activeCard === "smartHome"
                ? "border-[#3b82f6] shadow-[0_20px_60px_rgba(59,130,246,0.2)]"
                : "border-transparent"
            }`}
            onMouseEnter={() => setActiveCard("smartHome")}
            onMouseLeave={() => setActiveCard(null)}
          >
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-10">
              <div className="w-[36px] h-[36px] sm:w-[80px] sm:h-[80px] md:w-[90px] md:h-[90px] bg-gradient-to-br from-[#ddefff] to-[#bfdbfe] rounded-[12px] sm:rounded-[20px] flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                <img
                  src={APP_IMAGES.smartHouse1}
                  alt="Smart Home"
                  className="w-[20px] h-[20px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] object-contain"
                />
              </div>
              <div>
                <h3 className="text-[14px] sm:text-[29px] md:text-[32px] font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-0.8px]">
                  Smart Home
                </h3>
                <p className="text-[9px] sm:text-[13px] md:text-[14px] text-[#4a5565] font-['Poppins'] leading-4 sm:leading-5 drop-shadow-md">
                  Intelligent automation
                </p>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-[#ddefff] to-[#bfdbfe] rounded-full mb-4 sm:mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] w-full transform origin-left transition-transform duration-1000 ease-out" />
            </div>

            <div className="space-y-3 sm:space-y-4">
              {processSteps.smartHome.map((step, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-r from-white to-[#f7fff9] rounded-[16px] sm:rounded-[20px] p-3 sm:p-5 border-2 border-transparent hover:border-[#ddefff] hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="w-[22px] h-[22px] sm:w-[48px] sm:h-[48px] md:w-[50px] md:h-[50px] rounded-full flex items-center justify-center text-[10px] sm:text-[19px] md:text-[20px] font-bold font-['Urbanist'] flex-shrink-0 bg-gradient-to-br from-[#ddefff] to-[#bfdbfe] text-[#0a0a0a] group-hover:scale-110 transition-all duration-300">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[12px] sm:text-[19px] md:text-[22px] text-[#0a0a0a] font-bold font-['Urbanist'] tracking-[-0.5px] leading-tight sm:leading-7">
                        {step.title}
                      </h4>
                      <div className="mt-2 sm:mt-3">
                        <p className="text-[10px] sm:text-[15px] md:text-[16px] text-[#4a5565] font-['Poppins'] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="text-center mt-6 sm:mt-12 md:mt-16" variants={revealVariant}>
          <motion.a
            href="#solutions-section"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-4 min-h-[44px] border border-[rgba(74,85,101,0.75)] rounded-[8px] sm:rounded-[10px] text-[#4a5565] hover:bg-gray-50 transition-colors text-xs sm:text-[19px] tracking-[-0.76px]"
            {...ctaMotionProps}
          >
            Explore Full Process
            <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5" />
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  );
}
