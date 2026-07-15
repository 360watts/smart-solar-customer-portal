"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Mail, MessageCircle } from "lucide-react";
import { portalApi, type SiteMember } from "@/lib/api";

export default function InviteMemberModal({
  siteId,
  onClose,
  onInvited,
  preloaded,
}: {
  siteId: string;
  onClose: () => void;
  onInvited: (member: SiteMember) => void;
  /** Already-fetched invite (e.g. from a resend) — skips the auto-generate POST. */
  preloaded?: SiteMember;
}) {
  const [invite, setInvite] = useState<SiteMember | null>(preloaded ?? null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hasGenerated = useRef(!!preloaded);

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      // Backend reuses an existing pending invite if one exists for the site.
      const { data } = await portalApi.inviteSiteMember(siteId, null, "viewer");
      setInvite(data);
      onInvited(data);
    } catch {
      setError("Couldn't generate an invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!invite?.invite_link) return;
    navigator.clipboard.writeText(invite.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share(platform: "whatsapp" | "email") {
    if (!invite?.invite_link) return;
    const message = `Join 360Watts: ${invite.invite_link}`;
    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      window.open(`mailto:?subject=${encodeURIComponent("Join 360Watts")}&body=${encodeURIComponent(message)}`, "_blank");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-sm rounded-2xl bg-[#0b1119] border border-border p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Invite a site member</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-emerald-400 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={generate}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && invite && (
          <div className="text-center">
            {invite.qr_code && (
              <div className="inline-block p-3 bg-white rounded-xl shadow-lg mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={invite.qr_code} alt="Invite QR code" width={160} height={160} className="block" />
              </div>
            )}

            {invite.invite_link && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2.5 mb-4">
                <span className="flex-1 text-xs text-muted-foreground truncate text-left font-mono">
                  {invite.invite_link}
                </span>
                <button
                  onClick={copyLink}
                  title="Copy link"
                  className={`shrink-0 cursor-pointer ${copied ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}

            <div className="flex justify-center gap-4 mb-5">
              <button
                onClick={() => share("whatsapp")}
                title="Share via WhatsApp"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <MessageCircle size={20} />
              </button>
              <button
                onClick={() => share("email")}
                title="Share via email"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <Mail size={20} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              Share this invite link or scan the QR code. Everyone joins as a Viewer — you can change their role later in Members.
            </p>
            {invite.expires_at && (
              <p className="text-sm text-muted-foreground/70">
                Expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
