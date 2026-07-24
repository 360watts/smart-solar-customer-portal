"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import type { AssistantMessage } from "./types";

interface MessageBubbleProps {
  message: AssistantMessage;
}

function MessageBubbleImpl({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
        isUser ? "self-end rounded-br-md" : "self-start rounded-bl-md",
      )}
      style={
        isUser
          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
          : {
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: message.isError ? "var(--destructive)" : "var(--foreground)",
            }
      }
    >
      {isUser ? (
        message.content
      ) : (
        <div className="prose-assistant">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || " "}</ReactMarkdown>
        </div>
      )}
      {message.cutOff && (
        <div className="mt-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          (response cut off)
        </div>
      )}
    </div>
  );
}

// Streaming updates the *last* message frequently; every other bubble in
// the list is immutable once rendered, so memoizing avoids re-rendering the
// entire history on every token flush — only the bubble whose content
// actually changed re-renders.
const MessageBubble = memo(MessageBubbleImpl, (prev, next) => prev.message === next.message);
export default MessageBubble;
