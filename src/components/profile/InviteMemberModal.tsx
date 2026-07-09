"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { portalApi, type SiteMember } from "@/lib/api";

export default function InviteMemberModal({
  siteId,
  onClose,
  onInvited,
}: {
  siteId: string;
  onClose: () => void;
  onInvited: (member: SiteMember) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SiteMember["role"]>("viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await portalApi.inviteSiteMember(siteId, email.trim() || null, role);
      onInvited(data);
      onClose();
    } catch (err) {
      const backendMessage =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(backendMessage ?? "Couldn't send the invite. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md rounded-2xl bg-[#0b1119] border border-border p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Invite a site member</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg bg-white/5 border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground uppercase tracking-wide mb-2 block">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {(["viewer", "co_owner"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border p-3 text-sm text-left transition-colors cursor-pointer ${
                    role === r
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-emerald-500/25 hover:text-foreground"
                  }`}
                >
                  {r === "viewer" ? "Viewer" : "Co-owner"}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-2.5 transition-colors cursor-pointer"
          >
            {submitting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
