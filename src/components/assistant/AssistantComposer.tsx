"use client";

import { m } from "framer-motion";
import { Send } from "lucide-react";
import { forwardRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface AssistantComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

const AssistantComposer = forwardRef<HTMLTextAreaElement, AssistantComposerProps>(function AssistantComposer(
  { disabled, onSend },
  ref,
) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="flex flex-shrink-0 items-end gap-2 px-3 py-2.5"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Ask about your system…"
        aria-label="Message the assistant"
        className="flex-1 resize-none rounded-lg bg-transparent px-2.5 py-1.5 text-[12.5px] outline-none"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      />
      <m.button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        whileTap={{ scale: 0.8, rotate: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg disabled:opacity-40"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <Send size={14} />
      </m.button>
    </div>
  );
});

export default AssistantComposer;
