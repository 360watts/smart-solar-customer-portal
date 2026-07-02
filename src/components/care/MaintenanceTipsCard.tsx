import GlassCard from "@/components/ui/GlassCard";
import type { MaintenanceTip } from "@/lib/care/types";

export default function MaintenanceTipsCard({ tips }: { tips: MaintenanceTip[] }) {
  if (tips.length === 0) return null;

  return (
    <GlassCard>
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-white/50 mb-4">Maintenance Tips</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tips.map((tip) => (
          <div
            key={tip.description}
            className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5"
          >
            <span className="text-lg leading-none shrink-0">{tip.icon}</span>
            <div className="min-w-0">
              <p className="text-white/80 text-sm">{tip.description}</p>
              <span className="inline-block mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                {tip.frequency}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
