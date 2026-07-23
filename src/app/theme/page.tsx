"use client";

/**
 * 360watts App design system — implementation reference page.
 * Visit /theme.
 *
 * Recreates the 5 Figma sheets shared for this task, in code, using the
 * real components in src/components/design-system/DesignSystem.tsx:
 *   1. node 1078-1635 — raw UI kit sheet (inputs, menus, buttons, avatars...)
 *   2. node 1076-1579 — Typography
 *   3. node 1076-1580 — Icon Library
 *   4. node 1218-201  — Colour Scheme
 *   5. node 1284-561  — Component Library
 *
 * Scoped via [data-ds-scope] so it reads only --ds-* tokens
 * (styles/design-system-tokens.css) — completely independent of the
 * portal's existing "Solar Noir" theme tokens.
 */

import { useState } from "react";
import { Home, Zap, Bell, Settings, Sun } from "lucide-react";
import {
  Heading, Text, Button, ButtonGroup, Tag, Avatar, AvatarGroup, Input,
  Textarea, Switch, Checkbox, RadioButton, ProgressBar, ProgressCircle,
  Snackbar, MenuItem, TabBar, BottomNav,
} from "@/components/design-system/DesignSystem";

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-5">
      <Text size="xs" weight="semibold" style={{ color: "var(--ds-neutral-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {n}
      </Text>
      <Heading level="h3">{title}</Heading>
    </div>
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="h-16 rounded-t-md" style={{ background: hex }} />
      <div className="px-1.5 py-1" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)", borderTop: "none" }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "var(--ds-text-body)" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: "var(--ds-neutral-400)" }}>{hex}</p>
      </div>
    </div>
  );
}

