"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck, ChevronDown, Send, CheckCircle, MessageCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { portalApi } from "@/lib/api";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Why does my dashboard sometimes show old data?",
    answer:
      "If your gateway loses its local connection, the dashboard automatically falls back to your inverter manufacturer's cloud service and shows \"Live · Via Cloud\" — data may lag by a few minutes. If it says \"Offline — Last Known\", we haven't received fresh readings from either source yet.",
  },
  {
    question: "How do I change my email or phone number?",
    answer:
      "Go to Profile → Edit profile. Changing either sends a one-time verification code to confirm it's really you before the change takes effect.",
  },
  {
    question: "How do I book a technician visit for a hardware issue?",
    answer:
      "Head to 360Care — you can schedule a service visit for panel, inverter, battery, or monitoring issues directly from there.",
  },
  {
    question: "Can I share my system with family members?",
    answer:
      "Yes — Profile → Site Members lets you invite others to view (or co-manage) your site.",
  },
  {
    question: "How do I turn off email or push alerts?",
    answer:
      "Profile → Contact & preferences has a toggle for each — tap one to enable or disable it immediately.",
  },
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "app", label: "App / Portal Issue" },
  { value: "other", label: "Other" },
];

const STATUS_META: Record<string, { label: string; pill: "active" | "warning" | "inactive" }> = {
  ai_handling: { label: "AI Assistant", pill: "active" },
  open: { label: "Open", pill: "warning" },
  in_progress: { label: "In Progress", pill: "active" },
  resolved: { label: "Resolved", pill: "inactive" },
  closed: { label: "Closed", pill: "inactive" },
};

interface InquiryListItem {
  id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
}

interface InquiryReply {
  id: number;
  author_name: string;
  is_staff_reply: boolean;
  is_ai_reply: boolean;
  message: string;
  created_at: string;
}

interface InquiryDetail extends Omit<InquiryListItem, "reply_count"> {
  replies: InquiryReply[];
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-3.5 text-left"
      >
        <span className="text-base font-medium text-foreground">{question}</span>
        <ChevronDown
          size={16}
          className="shrink-0 text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && <p className="text-sm text-muted-foreground pb-4 pr-6">{answer}</p>}
    </div>
  );
}

/** One inquiry row — collapsed shows category/status/preview; expanded loads
 * and shows the full reply thread plus a reply box. Thread is fetched lazily
 * (only on first expand) rather than upfront for every row in the list. */
