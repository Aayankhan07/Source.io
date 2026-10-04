import type { Transition, Variants } from "motion/react";

/**
 * Zain's Design Motion Vocabulary (Jakub Krehel production polish)
 * - ENTER: spring, 0.5s, bounce 0 (no wobble overshoot)
 * - reveal: opacity + y: 10 + blur resolving strictly to filter: 'none'
 * - revealStagger: parent container with 0.07 stagger, 0.05 delay
 * - VIEWPORT: { once: true, margin: '-80px' } (no re-animating on scroll)
 * - HOVER: spring, 0.28s, bounce 0, max 1px lift
 */

export const ENTER: Transition = {
  type: "spring",
  duration: 0.5,
  bounce: 0,
};

export const HOVER: Transition = {
  type: "spring",
  duration: 0.28,
  bounce: 0,
};

export const VIEWPORT = {
  once: true,
  margin: "-80px",
};

export const reveal: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: "blur(4px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "none", // CRITICAL: Never blur(0px) to prevent subpixel font blur
    transition: ENTER,
  },
};

export const revealStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};
