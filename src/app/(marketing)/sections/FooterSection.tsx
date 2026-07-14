"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { APP_IMAGES } from "../lib/imageRegistry";
import { localFinalLogo } from "../data";

interface FooterSectionProps {
  motionProps?: Record<string, unknown>;
}

export function FooterSection({ motionProps = {} }: FooterSectionProps) {
  return (
    <footer
      className="relative py-14 sm:py-18 md:py-24 px-4 sm:px-6 rounded-t-[30px] sm:rounded-t-[40px] md:rounded-t-[50px] overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(247, 255, 248, 1) 0%, rgba(240, 253, 244, 1) 50%, rgba(236, 254, 255, 1) 100%)",
        boxShadow:
          "0 -15px 50px rgba(4, 113, 58, 0.12), 0 -5px 25px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-[#04713a] rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-52 h-52 bg-[#015c40] rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#3b82f6] rounded-full blur-3xl opacity-60 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="w-full max-w-7xl mx-auto relative z-10 min-w-0">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 mb-10 sm:mb-12 md:mb-14 lg:mb-16 items-start min-w-0"
          {...motionProps}
        >
          <div className="col-span-2 sm:col-span-2 md:col-span-4 flex flex-col items-center sm:items-start gap-2 group">
            <div className="relative">
              <img
                src={APP_IMAGES.footerLogo}
                alt="360watts"
                className="h-21.25 sm:h-25 md:h-30 w-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-md"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = localFinalLogo;
                }}
              />
              <div className="absolute -inset-4 bg-linear-to-r from-[#04713a]/20 to-[#015c40]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-[13px] sm:text-[15px] md:text-[17px] text-[#4a5565] font-['Figtree',sans-serif] tracking-[-0.3px] sm:tracking-[-0.76px] mb-2 sm:mb-3 md:mb-4">
                Drive what's next.
              </div>
              <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-[#4a5565] leading-relaxed max-w-xs">
                Revolutionizing home energy with smart solar and automation
                solutions.
              </p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3 space-y-3 sm:space-y-4 md:space-y-5">
            <h4 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[24px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 sm:mb-4 md:mb-6 leading-6 relative inline-block">
              Quick Links
              <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-8 sm:w-10 md:w-12 h-0.5 sm:h-1 bg-linear-to-r from-[#04713a] to-[#015c40] rounded-full"></div>
            </h4>
            <nav className="flex flex-col space-y-2 sm:space-y-3">
              {[
                { label: "Solutions", href: "#solutions-section" },
                { label: "About Us", href: "#about-section" },
                { label: "FAQ", href: "#faq-section" },
                { label: "Contact", href: "#contact-section" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(link.href.substring(1))
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-[14px] sm:text-[15px] md:text-[16px] text-[#4a5565] hover:text-[#015c40] transition-all duration-200 font-medium leading-6 sm:leading-7 group flex items-center min-h-11"
                >
                  <span className="w-0 group-hover:w-3 h-0.5 bg-[#04713a] mr-0 group-hover:mr-2 transition-all duration-300 rounded-full"></span>
                  {link.label}
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200">
                    →
                  </span>
                </a>
              ))}
            </nav>
          </div>

          <div className="col-span-1 md:col-span-3 space-y-3 sm:space-y-4 md:space-y-5">
            <h4 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[24px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 sm:mb-4 md:mb-6 leading-6 relative inline-block">
              Contact Us
              <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-8 sm:w-10 md:w-12 h-0.5 sm:h-1 bg-linear-to-r from-[#04713a] to-[#015c40] rounded-full"></div>
            </h4>
            <div className="space-y-3 sm:space-y-4">
              <a
                href="mailto:hello@360watts.com"
                className="flex items-center gap-2 sm:gap-3 text-[14px] sm:text-[15px] md:text-[16px] text-[#4a5565] hover:text-[#015c40] transition-colors duration-200 font-medium leading-6 sm:leading-7 group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-linear-to-br from-[#04713a]/10 to-[#015c40]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#04713a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-200 text-[12px] sm:text-[14px] md:text-base">
                  hello@360watts.com
                </span>
              </a>
              <a
                href="tel:9087610051"
                className="flex items-center gap-2 sm:gap-3 text-[14px] sm:text-[15px] md:text-[16px] text-[#4a5565] font-medium leading-6 sm:leading-7 hover:text-[#04713a] transition-colors group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-linear-to-br from-[#04713a]/10 to-[#015c40]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#04713a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <span className="text-[12px] sm:text-[14px] md:text-base">
                  +91-9087610051
                </span>
              </a>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-2 md:col-span-2 space-y-3 sm:space-y-4 md:space-y-5">
            <h4 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[24px] font-bold text-[#0a0a0a] font-['Urbanist'] mb-3 sm:mb-4 md:mb-6 leading-6 relative inline-block">
              Follow Us
              <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-8 sm:w-10 md:w-12 h-0.5 sm:h-1 bg-linear-to-r from-[#04713a] to-[#015c40] rounded-full"></div>
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <a
                href="https://www.instagram.com/360.watts/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-linear-to-br from-[#1e2939] to-[#334155] rounded-xl sm:rounded-2xl flex items-center justify-center hover:shadow-2xl hover:shadow-[#1e2939]/30 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                title="Instagram"
              >
                <div className="absolute inset-0 bg-linear-to-br from-[#04713a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white group-hover:brightness-125 transition-all duration-200 relative z-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.645.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61588957388992"
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-linear-to-br from-[#1e2939] to-[#334155] rounded-xl sm:rounded-2xl flex items-center justify-center hover:shadow-2xl hover:shadow-[#1e2939]/30 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                title="Facebook"
              >
                <div className="absolute inset-0 bg-linear-to-br from-[#04713a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:brightness-125 transition-all duration-200 relative z-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://in.linkedin.com/company/360watts"
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-linear-to-br from-[#1e2939] to-[#334155] rounded-xl sm:rounded-2xl flex items-center justify-center hover:shadow-2xl hover:shadow-[#1e2939]/30 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                title="LinkedIn"
              >
                <div className="absolute inset-0 bg-linear-to-br from-[#04713a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:brightness-125 transition-all duration-200 relative z-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>

        <div className="relative pt-6 sm:pt-7 md:pt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200/60"></div>
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <div className="bg-linear-to-r from-[#f7fff9] via-white to-[#f0fdf4] px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 rounded-full shadow-md border-2 border-gray-100 hover:scale-105 transition-transform duration-300 hover:shadow-lg">
              <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#4a5565] font-semibold tracking-wide">
                © 2025 Matterless Technologies (OPC) Private Limited. All rights
                reserved.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-[12px] sm:text-[13px] text-[#8a9a90] hover:text-[#017c54] font-medium underline decoration-transparent hover:decoration-[#00a63e]/50 underline-offset-4 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