function InquiryRow({ inquiry, onUpdated }: { inquiry: InquiryListItem; onUpdated: (updated: InquiryListItem) => void }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyState, setReplyState] = useState<"idle" | "sending" | "error">("idle");
  const [resolutionState, setResolutionState] = useState<"idle" | "sending" | "error">("idle");
  const currentStatus = detail?.status ?? inquiry.status;
  const meta = STATUS_META[currentStatus] ?? STATUS_META.open;

  // The AI's reply is generated in the background (see backend
  // _run_ai_reply_background) — it never comes back in the same response
  // that created the ticket or posted the customer's message. The portal has
  // no push channel (unlike the mobile app, which reuses the existing
  // TYPE_SUPPORT_REPLY FCM push), so it bridges the gap with a short,
  // bounded poll: up to 7 tries, 2s apart (~14s total), stopping the moment
  // a new reply appears or the status moves off ai_handling. Not continuous
  // background polling — only runs right after an action that could have
  // triggered a new AI turn.
  async function pollForAiReply(baselineReplyCount: number) {
    for (let i = 0; i < 7; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const { data } = await portalApi.getSupportInquiry(inquiry.id);
        const d = data as InquiryDetail;
        setDetail(d);
        if (d.status !== "ai_handling" || d.replies.length > baselineReplyCount) return;
      } catch {
        return;
      }
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      setLoadingDetail(true);
      try {
        const { data } = await portalApi.getSupportInquiry(inquiry.id);
        const d = data as InquiryDetail;
        setDetail(d);
        if (d.status === "ai_handling") {
          void pollForAiReply(d.replies.length);
        }
      } catch {
        // leave detail null — the thread section below just won't render
      } finally {
        setLoadingDetail(false);
      }
    }
  }

  async function handleResolved(resolved: boolean) {
    setResolutionState("sending");
    try {
      const { data } = await portalApi.markSupportInquiryResolved(inquiry.id, resolved);
      const { data: freshDetail } = await portalApi.getSupportInquiry(inquiry.id);
      setDetail(freshDetail as InquiryDetail);
      setResolutionState("idle");
      onUpdated({ ...inquiry, status: data.status });
    } catch {
      setResolutionState("error");
    }
  }

  async function handleEscalate() {
    setResolutionState("sending");
    try {
      const { data } = await portalApi.escalateSupportInquiry(inquiry.id);
      setDetail(data as InquiryDetail);
      setResolutionState("idle");
      onUpdated({ ...inquiry, status: data.status });
    } catch {
      setResolutionState("error");
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const message = replyText.trim();
    if (!message) return;
    const wasAiHandling = currentStatus === "ai_handling";
    setReplyState("sending");
    try {
      const { data } = await portalApi.replySupportInquiry(inquiry.id, message);
      const d = data as InquiryDetail;
      setDetail(d);
      setReplyText("");
      setReplyState("idle");
      onUpdated({ ...inquiry, status: d.status, reply_count: d.replies.length });
      // This was the customer's elaboration on an AI turn — the AI's turn-2
      // reply is backgrounded too, so poll for it the same way toggle() does.
      if (wasAiHandling && d.status === "ai_handling") {
        void pollForAiReply(d.replies.length);
      }
    } catch {
      setReplyState("error");
    }
  }

  return (
    <div className="border-b border-border last:border-b-0 py-3">
      <button onClick={toggle} className="w-full flex items-start justify-between gap-3 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground capitalize">
              {CATEGORIES.find((c) => c.value === inquiry.category)?.label ?? inquiry.category}
            </span>
            <StatusPill status={meta.pill} label={meta.label} animated={false} />
            {inquiry.reply_count > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle size={11} /> {inquiry.reply_count}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{inquiry.message}</p>
        </div>
        <ChevronDown
          size={15}
          className="shrink-0 text-muted-foreground transition-transform mt-1"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="mt-3 pl-3 border-l border-border space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">You</p>
            <p className="text-sm text-muted-foreground">{inquiry.message}</p>
            <p className="text-sm text-muted-foreground/70 mt-0.5">{formatTimestamp(inquiry.created_at)}</p>
          </div>

          {loadingDetail && <p className="text-sm text-muted-foreground">Loading conversation…</p>}

          {detail?.replies.map((r) => (
            <div key={r.id}>
              <p className="text-sm font-medium text-foreground">{r.is_staff_reply ? "360watts Support" : r.author_name}</p>
              <p className="text-sm text-muted-foreground">{r.message}</p>
              <p className="text-sm text-muted-foreground/70 mt-0.5">{formatTimestamp(r.created_at)}</p>
            </div>
          ))}

          {currentStatus === "ai_handling" && detail && detail.replies.length > 0 && (
            <div className="space-y-2 pt-1">
              {detail.replies[detail.replies.length - 1].is_ai_reply && (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">Did this resolve your issue?</p>
                  <button
                    type="button"
                    disabled={resolutionState === "sending"}
                    onClick={() => handleResolved(true)}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    disabled={resolutionState === "sending"}
                    onClick={() => handleResolved(false)}
                    className="text-sm font-medium text-muted-foreground hover:underline disabled:opacity-50"
                  >
                    No
                  </button>
                </div>
              )}
              <button
                type="button"
                disabled={resolutionState === "sending"}
                onClick={handleEscalate}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                Talk to a person
              </button>
              {resolutionState === "error" && (
                <p className="text-sm text-destructive">Something went wrong — please try again.</p>
              )}
            </div>
          )}

          {inquiry.status !== "closed" && (
            <form onSubmit={handleReply} className="flex items-start gap-2 pt-1">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply…"
                rows={2}
                className="flex-1 bg-foreground/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground resize-none"
              />
              <button
                type="submit"
                disabled={replyState === "sending" || !replyText.trim()}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={13} />
              </button>
            </form>
          )}
          {replyState === "error" && (
            <p className="text-sm text-destructive">Couldn&apos;t send your reply — please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const [inquiries, setInquiries] = useState<InquiryListItem[] | null>(null);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  async function loadInquiries() {
    try {
      const { data } = await portalApi.getSupportInquiries();
      setInquiries(data as InquiryListItem[]);
    } catch {
      setInquiries([]);
    } finally {
      setInquiriesLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInquiries();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setState("sending");
    try {
      await portalApi.createSupportInquiry(category, message.trim());
      setState("sent");
      setMessage("");
      void loadInquiries();
    } catch {
      setState("error");
    }
  }

  function handleInquiryUpdated(updated: InquiryListItem) {
    setInquiries((prev) => (prev ? prev.map((i) => (i.id === updated.id ? updated : i)) : prev));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title mb-1">Help &amp; Support</h1>
        <p className="text-muted-foreground text-base">
          Answers to common questions, and a direct line to us if you need more.
        </p>
      </div>

      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Frequently asked questions
        </h2>
        <div className="mt-3">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Hardware issue?
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Panel, inverter, battery, or monitoring problems are handled through{" "}
          <Link href="/care" className="text-primary underline underline-offset-2">
            360Care
          </Link>{" "}
          — you can schedule a technician visit there directly.
        </p>
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Report an issue
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Account, billing, or app problems — tell us what&apos;s going on and our team will follow up here and by email.
        </p>

        {state === "sent" ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
            <CheckCircle size={16} />
            Thanks — we&apos;ve received your message and will get back to you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    category === c.value
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what's happening..."
              rows={4}
              className="w-full bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground resize-none"
            />
            {state === "error" && (
              <p className="text-sm text-destructive">Something went wrong sending your message — please try again.</p>
            )}
            <button
              type="submit"
              disabled={state === "sending" || !message.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {state === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </GlassCard>

      {(inquiriesLoading || (inquiries && inquiries.length > 0)) && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Your messages
          </h2>
          {inquiriesLoading ? (
            <p className="text-sm text-muted-foreground mt-3">Loading…</p>
          ) : (
            <div className="mt-2">
              {inquiries!.map((inquiry) => (
                <InquiryRow key={inquiry.id} inquiry={inquiry} onUpdated={handleInquiryUpdated} />
              ))}
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Prefer email? Reach us directly at{" "}
            <a href="mailto:hello@360watts.com" className="text-primary underline underline-offset-2">
              hello@360watts.com
            </a>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
