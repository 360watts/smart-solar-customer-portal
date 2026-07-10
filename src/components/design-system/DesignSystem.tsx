"use client";

/**
 * 360watts App design system — component implementations.
 *
 * Built directly from the Figma file (OEIt8xV5NZXmMMk1GnofqP):
 *   - Colour Scheme (node 1218-201) — exact hex ramps in
 *     ../../styles/design-system-tokens.css
 *   - Typography (node 1076-1579) — Inter, H1-H6 + Body Lg/Md/Sm/ExSm
 *   - Component Library (node 1284-561) — Avatar, Badge, Button, Button
 *     Group, Checkbox, Input, Label, Menu, Progress Bar/Circle, Radio,
 *     Snackbar, Switch, Tab Bar, Tag
 *   - Icon Library (node 1076-1580) — mapped to lucide-react equivalents
 *     (same outline-icon register; no custom SVG assets were vendored)
 *
 * Self-contained: reads only --ds-* tokens (design-system-tokens.css),
 * never the portal's --primary/--foreground/etc "Solar Noir" tokens, so it
 * can be dropped into any page via the [data-ds-scope] wrapper without
 * affecting or being affected by the rest of the app's theme.
 */

import React, { useState } from "react";
import {
  Check, ChevronRight, X, Info, AlertTriangle, CheckCircle2, Home, User,
} from "lucide-react";

const font = { fontFamily: "var(--font-inter), sans-serif" };

