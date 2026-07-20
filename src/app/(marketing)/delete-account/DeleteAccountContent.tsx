"use client";

import { motion } from "framer-motion";

function SectionHeading({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 mb-5">
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

export function DeleteAccountContent() {
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
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-[family-name:var(--font-fraunces)] font-medium text-[36px] sm:text-[48px] md:text-[56px] leading-[1.05] text-[#0f2419] tracking-tight"
          >
            Delete your 360watts
            <br className="hidden sm:block" /> account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 max-w-2xl mx-auto text-[15px] sm:text-base text-[#4a5565] leading-relaxed"
          >
            How to request deletion of your 360watts account and associated
            data — for the 360watts customer portal and mobile monitoring app,
            operated by Matterless Technologies (OPC) Private Limited.
          </motion.p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        <article className="space-y-14 sm:space-y-16">
          <section>
            <SectionHeading index={1}>How to request deletion</SectionHeading>
            <ol className="space-y-3 text-[15px] sm:text-base text-[#374151] leading-[1.8] list-decimal list-outside pl-5">
              <li>
                Email{" "}
                <a
                  href="mailto:hello@360watts.com?subject=Account%20deletion%20request"
                  className="text-[#017c54] underline decoration-[#00a63e]/40 underline-offset-2 hover:decoration-[#00a63e]"
                >
                  hello@360watts.com
                </a>{" "}
                from the email address registered on your account, with the
                subject line &quot;Account deletion request&quot;.
              </li>
              <li>
                Include the name or site address associated with your
                account, so we can verify it&apos;s you.
              </li>
              <li>
                We&apos;ll confirm your identity and process the deletion
                within <strong>30 days</strong>, then email you once it&apos;s
                complete.
              </li>
            </ol>
          </section>

          <section>
            <SectionHeading index={2}>What gets deleted</SectionHeading>
            <ul className="space-y-2.5 text-[15px] sm:text-base text-[#374151] leading-[1.7] list-none">
              {[
                "Your account: name, email, phone number, and login credentials",
                "Site and device configuration linked to your account",
                "In-app notifications, chat/support history, and saved preferences",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00a63e] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading index={3}>What we retain, and why</SectionHeading>
            <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8]">
              Solar energy telemetry from monitoring hardware physically
              installed at a site is retained in de-identified, aggregate form
              after account deletion — it powers our forecasting models and
              cannot be linked back to you once your account record is
              removed. Service and billing records tied to your installation
              may be retained for up to <strong>7 years</strong> where Indian
              accounting, warranty, or tax law requires it. Everything else is
              permanently deleted, not just deactivated.
            </p>
          </section>

          <section>
            <SectionHeading index={4}>Questions</SectionHeading>
            <div className="rounded-2xl bg-white border border-[#00a63e]/15 shadow-sm p-6 sm:p-8">
              <p className="text-[15px] sm:text-base text-[#374151] leading-[1.8] mb-4">
                See our full{" "}
                <a href="/privacy" className="text-[#017c54] underline decoration-[#00a63e]/40 underline-offset-2 hover:decoration-[#00a63e]">
                  Privacy Policy
                </a>{" "}
                for more on how 360watts handles your data, or reach us at:
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
  );
}
