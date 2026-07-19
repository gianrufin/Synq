"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3 } from "@/lib/geo";
import { GLOBE_RADIUS } from "./Earth";
import type { LatLon } from "@/lib/geo";

/** Amber = the user's own location; cyan = a tapped location. */
const COLORS = {
  amber: new THREE.Color("#f5a623"),
  cyan: new THREE.Color("#5fd4ff"),
} as const;

/**
 * A glowing pin marking a location on the globe. Sits just above the surface
 * and points radially outward, with a soft pulsing halo. Because it lives at
 * the sphere's surface, the globe's own depth naturally occludes it when the
 * location rotates to the far side.
 */
export default function LocationMarker({
  coords,
  color = "amber",
  reducedMotion,
}: {
  coords: LatLon;
  color?: keyof typeof COLORS;
  /** When true, hold the halo static (respects "reduce motion"). */
  reducedMotion?: boolean;
}) {
  const tint = COLORS[color];
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Position on the surface and the orientation that makes local +Z point
  // straight out from the globe's centre (so the pin and halo face outward).
  const { position, quaternion } = useMemo(() => {
    const dir = latLonToVector3(coords.lat, coords.lon, 1).normalize();
    const position = dir.clone().multiplyScalar(GLOBE_RADIUS);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      dir,
    );
    return { position, quaternion };
  }, [coords.lat, coords.lon]);

  // Pulse the halo: expand + fade on a ~2.4s loop. Held static under reduce-motion.
  useFrame((_, delta) => {
    const halo = haloRef.current;
    const mat = haloMatRef.current;
    if (!halo || !mat || reducedMotion) return;
    const t = ((halo.userData.t ?? 0) + delta) % 2.4;
    halo.userData.t = t;
    const k = t / 2.4; // 0 -> 1
    const scale = 1 + k * 2.2;
    halo.scale.setScalar(scale);
    mat.opacity = 0.5 * (1 - k);
  });

  return (
    <group ref={groupRef} position={position} quaternion={quaternion}>
      {/* Glowing core dot, lifted just off the surface. */}
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.028, 20, 20]} />
        <meshBasicMaterial color={tint} toneMapped={false} />
      </mesh>

      {/* Small stem so the dot reads as a pin above the terrain. */}
      <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 8]} />
        <meshBasicMaterial color={tint} toneMapped={false} />
      </mesh>

      {/* Pulsing halo ring, flat against the surface. */}
      <mesh ref={haloRef} position={[0, 0, 0.012]}>
        <ringGeometry args={[0.03, 0.05, 40]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={tint}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
