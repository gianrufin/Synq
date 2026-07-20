"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { vector3ToLatLon } from "@/lib/geo";
import type { LatLon } from "@/lib/geo";

const GLOBE_RADIUS = 2;

const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform vec3 sunDir;
  uniform vec3 cameraPosW;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(sunDir);
    vec3 V = normalize(cameraPosW - vPosW);

    float sun = dot(N, L);
    // Soft terminator between night and day.
    float dayAmount = smoothstep(-0.12, 0.20, sun);

    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    vec3 nightCol = texture2D(nightMap, vUv).rgb * 1.35; // boost city lights

    vec3 color = mix(nightCol, dayCol, dayAmount);

    // Specular glint off oceans (spec map: bright = water).
    float water = texture2D(specMap, vUv).r;
    vec3 H = normalize(L + V);
    float specHi = pow(max(dot(N, H), 0.0), 26.0) * water * dayAmount;
    color += vec3(0.55, 0.72, 1.0) * specHi * 0.7;

    // Atmospheric fresnel rim — cool cyan, brighter on the lit limb.
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    color += vec3(0.22, 0.52, 1.0) * fres * (0.30 + 0.45 * dayAmount);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 cameraPosW;
  uniform vec3 sunDir;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosW - vPosW);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.4);
    float sun = smoothstep(-0.25, 0.6, dot(N, normalize(sunDir)));
    vec3 glow = mix(vec3(0.08, 0.16, 0.42), vec3(0.30, 0.60, 1.0), sun);
    gl_FragColor = vec4(glow, rim * (0.25 + 0.55 * sun));
  }
`;

interface EarthProps {
  /** World-space unit vector pointing toward the sun. */
  sunDir: THREE.Vector3;
  /** Fired with the tapped geographic coordinate when the surface is clicked. */
  onPick?: (coords: LatLon) => void;
  /** When true, hold the clouds still (respects "reduce motion"). */
  reducedMotion?: boolean;
}

// Prefix static assets with the deploy base path (empty at root, "/Synq" on
// GitHub Pages) so texture URLs resolve under a repo subpath too.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Earth({ sunDir, onPick, reducedMotion }: EarthProps) {
  const [dayMap, nightMap, specMap, cloudMap] = useLoader(
    THREE.TextureLoader,
    [
      `${BASE}/textures/earth_day.jpg`,
      `${BASE}/textures/earth_night.jpg`,
      `${BASE}/textures/earth_specular.jpg`,
      `${BASE}/textures/earth_clouds.png`,
    ],
  );

  useMemo(() => {
    [dayMap, nightMap, specMap, cloudMap].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });
    specMap.colorSpace = THREE.NoColorSpace;
  }, [dayMap, nightMap, specMap, cloudMap]);

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      specMap: { value: specMap },
      sunDir: { value: sunDir.clone() },
      cameraPosW: { value: new THREE.Vector3() },
    }),
    [dayMap, nightMap, specMap, sunDir],
  );

  const atmosphereUniforms = useMemo(
    () => ({
      cameraPosW: { value: new THREE.Vector3() },
      sunDir: { value: sunDir.clone() },
    }),
    [sunDir],
  );

  const cloudRef = useRef<THREE.Mesh>(null);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!onPick) return;
    e.stopPropagation();
    // The surface mesh is unrotated at the origin, so the world-space hit point
    // is already in the mesh's frame — convert it straight to lat/lon.
    onPick(vector3ToLatLon(e.point));
  };

  useFrame(({ camera }, delta) => {
    earthUniforms.cameraPosW.value.copy(camera.position);
    earthUniforms.sunDir.value.copy(sunDir);
    atmosphereUniforms.cameraPosW.value.copy(camera.position);
    atmosphereUniforms.sunDir.value.copy(sunDir);
    if (cloudRef.current && !reducedMotion) {
      cloudRef.current.rotation.y += delta * 0.006; // gentle cloud drift
    }
  });

  return (
    <group>
      {/* Surface */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* Clouds (non-interactive so clicks reach the surface) */}
      <mesh ref={cloudRef} raycast={() => null}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.012, 64, 64]} />
        <meshStandardMaterial
          map={cloudMap}
          alphaMap={cloudMap}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Atmosphere glow shell (rendered from the inside, non-interactive) */}
      <mesh scale={1.09} raycast={() => null}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export { GLOBE_RADIUS };
