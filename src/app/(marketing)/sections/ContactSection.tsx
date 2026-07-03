"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, CheckCircle } from "lucide-react";
import { contactMethods } from "../data";
import { revealVariant, sectionMotionProps, staggerMotionProps } from "../lib/motion";

export function ContactSection() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", city: "", interest: "solar", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [partnershipData, setPartnershipData] = useState({ name: "", email: "", phone: "", company: "", partnerType: "Supplier", message: "" });
  const [isPartnershipSubmitting, setIsPartnershipSubmitting] = useState(false);
  const [isPartnershipSubmitted, setIsPartnershipSubmitted] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const createMessage = () =>
    `*Website Customer Contact Form Submission*\n\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Phone:* ${formData.phone}\n*City:* ${formData.city}\n*Interest:* ${formData.interest}\n` + (formData.message ? `*Message:* ${formData.message}` : "");
  const sendViaWhatsApp = () => {
    window.open(`https://wa.me/919087610051?text=${encodeURIComponent(createMessage())}`, "_blank");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("https://formsubmit.co/hello@360watts.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: formData.name, email: formData.email, phone: formData.phone, city: formData.city,
          interest: formData.interest, message: formData.message || "No message provided",
          _subject: `Website Customer Contact Form Submission from ${formData.name}`, _captcha: "false", _template: "table",
        }),
      });
      if (response.ok) { setIsSubmitting(false); setIsSubmitted(true); } else { throw new Error("Failed"); }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handlePartnershipChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setPartnershipData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const createPartnershipMessage = () =>
    `*Website Partnership Inquiry*\n\n*Name:* ${partnershipData.name}\n*Email:* ${partnershipData.email}\n*Phone:* ${partnershipData.phone}\n*Company:* ${partnershipData.company}\n*Partner Type:* ${partnershipData.partnerType}\n` + (partnershipData.message ? `*Message:* ${partnershipData.message}` : "");
  const sendPartnershipViaWhatsApp = () => {
    window.open(`https://wa.me/919087610051?text=${encodeURIComponent(createPartnershipMessage())}`, "_blank");
  };
  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPartnershipSubmitting(true);
    try {
      const response = await fetch("https://formsubmit.co/hello@360watts.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: partnershipData.name, email: partnershipData.email, phone: partnershipData.phone,
          company: partnershipData.company, partnerType: partnershipData.partnerType, message: partnershipData.message || "No message provided",
          _subject: `Website Partnership Inquiry from ${partnershipData.name} - ${partnershipData.company}`, _captcha: "false", _template: "table",
        }),
      });
      if (response.ok) { setIsPartnershipSubmitting(false); setIsPartnershipSubmitted(true); } else { throw new Error("Failed"); }
    } catch (err) {
      console.error(err);
      setIsPartnershipSubmitting(false);
      setIsPartnershipSubmitted(true);
    }
  };

  return (
    <motion.section id="contact-section" className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 bg-white scroll-mt-20" {...sectionMotionProps}>
      <div className="w-full max-w-5xl mx-auto min-w-0">
        <motion.div className="text-center mb-8 sm:mb-10 md:mb-12" variants={revealVariant}>
          <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[33px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-2 sm:mb-3 leading-tight">Let's build your smart solar home.</h2>
          <p className="text-[14px] sm:text-[15px] md:text-[17px] lg:text-[20px] text-[#4a5565] leading-relaxed">Get in touch with us for a free consultation and personalized energy assessment</p>
        </motion.div>

        {/* Contact methods */}
        <motion.div className="flex flex-row sm:flex-row justify-center flex-wrap gap-4 sm:gap-6 md:gap-8 lg:gap-[134px] mb-8 sm:mb-10 md:mb-12" {...staggerMotionProps}>
          {contactMethods.map((method, index) => (
            <motion.a 
              key={index}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={revealVariant}
              className="flex flex-col items-center w-[120px] sm:w-[150px] md:w-[180px] lg:w-[222px] group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-[#dcfce7] rounded-[8px] sm:rounded-[10px] flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow">
                <img src={method.icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              </div>
              <h3 className="text-[12px] sm:text-[13px] md:text-[15px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-0.5 text-center font-semibold">{method.title}</h3>
              <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[19px] text-[#4a5565] tracking-[-0.5px] sm:tracking-[-0.76px] text-center">{method.value}</p>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[16px] text-[rgba(74,85,101,0.6)] tracking-[-0.4px] sm:tracking-[-0.64px] text-center">{method.note}</p>
            </motion.a>
          ))}
        </motion.div>
        
        {/* Contact form */}
        <motion.div className="border border-[rgba(0,0,0,0.3)] rounded-[20px] sm:rounded-[25px] md:rounded-[30px] p-4 sm:p-6 md:p-8 lg:p-12 shadow-[0px_3px_4px_0px_rgba(0,0,0,0.45)] max-w-[939px] mx-auto" variants={revealVariant}>
          {isSubmitted ? (
            <div className="text-center" aria-live="polite">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-[#017c54]" />
              </div>
              <h3 className="text-[28px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-4">Thank You!</h3>
              <p className="text-[17px] text-[#4a5565] mb-2">Your message has been sent successfully to our team.</p>
              <p className="text-[15px] text-[#4a5565] mb-8">We'll get back to you shortly. For immediate assistance, connect with us on WhatsApp:</p>

              <div className="space-y-4 max-w-2xl mx-auto mb-8">
                <button
                  onClick={sendViaWhatsApp}
                  className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send via WhatsApp Too
                </button>
              </div>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: "", email: "", phone: "", city: "", interest: "solar", message: "" });
                }}
                className="text-[#017c54] font-medium hover:underline font-['Poppins']"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 md:gap-y-6 lg:gap-y-[60px] gap-x-3 sm:gap-x-6 md:gap-x-8 lg:gap-x-[200px]">
                <div>
                  <label htmlFor="contact-name" className="block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1">Name *</label>
                  <input 
                    type="text" 
                    id="contact-name"
                    name="name" 
                    placeholder="Your full name"
                    value={formData.name} 
                    onChange={handleFormChange} 
                    required
                    autoComplete="name"
                    className="w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#017c54] bg-transparent" 
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1">Email</label>
                  <input 
                    type="email" 
                    id="contact-email"
                    name="email" 
                    placeholder="your@email.com"
                    value={formData.email} 
                    onChange={handleFormChange} 
                    autoComplete="email"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Please enter a valid email address"
                    className="w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#017c54] bg-transparent" 
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1">Phone *</label>
                  <input 
                    type="tel" 
                    id="contact-phone"
                    name="phone" 
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone} 
                    onChange={handleFormChange} 
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit phone number"
                    className="w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#017c54] bg-transparent" 
                  />
                </div>
                <div>
                  <label htmlFor="contact-city" className="block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1">City *</label>
                  <input 
                    type="text" 
                    id="contact-city"
                    name="city" 
                    placeholder="Your city"
                    value={formData.city} 
                    onChange={handleFormChange} 
                    required
                    autoComplete="address-level2"
                    className="w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#017c54] bg-transparent" 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-interest" className="block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1">Interested in *</label>
                <div className="relative">
                  <select 
                    id="contact-interest"
                    name="interest" 
                    value={formData.interest} 
                    onChange={handleFormChange} 
                    required
                    className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-[8px] sm:rounded-[10px] border border-[rgba(0,0,0,0.4)] appearance-none bg-white text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px]"
                  >
                    <option value="solar">Solar Only</option>
                    <option value="smart-home">Smart Home Only</option>
                    <option value="both">Both Solar &amp; Smart Home</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-[#0a0a0a]/40" />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] text-[#0a0a0a] tracking-[-0.5px] sm:tracking-[-0.76px] mb-1">Message (Optional)</label>
                <input 
                  type="text" 
                  id="contact-message"
                  name="message" 
                  placeholder="Tell us about your energy needs..."
                  value={formData.message} 
                  onChange={handleFormChange} 
                  autoComplete="off"
                  className="w-full text-[#4a5565] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] tracking-[-0.5px] sm:tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#017c54] bg-transparent" 
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 sm:py-3 md:py-3.5 lg:py-4 bg-gradient-to-r from-[#00a63e] to-[#007a55] text-white font-medium rounded-[8px] sm:rounded-[10px] text-[13px] sm:text-[14px] md:text-[16px] lg:text-[19px] hover:opacity-90 transition-opacity disabled:opacity-70 font-['Poppins']"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </motion.div>

        {/* Partnership Form */}
        <motion.div id="partnership" className="mt-12 sm:mt-16 md:mt-20" {...sectionMotionProps}>
          <motion.div className="text-center mb-8 sm:mb-10 md:mb-12" variants={revealVariant}>
            <h2 className="text-[22px] sm:text-[25px] md:text-[27px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 sm:mb-4 leading-6">Partnership Inquiry</h2>
            <p className="text-[15px] sm:text-[17px] md:text-[19px] text-[#4a5565] tracking-[-0.76px]">
              Interested in partnering with 360watts?<br />
              Whether you're a supplier, installer, or technology partner, let's work together.
            </p>
          </motion.div>

          <motion.div className="border border-[rgba(0,0,0,0.3)] rounded-[20px] sm:rounded-[25px] md:rounded-[30px] p-5 sm:p-8 md:p-12 shadow-[0px_3px_4px_0px_rgba(0,0,0,0.45)] bg-white max-w-[939px] mx-auto" variants={revealVariant}>
            {isPartnershipSubmitted ? (
              <div className="text-center" aria-live="polite">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-[#ff6900]" />
                </div>
                <h3 className="text-[28px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-4">Thank You!</h3>
                <p className="text-[17px] text-[#4a5565] mb-2">Your partnership inquiry has been sent successfully.</p>
                <p className="text-[15px] text-[#4a5565] mb-8">Our partnership team will review your request and get back to you shortly. For immediate discussion, reach us on WhatsApp:</p>

                <div className="space-y-4 max-w-2xl mx-auto mb-8">
                  <button
                    onClick={sendPartnershipViaWhatsApp}
                    className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Connect via WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsPartnershipSubmitted(false);
                    setPartnershipData({ name: "", email: "", phone: "", company: "", partnerType: "Supplier", message: "" });
                  }}
                  className="text-[#ff6900] font-medium hover:underline font-['Poppins']"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handlePartnershipSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 sm:gap-y-8 md:gap-y-[60px] gap-x-4 sm:gap-x-12 md:gap-x-[200px]">
                  <div>
                    <label htmlFor="partner-name" className="block text-[15px] sm:text-[17px] md:text-[19px] text-[#0a0a0a] tracking-[-0.76px] mb-1">Name *</label>
                    <input 
                      type="text" 
                      id="partner-name"
                      name="name" 
                      placeholder="Your full name"
                      value={partnershipData.name} 
                      onChange={handlePartnershipChange} 
                      required
                      autoComplete="name"
                      className="w-full text-[#4a5565] text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#ff6900] bg-transparent" 
                    />
                  </div>
                  <div>
                    <label htmlFor="partner-email" className="block text-[15px] sm:text-[17px] md:text-[19px] text-[#0a0a0a] tracking-[-0.76px] mb-1">Email</label>
                    <input 
                      type="email" 
                      id="partner-email"
                      name="email" 
                      placeholder="your@email.com"
                      value={partnershipData.email} 
                      onChange={handlePartnershipChange} 
                      autoComplete="email"
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Please enter a valid email address"
                      className="w-full text-[#4a5565] text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#ff6900] bg-transparent" 
                    />
                  </div>
                  <div>
                    <label htmlFor="partner-phone" className="block text-[15px] sm:text-[17px] md:text-[19px] text-[#0a0a0a] tracking-[-0.76px] mb-1">Phone *</label>
                    <input 
                      type="tel" 
                      id="partner-phone"
                      name="phone" 
                      placeholder="+91 XXXXX XXXXX"
                      value={partnershipData.phone} 
                      onChange={handlePartnershipChange} 
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      className="w-full text-[#4a5565] text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#ff6900] bg-transparent" 
                    />
                  </div>
                  <div>
                    <label htmlFor="partner-company" className="block text-[15px] sm:text-[17px] md:text-[19px] text-[#0a0a0a] tracking-[-0.76px] mb-1">Company/Organization *</label>
                    <input 
                      type="text" 
                      id="partner-company"
                      name="company" 
                      placeholder="Company name"
                      value={partnershipData.company} 
                      onChange={handlePartnershipChange} 
                      required
                      autoComplete="organization"
                      className="w-full text-[#4a5565] text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.76px] border-b border-gray-300 pb-2 focus:outline-none focus:border-[#ff6900] bg-transparent" 
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="partner-type" className="block text-[15px] sm:text-[17px] md:text-[19px] text-[#0a0a0a] tracking-[-0.76px] mb-2">Partnership Type *</label>
                  <div className="relative">
                    <select 
                      id="partner-type"
                      name="partnerType" 
                      value={partnershipData.partnerType} 
                      onChange={handlePartnershipChange} 
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-[10px] border border-[rgba(0,0,0,0.4)] appearance-none bg-white text-[#4a5565] text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.76px]"
                    >
                      <option value="Supplier">Supplier</option>
                      <option value="Installer">Installer</option>
                      <option value="Technology Partner">Technology Partner</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Investment Partner">Investment Partner</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-[#0a0a0a]/40" />
                  </div>
                </div>

                <div>
                  <label htmlFor="partner-message" className="block text-[15px] sm:text-[17px] md:text-[19px] text-[#0a0a0a] tracking-[-0.76px] mb-1">Message (Optional)</label>
                  <textarea 
                    id="partner-message"
                    name="message" 
                    placeholder="Tell us about your partnership proposal..."
                    value={partnershipData.message} 
                    onChange={handlePartnershipChange} 
                    autoComplete="off"
                    rows={4}
                    className="w-full text-[#4a5565] text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.76px] border border-gray-300 rounded-[10px] p-2.5 sm:p-3 focus:outline-none focus:border-[#ff6900] bg-transparent resize-none" 
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPartnershipSubmitting}
                  className="w-full py-3 sm:py-3.5 md:py-4 text-white font-medium rounded-[10px] text-[15px] sm:text-[17px] md:text-[19px] hover:opacity-90 transition-opacity disabled:opacity-70"
                  style={{ backgroundImage: "linear-gradient(170deg, #fdc700 0%, #ff6900 100%)" }}
                >
                  {isPartnershipSubmitting ? "Sending..." : "Submit Partnership Inquiry"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
        
        {/* Location Information Section */}
        <motion.div className="mt-12 sm:mt-16 md:mt-20 mb-10 sm:mb-12 md:mb-16 bg-gradient-to-br from-[#f0fdf4] to-[#f7fff9] rounded-[20px] sm:rounded-[26px] md:rounded-[32px] p-5 sm:p-7 md:p-10 border border-[#dcfce7] shadow-[0_8px_30px_rgba(0,166,62,0.08)]" {...sectionMotionProps}>
          <motion.div className="text-center mb-6 sm:mb-8 md:mb-10" variants={revealVariant}>
            <h3 className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[40px] font-bold text-[#0a0a0a] font-['Urbanist'] tracking-[-1px] mb-2 sm:mb-3">Find Us</h3>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#4a5565] font-['Poppins']">Visit our office in Coimbatore, Tamil Nadu</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-5 gap-5 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10 min-w-0" {...staggerMotionProps}>
            <motion.div className="md:col-span-3 rounded-[16px] sm:rounded-[20px] md:rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] h-[280px] sm:h-[340px] md:h-[400px] min-w-0" variants={revealVariant}>
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

            <motion.div className="md:col-span-2 space-y-3 sm:space-y-4 md:space-y-5" variants={revealVariant}>
              <motion.div variants={revealVariant} className="bg-white rounded-[14px] sm:rounded-[18px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-[#e5f3e9] hover:shadow-[0_8px_25px_rgba(0,166,62,0.12)] transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#00a63e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-3.314 0-6 2.239-6 5v1a1 1 0 001 1h10a1 1 0 001-1v-1c0-2.761-2.686-5-6-5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-1">Address</h4>
                    <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#4a5565] font-['Poppins'] leading-relaxed">GRG INCUBATION CENTER<br />Coimbatore, Tamil Nadu</p>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={revealVariant} className="bg-white rounded-[14px] sm:rounded-[18px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-[#e5f3e9] hover:shadow-[0_8px_25px_rgba(0,166,62,0.12)] transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#ddefff] to-[#bfdbfe] rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-1">Email</h4>
                    <a href="mailto:hello@360watts.com" className="text-[12px] sm:text-[13px] md:text-[14px] text-[#00a63e] font-['Poppins'] hover:text-[#007a55] transition-colors underline">hello@360watts.com</a>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={revealVariant} className="bg-white rounded-[14px] sm:rounded-[18px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-[#e5f3e9] hover:shadow-[0_8px_25px_rgba(0,166,62,0.12)] transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#fef3c7] to-[#fce7f3] rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0">
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
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-[#00a63e] to-[#007a55] text-white font-semibold rounded-[12px] sm:rounded-[14px] text-[14px] sm:text-[15px] md:text-base hover:shadow-[0_8px_30px_rgba(0,166,62,0.3)] transition-all hover:scale-105 shadow-[0_4px_15px_rgba(0,166,62,0.2)] font-['Poppins']"
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
