/** Timezone + formatting helpers built on the native Intl API. */

export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Human label for a tz id, e.g. "America/New_York" -> "New York". */
export function timeZoneLabel(tz: string): string {
  const city = tz.split("/").pop() ?? tz;
  return city.replace(/_/g, " ");
}

export interface ClockParts {
  hours: string;
  minutes: string;
  seconds: string;
  meridiem: string; // "" when 24h
  weekday: string;
  date: string; // e.g. "Sat, Jul 19"
  offsetLabel: string; // e.g. "GMT+2"
}

export function clockParts(
  date: Date,
  timeZone: string,
  hour12 = false,
): ClockParts {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  }).formatToParts(date);

  const get = (t: string) => time.find((p) => p.type === t)?.value ?? "";

  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(date);

  return {
    hours: get("hour"),
    minutes: get("minute"),
    seconds: get("second"),
    meridiem: hour12 ? get("dayPeriod").toUpperCase() : "",
    weekday,
    date: dateStr,
    offsetLabel: offsetLabel(date, timeZone),
  };
}

/** GMT offset label for a tz at a given instant, e.g. "GMT-4". */
export function offsetLabel(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return name.replace("GMT", "GMT").replace("UTC", "GMT") || "GMT+0";
  } catch {
    return "GMT";
  }
}
