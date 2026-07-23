"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EFFECTIVE_DATE = "July 9, 2026";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "data-we-collect", label: "Data We Collect" },
  { id: "how-we-use-it", label: "How We Use It" },
  { id: "device-telemetry", label: "Solar & Device Data" },
  { id: "sharing", label: "Who We Share With" },
  { id: "whatsapp", label: "WhatsApp & Messaging" },
  { id: "retention", label: "Data Retention" },
  { id: "security", label: "Security" },
  { id: "your-rights", label: "Your Rights" },
  { id: "children", label: "Children's Privacy" },
  { id: "changes", label: "Policy Changes" },
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

function SectionHeading({ id, index, children }: { id: string; index: number; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 mb-5 scroll-mt-28" id={id}>
      <span
        className="font-[family-name:var(--font-fraunces)] text-[13px] sm:text-sm text-[#00a63e]/70 tabular-nums shrink-0"
        aria-hidden
      >
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="font-[family-name:var(--font-urbanist)] font-bold text-[22px] sm:text-[26px] md:text-[30px] text-[#0f2419] tracking-tight">
        {children}
      </h2>
    </div>
  );
}

export function PrivacyContent() {
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
            Your data, handled the
            <br className="hidden sm:block" /> way sunlight travels —
            <span className="italic text-[#00a63e]"> transparently.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-2xl mx-auto text-[15px] sm:text-base text-[#4a5565] leading-relaxed"
          >
            This policy explains what 360watts collects across our solar
            monitoring platform, customer portal, and service communications
            — and exactly what we do (and don&apos;t do) with it.
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
                  360watts (operated by <strong>Matterless Technologies (OPC)
                  Private Limited</strong>, &quot;360watts&quot;, &quot;we&quot;, &quot;us&quot;) provides
                  solar power installation, monitoring, and after-sales
                  service (&quot;360Care&quot;) in Coimbatore, Tamil Nadu, India. This
                  policy covers data collected through our website, customer
                  portal, mobile applications, IoT monitoring devices
                  installed at your site, and our service communications
                  (email, WhatsApp).
                </p>
              </section>

              <section>
                <SectionHeading id="data-we-collect" index={2}>Data We Collect</SectionHeading>
                <ul className="space-y-3 text-[15px] sm:text-base text-[#374151] leading-[1.8] list-none">
                  {[
                    ["Account details", "Name, email, phone number, and site address when you register or request a quotation."],
                    ["Solar system data", "Real-time and historical energy generation, consumption, and device health readings from monitoring hardware installed at your site."],
                    ["Service records", "Booking details, technician assignments, completion notes, and communications related to 360Care service visits."],
                    ["Payment & billing", "Tariff configuration and billing-period data used to calculate savings — we do not store full payment card details."],
                    ["Communications", "Emails, in-app messages, and WhatsApp messages exchanged with our support and field teams."],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00a63e] shrink-0" />
                      <span><strong className="text-[#0f2419]">{title}.</strong> {desc}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <SectionHeading id="how-we-use-it" index={3}>How We Use It</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  We use your data to operate your solar monitoring
                  dashboard, generate accurate savings and production
                  forecasts, schedule and verify service visits, send
                  transactional notifications (booking confirmations,
                  completion codes, billing summaries), and improve the
                  reliability of our forecasting models. We do not sell your
                  personal data.
                </p>
              </section>

              <section>
                <SectionHeading id="device-telemetry" index={4}>Solar & Device Data</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  Monitoring devices installed at your site (inverters,
                  meters, and our IoT gateway) report energy readings at
                  regular intervals. This telemetry is used to power your
                  live dashboard, detect faults early, and — in aggregate,
                  anonymized form — train the forecasting models behind our
                  solar and load predictions. Device-level telemetry is
                  never shared outside 360watts and its infrastructure
                  providers.
                </p>
              </section>

              <section>
                <SectionHeading id="sharing" index={5}>Who We Share With</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8] mb-4">
                  We share data only with service providers who help us
                  operate 360watts, under contractual confidentiality
                  obligations:
                </p>
                <ul className="space-y-2.5 text-[15px] sm:text-base text-[#374151] leading-[1.7] list-none">
                  {[
                    "Cloud infrastructure and database hosting (AWS, Railway)",
                    "Frontend hosting and delivery (Vercel)",
                    "Transactional email delivery (Brevo)",
                    "Messaging, where you've opted in (WhatsApp Business Platform by Meta)",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8] mt-4">
                  We do not share your data with advertisers or data
                  brokers. We may disclose data if required by law.
                </p>
              </section>

              <section>
                <SectionHeading id="whatsapp" index={6}>WhatsApp & Messaging</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  When you or our field technicians communicate with
                  360watts over WhatsApp — for example, verifying completion
                  of a service visit — those messages are processed through
                  the WhatsApp Business Platform, operated by Meta, subject
                  to{" "}
                  <a
                    href="https://www.whatsapp.com/legal/business-data-processing-terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#017c54] underline decoration-[#00a63e]/40 underline-offset-2 hover:decoration-[#00a63e]"
                  >
                    Meta&apos;s Business Data Processing Terms
                  </a>
                  . One-time completion codes are stored by 360watts in
                  hashed form and are never sent to anyone other than the
                  customer who requested the service.
                </p>
              </section>

              <section>
                <SectionHeading id="retention" index={7}>Data Retention</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  We retain account and service-history data for as long as
                  your account is active and for a reasonable period
                  afterward to meet legal, accounting, and warranty
                  obligations tied to your solar installation. Anonymized
                  telemetry used for forecasting research may be retained
                  longer in aggregate form, with no link back to your
                  identity.
                </p>
              </section>

              <section>
                <SectionHeading id="security" index={8}>Security</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  Data in transit is encrypted (HTTPS/TLS). Access to
                  production systems is restricted to authorized personnel,
                  and sensitive credentials such as verification codes are
                  stored hashed, never in plaintext.
                </p>
              </section>

              <section>
                <SectionHeading id="your-rights" index={9}>Your Rights</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  You may request access to, correction of, or deletion of
                  your personal data at any time by contacting us below.
                  We&apos;ll respond within a reasonable timeframe and in line
                  with applicable Indian data protection law.
                </p>
              </section>

              <section>
                <SectionHeading id="children" index={10}>Children&apos;s Privacy</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  360watts services are intended for property owners and
                  businesses. We do not knowingly collect data from
                  children under 18.
                </p>
              </section>

              <section>
                <SectionHeading id="changes" index={11}>Policy Changes</SectionHeading>
                <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
                  We may update this policy as our services evolve. Material
                  changes will be reflected by updating the effective date
                  at the top of this page.
                </p>
              </section>

              <section>
                <SectionHeading id="contact" index={12}>Contact Us</SectionHeading>
                <div className="rounded-2xl bg-white border border-[#00a63e]/15 shadow-sm p-6 sm:p-8">
                  <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8] mb-4">
                    Questions about this policy or your data? Reach us at:
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
