import * as THREE from "three";

const DEG2RAD = Math.PI / 180;

/**
 * Longitude offset (in degrees) that aligns our lat/lon math with the seam of
 * the equirectangular Earth textures we ship. Tuned so Greenwich (0°,0°) sits
 * where it should. Exposed as a constant so marker placement and the day/night
 * terminator share one source of truth.
 */
export const TEXTURE_LON_OFFSET = -90;

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Convert geographic coordinates to a point/direction on a unit sphere in the
 * same frame the (unrotated) Earth mesh lives in. Returns a direction when
 * radius = 1, so it doubles as a light-direction helper.
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius = 1,
): THREE.Vector3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lon - TEXTURE_LON_OFFSET) * DEG2RAD;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Inverse of {@link latLonToVector3}: turn a point/direction on the (unrotated)
 * Earth mesh back into geographic coordinates. Used to translate a raycast hit
 * from tapping the globe into a lat/lon. Longitude is normalised to [-180, 180].
 */
export function vector3ToLatLon(v: THREE.Vector3): LatLon {
  const dir = v.clone().normalize();
  const phi = Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1));
  const lat = 90 - phi / DEG2RAD;
  const theta = Math.atan2(dir.z, -dir.x);
  let lon = theta / DEG2RAD + TEXTURE_LON_OFFSET;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return { lat, lon };
}

/**
 * Subsolar point — the lat/lon on Earth where the sun is directly overhead at a
 * given instant. Uses a standard low-precision solar-position approximation,
 * which is more than accurate enough for a day/night terminator.
 */
export function subsolarPoint(date: Date): LatLon {
  // Fractional day of year (UTC).
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() - start;
  const dayOfYear = diff / 86_400_000;

  // Solar declination (deg).
  const declination =
    -23.44 * Math.cos(DEG2RAD * (360 / 365) * (dayOfYear + 10));

  // Equation of time (minutes) — refines solar-noon longitude.
  const b = DEG2RAD * (360 / 365) * (dayOfYear - 81);
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  // Longitude where it is solar noon.
  let lon = -15 * (utcHours + eot / 60 - 12);
  // Normalise to [-180, 180].
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;

  return { lat: declination, lon };
}

/** World-space direction pointing from Earth's centre toward the sun. */
export function sunDirection(date: Date): THREE.Vector3 {
  const { lat, lon } = subsolarPoint(date);
  return latLonToVector3(lat, lon, 1).normalize();
}
