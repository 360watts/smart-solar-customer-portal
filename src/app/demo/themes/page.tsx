"use client";

/**
 * Theme variant lab — review page, not shipped UI.
 * Visit /demo/themes on localhost. Ten complete light+dark direction
 * candidates (five exploratory + five premium/elegance-first), each fully
 * self-contained (own palette + font pairing + radius, scoped local styles —
 * none of this touches the real app tokens in globals.css). Pick one, and
 * I'll build it out as the real theme system.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Sun, Zap, TrendingUp, Cloud, ChevronDown, Cpu,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Palette definitions — each variant is a complete, independent design
// system: background, surface, text tiers, one primary + one secondary
// accent, border, and a font pairing. Nothing here reads from globals.css.
// ---------------------------------------------------------------------------
interface Palette {
  bg: string;
  sidebarBg: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryContrast: string;
  secondary: string;
  chip: string;
}

interface Variant {
  id: string;
  name: string;
  tagline: string;
  displayFont: string;
  bodyFont: string;
  /** Card corner radius in px — part of each system's personality, not just color. */
  radius?: number;
  dark: Palette;
  light: Palette;
}

const VARIANTS: Variant[] = [
  {
    id: "ember",
    name: "Ember & Slate",
    tagline:
      "Warm terracotta/ember replaces the generic fintech green as the primary accent — reads as \"sun-powered warmth\" rather than \"banking app.\" Deep charcoal-slate dark mode (not navy-black); warm linen light mode instead of clinical white.",
    displayFont: "var(--font-urbanist)",
    bodyFont: "var(--font-figtree)",
    dark: {
      bg: "#1A1614", sidebarBg: "#211B18", card: "#241E1B", border: "rgba(255,236,220,0.08)",
      text: "#F5EDE6", textMuted: "#B8A99E",
      primary: "#E8703A", primaryContrast: "#1A1614", secondary: "#4A9B8E", chip: "rgba(232,112,58,0.15)",
    },
    light: {
      bg: "#FBF6F0", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(60,40,25,0.09)",
      text: "#2B211B", textMuted: "#7A6A5D",
      primary: "#C6541C", primaryContrast: "#FFFFFF", secondary: "#2F7A6D", chip: "rgba(198,84,28,0.10)",
    },
  },
  {
    id: "circuit",
    name: "Deep Teal Circuit",
    tagline:
      "Leans into \"smart hardware control room\" instead of \"energy weather.\" Cyan-teal primary against true near-black dark mode; crisp cool-white light mode with a technical monospace-flavored nav. More precise, less organic than the current emerald direction.",
    displayFont: "var(--font-display)",
    bodyFont: "var(--font-nav)",
    dark: {
      bg: "#080F12", sidebarBg: "#0B1417", card: "#0F1B1F", border: "rgba(180,240,255,0.07)",
      text: "#E8F8FB", textMuted: "#7FA5AD",
      primary: "#22D3EE", primaryContrast: "#04191C", secondary: "#818CF8", chip: "rgba(34,211,238,0.13)",
    },
    light: {
      bg: "#F5FBFC", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(10,50,55,0.08)",
      text: "#0B2226", textMuted: "#5C7A80",
      primary: "#0E93A8", primaryContrast: "#FFFFFF", secondary: "#5257D0", chip: "rgba(14,147,168,0.10)",
    },
  },
  {
    id: "goldenhour",
    name: "Golden Hour",
    tagline:
      "Fully commits to solar: gold/amber becomes the primary (not a secondary accent), with deep umber-brown dark mode and warm ivory light mode. An editorial serif display face gives it a premium, considered feel rather than a dashboard-template one.",
    displayFont: "var(--font-fraunces)",
    bodyFont: "var(--font-poppins)",
    dark: {
      bg: "#211505", sidebarBg: "#2A1B08", card: "#2E1E0A", border: "rgba(255,224,160,0.10)",
      text: "#FBF1DE", textMuted: "#C4AC85",
      primary: "#F0AC3D", primaryContrast: "#211505", secondary: "#7FA894", chip: "rgba(240,172,61,0.16)",
    },
    light: {
      bg: "#FDF8ED", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(90,60,10,0.09)",
      text: "#2E2210", textMuted: "#8A7856",
      primary: "#B8790C", primaryContrast: "#FFFFFF", secondary: "#3F7A63", chip: "rgba(184,121,12,0.10)",
    },
  },
  {
    id: "graphite",
    name: "Graphite Frost",
    tagline:
      "Research note: Datadog/Supabase/Railway-style 2026 dark dashboards favor true greys over navy-black, plus one saturated accent (Radix's token model). True-neutral graphite dark mode, cool paper-white light mode, one confident indigo-blue accent — the most \"serious monitoring tool\" of the set, calmest and most legible for long sessions.",
    displayFont: "var(--font-display)",
    bodyFont: "var(--font-dm-sans)",
    dark: {
      bg: "#121212", sidebarBg: "#181818", card: "#1C1C1C", border: "rgba(255,255,255,0.08)",
      text: "#EDEDED", textMuted: "#8E8E8E",
      primary: "#5B8DEF", primaryContrast: "#0B1220", secondary: "#4ADE80", chip: "rgba(91,141,239,0.16)",
    },
    light: {
      bg: "#FAFAFA", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(20,20,20,0.09)",
      text: "#171717", textMuted: "#6B6B6B",
      primary: "#3B6FE0", primaryContrast: "#FFFFFF", secondary: "#1E9E5C", chip: "rgba(59,111,224,0.09)",
    },
  },
  {
    id: "twilight",
    name: "Twilight Mauve",
    tagline:
      "Inspired by tweakcn's most-bookmarked 2026 presets (\"Amethyst Haze\", \"Quantum Rose\") — a violet-rose twilight accent instead of the industry-default blue/green, evoking dusk/dawn solar hours. Deep plum-black dark mode, soft blush-white light mode. The most distinctive and least \"admin template\" of the five.",
    displayFont: "var(--font-urbanist)",
    bodyFont: "var(--font-biryani)",
    radius: 14,
    dark: {
      bg: "#181120", sidebarBg: "#1F1729", card: "#241B2E", border: "rgba(230,200,255,0.09)",
      text: "#F1E9F9", textMuted: "#AB9BBE",
      primary: "#B98CE8", primaryContrast: "#181120", secondary: "#E89CB0", chip: "rgba(185,140,232,0.16)",
    },
    light: {
      bg: "#FBF6FD", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(70,30,90,0.08)",
      text: "#2B1F35", textMuted: "#83718F",
      primary: "#8A4FCB", primaryContrast: "#FFFFFF", secondary: "#C6577A", chip: "rgba(138,79,203,0.09)",
    },
  },

  // ── Premium set — elegance-first directions (variants 6–10) ────────────────
  {
    id: "champagne",
    name: "Champagne Onyx",
    tagline:
      "Private-bank luxury: polished onyx dark mode with a muted champagne-gold accent and hairline borders — jewelry-case restraint, no neon. Light mode is warm alabaster with the gold deepened to bronze for contrast. Fraunces serif display gives numbers a certificate-engraving quality.",
    displayFont: "var(--font-fraunces)",
    bodyFont: "var(--font-dm-sans)",
    radius: 10,
    dark: {
      bg: "#0F0E0C", sidebarBg: "#141311", card: "#191714", border: "rgba(226,204,158,0.10)",
      text: "#F2EDE3", textMuted: "#A39A88",
      primary: "#D8BC7E", primaryContrast: "#171410", secondary: "#8FA898", chip: "rgba(216,188,126,0.13)",
    },
    light: {
      bg: "#FAF7F1", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(60,50,30,0.10)",
      text: "#26211A", textMuted: "#7D7466",
      primary: "#9A7B3A", primaryContrast: "#FFFFFF", secondary: "#5A7A68", chip: "rgba(154,123,58,0.10)",
    },
  },
  {
    id: "porcelain",
    name: "Porcelain Ink",
    tagline:
      "Gallery minimalism: near-monochrome porcelain white / india-ink black with a single vermilion seal-stamp accent used only where attention is earned (live values, alerts). The most typographically-driven system — elegance from spacing and contrast, not color. For customers who equate quiet with premium.",
    displayFont: "var(--font-fraunces)",
    bodyFont: "var(--font-figtree)",
    radius: 8,
    dark: {
      bg: "#111113", sidebarBg: "#161618", card: "#1B1B1E", border: "rgba(255,255,255,0.09)",
      text: "#F4F3F0", textMuted: "#8F8E8A",
      primary: "#E05D3D", primaryContrast: "#FFFFFF", secondary: "#B9B7B0", chip: "rgba(224,93,61,0.13)",
    },
    light: {
      bg: "#FCFBF9", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(25,25,28,0.10)",
      text: "#1B1B1E", textMuted: "#6E6D69",
      primary: "#C24425", primaryContrast: "#FFFFFF", secondary: "#55544F", chip: "rgba(194,68,37,0.08)",
    },
  },
  {
    id: "estate",
    name: "Forest & Brass",
    tagline:
      "Country-estate heritage: deep bottle-green dark mode with an aged-brass accent — the palette of bankers' lamps and library ladders, mapped onto solar. Light mode is warm parchment with the green carrying the text. Feels established and trustworthy; the strongest \"generational investment\" story of the set.",
    displayFont: "var(--font-fraunces)",
    bodyFont: "var(--font-poppins)",
    radius: 12,
    dark: {
      bg: "#0C1512", sidebarBg: "#101A16", card: "#14201B", border: "rgba(212,188,130,0.10)",
      text: "#EDF2EC", textMuted: "#8FA396",
      primary: "#C9A855", primaryContrast: "#141F1A", secondary: "#6FA98C", chip: "rgba(201,168,85,0.13)",
    },
    light: {
      bg: "#F8F6EE", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(25,55,40,0.11)",
      text: "#182B22", textMuted: "#5F7268",
      primary: "#8A6D24", primaryContrast: "#FFFFFF", secondary: "#2E6B4F", chip: "rgba(138,109,36,0.10)",
    },
  },
  {
    id: "velvet",
    name: "Velvet Midnight",
    tagline:
      "First-class cabin: deep velvet navy (not grey, not black) with a champagne-gold primary and icy platinum secondary — the Fintech/Crypto \"gold trust\" palette from the design-intelligence DB, tempered to premium rather than crypto-loud. Light mode is cool pearl. The dressiest dark mode of the ten.",
    displayFont: "var(--font-urbanist)",
    bodyFont: "var(--font-dm-sans)",
    radius: 14,
    dark: {
      bg: "#0D1424", sidebarBg: "#111A2E", card: "#152036", border: "rgba(214,197,150,0.10)",
      text: "#EEF1F8", textMuted: "#8D99B5",
      primary: "#E3C77F", primaryContrast: "#121B30", secondary: "#9FB8DF", chip: "rgba(227,199,127,0.13)",
    },
    light: {
      bg: "#F6F8FB", sidebarBg: "#FFFFFF", card: "#FFFFFF", border: "rgba(20,35,70,0.09)",
      text: "#141F38", textMuted: "#66718C",
      primary: "#A07E2E", primaryContrast: "#FFFFFF", secondary: "#3D5A8F", chip: "rgba(160,126,46,0.10)",
    },
  },
  {
    id: "atelier",
    name: "Greige Atelier",
    tagline:
      "Aesop-counter minimalism: warm greige neutrals with a single burnt-sienna accent and softly rounded cards — evolved-neumorphism depth (soft shadows, WCAG-checked contrast) without the toy-like look. The gentlest, most domestic system here; premium through calm, for customers who find dashboards stressful.",
    displayFont: "var(--font-urbanist)",
    bodyFont: "var(--font-figtree)",
    radius: 18,
    dark: {
      bg: "#1B1917", sidebarBg: "#201E1B", card: "#262320", border: "rgba(235,225,210,0.08)",
      text: "#F0EBE4", textMuted: "#A29A8E",
      primary: "#CD8B62", primaryContrast: "#1E1B18", secondary: "#8FA5A0", chip: "rgba(205,139,98,0.13)",
    },
    light: {
      bg: "#F5F2ED", sidebarBg: "#FBF9F6", card: "#FFFFFF", border: "rgba(55,45,35,0.09)",
      text: "#2E2823", textMuted: "#7E7568",
      primary: "#A85F35", primaryContrast: "#FFFFFF", secondary: "#5E7A74", chip: "rgba(168,95,53,0.09)",
    },
  },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Sun, label: "Solar", active: false },
  { icon: Zap, label: "Consumption", active: false },
  { icon: TrendingUp, label: "History", active: false },
  { icon: Cloud, label: "Weather", active: false },
];

