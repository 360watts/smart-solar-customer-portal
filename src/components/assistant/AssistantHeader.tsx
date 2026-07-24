"use client";

import { Maximize2, Minimize2, X } from "lucide-react";

interface AssistantHeaderProps {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export default function AssistantHeader({ fullscreen, onToggleFullscreen, onClose }: AssistantHeaderProps) {
  return (
    <div
      className="flex flex-shrink-0 items-center gap-2 px-3.5 py-3"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: "var(--primary)" }} />
      <span className="text-[12.5px] font-bold">360watts Assistant</span>
      <span className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ color: "var(--muted-foreground)" }}
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X size={14} />
        </button>
      </span>
    </div>
  );
}
