"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import BrandMark from "./BrandMark";
import ClockPanel from "./hud/ClockPanel";
import { useNow } from "@/hooks/useNow";
import { detectTimeZone } from "@/lib/time";

// The WebGL scene touches `window`; load it client-only.
const GlobeScene = dynamic(() => import("./GlobeScene"), {
  ssr: false,
  loading: () => <SceneLoader />,
});

function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-24 w-24">
        <span className="absolute inset-0 rounded-full border border-cyan-glow/30 animate-spin-slow" />
        <span className="absolute inset-2 rounded-full border border-indigo-glow/30 animate-spin-reverse" />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.3em] text-ink-500">
          Synq
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const now = useNow(1000);
  const [timeZone, setTimeZone] = useState<string>("UTC");
  // Clocks are time-dependent, so they'd mismatch between server and client
  // render. Gate them until after mount to keep hydration clean.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeZone(detectTimeZone());
    setMounted(true);
  }, []);

  return (
    <main className="space-backdrop relative h-[100dvh] w-screen overflow-hidden">
      {/* 3D globe fills the viewport */}
      <div className="absolute inset-0">
        <GlobeScene time={now} />
      </div>

      {/* subtle vignette so the HUD reads over the globe */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(4,6,13,0.55)_100%)]" />

      {/* Header / brand */}
      <header className="pointer-events-none absolute left-5 top-5 flex items-center gap-3">
        <div className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
          <BrandMark size={30} />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-ink-100">
              Synq
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink-500">
              World Clock
            </div>
          </div>
        </div>
      </header>

      {/* Local clock HUD */}
      <div className="absolute right-5 top-5">
        {mounted && (
          <ClockPanel
            time={now}
            timeZone={timeZone}
            eyebrow="Your location"
            accent="amber"
          />
        )}
      </div>

      {/* Footer hint (time-scrubber lands here next) */}
      <footer className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
        <div className="glass rounded-full px-4 py-2 text-[11px] tracking-wide text-ink-500">
          Drag to orbit · scroll to zoom
        </div>
      </footer>
    </main>
  );
}
