export function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-foreground/[0.06] ${className}`} />;
}

export default SkeletonPulse;
