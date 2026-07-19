import type { LatLon } from "./geo";
import { timeZoneLabel } from "./time";
import { TZ_COORDS } from "./timezoneCoords";

export interface City {
  /** Display name, e.g. "New York". */
  name: string;
  /** Region the zone lives in, e.g. "America" — shown to disambiguate. */
  region: string;
  timeZone: string;
  coords: LatLon;
}

/**
 * Searchable index of well-known cities, derived from the same namesake-city
 * table used to place the user's marker ({@link TZ_COORDS}). One entry per
 * distinct city name, sorted alphabetically.
 */
export const CITIES: City[] = (() => {
  const seen = new Set<string>();
  const list: City[] = [];
  for (const [timeZone, coords] of Object.entries(TZ_COORDS)) {
    if (timeZone === "UTC") continue;
    const name = timeZoneLabel(timeZone);
    if (seen.has(name)) continue; // e.g. Asia/Istanbul vs Europe/Istanbul
    seen.add(name);
    list.push({ name, region: timeZone.split("/")[0], timeZone, coords });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
})();

/**
 * Cities whose name matches `query` (case-insensitive substring). Prefix
 * matches rank above interior matches so "par" surfaces Paris before it
 * surfaces anything merely containing "par". Returns [] for an empty query.
 */
export function searchCities(query: string, limit = 6): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = CITIES.filter((c) => c.name.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return ap - bp || a.name.localeCompare(b.name);
  });
  return matches.slice(0, limit);
}
