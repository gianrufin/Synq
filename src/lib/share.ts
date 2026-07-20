import type { LatLon } from "./geo";

export interface ShareState {
  /** Pinned locations, in order. */
  pins: LatLon[];
  /** Index into `pins` the camera is focused on, or -1 for none. */
  focusIndex: number;
  /** Time-scrubber offset from now, in minutes. */
  offsetMinutes: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Encode the shareable view into a URL query string (no leading "?"), e.g.
 * `p=40.71,-74.01;35.68,139.77&f=1&t=120`. Empty when there's nothing to share.
 */
export function encodeShare(state: ShareState): string {
  if (!state.pins.length) return "";
  const p = state.pins
    .map((c) => `${round(c.lat)},${round(c.lon)}`)
    .join(";");
  const params = new URLSearchParams({ p });
  if (state.focusIndex >= 0) params.set("f", String(state.focusIndex));
  if (state.offsetMinutes !== 0) params.set("t", String(state.offsetMinutes));
  return params.toString();
}

/**
 * Parse a share query string (with or without a leading "?") back into state.
 * Returns null when there are no valid pins to restore.
 */
export function decodeShare(search: string): ShareState | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const p = params.get("p");
  if (!p) return null;

  const pins: LatLon[] = [];
  for (const pair of p.split(";")) {
    const [latStr, lonStr] = pair.split(",");
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    ) {
      pins.push({ lat, lon });
    }
  }
  if (!pins.length) return null;

  const f = Number(params.get("f"));
  const t = Number(params.get("t"));
  return {
    pins,
    focusIndex: Number.isInteger(f) && f >= 0 && f < pins.length ? f : -1,
    offsetMinutes: Number.isFinite(t) ? t : 0,
  };
}