// ─── Typography ──────────────────────────────────────────────────────────────

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export function Heading({
  level, weight = "bold", children, className = "",
}: { level: HeadingLevel; weight?: "bold" | "semibold"; children: React.ReactNode; className?: string }) {
  const Tag = level;
  return (
    <Tag
      className={className}
      style={{
        ...font,
        fontSize: `var(--ds-${level}-size)`,
        lineHeight: `var(--ds-${level}-line)`,
        fontWeight: weight === "bold" ? 700 : 600,
        color: "var(--ds-text-heading)",
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {children}
    </Tag>
  );
}

type BodySize = "lg" | "md" | "sm" | "xs";
export function Text({
  size = "md", weight = "regular", children, className = "", style,
}: { size?: BodySize; weight?: "semibold" | "medium" | "regular"; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <p
      className={className}
      style={{
        ...font,
        fontSize: `var(--ds-body-${size === "xs" ? "xs" : size}-size)`,
        lineHeight: `var(--ds-body-${size === "xs" ? "xs" : size}-line)`,
        fontWeight: weight === "semibold" ? 600 : weight === "medium" ? 500 : 400,
        color: "var(--ds-text-body)",
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}
export function Button({ variant = "primary", size = "md", className = "", children, style, ...rest }: ButtonProps) {
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "13px 26px", fontSize: 15 } }[size];
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--ds-cta)", color: "#ffffff", border: "1px solid transparent" },
    secondary: { background: "var(--ds-primary)", color: "#ffffff", border: "1px solid transparent" },
    outline: { background: "transparent", color: "var(--ds-text-heading)", border: "1px solid var(--ds-border)" },
    ghost: { background: "transparent", color: "var(--ds-cta)", border: "1px solid transparent" },
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
      style={{ ...font, ...sizes, ...variants[variant], borderRadius: "var(--ds-radius-sm)", ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-sm)" }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="cursor-pointer transition-colors"
            style={{
              ...font, fontSize: 13, fontWeight: 600, padding: "8px 16px",
              background: active ? "var(--ds-primary)" : "transparent",
              color: active ? "#ffffff" : "var(--ds-text-heading)",
              borderRight: "1px solid var(--ds-border)",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Badge / Tag ─────────────────────────────────────────────────────────────

type Tone = "primary" | "success" | "warning" | "error" | "neutral";
const TONE_BG: Record<Tone, string> = {
  primary: "var(--ds-primary-100)", success: "var(--ds-success-100)",
  warning: "var(--ds-warning-100)", error: "var(--ds-error-100)", neutral: "var(--ds-neutral-100)",
};
const TONE_FG: Record<Tone, string> = {
  primary: "var(--ds-primary-700)", success: "var(--ds-success-700)",
  warning: "var(--ds-warning-700)", error: "var(--ds-error-700)", neutral: "var(--ds-neutral-700)",
};

export function Tag({ tone = "primary", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{ ...font, fontSize: 12, fontWeight: 600, padding: "3px 10px", background: TONE_BG[tone], color: TONE_FG[tone] }}
    >
      {children}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{ ...font, width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, var(--ds-primary), var(--ds-primary-700))` }}
    >
      {initials}
    </div>
  );
}
export function AvatarGroup({ initialsList }: { initialsList: string[] }) {
  return (
    <div className="flex items-center">
      {initialsList.map((n, i) => (
        <div key={n} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: initialsList.length - i }}>
          <div style={{ border: "2px solid var(--ds-bg)", borderRadius: "9999px" }}>
            <Avatar initials={n} size={34} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Field / Label / Input ───────────────────────────────────────────────────

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span style={{ ...font, fontSize: 13, fontWeight: 600, color: "var(--ds-text-heading)" }}>{children}</span>
      {hint && <Info size={12} style={{ color: "var(--ds-neutral-400)" }} />}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hintText?: string;
  error?: string;
}
export function Input({ label, hintText, error, className = "", style, ...rest }: InputProps) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        className={`w-full outline-none transition-colors ${className}`}
        style={{
          ...font, fontSize: 14, padding: "10px 14px",
          border: `1px solid ${error ? "var(--ds-error)" : "var(--ds-border)"}`,
          borderRadius: "var(--ds-radius-sm)", background: "var(--ds-card)", color: "var(--ds-text-heading)",
          ...style,
        }}
        {...rest}
      />
      {(hintText || error) && (
        <Text size="xs" className="mt-1" style={{ color: error ? "var(--ds-error)" : "var(--ds-neutral-400)" }}>
          {error ?? hintText}
        </Text>
      )}
    </div>
  );
}

export function Textarea({ label, rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea
        rows={rows}
        placeholder="Placeholder Text"
        className="w-full outline-none resize-none"
        style={{ ...font, fontSize: 14, padding: "10px 14px", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-sm)", background: "var(--ds-card)", color: "var(--ds-text-heading)" }}
      />
    </div>
  );
}

// ─── Switch / Checkbox / Radio ───────────────────────────────────────────────

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center cursor-pointer transition-colors"
      style={{ width: 40, height: 22, borderRadius: 999, background: checked ? "var(--ds-primary)" : "var(--ds-neutral-200)" }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-transform"
        style={{ width: 16, height: 16, left: 3, transform: checked ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
        className="flex items-center justify-center transition-colors"
        style={{
          width: 18, height: 18, borderRadius: 5,
          border: `1.5px solid ${checked ? "var(--ds-primary)" : "var(--ds-border)"}`,
          background: checked ? "var(--ds-primary)" : "transparent",
        }}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </span>
      {label && <Text size="sm" weight="medium" style={{ color: "var(--ds-text-heading)" }}>{label}</Text>}
    </label>
  );
}

export function RadioButton({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none" onClick={onChange}>
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${checked ? "var(--ds-primary)" : "var(--ds-border)"}` }}
      >
        {checked && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--ds-primary)" }} />}
      </span>
      {label && <Text size="sm" weight="medium" style={{ color: "var(--ds-text-heading)" }}>{label}</Text>}
    </label>
  );
}

// ─── Progress bar / circle ────────────────────────────────────────────────────

export function ProgressBar({ pct, tone = "primary" }: { pct: number; tone?: Tone }) {
  const fg = tone === "primary" ? "var(--ds-primary)" : TONE_FG[tone];
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "var(--ds-neutral-100)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: fg }} />
    </div>
  );
}

export function ProgressCircle({ pct, tone = "primary", size = 88 }: { pct: number; tone?: Tone; size?: number }) {
  const fg = tone === "primary" ? "var(--ds-primary)" : TONE_FG[tone];
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ds-neutral-100)" strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fg} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ ...font, fontSize: size * 0.2, fontWeight: 700, color: "var(--ds-text-heading)" }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Snackbar ────────────────────────────────────────────────────────────────

export function Snackbar({ title, message, tone = "primary", onClose }: { title: string; message: string; tone?: Tone; onClose?: () => void }) {
  const Icon = tone === "error" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;
  const accent = tone === "primary" ? "var(--ds-primary)" : TONE_FG[tone];
  return (
    <div
      className="flex flex-col gap-1.5 relative"
      style={{
        width: 280, padding: "12px 14px", borderRadius: "var(--ds-radius-sm)",
        background: "var(--ds-card)", border: "1px solid var(--ds-border)", borderLeft: `3px solid ${accent}`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-start gap-2">
        <Icon size={16} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="semibold" style={{ color: "var(--ds-text-heading)" }}>{title}</Text>
          <Text size="xs" className="mt-0.5">{message}</Text>
        </div>
        {onClose && (
          <button onClick={onClose} className="cursor-pointer shrink-0">
            <X size={14} style={{ color: "var(--ds-neutral-400)" }} />
          </button>
        )}
      </div>
      <button className="inline-flex items-center gap-0.5 self-start cursor-pointer" style={{ ...font, fontSize: 12, fontWeight: 600, color: accent }}>
        Learn More <ChevronRight size={12} />
      </button>
    </div>
  );
}

// ─── Menu item ───────────────────────────────────────────────────────────────

export function MenuItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors"
      style={{ background: active ? "var(--ds-primary-100)" : "transparent", borderRadius: "var(--ds-radius-sm)" }}
    >
      <Text size="sm" weight={active ? "semibold" : "regular"} style={{ color: active ? "var(--ds-primary-700)" : "var(--ds-text-heading)" }}>
        {label}
      </Text>
      <ChevronRight size={14} style={{ color: active ? "var(--ds-primary-700)" : "var(--ds-neutral-400)" }} />
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

export function TabBar({ items }: { items: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="inline-flex gap-1" style={{ borderBottom: "1px solid var(--ds-border)" }}>
      {items.map((item, i) => (
        <button
          key={item}
          onClick={() => setActive(i)}
          className="cursor-pointer relative"
          style={{
            ...font, fontSize: 14, fontWeight: 600, padding: "8px 4px", marginRight: 20,
            color: active === i ? "var(--ds-primary)" : "var(--ds-neutral-500)",
            borderBottom: active === i ? "2px solid var(--ds-primary)" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ─── Bottom nav (from the Icon Library sheet's nav icon row) ────────────────

export function BottomNav() {
  const items = [{ icon: Home, label: "Home" }, { icon: User, label: "Profile" }];
  const [active, setActive] = useState(0);
  return (
    <div className="inline-flex items-center gap-6 px-4 py-3" style={{ borderRadius: "var(--ds-radius-lg)", border: "1px solid var(--ds-border)", background: "var(--ds-card)" }}>
      {items.map((it, i) => (
        <button key={it.label} onClick={() => setActive(i)} className="flex flex-col items-center gap-1 cursor-pointer">
          <it.icon size={20} style={{ color: active === i ? "var(--ds-primary)" : "var(--ds-neutral-400)" }} />
          <span style={{ ...font, fontSize: 10, fontWeight: 600, color: active === i ? "var(--ds-primary)" : "var(--ds-neutral-400)" }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}
