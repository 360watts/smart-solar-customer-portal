"use client";

import React, { ReactNode } from "react";
import PortalSidebar from "@/components/layout/PortalSidebar";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
