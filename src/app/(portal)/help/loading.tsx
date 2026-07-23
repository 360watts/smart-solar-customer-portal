export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-foreground/[0.06]" />
      <div className="h-64 rounded-2xl bg-foreground/[0.04]" />
      <div className="h-48 rounded-2xl bg-foreground/[0.04]" />
    </div>
  );
}
