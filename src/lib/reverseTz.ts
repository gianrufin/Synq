import tzlookup from "tz-lookup";

/**
 * IANA time zone for a geographic coordinate, via a bundled boundary dataset
 * (`tz-lookup`). Land points resolve to a city zone (e.g. "America/New_York");
 * open ocean resolves to a nautical `Etc/GMT±N` offset. Never throws — falls
 * back to "UTC" on out-of-range input.
 */
export function latLonToTimeZone(lat: number, lon: number): string {
  try {
    return tzlookup(lat, lon);
  } catch {
    return "UTC";
  }
}
