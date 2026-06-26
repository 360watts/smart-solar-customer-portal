"use client";

import GlassCard from "@/components/ui/GlassCard";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-foreground font-syne mb-6">
        Profile
      </h1>

      <GlassCard glow="green">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              John Doe
            </h3>
            <p className="text-sm text-muted-foreground">Pro Plan</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-foreground mb-4">Account Info</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-foreground">john@example.com</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Phone</p>
            <p className="text-foreground">+1 (555) 123-4567</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Location</p>
            <p className="text-foreground">Coimbatore, Tamil Nadu</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-foreground mb-4">Subscription</h3>
        <div className="space-y-2">
          <p className="text-foreground">Pro Plan</p>
          <p className="text-sm text-muted-foreground">
            Renews on September 26, 2026
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
