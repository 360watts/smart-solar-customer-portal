"use client";

import { motion } from "framer-motion";
import { benefitsData } from "../data";
import { revealVariant, sectionMotionProps, staggerMotionProps, cardMotionProps, reduceMotion } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";

export function Why360wattsSection() {
  const tilt0 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilt1 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilt2 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilt3 = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  const tilts = [tilt0, tilt1, tilt2, tilt3];

  return (
    <motion.section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-transparent" {...sectionMotionProps}>
      <div className="w-full max-w-7xl mx-auto min-w-0">
        <motion.div className="text-center mb-12 sm:mb-16 md:mb-20" variants={revealVariant}>
          <h2 className="text-[32px] sm:text-[38px] md:text-[44px] lg:text-[48px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 md:mb-4 tracking-[-1.5px]">
            Why 360watts?
          </h2>
          <p className="text-[16px] sm:text-[18px] md:text-[20px] text-[#4a5565] font-['Poppins'] tracking-[-0.5px]">
            Tangible benefits for your home
          </p>
        </motion.div>

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12 min-w-0" {...staggerMotionProps}>
          {benefitsData.map((benefit, index) => {
            const t = tilts[index];
            return (
              <div key={index} style={t.wrapperStyle} className="min-w-0">
                <motion.div
                  variants={revealVariant}
                  {...(reduceMotion ? {} : cardMotionProps)}
                  style={t.cardStyle}
                  onMouseMove={t.onMouseMove}
                  onMouseLeave={t.onMouseLeave}
                  className="flex flex-col items-center text-center group min-w-0 h-full"
                >
              <div className="w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] md:w-[100px] md:h-[100px] bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] rounded-[16px] sm:rounded-[20px] flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-[0_4px_20px_rgba(0,166,62,0.15)] group-hover:shadow-[0_8px_30px_rgba(0,166,62,0.25)] transition-all duration-300">
                <img
                  src={benefit.icon}
                  alt=""
                  className="w-[38px] h-[38px] sm:w-[45px] sm:h-[45px] md:w-[50px] md:h-[50px]"
                />
              </div>
              <h3 className="text-[14px] sm:text-[17px] md:text-[20px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-2 sm:mb-3 leading-tight">
                {benefit.title}
              </h3>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] text-[#4a5565] leading-relaxed font-['Poppins']">
                {benefit.description}
              </p>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}