// ---------------------------------------------------------------------------
// Mini mockup — a compact fake dashboard (sidebar rail + 2 stat cards + a
// bar strip) rendered entirely from a single Palette object via inline
// styles, so swapping the palette is the only thing that changes.
// ---------------------------------------------------------------------------
function MiniMockup({ p, displayFont, bodyFont, mode, radius = 12 }: { p: Palette; displayFont: string; bodyFont: string; mode: "dark" | "light"; radius?: number }) {
  const cardStyle = { background: p.card, border: `1px solid ${p.border}`, borderRadius: radius };
  return (
    <div
      className="rounded-2xl overflow-hidden flex"
      style={{ background: p.bg, border: `1px solid ${p.border}`, height: 340, fontFamily: bodyFont }}
    >
      {/* Sidebar rail */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 132, background: p.sidebarBg, borderRight: `1px solid ${p.border}` }}
      >
        <div className="flex items-center gap-2 px-3 h-12 shrink-0" style={{ borderBottom: `1px solid ${p.border}` }}>
          <div className="w-5 h-5 rounded-md shrink-0" style={{ background: p.primary }} />
          <span className="text-xs font-bold truncate" style={{ color: p.text, fontFamily: displayFont }}>360watts</span>
        </div>
        <div className="flex-1 py-2 px-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
              style={item.active ? { background: p.chip, color: p.primary } : { color: p.textMuted }}
            >
              <item.icon size={11} className="shrink-0" />
              <span className="text-[10px] font-semibold truncate">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="px-1.5 pb-2">
          <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: p.chip }}>
            <div
              className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center text-[7px] font-bold"
              style={{ background: p.primary, color: p.primaryContrast }}
            >
              R
            </div>
            <span className="text-[9px] font-semibold truncate flex-1" style={{ color: p.text }}>Rajeev</span>
            <ChevronDown size={9} style={{ color: p.primary }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        <p className="text-[9px] uppercase tracking-[0.12em] mb-0.5" style={{ color: p.textMuted }}>Overview · {mode}</p>
        <p className="text-lg font-bold mb-2.5" style={{ color: p.text, fontFamily: displayFont }}>Good afternoon</p>

        <div className="grid grid-cols-2 gap-2 mb-2.5">
          {[{ label: "Solar now", value: "3.2 kW", icon: Sun }, { label: "Battery", value: "84%", icon: Zap }].map((s) => (
            <div key={s.label} className="p-2.5" style={cardStyle}>
              <div className="flex items-center justify-between mb-1.5">
                <s.icon size={12} style={{ color: p.primary }} />
                <span className="text-[8px]" style={{ color: p.textMuted }}>{s.label}</span>
              </div>
              <p className="text-base font-bold" style={{ color: p.text, fontFamily: displayFont }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="p-2.5" style={cardStyle}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-semibold" style={{ color: p.text }}>Generation today</span>
            <Cpu size={11} style={{ color: p.secondary }} />
          </div>
          <div className="flex items-end gap-1 h-14">
            {[30, 55, 70, 90, 100, 82, 60, 38, 20].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: i === 4 ? p.primary : p.secondary, opacity: i === 4 ? 1 : 0.45 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SwatchDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full shrink-0 border border-white/10" style={{ background: color }} />
      <span className="text-[10px] text-muted-foreground font-mono">{label}</span>
    </div>
  );
}

export default function ThemeVariantsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-14">
        <header>
          <p className="eyebrow mb-2">360watts · theme lab</p>
          <h1 className="page-title mb-2">Light + dark theme variants</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Ten complete direction candidates — five exploratory, five premium/elegance-first — each
            with its own palette, font pairing, and corner-radius personality, shown in both modes.
            Pick one and I&apos;ll build it out as the real token system across the whole portal.
          </p>
        </header>

        {VARIANTS.map((v, i) => (
          <section key={v.id}>
            <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-2xl">
                <p className="eyebrow mb-1">Variant {i + 1}</p>
                <h2 className="font-display text-xl font-bold text-foreground">{v.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{v.tagline}</p>
              </div>
              <button
                onClick={() => setSelected(v.id)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  selected === v.id
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {selected === v.id ? "✓ Selected" : "Pick this one"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Dark</p>
                <MiniMockup p={v.dark} displayFont={v.displayFont} bodyFont={v.bodyFont} mode="dark" radius={v.radius} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Light</p>
                <MiniMockup p={v.light} displayFont={v.displayFont} bodyFont={v.bodyFont} mode="light" radius={v.radius} />
              </motion.div>
            </div>

            <div className="flex flex-wrap gap-4 px-1">
              <SwatchDot color={v.dark.bg} label="bg (dark)" />
              <SwatchDot color={v.dark.primary} label="primary" />
              <SwatchDot color={v.dark.secondary} label="secondary" />
              <SwatchDot color={v.light.bg} label="bg (light)" />
              <SwatchDot color={v.light.primary} label="primary" />
            </div>
          </section>
        ))}

        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 glass-green"
          >
            <p className="text-sm text-foreground">
              You picked <strong>{VARIANTS.find((v) => v.id === selected)?.name}</strong>. Tell me to build it
              out and I&apos;ll replace the current token set in <code className="font-mono text-xs">globals.css</code> and
              re-theme the portal to match — same architecture (CSS vars + <code className="font-mono text-xs">ThemeContext</code>),
              new palette and type.
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
