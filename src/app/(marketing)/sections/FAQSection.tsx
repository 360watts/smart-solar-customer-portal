"use client";

import { motion } from "framer-motion";
import { faqSections } from "../data";
import { FAQSectionComponent } from "../components/FAQSection";
import { sectionMotionProps, staggerMotionProps, revealVariant, reduceMotion } from "../lib/motion";

export function FAQSection() {
  return (
    <motion.section
      id="faq-section"
      className="scroll-mt-20 bg-[#f7fff9] text-[#0a0a0a]"
      {...sectionMotionProps}
    >
      <div className="relative isolate overflow-hidden rounded-[50px] sm:rounded-[60px] md:rounded-[80px] px-4 sm:px-6 w-full min-w-0">
        {/* Slow ambient drift — a loop, not scroll-linked, so the panel doesn't feel inert while reading */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-[50px] sm:rounded-[60px] md:rounded-[80px]"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(4,113,58,0.09), rgba(1,92,64,0.09), rgba(4,113,58,0.09))",
            backgroundSize: "200% 100%",
          }}
          animate={reduceMotion ? undefined : { backgroundPosition: ["0% 50%", "100% 50%"] }}
          transition={reduceMotion ? undefined : { duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
        <header className="relative h-70 sm:h-80 md:h-95 flex items-center justify-center px-0">
          <motion.div className="w-full max-w-240 mx-auto min-w-0 text-center space-y-2" variants={revealVariant}>
            <h2 className="text-[26px] sm:text-[30px] md:text-[36px] font-bold tracking-[-0.04em] font-['Urbanist'] text-[#0a0a0a]">
              Frequently Asked Questions
            </h2>
            <p className="text-[14px] sm:text-[17px] md:text-[20px] text-[#4a5565] font-['Poppins'] leading-snug">
              Find answers to common questions about 360watts solar and smart home solutions
            </p>
          </motion.div>
        </header>
      </div>

      <main className="px-6 pb-20 mt-10 md:mt-14">
        <motion.div className="w-full max-w-255 mx-auto min-w-0 space-y-14" {...staggerMotionProps}>
          {faqSections.map((section) => (
            <motion.div key={section.id} variants={revealVariant}>
              <FAQSectionComponent section={section} />
            </motion.div>
          ))}
        </motion.div>
      </main>

      <motion.section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6" {...sectionMotionProps}>
        <motion.div className="w-full max-w-181 mx-auto min-w-0 text-center space-y-2 sm:space-y-3" variants={revealVariant}>
          <h3 className="text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] font-bold font-['Urbanist'] text-[#0a0a0a] mb-3">
            Still have questions?
          </h3>
          <p className="text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] text-[#4a5565] font-['Poppins']">
            Our team is here to help. Reach out anytime.
          </p>
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4">
            <a
              href="#contact-section"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-linear-to-r from-[#04713a] to-[#015c40] text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-[14px] sm:text-[15px] md:text-[16px] font-['Poppins'] shadow-[0_4px_12px_rgba(4, 113, 58,0.25)] hover:opacity-90 transition min-w-40 sm:min-w-45 md:min-w-55"
            >
              Chat with Us
            </a>
            <a
              href="#contact-section"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center rounded-[10px] border border-[rgba(0,0,0,0.5)] px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-[14px] sm:text-[15px] md:text-[16px] font-['Poppins'] text-[#0a0a0a] hover:bg-black/5 transition min-w-40 sm:min-w-45 md:min-w-55"
            >
              Call Us
            </a>
          </div>
        </motion.div>
      </motion.section>
    </motion.section>
  );
}
