// Shared types/helpers/components between the ticket list (page.tsx) and the
// dedicated conversation view ([id]/page.tsx) — leading underscore keeps
// Next.js from treating this as a route segment.

import Link from "next/link";
import { ArrowLeft, Headset, MessageCirclePlus, Sparkles } from "lucide-react";

/** Persistent wayfinding for the two non-list /help pages (a conversation,
 * the composer) — each used to carry its own dead-end "back" link with no
 * way to jump anywhere else, so getting from one conversation to another, or
 * from the composer to an existing conversation, meant funneling back
 * through the list every time.
 *
 * This is a plain component, not a Next.js layout.tsx, on purpose: a nested
 * layout tied to a real path segment (as opposed to a route-group layout
 * like (portal)/layout.tsx, which doesn't add a URL segment) is the first of
 * its kind in this app, and Next 16.2.9's generated route-type validator
 * (.next/dev/types/validator.ts) fails to type-check its own LayoutConfig
 * generic once LayoutRoutes has more than one member — a framework-level
 * typegen limitation, not something fixable from this file. A shared
 * component gets the identical UX without touching route config. */
export function HelpNavBar({ showNewLink = true }: { showNewLink?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <Link href="/help" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
        <ArrowLeft size={16} /> Help &amp; Support
      </Link>
      {showNewLink && (
        <Link
          href="/help/new"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          <MessageCirclePlus size={14} />
          New conversation
        </Link>
      )}
    </div>
  );
}

export const CATEGORIES: { value: string; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "app", label: "App / Portal Issue" },
  { value: "other", label: "Other" },
];

export const STATUS_META: Record<string, { label: string; pill: "active" | "warning" | "inactive" }> = {
  ai_handling: { label: "AI Assistant", pill: "active" },
  open: { label: "Open", pill: "warning" },
  in_progress: { label: "In Progress", pill: "active" },
  resolved: { label: "Resolved", pill: "inactive" },
  closed: { label: "Closed", pill: "inactive" },
};

export const CLOSED_STATUSES = new Set(["resolved", "closed"]);

export interface InquiryListItem {
  id: number;
  category: string;
  message: string;
  status: string;
  sla_due_at: string | null;
  ai_turn_count: number;
  max_ai_turns: number;
  created_at: string;
  updated_at: string;
  reply_count: number;
}

export interface InquiryReply {
  id: number;
  author_name: string;
  is_staff_reply: boolean;
  is_ai_reply: boolean;
  message: string;
  created_at: string;
}

export interface InquiryDetail extends Omit<InquiryListItem, "reply_count"> {
  replies: InquiryReply[];
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatSlaDeadline(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Backend always returns `error_response(message, ...)` on failure — surface
 * that exact message (e.g. "This inquiry is already with staff.") instead of
 * a generic one, falling back only when the shape doesn't match. */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const message =
    err && typeof err === "object" && "response" in err
      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
      : undefined;
  return message ?? fallback;
}

export function ReplyAuthorBadge({ reply }: { reply: InquiryReply }) {
  if (reply.is_ai_reply) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
        <Sparkles size={12} className="text-primary" aria-hidden="true" />
        {reply.author_name}
      </span>
    );
  }
  if (reply.is_staff_reply) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
        <Headset size={12} className="text-emerald-400" aria-hidden="true" />
        360watts Support
      </span>
    );
  }
  return <span className="text-sm font-medium text-foreground">{reply.author_name}</span>;
}

// ─── Unread tracking ────────────────────────────────────────────────────────
// No backend "read" state exists for support tickets, and adding one is more
// than this needs — a per-user localStorage map of ticket id → last-viewed
// timestamp is enough to drive an unread dot on the list, and degrades to
// "nothing is ever unread" (never wrong, just less helpful) if storage is
// unavailable (SSR, private browsing) rather than throwing.
const LAST_VIEWED_KEY = "360watts:support-last-viewed";

function readLastViewedMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LAST_VIEWED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function isInquiryUnread(inquiry: InquiryListItem): boolean {
  // A ticket with no replies yet has nothing new to "catch up" on — the
  // customer just filed it themselves.
  if (inquiry.reply_count === 0) return false;
  const lastViewed = readLastViewedMap()[inquiry.id];
  if (!lastViewed) return true;
  return new Date(inquiry.updated_at).getTime() > new Date(lastViewed).getTime();
}

export function markInquiryViewed(id: number) {
  if (typeof window === "undefined") return;
  try {
    const map = readLastViewedMap();
    map[id] = new Date().toISOString();
    window.localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private browsing, quota) — unread state just
    // won't persist across visits; not worth surfacing an error for.
  }
}

// ─── New-ticket draft persistence ──────────────────────────────────────────
// One slot, not per-category — this is a single "start a conversation" form,
// not multiple concurrent drafts. Saves an accidental back-navigation or a
// session hiccup from losing what the customer already typed (a customer
// describing a billing dispute or an outage isn't someone who wants to
// re-type it from scratch).
const DRAFT_KEY = "360watts:support-new-draft";

export interface SupportDraft {
  category: string;
  message: string;
}

export function readSupportDraft(): SupportDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as SupportDraft) : null;
  } catch {
    return null;
  }
}

export function saveSupportDraft(draft: SupportDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Best-effort — losing draft persistence isn't worth surfacing an error.
  }
}

export function clearSupportDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // no-op
  }
}
