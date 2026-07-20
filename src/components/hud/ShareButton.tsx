"use client";

import { useEffect, useRef, useState } from "react";
import { encodeShare } from "@/lib/share";
import type { LatLon } from "@/lib/geo";

interface ShareButtonProps {
  pins: LatLon[];
  focusIndex: number;
  offsetMinutes: number;
}

/**
 * Copies a shareable link to the current view — the pinned cities, the focused
 * one, and the scrubbed time — to the clipboard, with brief "Copied" feedback.
 * Hidden until there's at least one pin to share.
 */
export default function ShareButton({
  pins,
  focusIndex,
  offsetMinutes,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!pins.length) return null;

  const share = async () => {
    const query = encodeShare({ pins, focusIndex, offsetMinutes });
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked (e.g. insecure context) — fall back to the URL bar.
      window.history.replaceState(null, "", url);
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Copy a shareable link to this view"
      className="glass flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-ink-100 transition-colors hover:text-cyan-glow"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8.5l3 3 7-7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M5.6 7.1l4.8-2.4M5.6 8.9l4.8 2.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
