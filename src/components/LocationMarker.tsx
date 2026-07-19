"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3 } from "@/lib/geo";
import { GLOBE_RADIUS } from "./Earth";
import type { LatLon } from "@/lib/geo";

const AMBER = new THREE.Color("#f5a623");

/**
 * A glowing amber pin marking the user's location on the globe. Sits just above
 * the surface and points radially outward, with a soft pulsing halo. Because it
 * lives at the sphere's surface, the globe's own depth naturally occludes it
 * when the location rotates to the far side.
 */
export default function LocationMarker({ coords }: { coords: LatLon }) {
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

  // Pulse the halo: expand + fade on a ~2.4s loop.
  useFrame((_, delta) => {
    const halo = haloRef.current;
    const mat = haloMatRef.current;
    if (!halo || !mat) return;
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
        <meshBasicMaterial color={AMBER} toneMapped={false} />
      </mesh>

      {/* Small stem so the dot reads as a pin above the terrain. */}
      <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 8]} />
        <meshBasicMaterial color={AMBER} toneMapped={false} />
      </mesh>

      {/* Pulsing halo ring, flat against the surface. */}
      <mesh ref={haloRef} position={[0, 0, 0.012]}>
        <ringGeometry args={[0.03, 0.05, 40]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={AMBER}
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
