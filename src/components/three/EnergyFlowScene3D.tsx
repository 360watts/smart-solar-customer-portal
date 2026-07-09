"use client";

/**
 * Real WebGL 3D energy-flow scene (react-three-fiber). Procedural low-poly
 * house with a true gable roof, solar panels mounted flush on the roof pitch
 * (children of the roof-face group, so they inherit its tilt for free),
 * a battery pack, and a padmount transformer for the grid connection.
 *
 * The sun moves on a real sunrise → noon → sunset → night arc driven by an
 * in-scene clock (not the visitor's wall clock — a full day in ~70s makes the
 * lighting change visible instead of imperceptible), and light color/intensity,
 * sky turbidity, fog, and ambient all derive from that single `hour` value so
 * they can never drift out of sync with each other. A weather selector
 * (Clear/Cloudy/Overcast) scales intensity, fog distance, and adds drifting
 * cloud meshes on top of the same lighting model.
 *
 * Deliberately NOT interactive — one fixed architectural "hero shot" camera,
 * like a real-estate render, not a spinnable product viewer. The camera is
 * locked via a disabled OrbitControls (used only to aim at `target` on mount,
 * never for user input). Lazy-loaded — see EnergyFlowScene3DLazy.tsx.
 */

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html, Sparkles, Sky } from "@react-three/drei";
import * as THREE from "three";

const EMERALD = "#2FBF71";
const AMBER = "#E9B949";
const SLATE = "#6B7A99";
const MOON_COLOR = "#C7D2E8";
const ROOF = "#3A3E45";
const ROOF_TRIM = "#1B1D21";
const WALL = "#D9D3C6";
const WALL_TRIM = "#8B8378";
const CHIMNEY = "#5C564E";
const WINDOW_FRAME = "#2A2D31";
const TIMBER = "#8A6A4C";
const GRASS = "#3E7A45";
const HEDGE = "#2E5A3A";

type Weather = "clear" | "cloudy" | "overcast";
const WEATHER_PRESET: Record<Weather, { intensityMul: number; fogFar: number; desaturate: number; clouds: number; label: string }> = {
  clear: { intensityMul: 1, fogFar: 26, desaturate: 0, clouds: 0, label: "Clear" },
  cloudy: { intensityMul: 0.72, fogFar: 19, desaturate: 0.32, clouds: 4, label: "Cloudy" },
  overcast: { intensityMul: 0.42, fogFar: 13, desaturate: 0.6, clouds: 9, label: "Overcast" },
};

