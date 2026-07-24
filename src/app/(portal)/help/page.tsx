"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck, ChevronDown, ChevronRight, MessageCirclePlus, MessageCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusPill from "@/components/ui/StatusPill";
import { portalApi } from "@/lib/api";
import {
  CATEGORIES,
  STATUS_META,
  CLOSED_STATUSES,
  type InquiryListItem,
  formatTimestamp,
  isInquiryUnread,
} from "./_shared";

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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={answerId}
        className="w-full flex items-center justify-between gap-4 py-3.5 text-left"
      >
        <span className="text-base font-medium text-foreground">{question}</span>
        <ChevronDown
          size={16}
          className="shrink-0 text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <p id={answerId} className="text-sm text-muted-foreground pb-4 pr-6">
          {answer}
        </p>
      )}
    </div>
  );
}

/** One row in the ticket list — a plain link into the dedicated conversation
 * view at /help/[id], not an inline accordion. A list this size (a customer
 * can accumulate tickets over months/years) needs to stay skimmable: status,
 * unread state, and a preview, nothing else competing for attention here. */
function InquiryListRow({ inquiry }: { inquiry: InquiryListItem }) {
  const meta = STATUS_META[inquiry.status] ?? STATUS_META.open;
  const unread = isInquiryUnread(inquiry);
  return (
    <Link
      href={`/help/${inquiry.id}`}
      className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-b-0 hover:bg-foreground/[0.03] -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="min-w-0 flex items-start gap-2.5">
        {unread ? (
          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-label="Unread reply" />
        ) : (
          <span className="mt-1.5 w-2 h-2 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm capitalize ${unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
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
          <p className="text-sm text-muted-foreground/70 mt-0.5">{formatTimestamp(inquiry.updated_at)}</p>
        </div>
      </div>
      <ChevronRight size={15} className="shrink-0 text-muted-foreground mt-1.5" />
    </Link>
  );
}

function ClosedTicketsDisclosure({ inquiries }: { inquiries: InquiryListItem[] }) {
  const [open, setOpen] = useState(false);
  if (inquiries.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <span>Closed ({inquiries.length})</span>
        <ChevronDown size={14} className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div>
          {inquiries.map((inquiry) => (
            <InquiryListRow key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
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

  const openInquiries = (inquiries ?? []).filter((i) => !CLOSED_STATUSES.has(i.status));
  const closedInquiries = (inquiries ?? []).filter((i) => CLOSED_STATUSES.has(i.status));

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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Chat with us
            </h2>
            <p className="text-sm text-muted-foreground">
              Account, billing, or app problems — tell us what&apos;s going on and our team will follow up here and by email.
            </p>
          </div>
          <Link
            href="/help/new"
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors"
          >
            <MessageCirclePlus size={16} />
            Start a conversation
          </Link>
        </div>
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
              {openInquiries.length === 0 && closedInquiries.length > 0 && (
                <p className="text-sm text-muted-foreground py-2">No open tickets.</p>
              )}
              {openInquiries.map((inquiry) => (
                <InquiryListRow key={inquiry.id} inquiry={inquiry} />
              ))}
              <ClosedTicketsDisclosure inquiries={closedInquiries} />
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
