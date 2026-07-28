import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { TermsContent } from "./TermsContent";

const FooterSection = dynamic(() =>
  import("../sections/FooterSection").then((m) => ({ default: m.FooterSection })),
);

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of 360watts' solar monitoring platform, customer portal, and 360Care service bookings.",
  alternates: { canonical: "https://360watts.com/terms" },
  openGraph: {
    title: "Terms of Service | 360watts",
    description:
      "The terms governing your use of 360watts' solar monitoring platform, customer portal, and 360Care service bookings.",
    url: "https://360watts.com/terms",
    siteName: "360watts",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <main
      id="main-content"
      className="bg-linear-to-b from-[#f7fff9] via-white to-[#f7fff9] min-h-screen overflow-x-clip w-full min-w-0"
    >
      <TermsContent />
      <FooterSection />
    </main>
  );
}
