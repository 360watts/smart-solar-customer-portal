"use client";

import { m } from "framer-motion";
import { Battery, CalendarClock, Gauge, Sparkles } from "lucide-react";

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
}

// Four real jobs-to-be-done, no overlap: today's snapshot, a status check,
// troubleshooting, and forward-looking — the last swapped from an earlier
// "how am I doing this month" (redundant with the History page's own charts)
// to a forecast question, since forecasting is genuinely something a
// conversational interface answers better than a chart does.
const PROMPTS = [
  { icon: Gauge, label: "How much did I generate today?" },
  { icon: Sparkles, label: "Is my system healthy?" },
  { icon: Battery, label: "Why is my battery low?" },
  { icon: CalendarClock, label: "Will I generate enough tomorrow?" },
];

export default function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-3.5 pb-3">
      {PROMPTS.map(({ icon: Icon, label }) => (
        <m.button
          key={label}
          type="button"
          onClick={() => onSelect(label)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
        >
          <Icon size={12} />
          {label}
        </m.button>
      ))}
    </div>
  );
}
