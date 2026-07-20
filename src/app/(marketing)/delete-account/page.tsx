import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { DeleteAccountContent } from "./DeleteAccountContent";

const FooterSection = dynamic(() =>
  import("../sections/FooterSection").then((m) => ({ default: m.FooterSection })),
);

export const metadata: Metadata = {
  title: "Delete Account",
  description:
    "How to request deletion of your 360watts account and associated data.",
  alternates: { canonical: "https://360watts.com/delete-account" },
  openGraph: {
    title: "Delete Account | 360watts",
    description:
      "How to request deletion of your 360watts account and associated data.",
    url: "https://360watts.com/delete-account",
    siteName: "360watts",
    type: "website",
  },
};

export default function DeleteAccountPage() {
  return (
    <main
      id="main-content"
      className="bg-linear-to-b from-[#f7fff9] via-white to-[#f7fff9] min-h-screen overflow-x-clip w-full min-w-0"
    >
      <DeleteAccountContent />
      <FooterSection />
    </main>
  );
}
