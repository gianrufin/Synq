"use client";

import { clockParts, timeZoneLabel } from "@/lib/time";

interface ClockPanelProps {
  time: Date;
  timeZone: string;
  /** Overrides the derived city name (e.g. for a tapped location). */
  title?: string;
  /** Small eyebrow label above the title, e.g. "YOUR LOCATION". */
  eyebrow?: string;
  accent?: "cyan" | "amber";
  hour12?: boolean;
}

/**
 * A floating glass clock panel — the core reusable HUD surface. Renders a
 * location, its live time with monospaced tabular digits, and its UTC offset.
 */
export default function ClockPanel({
  time,
  timeZone,
  title,
  eyebrow,
  accent = "cyan",
  hour12 = false,
}: ClockPanelProps) {
  const p = clockParts(time, timeZone, hour12);
  const name = title ?? timeZoneLabel(timeZone);

  const dot =
    accent === "amber"
      ? "bg-amber-glow shadow-glow-amber"
      : "bg-cyan-glow shadow-glow";

  return (
    <div className="glass w-64 rounded-2xl px-5 py-4 animate-fade-up">
      {eyebrow && (
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse-glow`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            {eyebrow}
          </span>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="truncate text-lg font-semibold text-ink-100">{name}</h2>
        <span className="shrink-0 text-[11px] font-medium text-ink-500">
          {p.offsetLabel}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
        <span className="text-4xl font-semibold text-ink-100">{p.hours}</span>
        <span className="text-4xl font-semibold text-ink-300">:</span>
        <span className="text-4xl font-semibold text-ink-100">{p.minutes}</span>
        <span className="w-9 text-base font-medium text-cyan-glow">
          {p.seconds}
        </span>
        {p.meridiem && (
          <span className="ml-0.5 text-xs font-semibold text-ink-500">
            {p.meridiem}
          </span>
        )}
      </div>

      <div className="mt-1.5 text-xs text-ink-500">
        {p.weekday} · {p.date}
      </div>
    </div>
  );
}
