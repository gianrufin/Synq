"use client";

/**
 * The Synq logo mark: a glowing sphere wrapped in two crossed orbital rings
 * with luminous nodes — a flat SVG echo of the app icon, used in the HUD header.
 */
export default function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <defs>
        <radialGradient id="synq-sphere" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#f3f6ff" />
          <stop offset="42%" stopColor="#aab8e8" />
          <stop offset="72%" stopColor="#5b6bb5" />
          <stop offset="100%" stopColor="#2a2f5c" />
        </radialGradient>
        <linearGradient id="synq-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b93ff" />
          <stop offset="55%" stopColor="#5fd4ff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="synq-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* warm day-side glint */}
      <circle cx="24" cy="24" r="7" fill="#f5a623" opacity="0.35" />
      <circle cx="32" cy="32" r="16" fill="url(#synq-sphere)" />

      <g
        stroke="url(#synq-ring)"
        strokeWidth="2"
        fill="none"
        filter="url(#synq-glow)"
      >
        <ellipse
          cx="32"
          cy="32"
          rx="27"
          ry="12"
          transform="rotate(32 32 32)"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="27"
          ry="12"
          transform="rotate(-32 32 32)"
        />
      </g>

      <g fill="#eaf6ff" filter="url(#synq-glow)">
        <circle cx="32" cy="8" r="2.1" />
        <circle cx="56" cy="40" r="2.1" />
        <circle cx="10" cy="26" r="2.1" />
      </g>
    </svg>
  );
}