const tmpColor = new THREE.Color();
function mixHex(a: string, b: string, t: number) {
  return tmpColor.set(a).lerp(tmpColor.clone().set(b), THREE.MathUtils.clamp(t, 0, 1)).getStyle();
}
function desaturate(hex: string, amount: number) {
  const c = tmpColor.set(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return c.setHSL(hsl.h, hsl.s * (1 - amount), hsl.l).getStyle();
}

/** Every visual value in the scene derives from this one function of `hour`,
 *  so sun position, color, sky, fog, and ambient can never disagree. The moon
 *  sits at angle+π on the same great circle — sin(θ+π) = -sin(θ), so it is
 *  mathematically guaranteed to be up exactly when the sun is down, and vice
 *  versa, with no separate schedule to keep in sync. */
function sampleDay(hour: number) {
  const angle = ((hour - 6) / 24) * Math.PI * 2; // 0 at sunrise, π at sunset
  const elevation = Math.sin(angle); // >0 = day, <=0 = night
  const R = 9;
  const sunPos: [number, number, number] = [R * Math.cos(angle), Math.max(elevation, -0.06) * R * 0.85 + 0.6, -4];

  const moonAngle = angle + Math.PI;
  const moonElevation = -elevation;
  const moonPos: [number, number, number] = [R * Math.cos(moonAngle), Math.max(moonElevation, -0.06) * R * 0.85 + 0.6, -4];
  const moonVisible = moonElevation > -0.08;
  const moonIntensity = Math.max(0, moonElevation) ** 0.7 * 0.3;

  const day = THREE.MathUtils.clamp(elevation * 2.4, 0, 1); // 0 at horizon, 1 well above it
  const horizonGlow = 1 - THREE.MathUtils.clamp(Math.abs(elevation) * 5, 0, 1); // peaks right at sunrise/sunset

  const sunColor = mixHex(mixHex("#FF7A45", "#FFD9A0", THREE.MathUtils.clamp(elevation * 3, 0, 1)), "#FFF6E0", day);
  const ambientColor = mixHex("#1A2740", "#FFF6E0", day);
  const fogColor = mixHex(mixHex("#060A10", "#E8B08A", horizonGlow * (elevation < 0.3 ? 1 : 0)), "#BFD9E8", day);
  const sunIntensity = Math.max(0, elevation) ** 0.6 * 0.95;
  // moonlight visibly lifts the surroundings out of pure black instead of only the ambient floor
  const ambientIntensity = 0.1 + Math.max(0, elevation) * 0.42 + Math.max(0, moonElevation) * 0.16;
  const turbidity = 3 + horizonGlow * 7;
  const isNight = elevation <= -0.04;
  const sunVisible = elevation > -0.1;

  return {
    sunPos, sunColor, ambientColor, fogColor, sunIntensity, ambientIntensity, turbidity, isNight, sunVisible, elevation,
    moonPos, moonVisible, moonIntensity,
  };
}

/** Advances the in-scene clock and reports `hour` to the parent, throttled so
 *  the whole tree doesn't re-render at 60fps for a change this slow. */
function DayClock({ playing, hoursPerSecond, onTick }: { playing: boolean; hoursPerSecond: number; onTick: (h: number) => void }) {
  const hourRef = useRef(9.5); // start mid-morning
  const acc = useRef(0);
  useFrame((_, delta) => {
    if (!playing) return;
    hourRef.current = (hourRef.current + delta * hoursPerSecond) % 24;
    acc.current += delta;
    if (acc.current > 0.12) {
      acc.current = 0;
      onTick(hourRef.current);
    }
  });
  return null;
}

function SunMarker({ position, color, visible }: { position: [number, number, number]; color: string; visible: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.05);
  });
  if (!visible) return null;
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Sparkles count={16} scale={2.2} size={3} speed={0.3} color={color} opacity={0.6} />
      <Html center distanceFactor={10} occlude={false}>
        <div className="px-2 py-1 rounded-md bg-black/70 border border-amber-400/40 backdrop-blur-sm whitespace-nowrap pointer-events-none">
          <p className="text-[9px] uppercase tracking-wider text-amber-300 leading-none">Solar</p>
          <p className="font-mono text-[10px] font-bold text-amber-200 leading-none mt-0.5">3.2 kW</p>
        </div>
      </Html>
    </group>
  );
}

/** The moon: a plain pale sphere, no data chip, no sparkle burst — it's there
 *  to visibly light the surroundings when the sun is down, not to be a UI node. */
function MoonMarker({ position, intensity, visible }: { position: [number, number, number]; intensity: number; visible: boolean }) {
  if (!visible) return null;
  const glow = THREE.MathUtils.clamp(intensity / 0.3, 0, 1);
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial color={MOON_COLOR} emissive={MOON_COLOR} emissiveIntensity={0.6 * glow} roughness={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={MOON_COLOR} transparent opacity={0.08 * glow} />
      </mesh>
    </group>
  );
}

/** A handful of stars, only meaningful once the sun has set. */
function NightSky({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <Sparkles count={140} scale={[20, 8, 20]} position={[0, 6, 0]} size={1.4} speed={0.05} color="#DCE6FF" opacity={0.7} />;
}

/** Drifting flattened-icosahedron clouds; count scales with weather severity. */
function Clouds({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () => Array.from({ length: count }).map((_, i) => ({ y: 4.2 + (i % 3) * 0.5, z: -6 + (i % 4) * 3, scale: 0.9 + (i % 3) * 0.4, speed: 0.06 + (i % 3) * 0.02, offset: i * 3.1 })),
    [count],
  );
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const s = seeds[i];
      child.position.x = (((clock.getElapsedTime() * s.speed + s.offset) % 20) - 10) * 1.4;
    });
  });
  if (count === 0) return null;
  return (
    <group ref={group}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[0, s.y, s.z]} scale={[s.scale * 1.6, s.scale * 0.6, s.scale]}>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color="#DDE3EA" roughness={1} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

