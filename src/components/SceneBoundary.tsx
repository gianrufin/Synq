"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time failures in the WebGL scene (e.g. a device with no
 * usable WebGL context) so the whole app doesn't blank out. Shows a calm
 * on-brand fallback in place of the globe; the HUD/clocks keep working.
 */
export default class SceneBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Non-fatal for the rest of the app; surface it for debugging.
    console.error("Globe scene failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass max-w-xs rounded-2xl px-6 py-5 text-center">
            <div className="text-sm font-semibold text-ink-100">
              3D globe unavailable
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
              Your browser or device couldn&apos;t start WebGL. The clocks below
              still work.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
