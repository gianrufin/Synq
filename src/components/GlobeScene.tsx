"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Earth from "./Earth";
import Starfield from "./Starfield";
import LocationMarker from "./LocationMarker";
import CameraFocus from "./CameraFocus";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { sunDirection, latLonToVector3 } from "@/lib/geo";
import type { LatLon } from "@/lib/geo";
import { useNow } from "@/hooks/useNow";

/**
 * The full-viewport WebGL scene: starfield, day/night Earth, ambient/sun
 * lighting, auto-rotating orbit controls. `time` drives the day/night
 * terminator so the same clock can later feed the time-scrubber. `marker`
 * highlights the user's location; `focus` marks a tapped location and reframes
 * the camera onto it; `onPick` fires when the surface is tapped.
 */
export default function GlobeScene({
  time,
  marker,
  focus,
  onPick,
}: {
  time: Date;
  marker?: LatLon | null;
  focus?: LatLon | null;
  onPick?: (coords: LatLon) => void;
}) {
  // Recompute the sun vector roughly once a minute to keep the terminator live
  // without thrashing (the scene itself renders continuously).
  const minuteTick = Math.floor(time.getTime() / 60_000);
  const sunDir = useMemo(
    () => sunDirection(new Date(minuteTick * 60_000)),
    [minuteTick],
  );

  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Outward direction of the focused point — the camera reframes onto it. A new
  // vector identity per focus change re-triggers the reframe animation.
  const focusDir = useMemo(
    () => (focus ? latLonToVector3(focus.lat, focus.lon, 1).normalize() : null),
    [focus],
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
        <Earth sunDir={sunDir} onPick={onPick} />
        {marker && <LocationMarker coords={marker} color="amber" />}
        {focus && <LocationMarker coords={focus} color="cyan" />}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minDistance={3.2}
        maxDistance={12}
        // Idle spin, but hold still while a tapped location is in focus.
        autoRotate={!focus}
        autoRotateSpeed={0.35}
      />
      <CameraFocus controlsRef={controlsRef} target={focusDir} />
    </Canvas>
  );
}

/** Convenience wrapper that owns the live clock. */
export function LiveGlobeScene() {
  const now = useNow(1000);
  return <GlobeScene time={now} />;
}
