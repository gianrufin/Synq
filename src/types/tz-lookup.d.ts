declare module "tz-lookup" {
  /** Returns the IANA time-zone id for a latitude/longitude. */
  export default function tzlookup(lat: number, lon: number): string;
}
