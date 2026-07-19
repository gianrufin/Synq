# Synq — 3D Timezone Globe & World Clock

An interactive 3D Earth globe that doubles as a live world clock and timezone
converter. Built with Next.js, React Three Fiber, and a glassmorphism UI.

<p align="center">
  <em>Deep-space navy · glowing cyan→indigo accents · a warm/cool day-night sphere</em>
</p>

## Status

**Interactive world clock — complete.** The realistic, controllable 3D globe
with a live day/night terminator renders inside the Synq design system, marks
where you are, lets you tap anywhere to read its time, and lets you scrub
through ±24h with the clocks and shadow moving together.

- [x] Foundational Next.js + React Three Fiber environment
- [x] High-res Earth (day/night/spec/cloud textures)
- [x] Live day/night shadow driven by the real subsolar point (UTC)
- [x] Clouds, atmospheric rim glow, starfield
- [x] Auto-rotate when idle + full orbit/zoom control
- [x] Glassmorphism HUD: brand mark + local-time clock panel
- [x] Location detection + highlight user's location on the globe
- [x] Tap-to-view: fly camera to a tapped location, show its clock
- [x] Time-scrubber: drag through time, sync clocks + the globe's shadow

## Tech stack

| Concern      | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | Next.js 14 (App Router) + React 18 + TypeScript    |
| 3D rendering | React Three Fiber + drei + three.js (custom GLSL)  |
| Styling      | TailwindCSS, glassmorphism design system           |
| Time logic   | Native `Intl` API; `tz-lookup` for lat/lon → zone  |

## Design system

Derived from the app logo and centralised in `tailwind.config.ts` +
`globals.css`:

- **Backdrop** — deep-space navy (`space-*`) with a radial ambient gradient.
- **Cool accents** — cyan `#5fd4ff` → blue `#38bdf8` → indigo `#8b93ff`, echoing
  the logo's orbital rings.
- **Warm accent** — amber `#f5a623` for the user's location / day side.
- **Surfaces** — the `.glass` / `.glass-accent` utilities: blurred, semi-
  transparent panels with hairline gradient borders and soft glows.
- **Type** — Inter (sans) for UI, JetBrains Mono for clock digits (tabular).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Project structure

```
src/
  app/            # Next.js App Router (layout, page, globals, icon)
  components/     # BrandMark, Earth, Starfield, GlobeScene, LocationMarker,
                  #   CameraFocus, App, hud/* (ClockPanel, TimeScrubber)
  hooks/          # useNow (ticking clock), useLocation (tz + GPS)
  lib/            # geo (sun/terminator + lat/lon projection), time (Intl),
                  #   timezoneCoords, reverseTz (tapped lat/lon -> IANA zone)
public/textures/  # Earth day/night/spec/bump/cloud maps
```
