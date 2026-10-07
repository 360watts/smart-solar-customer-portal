"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useAssistantStream } from "@/lib/hooks/useAssistantStream";
import AssistantComposer from "./AssistantComposer";
import AssistantHeader from "./AssistantHeader";
import AssistantMessages from "./AssistantMessages";
import AssistantOrb from "./AssistantOrb";
import AssistantPanel from "./AssistantPanel";
import QuickPrompts from "./QuickPrompts";

/**
 * Root of the AI assistant widget. Mounted once in the portal's root layout
 * (outside route content) so it persists across client-side navigation —
 * see docs/superpowers/specs/2026-07-24-ai-assistant-widget-design.md.
 * Conversation lives in memory only — resets on refresh/navigation away
 * from the portal shell, no persistence layer.
 *
 * Loaded via next/dynamic with ssr:false from the layout (not here) so its
 * JS chunk — Framer Motion, react-markdown, the streaming hook — never
 * blocks the initial portal page load.
 */
// The backend (IsBasicOrAbove) serves chat to basic/premium plans only. Other
// plans still see the widget, but as a locked preview — no request is sent.
export function planAllowsAssistant(planType: string | null | undefined): boolean {
  return planType === "basic" || planType === "premium";
}

export default function AiAssistantWidget() {
  const { user } = useAuth();
  const locked = !planAllowsAssistant(user?.plan_type);
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const orbRef = useRef<HTMLButtonElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, streaming, sendMessage, cancel } = useAssistantStream();
  const followUps = messages[messages.length - 1]?.suggestions;

  const handleClose = () => {
    setOpen(false);
    // A response mid-stream when the panel closes is abandoned rather than
    // continuing invisibly — avoids a dangling reader/state update for a
    // panel nobody's looking at.
    cancel();
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <AssistantOrb
        ref={orbRef}
        open={open}
        hasUnread={false}
        onClick={() => (open ? handleClose() : setOpen(true))}
      />
      <AssistantPanel open={open} fullscreen={fullscreen} onClose={handleClose} triggerRef={orbRef}>
        <AssistantHeader
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((v) => !v)}
          onClose={handleClose}
        />
        <AssistantMessages messages={messages} streaming={streaming} />
        {locked && (
          <p className="px-3.5 pb-2 text-[12px]" style={{ color: "var(--muted-foreground)" }} role="status">
            The assistant is part of the Basic and Premium plans. Contact 360Watts to upgrade and start asking
            questions about your system.
          </p>
        )}
        {messages.length === 0 && <QuickPrompts onSelect={sendMessage} disabled={locked} />}
        {!streaming && !locked && followUps && <QuickPrompts prompts={followUps} onSelect={sendMessage} />}
        <AssistantComposer ref={composerRef} disabled={streaming} locked={locked} onSend={sendMessage} />
      </AssistantPanel>
    </LazyMotion>
  );
}
