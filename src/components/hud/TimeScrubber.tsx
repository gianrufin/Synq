"use client";

/** ±24h, in minutes — the scrub range around the live "now". */
export const SCRUB_RANGE_MIN = 24 * 60;

/** Human label for an offset in minutes: "Live", "+3h 15m", "−45m". */
function offsetLabel(min: number): string {
  if (min === 0) return "Live";
  const sign = min > 0 ? "+" : "−"; // real minus glyph
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : ""].filter(Boolean);
  return `${sign}${parts.join(" ")}`;
}

/**
 * A draggable timeline that shifts the app's clock off "now" by ±24h. Feeds the
 * offset up to {@link App}, which re-derives the displayed time so every clock
 * and the globe's day/night terminator move together. A reset returns to live.
 */
export default function TimeScrubber({
  offsetMinutes,
  onChange,
  onReset,
}: {
  offsetMinutes: number;
  onChange: (min: number) => void;
  onReset: () => void;
}) {
  const isLive = offsetMinutes === 0;

  return (
    <div className="glass w-[min(88vw,30rem)] rounded-2xl px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
          Time
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              isLive ? "text-cyan-glow" : "text-ink-100"
            }`}
          >
            {offsetLabel(offsetMinutes)}
          </span>
          {!isLive && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-cyan-glow/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/10"
            >
              Live
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Centre "live" tick. */}
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-cyan-glow/40" />
        <input
          type="range"
          className="scrubber relative"
          min={-SCRUB_RANGE_MIN}
          max={SCRUB_RANGE_MIN}
          step={5}
          value={offsetMinutes}
          aria-label="Scrub time offset from now"
          onChange={(e) => onChange(Number(e.target.value))}
          onDoubleClick={onReset}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-ink-700">
        <span>−24h</span>
        <span>now</span>
        <span>+24h</span>
      </div>
    </div>
  );
}
