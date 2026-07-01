"use client";

export default function SavingsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass rounded-xl p-8 text-center space-y-4">
      <p className="text-sm text-red-400">Failed to load savings data.</p>
      <p className="text-xs text-white/30">{error.message}</p>
      <button
        onClick={reset}
        className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
