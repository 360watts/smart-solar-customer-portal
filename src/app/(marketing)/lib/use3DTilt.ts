import { useState, useRef, useCallback, useEffect } from "react";

const PERSPECTIVE_PX = 1000;
const DEFAULT_MAX_DEG = 6;

/** Prefer fine pointer + hover for mouse-follow 3D tilt (desktop only). */
function prefersFinePointerAndHover(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export type Use3DTiltOptions = {
  /** Max tilt in degrees (default 6). Plan: ±4deg to ±6deg. */
  maxDeg?: number;
  /** When true, no tilt (e.g. reduceMotion). */
  disabled?: boolean;
};

export type Use3DTiltResult = {
  /** Apply to parent of the tilting element. */
  wrapperStyle: React.CSSProperties;
  /** Apply to the tilting card (motion.div or div). */
  cardStyle: React.CSSProperties;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
};

/**
 * Hook for hover-based 3D tilt (mouse-follow). Use on desktop/fine-pointer only;
 * when disabled or coarse pointer, returns zero tilt and no-op handlers.
 * Throttles updates via requestAnimationFrame.
 */
export function use3DTilt(options: Use3DTiltOptions = {}): Use3DTiltResult {
  const { maxDeg = DEFAULT_MAX_DEG, disabled = false } = options;
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [finePointer, setFinePointer] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Client-only value (matchMedia unavailable during SSR) — must run post-hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFinePointer(prefersFinePointerAndHover());
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const listener = () => {
      setFinePointer(mq.matches);
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const enabled = !disabled && finePointer;

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      const el = e.currentTarget as HTMLElement;
      ref.current = el;
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = (e.clientX - cx) / (rect.width / 2);
        const y = (e.clientY - cy) / (rect.height / 2);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        setRotateX(-clamp(y) * maxDeg);
        setRotateY(clamp(x) * maxDeg);
      });
    },
    [enabled, maxDeg]
  );

  const onMouseLeave = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setRotateX(0);
    setRotateY(0);
  }, []);

  const wrapperStyle: React.CSSProperties = {
    perspective: PERSPECTIVE_PX,
    transformStyle: "preserve-3d",
  };

  const cardStyle: React.CSSProperties = {
    transformStyle: "preserve-3d",
    transform: `rotateX(${enabled ? rotateX : 0}deg) rotateY(${enabled ? rotateY : 0}deg)`,
    transition: "transform 0.15s ease-out",
  };

  return {
    wrapperStyle,
    cardStyle,
    onMouseMove: enabled ? onMouseMove : () => {},
    onMouseLeave: enabled ? onMouseLeave : () => {},
  };
}
