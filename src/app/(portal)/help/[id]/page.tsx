"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Headset, Send } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { portalApi } from "@/lib/api";
import {
  CATEGORIES,
  STATUS_META,
  type InquiryDetail,
  formatTimestamp,
  formatSlaDeadline,
  extractErrorMessage,
  ReplyAuthorBadge,
  markInquiryViewed,
  HelpNavBar,
} from "../_shared";

type ResolutionAction = "yes" | "no" | "escalate";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground py-1" aria-live="polite">
      <span className="inline-flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
      </span>
      AI is replying…
    </div>
  );
}

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const inquiryId = Number(params?.id);

  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<"not_found" | "generic" | null>(null);
  const [polling, setPolling] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replyState, setReplyState] = useState<"idle" | "sending" | "error">("idle");
  const [replyError, setReplyError] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<ResolutionAction | null>(null);
  const [actionError, setActionError] = useState<{ action: ResolutionAction; message: string } | null>(null);
  const [noHintShown, setNoHintShown] = useState(false);
  const [escalatedConfirmation, setEscalatedConfirmation] = useState<{ slaDeadline: string | null } | null>(null);

  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const questionId = useId();

  // Same bounded-poll bridge as before: the AI's reply is generated in the
  // background and never comes back in the same response that created the
  // ticket or posted a message, and the portal has no push channel — up to 7
  // tries, 2s apart (~14s), stopping the moment a new reply appears or the
  // status moves off ai_handling.
  async function pollForAiReply(baselineReplyCount: number) {
    setPolling(true);
    for (let i = 0; i < 7; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const { data } = await portalApi.getSupportInquiry(inquiryId);
        const d = data as InquiryDetail;
        setDetail(d);
        if (d.status !== "ai_handling" || d.replies.length > baselineReplyCount) {
          setPolling(false);
          return;
        }
      } catch {
        setPolling(false);
        return;
      }
    }
    setPolling(false);
  }

  useEffect(() => {
    if (!Number.isFinite(inquiryId)) {
      // Malformed :id in the URL — genuine validation of an external route
      // param, not derivable from a lazy initializer since inquiryId can
      // change across client-side navigations without remounting this page.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadError("not_found");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await portalApi.getSupportInquiry(inquiryId);
        if (cancelled) return;
        const d = data as InquiryDetail;
        setDetail(d);
        markInquiryViewed(inquiryId);
        // Only poll if the AI's first turn genuinely hasn't landed yet (0
        // replies) — reopening/reloading a ticket where the AI already
        // replied and is just waiting on the customer's Yes/No has nothing
        // in flight, and polling anyway would wrongly hide those buttons
        // for up to ~14s on every page load.
        if (d.status === "ai_handling" && d.replies.length === 0) void pollForAiReply(d.replies.length);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        setLoadError(status === 404 || status === 403 ? "not_found" : "generic");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId]);

  const currentStatus = detail?.status ?? "";
  const meta = STATUS_META[currentStatus] ?? STATUS_META.open;
  const aiTurnsUsed = detail?.ai_turn_count ?? 0;
  const maxAiTurns = detail?.max_ai_turns ?? 2;
  const isLastAiTurn = currentStatus === "ai_handling" && aiTurnsUsed >= maxAiTurns - 1 && aiTurnsUsed > 0;
  const lastReply = detail?.replies[detail.replies.length - 1];
  const showYesNo = currentStatus === "ai_handling" && !!lastReply?.is_ai_reply && !polling;
  const showEscalate = currentStatus === "ai_handling";
  const isSending = pendingAction !== null;

  async function handleResolved(resolved: boolean) {
    if (!detail) return;
    setPendingAction(resolved ? "yes" : "no");
    setActionError(null);
    if (!resolved) {
      setNoHintShown(true);
      replyTextareaRef.current?.focus();
    }
    try {
      await portalApi.markSupportInquiryResolved(inquiryId, resolved);
      const { data: freshDetail } = await portalApi.getSupportInquiry(inquiryId);
      setDetail(freshDetail as InquiryDetail);
      setPendingAction(null);
    } catch (err) {
      setPendingAction(null);
      if (resolved) {
        setActionError({ action: "yes", message: extractErrorMessage(err, "Something went wrong — please try again.") });
      }
    }
  }

  async function handleEscalate() {
    setPendingAction("escalate");
    setActionError(null);
    try {
      const { data } = await portalApi.escalateSupportInquiry(inquiryId);
      const d = data as InquiryDetail;
      setDetail(d);
      setPendingAction(null);
      setEscalatedConfirmation({ slaDeadline: formatSlaDeadline(d.sla_due_at) });
    } catch (err) {
      setPendingAction(null);
      setActionError({ action: "escalate", message: extractErrorMessage(err, "Couldn't connect you with our team — please try again.") });
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const message = replyText.trim();
    if (!message || !detail) return;
    const wasAiHandling = currentStatus === "ai_handling";
    setReplyState("sending");
    setReplyError(null);
    try {
      const { data } = await portalApi.replySupportInquiry(inquiryId, message);
      const d = data as InquiryDetail;
      setDetail(d);
      setReplyText("");
      setReplyState("idle");
      setNoHintShown(false);
      if (wasAiHandling && d.status === "ai_handling") {
        void pollForAiReply(d.replies.length);
      }
    } catch (err) {
      setReplyState("error");
      setReplyError(extractErrorMessage(err, "Couldn't send your reply — please try again."));
    }
  }

  return (
    <div className="space-y-4">
      <HelpNavBar />
      {loading && (
        <GlassCard>
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        </GlassCard>
      )}

      {loadError === "not_found" && (
        <GlassCard>
          <p className="text-base font-medium text-foreground mb-1">Ticket not found</p>
          <p className="text-sm text-muted-foreground">
            This conversation doesn&apos;t exist or isn&apos;t linked to your account.
          </p>
        </GlassCard>
      )}
      {loadError === "generic" && (
        <GlassCard>
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            Couldn&apos;t load this conversation — please try again.
          </p>
        </GlassCard>
      )}

      {detail && (
        <GlassCard>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-semibold text-foreground capitalize">
                  {CATEGORIES.find((c) => c.value === detail.category)?.label ?? detail.category}
                </span>
                <StatusPill status={meta.pill} label={meta.label} animated={false} />
              </div>
              <p className="text-sm text-muted-foreground/70 mt-0.5">Started {formatTimestamp(detail.created_at)}</p>
            </div>
            {showEscalate && (
              <button
                type="button"
                disabled={isSending}
                aria-busy={pendingAction === "escalate"}
                onClick={handleEscalate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/40 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 shrink-0"
              >
                <Headset size={14} />
                {pendingAction === "escalate" ? "Connecting…" : "Talk to a person"}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="max-w-[85%] ml-auto">
              <p className="text-sm font-medium text-foreground text-right">You</p>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 mt-1">
                <p className="text-sm text-foreground">{detail.message}</p>
              </div>
              <p className="text-sm text-muted-foreground/70 mt-0.5 text-right">{formatTimestamp(detail.created_at)}</p>
            </div>

            {detail.replies.map((r) => (
              <div key={r.id} className="max-w-[85%]">
                <ReplyAuthorBadge reply={r} />
                <div className="bg-foreground/[0.04] border border-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 mt-1">
                  <p className="text-sm text-foreground">{r.message}</p>
                </div>
                <p className="text-sm text-muted-foreground/70 mt-0.5">{formatTimestamp(r.created_at)}</p>
              </div>
            ))}

            {polling && <TypingIndicator />}

            {currentStatus === "closed" && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle size={14} />
                Marked as resolved — this ticket is closed.
              </div>
            )}

            {escalatedConfirmation && currentStatus !== "ai_handling" && (
              <div role="status" aria-live="polite" className="flex items-start gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                <Headset size={15} className="shrink-0 mt-0.5" />
                <span>
                  You&apos;re now talking to our team.
                  {escalatedConfirmation.slaDeadline
                    ? ` We typically respond by ${escalatedConfirmation.slaDeadline}.`
                    : " We'll get back to you here and by email."}
                </span>
              </div>
            )}

            {showYesNo && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p id={questionId} className="text-sm font-medium text-foreground">
                    Did this resolve your issue?
                  </p>
                  <button
                    type="button"
                    disabled={isSending}
                    aria-describedby={questionId}
                    aria-busy={pendingAction === "yes"}
                    onClick={() => handleResolved(true)}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {pendingAction === "yes" ? "Saving…" : "Yes"}
                  </button>
                  <button
                    type="button"
                    disabled={isSending}
                    aria-describedby={questionId}
                    aria-busy={pendingAction === "no"}
                    onClick={() => handleResolved(false)}
                    className="text-sm font-medium text-muted-foreground hover:underline disabled:opacity-50"
                  >
                    No
                  </button>
                </div>

                {noHintShown && currentStatus === "ai_handling" && (
                  <p className="text-sm text-muted-foreground">Tell us more below and we&apos;ll take another look.</p>
                )}
                {isLastAiTurn && (
                  <p className="text-sm text-muted-foreground">
                    This is the AI&apos;s final attempt — if it doesn&apos;t help, you&apos;ll be connected with our team automatically.
                  </p>
                )}
                {actionError && (
                  <p role="alert" aria-live="polite" className="text-sm text-destructive">
                    {actionError.message}
                  </p>
                )}
              </div>
            )}
            {!showYesNo && actionError && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {actionError.message}
              </p>
            )}

            {currentStatus !== "closed" && (
              <form onSubmit={handleReply} className="flex items-start gap-2 pt-1">
                <textarea
                  ref={replyTextareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply…"
                  rows={2}
                  aria-label="Reply to this ticket"
                  className="flex-1 bg-foreground/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground resize-none"
                />
                <button
                  type="submit"
                  disabled={replyState === "sending" || !replyText.trim()}
                  aria-busy={replyState === "sending"}
                  aria-label="Send reply"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={13} />
                </button>
              </form>
            )}
            {replyState === "error" && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {replyError ?? "Couldn't send your reply — please try again."}
              </p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
