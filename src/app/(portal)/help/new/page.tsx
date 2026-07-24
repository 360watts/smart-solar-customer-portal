"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { portalApi } from "@/lib/api";
import { CATEGORIES, extractErrorMessage, readSupportDraft, saveSupportDraft, clearSupportDraft, HelpNavBar } from "../_shared";

// A message this short usually means the AI won't have enough to act on and
// will just ask a clarifying question — burning one of only 2 AI turns before
// forced escalation. Soft nudge, not a hard minimum: never blocks sending.
const SHORT_MESSAGE_THRESHOLD = 15;

export default function NewSupportInquiryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");

  const [category, setCategory] = useState(
    () => CATEGORIES.find((c) => c.value === requestedCategory)?.value ?? CATEGORIES[0].value,
  );
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const restoredDraft = useRef(false);

  // Restore an in-progress draft once on mount (e.g. the customer navigated
  // away mid-message and came back) — a lazy initializer can't reach into
  // localStorage safely during SSR, so this runs post-hydration instead.
  useEffect(() => {
    if (restoredDraft.current) return;
    restoredDraft.current = true;
    const draft = readSupportDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft?.message) setMessage(draft.message);
    if (draft?.category) setCategory(draft.category);
    textareaRef.current?.focus();
  }, []);

  // Autosave on every change rather than requiring an explicit "save draft"
  // action — the customer is describing a problem, not filling out a form
  // they think of as having a save step.
  useEffect(() => {
    if (!message.trim()) {
      clearSupportDraft();
      return;
    }
    saveSupportDraft({ category, message });
  }, [category, message]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setState("sending");
    setSendError(null);
    try {
      const { data } = await portalApi.createSupportInquiry(category, message.trim());
      clearSupportDraft();
      // Land the customer directly in the new conversation — the whole point
      // of asking "what's wrong" is to start talking about it, not to file a
      // form and be left looking at a static confirmation.
      router.push(`/help/${(data as { id: number }).id}`);
    } catch (err) {
      setState("error");
      setSendError(extractErrorMessage(err, "Something went wrong sending your message — please try again."));
    }
  }

  const showShortMessageHint = message.trim().length > 0 && message.trim().length < SHORT_MESSAGE_THRESHOLD;

  return (
    <div className="space-y-4">
      <HelpNavBar showNewLink={false} />
      <GlassCard>
        <h1 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
          New message
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Account, billing, or app problems — tell us what&apos;s going on and our team will follow up here and by email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">What&apos;s this about?</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
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
          </div>

          <div>
            <label htmlFor="support-message" className="text-sm font-medium text-foreground mb-2 block">
              Describe what&apos;s happening
            </label>
            <textarea
              id="support-message"
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. My savings page hasn't updated in a week, or my last bill looks off..."
              rows={6}
              className="w-full bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground resize-none"
            />
            {showShortMessageHint && (
              <p className="text-sm text-muted-foreground mt-1.5">
                A bit more detail helps our AI assistant get you a useful answer on the first try.
              </p>
            )}
          </div>

          {state === "error" && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              {sendError}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "sending" || !message.trim()}
            aria-busy={state === "sending"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {state === "sending" ? "Sending…" : "Start conversation"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
