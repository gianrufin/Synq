import type { LatLon } from "./geo";
import { offsetLabel } from "./time";

/**
 * Approximate coordinates for the representative city of common IANA time
 * zones. Used to place the user's marker on the globe *without* asking for
 * geolocation permission — the browser's resolved time zone is enough for a
 * good approximation, and precise GPS (if granted) upgrades it later.
 *
 * Coordinates are the zone's namesake city; precision to a degree is plenty at
 * globe scale. Not exhaustive — {@link timeZoneToLatLon} falls back to an
 * offset-derived longitude for anything not listed here.
 */
export const TZ_COORDS: Record<string, LatLon> = {
  // Africa
  "Africa/Abidjan": { lat: 5.3, lon: -4.0 },
  "Africa/Accra": { lat: 5.6, lon: -0.2 },
  "Africa/Algiers": { lat: 36.8, lon: 3.1 },
  "Africa/Cairo": { lat: 30.0, lon: 31.2 },
  "Africa/Casablanca": { lat: 33.6, lon: -7.6 },
  "Africa/Johannesburg": { lat: -26.2, lon: 28.0 },
  "Africa/Lagos": { lat: 6.5, lon: 3.4 },
  "Africa/Nairobi": { lat: -1.3, lon: 36.8 },
  "Africa/Tunis": { lat: 36.8, lon: 10.2 },
  // America
  "America/Anchorage": { lat: 61.2, lon: -149.9 },
  "America/Argentina/Buenos_Aires": { lat: -34.6, lon: -58.4 },
  "America/Bogota": { lat: 4.7, lon: -74.1 },
  "America/Chicago": { lat: 41.9, lon: -87.6 },
  "America/Denver": { lat: 39.7, lon: -105.0 },
  "America/Halifax": { lat: 44.6, lon: -63.6 },
  "America/Lima": { lat: -12.0, lon: -77.0 },
  "America/Los_Angeles": { lat: 34.1, lon: -118.2 },
  "America/Mexico_City": { lat: 19.4, lon: -99.1 },
  "America/New_York": { lat: 40.7, lon: -74.0 },
  "America/Phoenix": { lat: 33.4, lon: -112.1 },
  "America/Santiago": { lat: -33.4, lon: -70.7 },
  "America/Sao_Paulo": { lat: -23.5, lon: -46.6 },
  "America/Toronto": { lat: 43.7, lon: -79.4 },
  "America/Vancouver": { lat: 49.3, lon: -123.1 },
  // Asia
  "Asia/Bangkok": { lat: 13.8, lon: 100.5 },
  "Asia/Dhaka": { lat: 23.8, lon: 90.4 },
  "Asia/Dubai": { lat: 25.2, lon: 55.3 },
  "Asia/Hong_Kong": { lat: 22.3, lon: 114.2 },
  "Asia/Istanbul": { lat: 41.0, lon: 29.0 },
  "Asia/Jakarta": { lat: -6.2, lon: 106.8 },
  "Asia/Jerusalem": { lat: 31.8, lon: 35.2 },
  "Asia/Karachi": { lat: 24.9, lon: 67.0 },
  "Asia/Kolkata": { lat: 22.6, lon: 88.4 },
  "Asia/Manila": { lat: 14.6, lon: 121.0 },
  "Asia/Riyadh": { lat: 24.7, lon: 46.7 },
  "Asia/Seoul": { lat: 37.6, lon: 127.0 },
  "Asia/Shanghai": { lat: 31.2, lon: 121.5 },
  "Asia/Singapore": { lat: 1.3, lon: 103.8 },
  "Asia/Taipei": { lat: 25.0, lon: 121.6 },
  "Asia/Tehran": { lat: 35.7, lon: 51.4 },
  "Asia/Tokyo": { lat: 35.7, lon: 139.7 },
  // Australia / Pacific
  "Australia/Brisbane": { lat: -27.5, lon: 153.0 },
  "Australia/Melbourne": { lat: -37.8, lon: 145.0 },
  "Australia/Perth": { lat: -31.9, lon: 115.9 },
  "Australia/Sydney": { lat: -33.9, lon: 151.2 },
  "Pacific/Auckland": { lat: -36.8, lon: 174.8 },
  "Pacific/Honolulu": { lat: 21.3, lon: -157.9 },
  // Europe
  "Europe/Amsterdam": { lat: 52.4, lon: 4.9 },
  "Europe/Athens": { lat: 38.0, lon: 23.7 },
  "Europe/Berlin": { lat: 52.5, lon: 13.4 },
  "Europe/Brussels": { lat: 50.8, lon: 4.4 },
  "Europe/Bucharest": { lat: 44.4, lon: 26.1 },
  "Europe/Dublin": { lat: 53.3, lon: -6.3 },
  "Europe/Helsinki": { lat: 60.2, lon: 24.9 },
  "Europe/Istanbul": { lat: 41.0, lon: 29.0 },
  "Europe/Lisbon": { lat: 38.7, lon: -9.1 },
  "Europe/London": { lat: 51.5, lon: -0.1 },
  "Europe/Madrid": { lat: 40.4, lon: -3.7 },
  "Europe/Moscow": { lat: 55.8, lon: 37.6 },
  "Europe/Oslo": { lat: 59.9, lon: 10.8 },
  "Europe/Paris": { lat: 48.9, lon: 2.4 },
  "Europe/Prague": { lat: 50.1, lon: 14.4 },
  "Europe/Rome": { lat: 41.9, lon: 12.5 },
  "Europe/Stockholm": { lat: 59.3, lon: 18.1 },
  "Europe/Vienna": { lat: 48.2, lon: 16.4 },
  "Europe/Warsaw": { lat: 52.2, lon: 21.0 },
  "Europe/Zurich": { lat: 47.4, lon: 8.5 },
  UTC: { lat: 0, lon: 0 },
};

/**
 * Best-effort coordinates for an IANA time-zone id. Returns the namesake city
 * when known; otherwise estimates longitude from the zone's current UTC offset
 * (15° per hour) at the equator — a rough but sane fallback that at least lands
 * the marker in the right vertical slice of the globe.
 */
export function timeZoneToLatLon(timeZone: string, at: Date = new Date()): LatLon {
  const known = TZ_COORDS[timeZone];
  if (known) return known;

  // Fallback: derive longitude from the GMT offset, e.g. "GMT-4" -> -60°.
  // Handles fractional offsets too ("GMT+5:30" -> 82.5°, "GMT+5:45" -> 86.25°).
  const label = offsetLabel(at, timeZone); // "GMT+2", "GMT-4:30", "GMT"
  const match = label.match(/GMT([+-])(\d+)(?::(\d+))?/);
  let offsetHours = 0;
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    offsetHours = sign * (hours + minutes / 60);
  }
  const lon = Math.max(-180, Math.min(180, offsetHours * 15));
  return { lat: 0, lon };
}