function Ramp({ name, steps }: { name: string; steps: [string, string][] }) {
  return (
    <div className="mb-5">
      <Text size="sm" weight="semibold" className="mb-2" style={{ color: "var(--ds-text-heading)" }}>{name}</Text>
      <div className="flex gap-1">
        {steps.map(([label, hex]) => <Swatch key={label} hex={hex} label={label} />)}
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [check1, setCheck1] = useState(true);
  const [radio, setRadio] = useState(0);

  return (
    <main data-ds-scope className="min-h-screen px-6 py-12" style={{ background: "var(--ds-neutral-100)", fontFamily: "var(--font-inter)" }}>
      <div className="max-w-5xl mx-auto space-y-16">
        <header>
          <Tag tone="primary">Figma → code</Tag>
          <div className="mt-3">
            <Heading level="h1" className="mb-2">360watts App design system</Heading>
          </div>
          <Text size="lg" style={{ maxWidth: 640 }}>
            Implemented from the existing 360watts App Figma file — exact color ramps (read from the SVG
            fills, not eyeballed), Inter typography scale, and the core component library.
          </Text>
        </header>

        {/* ── 4. Colour Scheme ── */}
        <section>
          <SectionHeading n="Sheet 4 — node 1218-201" title="Colour Scheme" />
          <Ramp name="Primary (Green)" steps={[["900", "#122618"], ["800", "#244c30"], ["700", "#377149"], ["600", "#499761"], ["Base", "#5bbd79"], ["400", "#7cca94"], ["300", "#9dd7af"], ["200", "#bde5c9"], ["100", "#def2e4"]]} />
          <Ramp name="Call to Action (Orange)" steps={[["900", "#301707"], ["800", "#612f0d"], ["700", "#914614"], ["600", "#c15e1a"], ["Base", "#f27521"], ["400", "#f5914d"], ["300", "#f7ac7a"], ["200", "#fac8a6"], ["100", "#fce3d3"]]} />
          <Ramp name="Neutral" steps={[["Base", "#15171a"], ["800", "#2b2e33"], ["700", "#40444d"], ["600", "#565b66"], ["500", "#6b7280"], ["400", "#898e99"], ["300", "#a6aab3"], ["200", "#c4c7cc"], ["100", "#e1e3e6"]]} />
          <Ramp name="Success" steps={[["900", "#061c12"], ["800", "#0c3724"], ["700", "#135337"], ["600", "#196e49"], ["Base", "#1f8a5b"], ["400", "#4ca17c"], ["300", "#79b99d"], ["200", "#a5d0bd"], ["100", "#d2e8de"]]} />
          <Ramp name="Warning" steps={[["900", "#2f250f"], ["800", "#5d4a1d"], ["700", "#8c6f2c"], ["600", "#ba943a"], ["Base", "#e9b949"], ["400", "#edc76d"], ["300", "#f2d592"], ["200", "#f6e3b6"], ["100", "#fbf1db"]]} />
          <Ramp name="Error" steps={[["900", "#270101"], ["800", "#4e0303"], ["700", "#750404"], ["600", "#9d0606"], ["Base", "#c40707"], ["400", "#d03939"], ["300", "#dc6a6a"], ["200", "#e79c9c"], ["100", "#f3cdcd"]]} />
          <Ramp name="Info" steps={[["900", "#070f14"], ["800", "#0e1f28"], ["700", "#162e3d"], ["600", "#1d3e51"], ["Base", "#244d65"], ["400", "#507184"], ["300", "#7c94a3"], ["200", "#a7b8c1"], ["100", "#d3dbe0"]]} />
        </section>

        {/* ── 2. Typography ── */}
        <section>
          <SectionHeading n="Sheet 2 — node 1076-1579" title="Typography · Inter" />
          <div className="rounded-xl p-6 space-y-3" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
            <Heading level="h1">H1 Bold — 48/56</Heading>
            <Heading level="h2">H2 Bold — 40/48</Heading>
            <Heading level="h3">H3 Bold — 32/40</Heading>
            <Heading level="h4">H4 Bold — 28/32</Heading>
            <Heading level="h5">H5 Bold — 24/28</Heading>
            <Heading level="h6">H6 Bold — 20/24</Heading>
            <div className="pt-2 space-y-1.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
              <Text size="lg" weight="semibold">Body Lg Semibold — 20/24</Text>
              <Text size="md" weight="medium">Body Md Medium — 16/20</Text>
              <Text size="sm">Body Sm Regular — 14/16</Text>
              <Text size="xs">Body Ex Sm Regular — 12/16</Text>
            </div>
          </div>
        </section>

        {/* ── 5. Component Library ── */}
        <section>
          <SectionHeading n="Sheet 5 — node 1284-561" title="Component Library" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Button</Text>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary CTA</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <Text size="sm" weight="semibold" className="pt-2">Button Group</Text>
              <ButtonGroupDemo />
            </div>

            <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Avatar &amp; Avatar Group</Text>
              <div className="flex items-center gap-4">
                <Avatar initials="PJ" />
                <AvatarGroup initialsList={["A", "B", "C", "D"]} />
              </div>
              <Text size="sm" weight="semibold" className="pt-2">Tag</Text>
              <div className="flex flex-wrap gap-2">
                <Tag tone="primary">Primary</Tag>
                <Tag tone="success">Success</Tag>
                <Tag tone="warning">Warning</Tag>
                <Tag tone="error">Error</Tag>
                <Tag tone="neutral">Neutral</Tag>
              </div>
            </div>

            <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Input, Label &amp; Field</Text>
              <Input label="Email address" placeholder="you@example.com" hintText="We'll never share this." />
              <Input label="Site name" placeholder="Placeholder Text" error="This field is required" />
              <Textarea label="Notes" />
            </div>

            <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Switch, Checkbox &amp; Radio</Text>
              <div className="flex items-center gap-6">
                <Switch checked={toggle1} onChange={setToggle1} />
                <Switch checked={toggle2} onChange={setToggle2} />
              </div>
              <div className="flex items-center gap-6">
                <Checkbox checked={check1} onChange={setCheck1} label="Checkbox label" />
              </div>
              <div className="flex items-center gap-6">
                {["Option A", "Option B"].map((label, i) => (
                  <RadioButton key={label} checked={radio === i} onChange={() => setRadio(i)} label={label} />
                ))}
              </div>
            </div>

            <div className="rounded-xl p-6 space-y-5" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Progress Bar &amp; Circle</Text>
              <ProgressBar pct={68} />
              <div className="flex items-center gap-6 pt-1">
                <ProgressCircle pct={90} tone="success" size={72} />
                <ProgressCircle pct={62} tone="warning" size={72} />
                <ProgressCircle pct={24} tone="error" size={72} />
              </div>
            </div>

            <div className="rounded-xl p-6 space-y-3" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Snackbar</Text>
              <Snackbar title="Solar output normal" message="Generation is tracking to forecast for today." tone="primary" onClose={() => {}} />
            </div>

            <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Menu</Text>
              <div className="space-y-1">
                <MenuItem label="Overview" active />
                <MenuItem label="Solar" />
                <MenuItem label="Consumption" />
              </div>
            </div>

            <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
              <Text size="sm" weight="semibold">Tab Bar &amp; Bottom Nav</Text>
              <TabBar items={["Dashboard", "Solar", "Savings"]} />
              <div className="pt-2">
                <BottomNav />
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. Raw UI kit sheet applied together ── */}
        <section>
          <SectionHeading n="Sheet 1 — node 1078-1635" title="Assembled — mini overview card" />
          <div className="rounded-2xl p-6 max-w-sm" style={{ background: "var(--ds-card)", border: "1px solid var(--ds-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--ds-primary-100)" }}>
                  <Sun size={16} style={{ color: "var(--ds-primary-700)" }} />
                </div>
                <Text size="sm" weight="semibold">Solar today</Text>
              </div>
              <Tag tone="success">Online</Tag>
            </div>
            <Heading level="h2" className="mb-1">18.6 kWh</Heading>
            <Text size="sm" className="mb-4">+12% vs yesterday</Text>
            <ProgressBar pct={74} />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Home size={14} style={{ color: "var(--ds-neutral-400)" }} />
                <Zap size={14} style={{ color: "var(--ds-neutral-400)" }} />
                <Bell size={14} style={{ color: "var(--ds-neutral-400)" }} />
                <Settings size={14} style={{ color: "var(--ds-neutral-400)" }} />
              </div>
              <Button variant="primary" size="sm">View report</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ButtonGroupDemo() {
  const [val, setVal] = useState("Day");
  return <ButtonGroup options={["Day", "Week", "Month"]} value={val} onChange={setVal} />;
}
