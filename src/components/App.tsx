"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import BrandMark from "./BrandMark";
import ClockPanel from "./hud/ClockPanel";
import HourFormatToggle from "./hud/HourFormatToggle";
import TimeScrubber from "./hud/TimeScrubber";
import { useNow } from "@/hooks/useNow";
import { useLocation } from "@/hooks/useLocation";
import { latLonToTimeZone } from "@/lib/reverseTz";
import { timeZoneLabel } from "@/lib/time";
import type { LatLon } from "@/lib/geo";

interface Focus {
  coords: LatLon;
  timeZone: string;
}

// The WebGL scene touches `window`; load it client-only.
const GlobeScene = dynamic(() => import("./GlobeScene"), {
  ssr: false,
  loading: () => <SceneLoader />,
});

function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-24 w-24">
        <span className="absolute inset-0 rounded-full border border-cyan-glow/30 animate-spin-slow" />
        <span className="absolute inset-2 rounded-full border border-indigo-glow/30 animate-spin-reverse" />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.3em] text-ink-500">
          Synq
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const now = useNow(1000);
  // Client-only: resolves the user's time zone instantly, then upgrades to
  // precise GPS coordinates if they grant permission. `null` until mounted,
  // which also keeps the time-dependent clock out of the server render so
  // hydration stays clean.
  const location = useLocation();
  const timeZone = location?.timeZone ?? "UTC";

  // The location the user tapped on the globe (null = none). Picking reframes
  // the camera onto it and opens a clock panel for that place.
  const [focus, setFocus] = useState<Focus | null>(null);

  const handlePick = useCallback((coords: LatLon) => {
    setFocus({ coords, timeZone: latLonToTimeZone(coords.lat, coords.lon) });
  }, []);

  // Time-scrubber offset from the live "now", in minutes (0 = live). The
  // displayed time keeps ticking, just shifted — so every clock and the globe's
  // terminator move together as the offset changes.
  const [offsetMinutes, setOffsetMinutes] = useState(0);

  // 12-hour (AM/PM) vs 24-hour clock display, applied to every clock panel.
  const [hour12, setHour12] = useState(false);
  const displayTime = useMemo(
    () => (offsetMinutes === 0 ? now : new Date(now.getTime() + offsetMinutes * 60_000)),
    [now, offsetMinutes],
  );

  return (
    <main className="space-backdrop relative h-[100dvh] w-screen overflow-hidden">
      {/* 3D globe fills the viewport */}
      <div className="absolute inset-0">
        <GlobeScene
          time={displayTime}
          marker={location?.coords}
          focus={focus?.coords}
          onPick={handlePick}
        />
      </div>

      {/* subtle vignette so the HUD reads over the globe */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(4,6,13,0.55)_100%)]" />

      {/* Header / brand */}
      <header className="pointer-events-none absolute left-5 top-5 flex items-center gap-3">
        <div className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
          <BrandMark size={30} />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-ink-100">
              Synq
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink-500">
              World Clock
            </div>
          </div>
        </div>
      </header>

      {/* Clock HUD — the user's own location, plus any tapped location below. */}
      <div className="absolute right-5 top-5 flex flex-col items-end gap-3">
        <HourFormatToggle hour12={hour12} onChange={setHour12} />

        {location && (
          <ClockPanel
            time={displayTime}
            timeZone={timeZone}
            eyebrow={location.source === "gps" ? "Your location" : "Your time zone"}
            accent="amber"
            hour12={hour12}
          />
        )}

        {focus && (
          <div className="relative animate-fade-up">
            <ClockPanel
              time={displayTime}
              timeZone={focus.timeZone}
              title={timeZoneLabel(focus.timeZone)}
              eyebrow="Tapped location"
              accent="cyan"
              hour12={hour12}
            />
            <button
              type="button"
              onClick={() => setFocus(null)}
              aria-label="Dismiss tapped location"
              className="glass absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:text-ink-100"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Footer — time-scrubber, with a compact interaction hint above it. */}
      <footer className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <div className="pointer-events-none text-[11px] tracking-wide text-ink-500">
          Tap the globe to focus · drag to orbit · scroll to zoom
        </div>
        <TimeScrubber
          offsetMinutes={offsetMinutes}
          onChange={setOffsetMinutes}
          onReset={() => setOffsetMinutes(0)}
        />
      </footer>
    </main>
  );
}
