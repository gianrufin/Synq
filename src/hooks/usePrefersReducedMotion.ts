"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's OS-level "reduce motion" preference. Returns `false` until
 * mounted (client-only), then reflects `prefers-reduced-motion: reduce` and
 * updates live if the setting changes. Used to pause non-essential motion —
 * globe auto-rotation, cloud drift, marker pulses — for motion-sensitive users.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
