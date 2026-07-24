"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AssistantMessage } from "./types";
import MessageBubble from "./MessageBubble";

interface AssistantMessagesProps {
  messages: AssistantMessage[];
  streaming: boolean;
}

const MESSAGE_TRANSITION = { type: "spring" as const, bounce: 0.35, duration: 0.5 };

export default function AssistantMessages({ messages, streaming }: AssistantMessagesProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const wasStreamingRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming]);

  // Screen-reader announcement fires once per completed turn, not per
  // token — a live region that updates on every streamed word would spam
  // assistive tech; announcing the finished answer is what's actually useful.
  useEffect(() => {
    if (wasStreamingRef.current && !streaming) {
      const last = messages[messages.length - 1];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (last?.role === "assistant") setAnnouncement(last.content);
    }
    wasStreamingRef.current = streaming;
  }, [streaming, messages]);

  const lastMessage = messages[messages.length - 1];
  const showTyping = streaming && lastMessage?.role === "assistant" && lastMessage.content === "";
  // While the typing indicator is showing, the message it stands in for is
  // still an empty placeholder — render the indicator instead of an empty
  // bubble, not both stacked on top of each other.
  const visibleMessages = showTyping ? messages.slice(0, -1) : messages;

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-3">
      <AnimatePresence initial={false}>
        {visibleMessages.map((message) => (
          <m.div
            key={message.id}
            className="flex flex-col"
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={MESSAGE_TRANSITION}
          >
            <MessageBubble message={message} />
          </m.div>
        ))}
      </AnimatePresence>

      {showTyping && (
        <m.div
          className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md py-2.5 pl-2.5 pr-3.5"
          style={{
            background:
              "linear-gradient(120deg, var(--card), color-mix(in srgb, var(--secondary) 18%, var(--card)), var(--card))",
            backgroundSize: "200% 100%",
            border: "1px solid var(--border)",
          }}
          animate={{ backgroundPosition: ["0% 0%", "-200% 0%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        >
          {/* Same sun glyph as the orb trigger — "generating" reads as the
              assistant itself thinking, not a stock loading spinner. */}
          <m.span
            className="flex items-center justify-center rounded-full"
            style={{ width: 20, height: 20, color: "var(--secondary)" }}
            animate={reduceMotion ? undefined : { rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sun size={15} strokeWidth={2.25} />
          </m.span>
          <div className="flex items-center gap-1">
            {[0, 1].map((i) => (
              <m.span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--secondary)" }}
                animate={reduceMotion ? undefined : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </div>
        </m.div>
      )}

      <div ref={bottomRef} />

      {/* Visually hidden — announces the finished answer once per turn. */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
