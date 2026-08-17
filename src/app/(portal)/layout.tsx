import { redirect } from "next/navigation";
import type { Metadata } from "next";
import React, { ReactNode } from "react";

import PortalSidebar from "@/components/layout/PortalSidebar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AssistantMount from "@/components/assistant/AssistantMount";
import { hasSessionCookies } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Energy Portal",
  description: "Monitor your solar generation, savings, devices, and service health.",
};

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await hasSessionCookies())) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar />
      {/* min-w-0 is required on a flex-1 child: without it, a flex item won't
          shrink below its content's intrinsic width, so any page whose content
          is even slightly wider than the viewport pushes this whole layout
          wider instead of scrolling within itself — a page-level horizontal
          scrollbar rather than one contained inside a specific card. */}
      <main className="flex-1 min-w-0 overflow-auto bg-background bg-atmosphere">
        <div className="relative z-10 p-6 pb-20 md:pb-6">{children}</div>
      </main>
      <MobileTabBar />
      <AssistantMount />
    </div>
  );
}