const WALL_HALF_W = 1.7; // half-width of the wall footprint (matches both floors)
const EAVE_OVER = 0.4; // roof overhang beyond the wall on each side
const RIDGE_RISE = 1.35; // ridge height above the eave line
const PLINTH_H = 0.2;
const FLOOR1_H = 1.55;
const BAND_H = 0.08;
const FLOOR2_H = 1.4;
const EAVE_Z = PLINTH_H + FLOOR1_H + BAND_H + FLOOR2_H; // wall top / eave height, both floors

/** Roof surface height above the eave line at a given x — used to seat the
 *  chimney flush on the actual sloped surface instead of floating or burying it. */
function roofHeightAtX(x: number) {
  const halfSpan = WALL_HALF_W + EAVE_OVER;
  return RIDGE_RISE * Math.max(0, 1 - Math.abs(x) / halfSpan);
}

/** One roof pitch: a true flat plane (height depends only on x), so it is a
 *  real slope, not a fake gradient — the pitch is the same math a real gable
 *  roof uses. Panels are children of the slope, inheriting its tilt exactly. */
function GablePitch({ side, panels }: { side: 1 | -1; panels?: boolean }) {
  const span = WALL_HALF_W + EAVE_OVER;
  const pitchAngle = Math.atan2(RIDGE_RISE, span);
  const slopeLen = Math.hypot(span, RIDGE_RISE);
  const depth = 2.7 + EAVE_OVER * 2;
  return (
    <group position={[0, EAVE_Z, 0]} rotation={[0, 0, side * pitchAngle]}>
      <mesh position={[side * (slopeLen / 2), 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[slopeLen, 0.09, depth]} />
        <meshStandardMaterial color={ROOF} roughness={0.75} metalness={0.05} />
      </mesh>
      {/* gutter/fascia along the eave edge */}
      <mesh position={[side * slopeLen, -0.05, 0]}>
        <boxGeometry args={[0.08, 0.14, depth + 0.04]} />
        <meshStandardMaterial color={ROOF_TRIM} roughness={0.4} metalness={0.4} />
      </mesh>
      {panels && (
        <group position={[side * slopeLen * 0.42, 0.055, 0]}>
          {Array.from({ length: 2 }).map((_, c) =>
            Array.from({ length: 4 }).map((_, r) => (
              <mesh key={`${c}-${r}`} position={[side * (c * 0.62 - 0.31), 0, -1.05 + r * 0.7]}>
                <boxGeometry args={[0.56, 0.02, 0.64]} />
                <meshPhysicalMaterial color="#0A1A14" roughness={0.2} metalness={0.4} clearcoat={0.6} emissive={EMERALD} emissiveIntensity={0.06} />
              </mesh>
            )),
          )}
        </group>
      )}
    </group>
  );
}

/** Front + back gable-end walls: a low-poly triangular prism (3-sided cone)
 *  reading as the classic "A" of a pitched roof from the front elevation. */
function GableEnd({ z }: { z: number }) {
  return (
    <mesh position={[0, EAVE_Z, z]} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[WALL_HALF_W + 0.02, RIDGE_RISE, 3]} />
      <meshStandardMaterial color={WALL} roughness={0.9} />
    </mesh>
  );
}

function Chimney() {
  const baseX = 0.75;
  return (
    <group position={[baseX, EAVE_Z + roofHeightAtX(baseX), -0.4]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.32, 1.1, 0.32]} />
        <meshStandardMaterial color={CHIMNEY} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.4]} />
        <meshStandardMaterial color={ROOF_TRIM} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** One realistic window: dark recessed glass (physical material, faint
 *  reflectivity) behind a slim frame, with a warm interior pane that only
 *  reads as "lit" once you're close — not a cartoon glowing block. */
function Window({ position, w = 0.5, h = 0.7, glow }: { position: [number, number, number]; w?: number; h?: number; glow: number }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.04]} />
        <meshStandardMaterial color={WINDOW_FRAME} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[w, h, 0.03]} />
        <meshPhysicalMaterial color="#141C24" roughness={0.15} metalness={0.1} transmission={0.5} ior={1.4} thickness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[w * 0.92, h * 0.92, 0.01]} />
        <meshStandardMaterial color="#1A1206" emissive={AMBER} emissiveIntensity={glow * 0.7} transparent opacity={0.5 + glow * 0.4} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.03, 0.03]}>
        <boxGeometry args={[w + 0.14, 0.05, 0.08]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.8} />
      </mesh>
    </group>
  );
}

