"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Wrench, Sun, Moon } from "lucide-react";
import { createBooking, type CareBooking, type ServiceType, type TimeSlot } from "@/lib/careBooking";

type Step = "service" | "datetime" | "review";

const SERVICES: Array<{ id: ServiceType; label: string; description: string; icon: typeof Sparkles }> = [
  { id: "cleaning", label: "Cleaning", description: "Panel & system cleaning", icon: Sparkles },
  { id: "repair", label: "Repair Service", description: "Fault diagnosis & fix", icon: Wrench },
];

function nextNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function BookServiceDialog({
  onClose,
  onBooked,
}: {
  onClose: () => void;
  onBooked: (booking: CareBooking) => void;
}) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<ServiceType | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const days = useMemo(() => nextNDays(16), []);

  function confirm() {
    if (!service || !date || !slot) return;
    const booking = createBooking({ service, date, slot, contact, notes });
    onBooked(booking);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-[#0b1119] border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">
            {step === "service" && "Book a Service"}
            {step === "datetime" && "Select Date & Time"}
            {step === "review" && "Review Booking"}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white/80">
            <X size={18} />
          </button>
        </div>

        {step === "service" && (
          <div className="space-y-2">
            {SERVICES.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setService(id); setStep("datetime"); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-left"
              >
                <Icon size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-white font-medium">{label}</p>
                  <p className="text-white/50 text-sm">{description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "datetime" && (
          <div>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`text-xs py-2 rounded-lg border transition-colors ${
                    date === d
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 text-white/70 hover:border-white/25"
                  }`}
                >
                  {d.slice(5)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setSlot("morning")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                  slot === "morning" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"
                }`}
              >
                <Sun size={16} className="text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Morning</p>
                  <p className="text-white/50 text-xs">08:00 AM – 01:00 PM</p>
                </div>
              </button>
              <button
                onClick={() => setSlot("afternoon")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                  slot === "afternoon" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"
                }`}
              >
                <Moon size={16} className="text-indigo-300" />
                <div>
                  <p className="text-white text-sm font-medium">Afternoon</p>
                  <p className="text-white/50 text-xs">01:00 PM – 06:00 PM</p>
                </div>
              </button>
            </div>
            <p className="text-white/40 text-xs mt-4">
              You can reschedule or cancel this booking anytime before 24 hours of the service.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep("service")} className="flex-1 py-2 rounded-lg border border-white/10 text-white/70 text-sm">
                Back
              </button>
              <button
                disabled={!date || !slot}
                onClick={() => setStep("review")}
                className="flex-1 py-2 rounded-lg bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "review" && service && date && slot && (
          <div>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact number"
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30"
            />
            <dl className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between"><dt className="text-white/50">Service</dt><dd className="text-white">{service === "cleaning" ? "Cleaning" : "Repair Service"}</dd></div>
              <div className="flex justify-between"><dt className="text-white/50">Date</dt><dd className="text-white">{date}</dd></div>
              <div className="flex justify-between"><dt className="text-white/50">Time Slot</dt><dd className="text-white">{slot === "morning" ? "Morning" : "Afternoon"}</dd></div>
              <div className="flex justify-between"><dt className="text-white/50">Contact</dt><dd className="text-white">{contact || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-white/50">Notes</dt><dd className="text-white">{notes || "—"}</dd></div>
            </dl>
            <div className="flex gap-2">
              <button onClick={() => setStep("datetime")} className="flex-1 py-2 rounded-lg border border-white/10 text-white/70 text-sm">
                Back
              </button>
              <button onClick={confirm} className="flex-1 py-2 rounded-lg bg-emerald-500 text-black font-semibold text-sm">
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
