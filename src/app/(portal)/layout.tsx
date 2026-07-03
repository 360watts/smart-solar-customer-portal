import { redirect } from "next/navigation";
import type { Metadata } from "next";
import React, { ReactNode } from "react";

import PortalSidebar from "@/components/layout/PortalSidebar";
import { hasSessionCookies } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Customer Portal",
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
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
