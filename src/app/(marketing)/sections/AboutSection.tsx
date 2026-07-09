"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APP_IMAGES } from "../lib/imageRegistry";
import { storySteps, teamMembers } from "../data";
import { revealVariant, sectionMotionProps, staggerMotionProps, storyStepVariants, reduceMotion } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const tilt = use3DTilt({ maxDeg: 5, disabled: reduceMotion });
  return (
    <div style={tilt.wrapperStyle} className={className}>
      <motion.div
        style={tilt.cardStyle}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function AboutSection() {
  return (
    <motion.section id="about-section" className="scroll-mt-20 bg-[#f7fff9] min-h-screen text-[#0a0a0a]" {...sectionMotionProps}>
      {/* Hero */}
      <motion.section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-100 sm:min-h-112.5 md:min-h-130 w-full overflow-hidden" {...sectionMotionProps}>
        <img
          src={APP_IMAGES.aboutHero}
          alt="Solar hero"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/25 to-black/50" />
        <div className="relative z-10 w-full max-w-5xl mx-auto min-w-0 px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 lg:pt-36 flex items-start">
          <motion.div className="text-white space-y-2 sm:space-y-3 max-w-xl" variants={revealVariant}>
            <p className="text-sm sm:text-base md:text-lg font-['Poppins']">360watts.com | solar + smart home solutions</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-['Urbanist'] leading-tight">
              We're on a mission.
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-['Poppins'] text-white">
              To revolutionize how homes consume and manage energy.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Our Story */}
      <motion.section className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 bg-[#f7fff9]" {...sectionMotionProps}>
        <div className="w-full max-w-6xl mx-auto min-w-0">
          <motion.div className="mb-8 sm:mb-10 md:mb-12" variants={revealVariant}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Urbanist'] mb-2">Our Story.</h2>
            <p className="text-base sm:text-lg text-[#4a5565] font-['Poppins']">It all started with a question...</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-linear-to-b from-[#3fa66b] via-[#3fa66b]/95 to-transparent z-0 hidden md:block" />

            <div className="space-y-10 sm:space-y-12 md:space-y-16 relative z-10">
              {storySteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={step.align === "left" ? "hiddenLeft" : "hiddenRight"}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={storyStepVariants}
                  className={`flex flex-col ${step.align === "left" ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-6 sm:gap-8 md:gap-12 relative`}
                >
                  <div className="w-full md:w-1/2">
                    <TiltCard>
                      <div className="shadow-sm border border-[#e5f3e9] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 bg-transparent relative z-10">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-['Urbanist'] mb-2 sm:mb-3 leading-snug">{step.title}</h3>
                        {step.body && <p className="text-[#4a5565] font-['Poppins'] text-sm sm:text-base md:text-lg leading-relaxed">{step.body}</p>}
                      </div>
                    </TiltCard>
                  </div>
                  <div className="w-full md:w-1/2 flex justify-center relative z-10">
                    <img
                      src={step.image}
                      alt="Story visual"
                      className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-64 sm:h-80 md:h-96 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div className="mt-12 sm:mt-14 md:mt-16 text-center space-y-3 sm:space-y-4" variants={revealVariant}>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-['Urbanist']">The sun started it.</h3>
            <p className="text-base sm:text-lg text-[#4a5565] font-['Poppins']">We are just making it smarter.</p>
            <div className="flex flex-col items-center gap-2 sm:gap-3 pt-6 sm:pt-8">
              <img src={APP_IMAGES.aboutLogo} alt="360watts logo" className="w-24 sm:w-24 md:w-28 h-auto ml-4" loading="lazy" decoding="async" />
              <p className="text-[#244d65] font-['Figtree'] text-sm sm:text-base">Drive what's next.</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Team */}
      <motion.section className="py-1 sm:py-14 md:py-1 px-4 sm:px-6 bg-[#f7fff9]" {...sectionMotionProps}>
        <div className="w-full max-w-5xl mx-auto min-w-0 text-center">
          <motion.div className="mb-8 sm:mb-10" variants={revealVariant}>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-['Urbanist']">Meet Our Team</h3>
            <p className="text-base sm:text-lg text-[#4a5565] font-['Poppins']">The faces behind the innovation</p>
          </motion.div>

          <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 md:gap-8 justify-items-center" {...staggerMotionProps}>
            {teamMembers.map((member, idx) => (
              <TiltCard key={idx} className="flex flex-col items-center">
                <motion.div variants={revealVariant} className="flex flex-col items-center text-center gap-2 sm:gap-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-[#e8f5ed] flex items-center justify-center">
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).src = APP_IMAGES.aboutAvatar; }} />
                  </div>
                  <p className="text-[11px] sm:text-[13px] md:text-base font-semibold font-['Urbanist'] leading-tight">{member.name}</p>
                  <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] text-[#4a5565] font-['Poppins'] leading-snug">{member.role}</p>
                </motion.div>
              </TiltCard>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Partner CTA */}
      <motion.section className="py-10 sm:py-12 px-4 sm:px-6" {...sectionMotionProps}>
        <motion.div className="w-full max-w-4xl mx-auto min-w-0 border-2 border-[#04713a] rounded-2xl sm:rounded-[20px] bg-white shadow-sm p-6 sm:p-8 md:p-10 text-center" variants={revealVariant}>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-['Urbanist'] mb-2 sm:mb-3">Partner with Us</h3>
          <p className="text-base sm:text-lg text-[#4a5565] font-['Poppins'] mb-4 sm:mb-6">
            Join us in revolutionizing home energy. Whether you're a supplier, installer, or technology partner, let's work together.
          </p>
          <a
            href="#partnership"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("partnership")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-linear-to-r from-[#04713a] to-[#015c40] text-white font-semibold hover:opacity-90 transition"
          >
            Get in Touch <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </motion.section>
    </motion.section>
  );
}
