"use client";

import { useEffect, useState } from "react";
import type { LatLon } from "@/lib/geo";
import { detectTimeZone } from "@/lib/time";
import { timeZoneToLatLon } from "@/lib/timezoneCoords";

export type LocationSource = "timezone" | "gps";

export interface UserLocation {
  coords: LatLon;
  timeZone: string;
  /** How `coords` was obtained. */
  source: LocationSource;
}

/**
 * Resolves the user's location for the globe marker in two stages:
 *
 *  1. Immediately, from the browser's resolved IANA time zone — no permission
 *     prompt, so the marker appears the moment the app mounts.
 *  2. Asynchronously, from `navigator.geolocation` *if* the user grants it,
 *     upgrading the marker to precise coordinates.
 *
 * Returns `null` until the first (time-zone) estimate is ready, which keeps
 * server/client hydration clean since the value is client-only.
 */
export function useLocation(): UserLocation | null {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    const timeZone = detectTimeZone();

    // Stage 1 — instant, permission-free approximation from the time zone.
    setLocation({
      coords: timeZoneToLatLon(timeZone),
      timeZone,
      source: "timezone",
    });

    // Stage 2 — opportunistic precise fix. We never block on this and silently
    // keep the time-zone estimate if it's denied, errors, or is unavailable.
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setLocation({
          coords: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          timeZone,
          source: "gps",
        });
      },
      () => {
        /* denied / unavailable — keep the time-zone estimate */
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
