/**
 * Shared motion config for homepage sections.
 *
 * reduceMotion is read from the OS/browser "prefers-reduced-motion" setting at
 * module load time. Framer Motion component props are further gated by the
 * <MotionConfig reducedMotion="user"> wrapper in index.tsx, which handles
 * reactive updates if the preference changes mid-session.
 *
 * Theme: "rising sun / daybreak" — content rises gently upward (y: 20 → 0)
 * with an opacity fade, like dawn revealing panels coming online.
 */
export const reduceMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/** Rising-sun entrance: fade in + gentle upward rise (y: 20 → 0). */
export const revealVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

/** Story step scroll narrative: rise + slight horizontal drift (left steps from left, right from right). */
export const storyStepVariants = {
  hiddenLeft: { opacity: 0, y: 28, x: -16 },
  hiddenRight: { opacity: 0, y: 28, x: 16 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/** Spread onto a section or container to trigger entrance on scroll-into-view (once). */
export const sectionMotionProps = {
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: { once: true, amount: 0.1 },
  variants: revealVariant,
};

/**
 * Spread onto a list container whose direct children use `variants={revealVariant}`.
 * Children stagger 0.1 s apart — like panels coming online in sequence.
 */
export const staggerMotionProps = {
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: { once: true, amount: 0.1 },
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  },
};

/* ─── Motion tokens ─── */
export const DURATION = {
  fast: 0.15,     // micro-interactions (hover, tap)
  normal: 0.3,    // section reveals, crossfades
  slow: 0.45,     // staggered entrance
} as const;

export const EASE = {
  out: "easeOut" as const,
  in: "easeIn" as const,
  smooth: [0.4, 0, 0.2, 1] as const,       // CSS ease equivalent
  spring: { type: "spring" as const, stiffness: 300, damping: 25 },
} as const;

/**
 * CTA "power on" hover/tap — subtle scale + lift, like a panel activating.
 * Spread onto a <motion.div> wrapping a CTA link/button.
 */
export const ctaMotionProps = reduceMotion
  ? {}
  : {
      whileHover: { scale: 1.02, y: -2 },
      whileTap: { scale: 0.98 },
      transition: { duration: DURATION.fast, ease: EASE.out },
    };

/**
 * Card "panel tilt" hover — gentle lift with a hint of scale.
 * Spread onto a <motion.div> card container.
 */
export const cardMotionProps = reduceMotion
  ? {}
  : {
      whileHover: { y: -4, scale: 1.01 },
      transition: { duration: DURATION.fast, ease: EASE.out },
    };

/**
 * Slide deck transition: active slide rises to the front (scale-100, opacity-100, z-10);
 * inactive slides recede behind (scale-[0.88], opacity-0, z-0) like a card going to the
 * back of a deck. 750 ms gives enough time to feel the depth without being sluggish.
 */
export const appSlideMotionClass = reduceMotion
  ? "absolute inset-0"
  : "absolute inset-0 transition-all duration-[750ms] ease-[cubic-bezier(0.4,0,0.2,1)]";
