import { redirect } from "next/navigation";
import React, { ReactNode } from "react";

import PortalSidebar from "@/components/layout/PortalSidebar";
import { hasSessionCookies } from "@/lib/server-auth";

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
