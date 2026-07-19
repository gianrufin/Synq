"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Earth from "./Earth";
import Starfield from "./Starfield";
import LocationMarker from "./LocationMarker";
import { sunDirection } from "@/lib/geo";
import type { LatLon } from "@/lib/geo";
import { useNow } from "@/hooks/useNow";

/**
 * The full-viewport WebGL scene: starfield, day/night Earth, ambient/sun
 * lighting, auto-rotating orbit controls. `time` drives the day/night
 * terminator so the same clock can later feed the time-scrubber. `marker`, when
 * present, highlights the user's location on the surface.
 */
export default function GlobeScene({
  time,
  marker,
}: {
  time: Date;
  marker?: LatLon | null;
}) {
  // Recompute the sun vector roughly once a minute to keep the terminator live
  // without thrashing (the scene itself renders continuously).
  const minuteTick = Math.floor(time.getTime() / 60_000);
  const sunDir = useMemo(
    () => sunDirection(new Date(minuteTick * 60_000)),
    [minuteTick],
  );

  return (
    <Canvas
      camera={{ position: [0, 1.4, 6.2], fov: 42, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.12} />
      {/* A soft directional light aligned with the sun for the cloud layer. */}
      <directionalLight position={sunDir.clone().multiplyScalar(10)} intensity={1.1} />

      <Suspense fallback={null}>
        <Starfield />
        <Earth sunDir={sunDir} />
        {marker && <LocationMarker coords={marker} />}
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={3.2}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}

/** Convenience wrapper that owns the live clock. */
export function LiveGlobeScene() {
  const now = useNow(1000);
  return <GlobeScene time={now} />;
}
