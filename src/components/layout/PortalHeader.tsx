"use client";

import React from "react";
import { Bell, Moon, Sun } from "lucide-react";

export default function PortalHeader() {
  const [isDark, setIsDark] = React.useState(true);

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 border-b border-border glass">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-xl font-bold text-foreground font-syne">
          Good morning
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
          <Bell size={20} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
        >
          {isDark ? (
            <Sun size={20} className="text-muted-foreground" />
          ) : (
            <Moon size={20} className="text-muted-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}
