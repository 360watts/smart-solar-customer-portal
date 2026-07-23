"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Wrench, Sun, Moon, ArrowRight } from "lucide-react";
import { portalApi, type ServiceBooking } from "@/lib/api";

type Step = "service" | "datetime" | "review";
type IssueCategory = ServiceBooking["issue_category"];
type PreferredSlot = ServiceBooking["preferred_slot"];

const STEPS: Step[] = ["service", "datetime", "review"];

const SERVICES: Array<{ id: IssueCategory; label: string; description: string; icon: typeof Sparkles }> = [
  { id: "cleaning", label: "Cleaning", description: "Panel & system cleaning", icon: Sparkles },
  { id: "other", label: "Repair Service", description: "Fault diagnosis & fix", icon: Wrench },
];

function nextNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: d.getDate(),
  };
}

export default function BookServiceDialog({
  siteId,
  onClose,
  onBooked,
}: {
  siteId: string;
  onClose: () => void;
  onBooked: (booking: ServiceBooking) => void;
}) {
  const [step, setStep] = useState<Step>("service");
  const [issueCategory, setIssueCategory] = useState<IssueCategory | null>(null);
  const [preferredDate, setPreferredDate] = useState<string | null>(null);
  const [preferredSlot, setPreferredSlot] = useState<PreferredSlot | "">("");
  const [notes, setNotes] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => nextNDays(14), []);
  const stepIndex = STEPS.indexOf(step);

  // Prefetch the account's registered number so we can tell the customer
  // who our team will call, without asking them to re-type it.
  useEffect(() => {
    let cancelled = false;
    portalApi
      .getProfile()
      .then((res) => {
        if (!cancelled) setOwnerPhone(res.data?.mobile_number ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    if (!issueCategory) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await portalApi.createServiceBooking({
        site_id: siteId,
        issue_category: issueCategory,
        issue_description: notes,
        ...(preferredDate ? { preferred_date: preferredDate } : {}),
        ...(preferredSlot ? { preferred_slot: preferredSlot } : {}),
      });
      onBooked(data);
    } catch (err) {
      const backendMessage =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      console.error("Booking submission failed:", err);
      setError(backendMessage ?? "Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-[#0b1119] border border-border p-6"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-foreground font-semibold text-lg">
            {step === "service" && "Book a Service"}
            {step === "datetime" && "When works for you?"}
            {step === "review" && "Review Request"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= stepIndex ? "bg-emerald-500" : "bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "service" && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {SERVICES.map(({ id, label, description, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setIssueCategory(id); setStep("datetime"); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-left cursor-pointer"
                >
                  <Icon size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">{label}</p>
                    <p className="text-muted-foreground text-sm">{description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === "datetime" && (
            <motion.div
              key="datetime"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-muted-foreground text-xs mb-3">
                Tell us a date &amp; time you&apos;d prefer — our team will call to confirm the
                exact slot with a technician.
              </p>

              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {days.map((d) => {
                  const { weekday, day } = formatDay(d);
                  const active = preferredDate === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setPreferredDate(active ? null : d)}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                        active
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                          : "border-border text-muted-foreground hover:border-emerald-500/25 hover:text-foreground"
                      }`}
                    >
                      <span className="text-[10px] uppercase opacity-70">{weekday}</span>
                      <span className="font-semibold">{day}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setPreferredSlot(preferredSlot === "morning" ? "" : "morning")}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    preferredSlot === "morning" ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                  }`}
                >
                  <Sun size={16} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-foreground text-sm font-medium">Morning</p>
                    <p className="text-muted-foreground text-xs">08:00 AM – 01:00 PM</p>
                  </div>
                </button>
                <button
                  onClick={() => setPreferredSlot(preferredSlot === "afternoon" ? "" : "afternoon")}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    preferredSlot === "afternoon" ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                  }`}
                >
                  <Moon size={16} className="text-indigo-300 shrink-0" />
                  <div>
                    <p className="text-foreground text-sm font-medium">Afternoon</p>
                    <p className="text-muted-foreground text-xs">01:00 PM – 06:00 PM</p>
                  </div>
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("service")} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm cursor-pointer">
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 text-black font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {preferredDate || preferredSlot ? "Continue" : "Skip — any time"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "review" && issueCategory && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the issue (optional)"
                rows={3}
                className="w-full mb-3 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground/70"
              />
              <dl className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service</dt>
                  <dd className="text-foreground">{issueCategory === "cleaning" ? "Cleaning" : "Repair Service"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Preferred date</dt>
                  <dd className="text-foreground">{preferredDate ?? "Flexible"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Preferred time</dt>
                  <dd className="text-foreground">
                    {preferredSlot === "morning" ? "Morning" : preferredSlot === "afternoon" ? "Afternoon" : "Flexible"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Callback number</dt>
                  <dd className="text-foreground">{ownerPhone || "On file"}</dd>
                </div>
              </dl>
              <p className="text-muted-foreground text-xs mb-4">
                Our team will call you to confirm a technician and schedule a visit date &amp; time.
              </p>
              {error && <p className="text-destructive text-xs mb-3">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep("datetime")} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm cursor-pointer">
                  Back
                </button>
                <button
                  onClick={confirm}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 disabled:opacity-40 text-black font-semibold text-sm cursor-pointer"
                >
                  {submitting ? "Submitting…" : "Confirm Request"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
