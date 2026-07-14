"use client";

import { motion } from "framer-motion";
import { contactMethods } from "../data";
import { revealVariant, sectionMotionProps, staggerMotionProps, reduceMotion } from "../lib/motion";
import { InquiryForm } from "../components/InquiryForm";

/** Info cards slide in from the map's edge rather than the generic fade-up — a small,
 *  intentional variant (not a new GSAP effect) for the one spot on this page that's a "you've arrived" moment. */
const slideInVariant = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function ContactSection() {
  return (
    <motion.section id="contact-section" className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 bg-[#f7fff9] scroll-mt-20" {...sectionMotionProps}>
      <div className="w-full max-w-5xl mx-auto min-w-0">
        <motion.div className="text-center mb-8 sm:mb-10 md:mb-12" variants={revealVariant}>
          <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[33px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-2 sm:mb-3 leading-tight">Let&apos;s build your smart solar home.</h2>
          <p className="text-[14px] sm:text-[15px] md:text-[17px] lg:text-[20px] text-[#4a5565] leading-relaxed">Get in touch with us for a free consultation and personalized energy assessment</p>
        </motion.div>

        {/* Contact methods */}
        <motion.div className="flex flex-row sm:flex-row justify-center flex-wrap gap-4 sm:gap-6 md:gap-8 lg:gap-33.5 mb-8 sm:mb-10 md:mb-12" {...staggerMotionProps}>
          {contactMethods.map((method, index) => (
            <motion.a
              key={index}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={revealVariant}
              className="flex flex-col items-center w-30 sm:w-37.5 md:w-45 lg:w-55.5 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-[#dcfce7] rounded-lg sm:rounded-[10px] flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow">
                <img src={method.icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              </div>
              <h3 className="text-[12px] sm:text-[13px] md:text-[15px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-0.5 text-center font-semibold">{method.title}</h3>
              <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[19px] text-[#4a5565] tracking-[-0.5px] sm:tracking-[-0.76px] text-center">{method.value}</p>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[16px] text-[rgba(74,85,101,0.6)] tracking-[-0.4px] sm:tracking-[-0.64px] text-center">{method.note}</p>
            </motion.a>
          ))}
        </motion.div>

        {/* Contact form */}
        <motion.div className="border border-[rgba(0,0,0,0.3)] rounded-[20px] sm:rounded-[25px] md:rounded-[30px] p-4 sm:p-6 md:p-8 lg:p-12 shadow-[0px_3px_4px_0px_rgba(0,0,0,0.45)] max-w-234.75 mx-auto" variants={revealVariant}>
          <InquiryForm
            theme="green"
            gridFields={[
              { type: "text", name: "name", label: "Name *", placeholder: "Your full name", required: true, autoComplete: "name" },
              { type: "email", name: "email", label: "Email", placeholder: "your@email.com", autoComplete: "email", pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$", title: "Please enter a valid email address" },
              { type: "tel", name: "phone", label: "Phone *", placeholder: "+91 XXXXX XXXXX", required: true, autoComplete: "tel", inputMode: "tel", pattern: "[0-9]{10}", title: "Please enter a valid 10-digit phone number" },
              { type: "text", name: "city", label: "City *", placeholder: "Your city", required: true, autoComplete: "address-level2" },
            ]}
            selectField={{
              type: "select",
              name: "interest",
              label: "Interested in *",
              options: [
                { value: "solar", label: "Solar Only" },
                { value: "smart-home", label: "Smart Home Only" },
                { value: "both", label: "Both Solar & Smart Home" },
              ],
            }}
            messageField={{ name: "message", label: "Message (Optional)", placeholder: "Tell us about your energy needs..." }}
            submitLabel="Send Message"
            submittingLabel="Sending..."
            endpoint="https://formsubmit.co/hello@360watts.com"
            buildSubject={(data) => `360Watts — New website inquiry from ${data.name}`}
            whatsappPhone="919087610051"
            buildWhatsAppMessage={(data) =>
              `*New inquiry via 360watts.com*\n\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Phone:* ${data.phone}\n*City:* ${data.city}\n*Interest:* ${data.interest}\n` +
              (data.message ? `*Message:* ${data.message}` : "")
            }
            success={{
              heading: "Thank You!",
              body1: "Your message has been sent successfully to our team.",
              body2: "We'll get back to you shortly. For immediate assistance, connect with us on WhatsApp:",
              whatsappLabel: "Send via WhatsApp Too",
              resetLabel: "Send another message",
            }}
          />
        </motion.div>

        {/* Partnership Form */}
        <motion.div id="partnership" className="mt-12 sm:mt-16 md:mt-20" {...sectionMotionProps}>
          <motion.div className="text-center mb-8 sm:mb-10 md:mb-12" variants={revealVariant}>
            <h2 className="text-[22px] sm:text-[25px] md:text-[27px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 sm:mb-4 leading-6">Partnership Inquiry</h2>
            <p className="text-[15px] sm:text-[17px] md:text-[19px] text-[#4a5565] tracking-[-0.76px]">
              Interested in partnering with 360watts?<br />
              Whether you&apos;re a supplier, installer, or technology partner, let&apos;s work together.
            </p>
          </motion.div>

          <motion.div className="border border-[rgba(0,0,0,0.3)] rounded-[20px] sm:rounded-[25px] md:rounded-[30px] p-5 sm:p-8 md:p-12 shadow-[0px_3px_4px_0px_rgba(0,0,0,0.45)] bg-white max-w-234.75 mx-auto" variants={revealVariant}>
            <InquiryForm
              theme="orange"
              gridFields={[
                { type: "text", name: "name", label: "Name *", placeholder: "Your full name", required: true, autoComplete: "name" },
                { type: "email", name: "email", label: "Email", placeholder: "your@email.com", autoComplete: "email", pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$", title: "Please enter a valid email address" },
                { type: "tel", name: "phone", label: "Phone *", placeholder: "+91 XXXXX XXXXX", required: true, autoComplete: "tel", inputMode: "tel", pattern: "[0-9]{10}", title: "Please enter a valid 10-digit phone number" },
                { type: "text", name: "company", label: "Company/Organization *", placeholder: "Company name", required: true, autoComplete: "organization" },
              ]}
              selectField={{
                type: "select",
                name: "partnerType",
                label: "Partnership Type *",
                options: ["Supplier", "Installer", "Technology Partner", "Distributor", "Investment Partner", "Other"].map((v) => ({ value: v, label: v })),
              }}
              messageField={{ name: "message", label: "Message (Optional)", placeholder: "Tell us about your partnership proposal...", multiline: true }}
              submitLabel="Submit Partnership Inquiry"
              submittingLabel="Sending..."
              endpoint="https://formsubmit.co/hello@360watts.com"
              buildSubject={(data) => `360Watts — New partnership inquiry from ${data.company}`}
              whatsappPhone="919087610051"
              buildWhatsAppMessage={(data) =>
                `*New partnership inquiry via 360watts.com*\n\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Phone:* ${data.phone}\n*Company:* ${data.company}\n*Partner Type:* ${data.partnerType}\n` +
                (data.message ? `*Message:* ${data.message}` : "")
              }
              success={{
                heading: "Thank You!",
                body1: "Your partnership inquiry has been sent successfully.",
                body2: "Our partnership team will review your request and get back to you shortly. For immediate discussion, reach us on WhatsApp:",
                whatsappLabel: "Connect via WhatsApp",
                resetLabel: "Submit another inquiry",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Location Information Section */}
        <motion.div className="mt-12 sm:mt-16 md:mt-20 mb-10 sm:mb-12 md:mb-16 bg-linear-to-br from-[#f0fdf4] to-[#f7fff9] rounded-[20px] sm:rounded-[26px] md:rounded-4xl p-5 sm:p-7 md:p-10 border border-[#dcfce7] shadow-[0_8px_30px_rgba(4, 113, 58,0.08)]" {...sectionMotionProps}>
          <motion.div className="text-center mb-6 sm:mb-8 md:mb-10" variants={revealVariant}>
            <h3 className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[40px] font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-1px] mb-2 sm:mb-3">Find Us</h3>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#4a5565] font-['Poppins']">Visit our office in Coimbatore, Tamil Nadu</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-5 gap-5 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10 min-w-0" {...staggerMotionProps}>
            <motion.div className="md:col-span-3 rounded-2xl sm:rounded-[20px] md:rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] h-70 sm:h-85 md:h-100 min-w-0" variants={revealVariant}>
              <iframe
                title="360watts office location map (Coimbatore)"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                loading="lazy"
                src="https://maps.google.com/maps?q=GRG+INCUBATION+CENTER,+Coimbatore,+Tamil+Nadu&output=embed"
                allowFullScreen
                aria-hidden="false"
                tabIndex={0}
              />
            </motion.div>

            <motion.div className="md:col-span-2 space-y-3 sm:space-y-4 md:space-y-5" {...staggerMotionProps}>
              <motion.div variants={reduceMotion ? revealVariant : slideInVariant} className="bg-white rounded-[14px] sm:rounded-[18px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-[#e5f3e9] hover:shadow-[0_8px_25px_rgba(4, 113, 58,0.12)] transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-linear-to-br from-[#dcfce7] to-[#bbf7d0] rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#04713a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-3.314 0-6 2.239-6 5v1a1 1 0 001 1h10a1 1 0 001-1v-1c0-2.761-2.686-5-6-5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-1">Address</h4>
                    <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#4a5565] font-['Poppins'] leading-relaxed">GRG INCUBATION CENTER<br />Coimbatore, Tamil Nadu</p>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={reduceMotion ? revealVariant : slideInVariant} className="bg-white rounded-[14px] sm:rounded-[18px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-[#e5f3e9] hover:shadow-[0_8px_25px_rgba(4, 113, 58,0.12)] transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-linear-to-br from-[#ddefff] to-[#bfdbfe] rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-1">Email</h4>
                    <a href="mailto:hello@360watts.com" className="text-[12px] sm:text-[13px] md:text-[14px] text-[#04713a] font-['Poppins'] hover:text-[#015c40] transition-colors underline">hello@360watts.com</a>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={reduceMotion ? revealVariant : slideInVariant} className="bg-white rounded-[14px] sm:rounded-[18px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-[#e5f3e9] hover:shadow-[0_8px_25px_rgba(4, 113, 58,0.12)] transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-linear-to-br from-[#fef3c7] to-[#fce7f3] rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-1">Hours</h4>
                    <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#4a5565] font-['Poppins']">Mon-Sat: 9 AM - 6 PM IST</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="https://www.google.com/maps/search/?api=1&query=11.037530,77.029499"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-11 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-linear-to-r from-[#04713a] to-[#015c40] text-white font-semibold rounded-xl sm:rounded-[14px] text-[14px] sm:text-[15px] md:text-base hover:shadow-[0_8px_30px_rgba(4, 113, 58,0.3)] transition-all hover:scale-105 shadow-[0_4px_15px_rgba(4, 113, 58,0.2)] font-['Poppins']"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l-7-7m0 0l7-7m-7 7h16" />
              </svg>
              Get Directions
            </a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
