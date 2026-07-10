export default function SavingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-lg bg-foreground/[0.05]" />
          <div className="h-4 w-56 rounded bg-foreground/[0.03]" />
        </div>
        <div className="h-7 w-24 rounded-full bg-foreground/[0.04]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 rounded-xl bg-foreground/[0.04]" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-foreground/[0.04]" />
      <div className="h-52 rounded-xl bg-foreground/[0.04]" />
    </div>
  );
}