function House({ windowGlow }: { windowGlow: number }) {
  return (
    <group position={[0, 0, 0]}>
      {/* stone plinth at grade */}
      <mesh position={[0, PLINTH_H / 2, 0]} receiveShadow>
        <boxGeometry args={[3.44, PLINTH_H, 2.74]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.9} />
      </mesh>

      {/* ground floor */}
      <mesh castShadow receiveShadow position={[0, PLINTH_H + FLOOR1_H / 2, 0]}>
        <boxGeometry args={[3.4, FLOOR1_H, 2.7]} />
        <meshStandardMaterial color={WALL} roughness={0.92} />
      </mesh>
      {/* floor band — the seam that reads "two stories", not one tall box */}
      <mesh position={[0, PLINTH_H + FLOOR1_H + BAND_H / 2, 0]}>
        <boxGeometry args={[3.44, BAND_H, 2.74]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.85} />
      </mesh>
      {/* upper floor */}
      <mesh castShadow receiveShadow position={[0, PLINTH_H + FLOOR1_H + BAND_H + FLOOR2_H / 2, 0]}>
        <boxGeometry args={[3.4, FLOOR2_H, 2.7]} />
        <meshStandardMaterial color={WALL} roughness={0.92} />
      </mesh>

      {/* ground-floor windows either side of the door + a wider living-room window */}
      <Window position={[-1.15, 0.95, 1.36]} w={0.55} h={0.85} glow={windowGlow} />
      <Window position={[1.0, 0.95, 1.36]} w={0.85} h={0.85} glow={windowGlow} />
      {/* upper-floor windows */}
      <Window position={[-1.15, 2.45, 1.36]} w={0.5} h={0.65} glow={windowGlow} />
      <Window position={[0.1, 2.45, 1.36]} w={0.5} h={0.65} glow={windowGlow} />
      <Window position={[1.15, 2.45, 1.36]} w={0.5} h={0.65} glow={windowGlow} />

      {/* entry door + modest portico */}
      <mesh position={[-0.15, 0.75, 1.37]}>
        <boxGeometry args={[0.6, 1.3, 0.04]} />
        <meshStandardMaterial color={WINDOW_FRAME} roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[-0.15, 1.42, 1.5]}>
        <boxGeometry args={[0.9, 0.06, 0.4]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.85} />
      </mesh>
      {/* porch downlight — a real point light pooling onto the deck, the thing
          that actually sells "lit up for visibility" after dark */}
      <pointLight position={[-0.15, 1.35, 1.55]} color={AMBER} intensity={windowGlow * 2.4} distance={3.6} decay={2} />
      <mesh position={[-0.15, 1.36, 1.48]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#3A2E12" emissive={AMBER} emissiveIntensity={windowGlow * 1.6} />
      </mesh>

      {/* true gable roof: two flat pitches meeting at a ridge, triangular
          gable-end walls front and back, panels on the sun-facing (front) pitch */}
      <GablePitch side={1} panels />
      <GablePitch side={-1} />
      <GableEnd z={1.35 + EAVE_OVER} />
      <GableEnd z={-(1.35 + EAVE_OVER)} />
      <Chimney />

      <Html position={[0, -0.3, 1.9]} center distanceFactor={10} occlude={false}>
        <div className="px-2 py-1 rounded-md bg-black/70 border border-blue-400/40 backdrop-blur-sm whitespace-nowrap pointer-events-none">
          <p className="text-[9px] uppercase tracking-wider text-blue-300 leading-none">Home load</p>
          <p className="font-mono text-[10px] font-bold text-blue-200 leading-none mt-0.5">2.1 kW</p>
        </div>
      </Html>
    </group>
  );
}

function Battery() {
  return (
    <group position={[-2.6, 0, 1.6]}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#0F2A1D" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0.21]}>
        <boxGeometry args={[0.42, 0.55, 0.02]} />
        <meshStandardMaterial color={EMERALD} emissive={EMERALD} emissiveIntensity={0.7} />
      </mesh>
      <Html position={[0, 0.95, 0]} center distanceFactor={10} occlude={false}>
        <div className="px-2 py-1 rounded-md bg-black/70 border border-emerald-400/40 backdrop-blur-sm whitespace-nowrap pointer-events-none">
          <p className="text-[9px] uppercase tracking-wider text-emerald-300 leading-none">Battery</p>
          <p className="font-mono text-[10px] font-bold text-emerald-200 leading-none mt-0.5">84%</p>
        </div>
      </Html>
    </group>
  );
}

