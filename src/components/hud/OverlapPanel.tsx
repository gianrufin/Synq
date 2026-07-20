"use client";

import { useMemo } from "react";
import { zonedHourMinute } from "@/lib/time";

export interface OverlapZone {
  label: string;
  timeZone: string;
  accent: "amber" | "cyan";
}

// Working 09–17, awake ("day") 07–23, night otherwise.
const WORK_START = 9;
const WORK_END = 17;
const DAY_START = 7;
const DAY_END = 23;

type Band = "night" | "day" | "work";

function classify(hour: number): Band {
  if (hour >= WORK_START && hour < WORK_END) return "work";
  if (hour >= DAY_START && hour < DAY_END) return "day";
  return "night";
}

const CELL: Record<Band, string> = {
  night: "bg-[rgba(120,160,255,0.06)]",
  day: "bg-[rgba(95,212,255,0.22)]",
  work: "bg-[rgba(95,212,255,0.62)]",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * A working-hours overlap grid. Each zone gets a 24-cell strip aligned to the
 * first zone's local day (so a column is the same instant everywhere); cells
 * are shaded night / awake / working. Columns where every zone is within
 * working hours are banded in amber — the meeting-friendly window — and a line
 * marks the current (scrubbed) time.
 */
export default function OverlapPanel({
  zones,
  time,
}: {
  zones: OverlapZone[];
  time: Date;
}) {
  const { rows, allWork, nowFrac, ref } = useMemo(() => {
    const ref = zones[0];
    const { hour, minute } = zonedHourMinute(time, ref.timeZone);
    const nowMin = hour * 60 + minute;
    const dayStart = new Date(time.getTime() - nowMin * 60_000);

    const rows = zones.map((z) =>
      HOURS.map((i) => {
        // Sample the middle of each hour to avoid boundary rounding.
        const at = new Date(dayStart.getTime() + (i * 60 + 30) * 60_000);
        return classify(zonedHourMinute(at, z.timeZone).hour);
      }),
    );

    const allWork = HOURS.map((i) => rows.every((r) => r[i] === "work"));
    return { rows, allWork, nowFrac: nowMin / 1440, ref };
  }, [zones, time]);

  const hasOverlap = allWork.some(Boolean);

  return (
    <div className="glass w-[min(92vw,26rem)] rounded-2xl px-4 py-3.5">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
          Working-hours overlap
        </span>
        <span className="text-[10px] text-ink-700">
          hours in {ref.label}
        </span>
      </div>

      <div className="relative">
        {zones.map((z, zi) => (
          <div key={z.timeZone} className="mb-1 flex items-center gap-2">
            <span
              className={`w-16 shrink-0 truncate text-[11px] ${
                z.accent === "amber" ? "text-amber-glow" : "text-ink-300"
              }`}
              title={z.label}
            >
              {z.label}
            </span>
            <div className="flex h-4 flex-1 gap-px overflow-hidden rounded">
              {rows[zi].map((band, i) => (
                <span key={i} className={`flex-1 ${CELL[band]}`} />
              ))}
            </div>
          </div>
        ))}

        {/* Overlay: amber overlap bands + the current-time line, aligned to the
            cell strips (which start after the w-16 label + gap-2). */}
        <div className="pointer-events-none absolute inset-y-0 left-[calc(4rem+0.5rem)] right-0 bottom-4">
          {allWork.map(
            (on, i) =>
              on && (
                <span
                  key={i}
                  className="absolute inset-y-0 bg-amber-glow/15"
                  style={{ left: `${(i / 24) * 100}%`, width: `${(1 / 24) * 100}%` }}
                />
              ),
          )}
          <span
            className="absolute inset-y-0 w-px bg-ink-100/80"
            style={{ left: `${nowFrac * 100}%` }}
          />
        </div>

        {/* Hour axis (0 / 6 / 12 / 18 / 24 in the reference zone). */}
        <div className="mt-1 flex items-center gap-2">
          <span className="w-16 shrink-0" />
          <div className="relative h-3 flex-1 text-[9px] tabular-nums text-ink-700">
            {[0, 6, 12, 18, 24].map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-500">
        <Legend swatch="bg-[rgba(95,212,255,0.62)]" label="Working" />
        <Legend swatch="bg-[rgba(95,212,255,0.22)]" label="Awake" />
        <Legend swatch="bg-amber-glow/30" label="Overlap" />
        {!hasOverlap && (
          <span className="ml-auto text-ink-700">No shared 9–5</span>
        )}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
