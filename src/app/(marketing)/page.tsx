import dynamic from "next/dynamic";
import type { Metadata } from "next";

import { HeroSection } from "./sections/HeroSection";
import { UnifiedSolutionSection } from "./sections/UnifiedSolutionSection";
import { Why360wattsSection } from "./sections/Why360wattsSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { AppShowcaseSection } from "./sections/AppShowcaseSection";
import { staggerMotionProps } from "./lib/motion";

const SolutionsSection = dynamic(() =>
  import("./sections/SolutionsSection").then((m) => ({ default: m.SolutionsSection })),
);
const AboutSection = dynamic(() =>
  import("./sections/AboutSection").then((m) => ({ default: m.AboutSection })),
);
const FAQSection = dynamic(() =>
  import("./sections/FAQSection").then((m) => ({ default: m.FAQSection })),
);
const ContactSection = dynamic(() =>
  import("./sections/ContactSection").then((m) => ({ default: m.ContactSection })),
);
const FooterSection = dynamic(() =>
  import("./sections/FooterSection").then((m) => ({
    default: (props: { motionProps: typeof staggerMotionProps }) => (
      <m.FooterSection motionProps={props.motionProps} />
    ),
  })),
);

export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL("https://360watts.com"),
  title: {
    absolute: "360watts - Smart Solar & Home Automation Solutions | Coimbatore",
  },
  description:
    "360watts provides solar power solutions and smart home automation in Coimbatore, Tamil Nadu. Save energy, reduce bills, and live sustainably with an integrated platform.",
  openGraph: {
    title: "360watts - Smart Solar & Home Automation Solutions",
    description:
      "Solar power and smart home automation for cleaner, lower-cost living.",
    url: "https://360watts.com",
    siteName: "360watts",
    images: [{ url: "/smartEnergy.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="bg-linear-to-b from-[#f7fff9] via-white to-[#f7fff9] min-h-screen overflow-x-hidden w-full min-w-0"
    >
      <HeroSection />

      <div
        className="relative w-full min-w-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(1200px 520px at 50% -18%, rgba(15,23,42,0.06), transparent 60%), radial-gradient(900px 520px at 110% 12%, rgba(59,130,246,0.10), transparent 66%), linear-gradient(180deg, #f7fff9 0%, #f6fdf8 36%, #eef9f3 72%, #e3f3ea 100%)",
        }}
      >
        <UnifiedSolutionSection />
        <Why360wattsSection />
        <HowItWorksSection />
      </div>

      <AppShowcaseSection />
      <SolutionsSection />
      <AboutSection />
      <FAQSection />
      <ContactSection />
      <FooterSection motionProps={staggerMotionProps} />
    </main>
  );
}
