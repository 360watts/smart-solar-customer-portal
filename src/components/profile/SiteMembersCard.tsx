"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, RotateCcw, Users } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { portalApi, type SiteMember } from "@/lib/api";
import InviteMemberModal from "./InviteMemberModal";

const STATUS_STYLES: Record<SiteMember["status"], string> = {
  pending: "text-amber-400 bg-amber-500/10",
  active: "text-emerald-400 bg-emerald-500/10",
  revoked: "text-muted-foreground bg-white/5",
};

function displayName(m: SiteMember) {
  if (m.user) {
    const name = `${m.user.first_name} ${m.user.last_name}`.trim();
    return name || "Member";
  }
  return "Pending invite";
}

// `token_expires_at` gets pushed forward every resend, so a pending invite
// can look "fresh" by expiry alone while sitting unaccepted for a long time —
// this shows how long it's actually been pending, independent of resends.
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default function SiteMembersCard({ siteId }: { siteId: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<SiteMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resendModalFor, setResendModalFor] = useState<SiteMember | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const isOwner = user?.user_type === "owner";

  useEffect(() => {
    let cancelled = false;
    // Resets loading/error from a previous siteId's fetch before this one starts —
    // not redundant with the useState defaults once siteId changes post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    portalApi
      .getSiteMembers(siteId)
      .then(({ data }) => {
        if (!cancelled) setMembers(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load site members.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  function flash(kind: "success" | "error", message: string) {
    setFeedback({ kind, message });
    setTimeout(() => setFeedback(null), 2500);
  }

  async function handleRoleChange(m: SiteMember, role: SiteMember["role"]) {
    setActionLoading(m.id);
    try {
      const { data } = await portalApi.updateSiteMember(siteId, m.id, { role });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? data : x)));
      flash("success", `Role updated to ${role === "co_owner" ? "Co-owner" : "Viewer"}.`);
    } catch {
      flash("error", "Failed to update role. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevoke(m: SiteMember) {
    setActionLoading(m.id);
    try {
      const { data } = await portalApi.updateSiteMember(siteId, m.id, { status: "revoked" });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? data : x)));
      flash("success", m.status === "pending" ? "Invite revoked." : `Access revoked for ${displayName(m)}.`);
    } catch {
      flash("error", "Failed to revoke access. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResend(m: SiteMember) {
    setActionLoading(m.id);
    try {
      const { data } = await portalApi.resendSiteInvite(siteId, m.id);
      const refreshed: SiteMember = {
        ...m,
        invite_link: data.invite_link,
        qr_code: data.qr_code,
        expires_at: data.expires_at,
      };
      setMembers((prev) => prev.map((x) => (x.id === m.id ? refreshed : x)));
      setResendModalFor(refreshed);
    } catch {
      flash("error", "Failed to resend invite. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users size={16} className="text-emerald-400" /> Site Members
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-3 py-1.5 transition-colors cursor-pointer"
          >
            <UserPlus size={14} /> Invite
          </button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-sm mb-3 ${feedback.kind === "success" ? "text-emerald-400" : "text-red-400"}`}
            >
              {feedback.message}
            </motion.p>
          )}
        </AnimatePresence>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && members.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No members yet. Invite a family member or co-owner to share access.
          </p>
        )}

        {!loading && members.length > 0 && (
          <div className="space-y-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0 flex-wrap"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayName(m)}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {m.user?.first_name
                      ? ""
                      : m.status === "pending"
                      ? (() => {
                          const days = daysSince(m.created_at);
                          return days > 0
                            ? `Invited ${days} day${days === 1 ? "" : "s"} ago — no account yet`
                            : "Invited today — no account yet";
                        })()
                      : "Invite pending — no account yet"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[m.status]}`}>
                    {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                  </span>

                  {m.status !== "revoked" && isOwner && (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m, e.target.value as SiteMember["role"])}
                      disabled={actionLoading === m.id}
                      className="text-sm rounded-lg border border-border bg-transparent text-foreground px-2 py-1 cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="co_owner">Co-owner</option>
                    </select>
                  )}

                  {m.status === "pending" && (
                    <button
                      onClick={() => handleResend(m)}
                      disabled={actionLoading === m.id}
                      title="Resend invite"
                      className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}

                  {isOwner && m.status !== "revoked" && (
                    <button
                      onClick={() => handleRevoke(m)}
                      disabled={actionLoading === m.id}
                      className="text-sm px-2.5 py-1 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {showModal && (
        <InviteMemberModal
          siteId={siteId}
          onClose={() => setShowModal(false)}
          onInvited={(m) =>
            setMembers((prev) => (prev.find((member) => member.id === m.id) ? prev : [...prev, m]))
          }
        />
      )}

      {resendModalFor && (
        <InviteMemberModal
          siteId={siteId}
          preloaded={resendModalFor}
          onClose={() => setResendModalFor(null)}
          onInvited={() => {}}
        />
      )}
    </>
  );
}
