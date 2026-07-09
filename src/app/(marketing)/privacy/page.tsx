import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PrivacyContent } from "./PrivacyContent";

const FooterSection = dynamic(() =>
  import("../sections/FooterSection").then((m) => ({ default: m.FooterSection })),
);

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How 360watts collects, uses, and protects your data across our solar monitoring platform, customer portal, and service communications.",
  alternates: { canonical: "https://360watts.com/privacy" },
  openGraph: {
    title: "Privacy Policy | 360watts",
    description:
      "How 360watts collects, uses, and protects your data across our solar monitoring platform, customer portal, and service communications.",
    url: "https://360watts.com/privacy",
    siteName: "360watts",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main
      id="main-content"
      className="bg-linear-to-b from-[#f7fff9] via-white to-[#f7fff9] min-h-screen overflow-x-hidden w-full min-w-0"
    >
      <PrivacyContent />
      <FooterSection />
    </main>
  );
}
