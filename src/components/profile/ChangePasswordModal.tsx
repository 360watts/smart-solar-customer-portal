"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { portalApi } from "@/lib/api";

const inputClass =
  "w-full bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw !== confirmPw) {
      setError("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setState("saving");
    try {
      await portalApi.changePassword({
        current_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      setState("saved");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to change password.";
      setError(msg);
      setState("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md rounded-2xl bg-card border border-border p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Change password</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Current password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">New password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Confirm new password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputClass} required />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-400">
                {error}
              </motion.p>
            )}
            {state === "saved" && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-emerald-400">
                Password changed ✓
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={state === "saving"}
            className="mt-2 w-full py-3 rounded-lg text-base font-semibold bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {state === "saving" ? "Updating…" : "Update password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