function Transformer() {
  return (
    <group position={[2.7, 0, -1.6]}>
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.7, 16]} />
        <meshStandardMaterial color="#141C2B" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <torusGeometry args={[0.34, 0.03, 8, 24]} />
        <meshStandardMaterial color={AMBER} roughness={0.4} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <group key={x} position={[x, 0.72, 0]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#8B97B8" />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#5A6478" />
          </mesh>
        </group>
      ))}
      <Html position={[0, 1.1, 0]} center distanceFactor={10} occlude={false}>
        <div className="px-2 py-1 rounded-md bg-black/70 border border-white/25 backdrop-blur-sm whitespace-nowrap pointer-events-none">
          <p className="text-[9px] uppercase tracking-wider text-slate-300 leading-none">Grid</p>
          <p className="font-mono text-[10px] font-bold text-slate-200 leading-none mt-0.5">+1.1 kW</p>
        </div>
      </Html>
    </group>
  );
}

/** Animated current: a small glowing sphere sliding along a fixed 3-point path, looping. */
function FlowParticle({ points, color, duration }: { points: [number, number, number][]; color: string; duration: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() % duration) / duration;
    ref.current.position.copy(curve.getPoint(t));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** A clipped hedge cube — modern landscaping reads as tidy geometry, not
 *  round bushes. A slightly rounded top edge keeps it from looking like a crate. */
function Hedge({ position, w = 0.5, h = 0.4 }: { position: [number, number, number]; w?: number; h?: number }) {
  return (
    <mesh position={[position[0], h / 2, position[2]]} castShadow receiveShadow>
      <boxGeometry args={[w, h, w]} />
      <meshStandardMaterial color={HEDGE} roughness={0.95} />
    </mesh>
  );
}

/** Low timber deck slab in front of the entry — a modern home has a platform, not stepping stones. */
function Deck() {
  return (
    <group position={[-1.35, 0, 1.35]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.12, 1.1]} />
        <meshStandardMaterial color={TIMBER} roughness={0.75} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-0.65 + i * 0.26, 0.125, 0]}>
          <boxGeometry args={[0.02, 0.01, 1.08]} />
          <meshStandardMaterial color="#5F4630" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Distant tree silhouette — cheap cone + cylinder, exists only to give the
 *  lawn a horizon instead of dissolving into empty fog at the ground's edge. */
function DistantTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1, 6]} />
        <meshStandardMaterial color="#2A2018" roughness={1} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[0.65, 1.5, 8]} />
        <meshStandardMaterial color="#1E3A26" roughness={1} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.48, 1.1, 8]} />
        <meshStandardMaterial color="#26472F" roughness={1} />
      </mesh>
    </group>
  );
}

function Rig({ windowGlow, cloudCount }: { windowGlow: number; cloudCount: number }) {
  return (
    <>
      <House windowGlow={windowGlow} />
      <Battery />
      <Transformer />
      <Clouds count={cloudCount} />

      <FlowParticle points={[[-3.2, 3.2, -3.2], [-0.9, 2.4, 0.5], [0.6, 1.6, -0.3]]} color={AMBER} duration={2.2} />
      <FlowParticle points={[[0.4, 1.1, 1.2], [-1.4, 0.7, 1.5], [-2.6, 0.5, 1.6]]} color={EMERALD} duration={2.6} />
      <FlowParticle points={[[0.6, 1.1, -0.6], [1.6, 0.6, -1.1], [2.7, 0.5, -1.6]]} color={SLATE} duration={3} />

      {/* landscaping — clipped hedges lining the deck, tidy rather than round shrubs */}
      <Hedge position={[-2.1, 0, 0.75]} />
      <Hedge position={[-2.1, 0, 1.35]} />
      <Hedge position={[-2.1, 0, 1.95]} />
      <Hedge position={[1.55, 0, 1.35]} w={0.6} h={0.32} />
      <Hedge position={[2.15, 0, 1.35]} w={0.6} h={0.32} />
      <Deck />

      <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={12} blur={2.2} far={4} color="#04180B" />

      {/* ground: one large disk running to and past the fog's far distance, so
          there is never a visible edge — the horizon dissolves into fog/sky
          instead of cutting to a floating dark void. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>

      {/* gravel foreground strip — the "camera stands on something" cue a
          real architectural photo always has, matching the reference's path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0, 3.4]} receiveShadow>
        <planeGeometry args={[5.5, 2.4]} />
        <meshStandardMaterial color="#9B968C" roughness={1} />
      </mesh>

      {/* a loose ring of distant trees gives the eye a horizon to read, so the
          lawn feels like it belongs to a place instead of ending in mid-air */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        const r = 11 + (i % 3) * 1.6;
        return <DistantTree key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={0.85 + (i % 4) * 0.12} />;
      })}
    </>
  );
}

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

