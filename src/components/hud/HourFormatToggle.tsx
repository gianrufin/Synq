"use client";

interface HourFormatToggleProps {
  hour12: boolean;
  onChange: (hour12: boolean) => void;
}

const OPTIONS = [
  { label: "24h", value: false },
  { label: "12h", value: true },
] as const;

/**
 * A compact segmented control that switches every clock between 24-hour and
 * 12-hour (AM/PM) display. Feeds the choice up to {@link App}, which passes it
 * to each {@link ClockPanel}.
 */
export default function HourFormatToggle({
  hour12,
  onChange,
}: HourFormatToggleProps) {
  return (
    <div
      role="group"
      aria-label="Time format"
      className="glass inline-flex items-center gap-0.5 rounded-full p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = hour12 === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              active
                ? "bg-cyan-glow/15 text-cyan-glow"
                : "text-ink-500 hover:text-ink-300"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
