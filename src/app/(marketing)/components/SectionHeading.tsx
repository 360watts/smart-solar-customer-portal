export function SectionHeading({ id, index, children }: { id?: string; index: number; children: React.ReactNode }) {
  return (
    <div className={`flex items-baseline gap-4 mb-5${id ? " scroll-mt-28" : ""}`} id={id}>
      <span
        className="font-[family-name:var(--font-fraunces)] text-[13px] sm:text-sm text-[#00a63e]/70 tabular-nums shrink-0"
        aria-hidden
      >
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="font-[family-name:var(--font-urbanist)] font-bold text-[22px] sm:text-[26px] md:text-[30px] text-[#0f2419] tracking-tight">
        {children}
      </h2>
    </div>
  );
}
