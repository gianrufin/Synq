"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/** Shortest signed angular delta from `a` to `b`, in (-π, π]. */
function shortAngle(a: number, b: number): number {
  return ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

/**
 * Smoothly orbits the camera so `target` (an outward surface direction) rotates
 * to face the viewer. Runs only while reframing: once it settles — or the user
 * grabs the globe — it releases control so manual orbiting stays free. A fresh
 * `target` (new object identity) re-engages the animation.
 */
export default function CameraFocus({
  controlsRef,
  target,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  target: THREE.Vector3 | null;
}) {
  const animating = useRef(false);
  const prevTarget = useRef<THREE.Vector3 | null>(null);

  // Re-engage whenever a new target arrives.
  useEffect(() => {
    if (target && target !== prevTarget.current) {
      animating.current = true;
      prevTarget.current = target;
    }
  }, [target]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!animating.current || !controls || !target) return;

    // Desired camera angles: sit on the ray through the picked point so it
    // faces us. OrbitControls orbits the origin, so the camera's spherical
    // angles equal those of the target direction.
    const sph = new THREE.Spherical().setFromVector3(target);
    const dAz = shortAngle(controls.getAzimuthalAngle(), sph.theta);
    const dPol = sph.phi - controls.getPolarAngle();

    // Critically-damped-ish step; framerate-independent.
    const k = 1 - Math.exp(-6 * delta);
    controls.setAzimuthalAngle(controls.getAzimuthalAngle() + dAz * k);
    controls.setPolarAngle(controls.getPolarAngle() + dPol * k);
    controls.update();

    if (Math.abs(dAz) < 0.002 && Math.abs(dPol) < 0.002) {
      animating.current = false;
    }
  });

  return null;
}