export default function EnergyFlowScene3D() {
  const [hour, setHour] = useState(9.5);
  const [playing, setPlaying] = useState(true);
  const [weather, setWeather] = useState<Weather>("clear");
  const onTick = useCallback((h: number) => setHour(h), []);

  const day = sampleDay(hour);
  const preset = WEATHER_PRESET[weather];
  const sunIntensity = day.sunIntensity * preset.intensityMul;
  const ambientIntensity = day.ambientIntensity * (0.6 + preset.intensityMul * 0.4); // ambient dims less than direct light when overcast
  const sunColor = weather === "clear" ? day.sunColor : desaturate(day.sunColor, preset.desaturate);
  const fogColor = weather === "clear" ? day.fogColor : mixHex(day.fogColor, "#8A93A0", preset.desaturate);
  const windowGlow = 0.15 + (1 - THREE.MathUtils.clamp(day.elevation * 3, 0, 1)) * 0.55; // lights "on" as dusk falls

  return (
    <div className="w-full h-105 rounded-xl overflow-hidden border border-white/8 relative">
      <Canvas shadows camera={{ position: [4.4, 1.75, 5.2], fov: 34 }} dpr={[1, 1.75]}>
        <DayClock playing={playing} hoursPerSecond={24 / 70} onTick={onTick} />
        {!day.isNight && (
          <Sky sunPosition={day.sunPos} turbidity={day.turbidity} rayleigh={1.4} mieCoefficient={0.02} mieDirectionalG={0.85} />
        )}
        {day.isNight && <color attach="background" args={["#050810"]} />}
        <fog attach="fog" args={[fogColor, Math.max(6, preset.fogFar * 0.45), preset.fogFar]} />
        <ambientLight intensity={ambientIntensity} color={day.ambientColor} />
        <directionalLight position={day.sunPos} intensity={sunIntensity} color={sunColor} castShadow shadow-mapSize={[1024, 1024]} />
        {/* real moonlight — a directional light at the moon's actual position,
            not a fixed cool fill; it only turns on because moonIntensity does,
            since the moon is only up when the sun's contribution is ~0 */}
        <directionalLight
          position={day.moonPos}
          intensity={day.moonIntensity * preset.intensityMul}
          color={MOON_COLOR}
          castShadow={day.isNight}
          shadow-mapSize={[512, 512]}
        />

        <SunMarker position={day.sunPos} color={sunColor} visible={day.sunVisible && weather !== "overcast"} />
        <MoonMarker position={day.moonPos} intensity={day.moonIntensity} visible={day.moonVisible && weather !== "overcast"} />
        <NightSky visible={day.isNight} />
        <Rig windowGlow={windowGlow} cloudCount={preset.clouds} />

        {/* enabled=false: purely aims the camera at `target` on mount, no
            user drag/zoom/pan — this is a fixed hero shot, not a viewer */}
        <OrbitControls enabled={false} target={[-0.2, 0.85, 0.3]} />
      </Canvas>

      {/* Time-of-day + weather controls — plain HTML, sits above the canvas */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/55 border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
            aria-label={playing ? "Pause day cycle" : "Play day cycle"}
          >
            {playing ? "❙❙" : "▶"}
          </button>
          <span className="font-mono text-xs text-white/85 tabular-nums">{fmtHour(hour)}</span>
        </div>
        <div className="pointer-events-auto flex gap-1 px-1.5 py-1.5 rounded-lg bg-black/55 border border-white/10 backdrop-blur-sm">
          {(Object.keys(WEATHER_PRESET) as Weather[]).map((w) => (
            <button
              key={w}
              onClick={() => setWeather(w)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                weather === w ? "bg-emerald-500/25 text-emerald-200" : "text-white/50 hover:text-white/80"
              }`}
            >
              {WEATHER_PRESET[w].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
