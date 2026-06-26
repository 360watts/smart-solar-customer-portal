"use client";

import React, { ReactNode } from "react";
import PortalSidebar from "@/components/layout/PortalSidebar";
import PortalHeader from "@/components/layout/PortalHeader";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PortalHeader />
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
