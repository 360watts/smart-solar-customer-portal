"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "../components/SectionHeading";

const EFFECTIVE_DATE = "July 28, 2026";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Your Account" },
  { id: "services", label: "Our Services" },
  { id: "care-bookings", label: "360Care Bookings" },
  { id: "payment", label: "Payment & Billing" },
  { id: "cancellation", label: "Cancellation & Refunds" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "ip", label: "Intellectual Property" },
  { id: "liability", label: "Liability" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Governing Law" },
  { id: "changes", label: "Changes to Terms" },
  { id: "contact", label: "Contact Us" },
];

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}


export function TermsContent() {
  const active = useActiveSection(SECTIONS.map((s) => s.id));

  return (
    <div className="font-[family-name:var(--font-poppins)]">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div
        className="relative w-full min-w-0 overflow-hidden pt-32 sm:pt-36 md:pt-44 pb-16 sm:pb-20 md:pb-28 px-4 sm:px-6"
        style={{
          background:
            "radial-gradient(1100px 480px at 12% -10%, rgba(0,166,62,0.10), transparent 60%), radial-gradient(900px 480px at 100% 0%, rgba(249,115,22,0.08), transparent 62%), linear-gradient(180deg, #f7fff9 0%, #f6fdf8 45%, #eef9f3 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-16 left-[8%] w-64 h-64 bg-[#00a63e] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-[6%] w-72 h-72 bg-[#f97316] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-[#00a63e]/20 shadow-sm text-[#017c54] font-[family-name:var(--font-urbanist)] font-semibold text-xs sm:text-sm tracking-wide mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a63e]" />
            Effective {EFFECTIVE_DATE}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-[family-name:var(--font-fraunces)] font-medium text-[36px] sm:text-[48px] md:text-[60px] leading-[1.05] text-[#0f2419] tracking-tight"
          >
            The ground rules,
            <br className="hidden sm:block" /> plainly
            <span className="italic text-[#00a63e]"> stated.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-2xl mx-auto text-[15px] sm:text-base text-[#4a5565] leading-relaxed"
          >
            These terms govern your use of 360watts&apos; website, customer
            portal, monitoring platform, and 360Care service bookings.
          </motion.p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
          {/* Sticky table of contents — desktop only */}
          <aside className="hidden md:block">
            <nav className="sticky top-28 space-y-1 pr-2">
              <p className="font-[family-name:var(--font-urbanist)] font-bold text-[11px] uppercase tracking-[0.14em] text-[#8a9a90] mb-3 px-3">
                On this page
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`block px-3 py-1.5 rounded-lg text-[13px] leading-snug transition-all duration-200 border-l-2 ${
                    active === s.id
                      ? "border-[#00a63e] bg-[#00a63e]/8 text-[#017c54] font-semibold"
                      : "border-transparent text-[#5b6b62] hover:text-[#017c54] hover:bg-[#00a63e]/5"
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0 max-w-[68ch]">
            <article className="space-y-14 sm:space-y-16">
              <section>
                <SectionHeading id="overview" index={1}>Overview</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  These Terms of Service (&quot;Terms&quot;) govern your access to and
                  use of 360watts&apos; website, customer portal, mobile
                  applications, and monitoring platform, as well as our
                  after-sales service program (&quot;360Care&quot;), operated by{" "}
                  <strong>Matterless Technologies (OPC) Private Limited</strong>{" "}
                  (&quot;360watts&quot;, &quot;we&quot;, &quot;us&quot;) in Coimbatore, Tamil Nadu, India. By
                  creating an account or using our services, you agree to
                  these Terms. If you don&apos;t agree, please don&apos;t use our
                  services.
                </p>
              </section>

              <section>
                <SectionHeading id="accounts" index={2}>Your Account</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  You&apos;re responsible for keeping your login credentials
                  confidential and for all activity under your account.
                  Customer portal access is invite-only, tied to a specific
                  solar installation site — let us know immediately if you
                  suspect unauthorized access to your account.
                </p>
              </section>

              <section>
                <SectionHeading id="services" index={3}>Our Services</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  360watts provides solar power installation, IoT-based
                  generation and consumption monitoring, forecasting, and
                  after-sales maintenance for residential and commercial
                  sites. Monitoring data (generation, consumption, device
                  health, forecasts) is provided for informational purposes;
                  while we work to keep it accurate and timely, occasional
                  gaps or delays can occur due to connectivity, hardware, or
                  third-party weather-data issues, and we don&apos;t guarantee
                  uninterrupted availability of the dashboard or forecasts.
                </p>
              </section>

              <section>
                <SectionHeading id="care-bookings" index={4}>360Care Bookings</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  Service visits booked through 360Care (cleaning,
                  inspection, repair, and similar) are scheduled subject to
                  technician and vendor availability. Some visits may be
                  fulfilled by third-party vendor partners under our
                  supervision. Completion of a service visit is verified via
                  a one-time code shared with the customer — please don&apos;t
                  share this code with anyone other than the attending
                  technician.
                </p>
              </section>

              <section>
                <SectionHeading id="payment" index={5}>Payment & Billing</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  Installation, equipment, and paid 360Care services are
                  billed as agreed at the time of quotation or booking.
                  Savings figures shown in your dashboard are estimates
                  calculated from your metered generation/consumption data
                  and applicable electricity board tariffs — they&apos;re
                  informational and not a guarantee of actual billing
                  outcomes from your electricity provider.
                </p>
              </section>

              <section>
                <SectionHeading id="cancellation" index={6}>Cancellation & Refunds</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  You may cancel or reschedule a 360Care service booking
                  before a technician has been dispatched at no charge.
                  Refunds for paid services are considered on a case-by-case
                  basis where a booked service could not be delivered as
                  described — contact us using the details below to request
                  one. Equipment and installation contracts are governed by
                  the specific terms of your signed quotation/agreement.
                </p>
              </section>

              <section>
                <SectionHeading id="acceptable-use" index={7}>Acceptable Use</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  Don&apos;t attempt to disrupt, reverse-engineer, or gain
                  unauthorized access to our platform, monitoring
                  infrastructure, or another customer&apos;s data. Don&apos;t use our
                  services for any unlawful purpose. We may suspend accounts
                  that violate this section.
                </p>
              </section>

              <section>
                <SectionHeading id="ip" index={8}>Intellectual Property</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  The 360watts name, logo, website, portal, and underlying
                  software are owned by Matterless Technologies (OPC)
                  Private Limited. Your solar generation/consumption data
                  belongs to you — we use it to operate and improve the
                  services as described in our{" "}
                  <a
                    href="/privacy"
                    className="text-[#017c54] underline decoration-[#00a63e]/40 underline-offset-2 hover:decoration-[#00a63e]"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </section>

              <section>
                <SectionHeading id="liability" index={9}>Liability</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  Our platform and forecasts are provided &quot;as is,&quot; without
                  warranty of uninterrupted or error-free operation. To the
                  extent permitted by Indian law, 360watts isn&apos;t liable for
                  indirect or consequential losses arising from reliance on
                  dashboard data or forecasts. This doesn&apos;t limit any
                  warranty or liability terms in your separate installation
                  or equipment agreement.
                </p>
              </section>

              <section>
                <SectionHeading id="termination" index={10}>Termination</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  You may stop using the customer portal at any time. We may
                  suspend or terminate portal access for violation of these
                  Terms or on request. Termination of portal access doesn&apos;t
                  affect any separate installation, equipment, or service
                  agreement between you and 360watts.
                </p>
              </section>

              <section>
                <SectionHeading id="governing-law" index={11}>Governing Law</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  These Terms are governed by the laws of India, with courts
                  in Coimbatore, Tamil Nadu having exclusive jurisdiction
                  over any dispute arising from them.
                </p>
              </section>

              <section>
                <SectionHeading id="changes" index={12}>Changes to Terms</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  We may update these Terms as our services evolve. Material
                  changes will be reflected by updating the effective date
                  at the top of this page.
                </p>
              </section>

              <section>
                <SectionHeading id="contact" index={13}>Contact Us</SectionHeading>
                <div className="rounded-2xl bg-white border border-[#00a63e]/15 shadow-sm p-6 sm:p-8">
                  <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8] mb-4">
                    Questions about these Terms? Reach us at:
                  </p>
                  <a
                    href="mailto:hello@360watts.com"
                    className="inline-flex items-center gap-2 font-[family-name:var(--font-urbanist)] font-bold text-lg text-[#017c54] hover:text-[#00a63e] transition-colors"
                  >
                    hello@360watts.com
                  </a>
                  <p className="text-[13px] text-[#8a9a90] mt-3">
                    Matterless Technologies (OPC) Private Limited · Coimbatore, Tamil Nadu, India
                  </p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
