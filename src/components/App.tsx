"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import BrandMark from "./BrandMark";
import SceneBoundary from "./SceneBoundary";
import ClockPanel from "./hud/ClockPanel";
import CitySearch from "./hud/CitySearch";
import HourFormatToggle from "./hud/HourFormatToggle";
import ShareButton from "./hud/ShareButton";
import TimeScrubber from "./hud/TimeScrubber";
import { useNow } from "@/hooks/useNow";
import { useLocation } from "@/hooks/useLocation";
import { usePersistentState } from "@/hooks/usePersistentState";
import { latLonToTimeZone } from "@/lib/reverseTz";
import { timeZoneLabel } from "@/lib/time";
import { decodeShare } from "@/lib/share";
import type { LatLon } from "@/lib/geo";

interface Pin {
  id: string;
  coords: LatLon;
  timeZone: string;
}

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

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

  // Pinned locations (tapped or searched), each with its own clock + marker.
  // Persisted so a saved set of cities survives a reload.
  const [pins, setPins] = usePersistentState<Pin[]>("synq.pins", []);
  // The pin the camera is focused on (transient — not persisted).
  const [focusId, setFocusId] = useState<string | null>(null);
  // 12-hour (AM/PM) vs 24-hour display, applied to every clock; persisted.
  const [hour12, setHour12] = usePersistentState("synq.hour12", false);
  // Time-scrubber offset from "now", in minutes (0 = live); transient.
  const [offsetMinutes, setOffsetMinutes] = useState(0);

  // Latest pins for the pick handler, without making it depend on pins.
  const pinsRef = useRef(pins);
  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  const addPin = useCallback(
    (coords: LatLon) => {
      const tz = latLonToTimeZone(coords.lat, coords.lon);
      // One clock per zone: re-focus an existing pin rather than duplicating it.
      const existing = pinsRef.current.find((p) => p.timeZone === tz);
      if (existing) {
        setFocusId(existing.id);
        return;
      }
      const id = makeId();
      setPins((prev) => [...prev, { id, coords, timeZone: tz }]);
      setFocusId(id);
    },
    [setPins],
  );

  const removePin = useCallback(
    (id: string) => {
      setPins((prev) => prev.filter((p) => p.id !== id));
      setFocusId((cur) => (cur === id ? null : cur));
    },
    [setPins],
  );

  // Restore a shared view from the URL once, on mount (overrides saved pins).
  useEffect(() => {
    const shared = decodeShare(window.location.search);
    if (!shared) return;
    const restored: Pin[] = shared.pins.map((coords) => ({
      id: makeId(),
      coords,
      timeZone: latLonToTimeZone(coords.lat, coords.lon),
    }));
    setPins(restored);
    setOffsetMinutes(shared.offsetMinutes);
    if (shared.focusIndex >= 0 && restored[shared.focusIndex]) {
      setFocusId(restored[shared.focusIndex].id);
    }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayTime = useMemo(
    () =>
      offsetMinutes === 0
        ? now
        : new Date(now.getTime() + offsetMinutes * 60_000),
    [now, offsetMinutes],
  );

  const focusCoords = useMemo(
    () => pins.find((p) => p.id === focusId)?.coords ?? null,
    [pins, focusId],
  );
  const pinCoords = useMemo(() => pins.map((p) => p.coords), [pins]);
  const focusIndex = useMemo(
    () => pins.findIndex((p) => p.id === focusId),
    [pins, focusId],
  );

  return (
    <main className="space-backdrop relative h-[100dvh] w-screen overflow-hidden">
      {/* 3D globe fills the viewport */}
      <div className="absolute inset-0">
        <SceneBoundary>
          <GlobeScene
            time={displayTime}
            marker={location?.coords}
            pins={pinCoords}
            focus={focusCoords}
            onPick={addPin}
          />
        </SceneBoundary>
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

      {/* City search — pin any city by name. */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2">
        <CitySearch onSelect={(city) => addPin(city.coords)} />
      </div>

      {/* Clock HUD — the user's own location, plus any pinned locations. */}
      <div className="absolute right-5 top-5 flex max-h-[calc(100dvh-2.5rem)] flex-col items-end gap-3">
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

        {pins.length > 0 && (
          <div className="flex min-h-0 flex-col items-end gap-3 overflow-y-auto pr-0.5">
            {pins.map((pin) => {
              const name = timeZoneLabel(pin.timeZone);
              return (
                <div key={pin.id} className="relative animate-fade-up">
                  <button
                    type="button"
                    onClick={() => setFocusId(pin.id)}
                    aria-label={`Focus ${name} on the globe`}
                    className="block cursor-pointer text-left"
                  >
                    <ClockPanel
                      time={displayTime}
                      timeZone={pin.timeZone}
                      title={name}
                      eyebrow="Pinned"
                      accent="cyan"
                      hour12={hour12}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePin(pin.id)}
                    aria-label={`Remove ${name}`}
                    className="glass absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-ink-300 transition-colors hover:text-ink-100"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 2l8 8M10 2l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share the current set of cities + scrubbed time as a link. */}
      <div className="absolute bottom-5 right-5">
        <ShareButton
          pins={pinCoords}
          focusIndex={focusIndex}
          offsetMinutes={offsetMinutes}
        />
      </div>

      {/* Footer — time-scrubber, with a compact interaction hint above it. */}
      <footer className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <div className="pointer-events-none text-[11px] tracking-wide text-ink-500">
          Tap the globe or search to pin a place · drag to orbit · scroll to zoom
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
