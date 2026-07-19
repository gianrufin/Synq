import type { LatLon } from "./geo";
import { latLonToTimeZone } from "./reverseTz";
import { CITY_SEED } from "./cityData";

export interface City {
  /** Display name, e.g. "New York". */
  name: string;
  /** Country, shown to disambiguate same-named cities. */
  country: string;
  /** IANA zone, derived from the coordinates. */
  timeZone: string;
  coords: LatLon;
}

/**
 * Searchable index of well-known cities, built from {@link CITY_SEED} with each
 * city's IANA zone derived from its coordinates. Deduped by name, sorted
 * alphabetically.
 */
export const CITIES: City[] = (() => {
  const seen = new Set<string>();
  const list: City[] = [];
  for (const c of CITY_SEED) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    list.push({
      name: c.name,
      country: c.country,
      coords: { lat: c.lat, lon: c.lon },
      timeZone: latLonToTimeZone(c.lat, c.lon),
    });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
})();

/**
 * Cities matching `query` (case-insensitive) by name or country. Ranking:
 * name-prefix hits first, then interior name hits, then country hits — each
 * group alphabetical. So "par" surfaces Paris first, "japan" surfaces Tokyo/Osaka.
 */
export function searchCities(query: string, limit = 6): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const rank = (c: City): number => {
    const name = c.name.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    if (c.country.toLowerCase().includes(q)) return 2;
    return 3;
  };

  return CITIES.map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r || a.c.name.localeCompare(b.c.name))
    .slice(0, limit)
    .map((x) => x.c);
}
