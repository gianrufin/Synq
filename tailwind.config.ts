import type { Config } from "tailwindcss";

/**
 * Synq design system.
 * Derived from the app logo: a deep-space navy field, glowing cyan→blue→indigo
 * orbital rings, and a sphere split between a warm (day) and cool (night) side.
 */
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep-space backdrop
        space: {
          950: "#04060d",
          900: "#070b16",
          850: "#0a0f1e",
          800: "#0f1628",
          700: "#161f38",
        },
        // Cool glow accents (orbital rings)
        cyan: {
          glow: "#5fd4ff",
          bright: "#38bdf8",
        },
        indigo: {
          glow: "#8b93ff",
        },
        // Warm accent (day side / user location marker)
        amber: {
          glow: "#f5a623",
        },
        // Text
        ink: {
          100: "#eaf1fb",
          300: "#b7c4de",
          500: "#8092b4",
          700: "#55648a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(95, 212, 255, 0.35)",
        "glow-lg": "0 0 60px -8px rgba(95, 212, 255, 0.45)",
        "glow-indigo": "0 0 40px -6px rgba(139, 147, 255, 0.4)",
        "glow-amber": "0 0 24px -4px rgba(245, 166, 35, 0.5)",
        panel: "0 8px 40px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backdropBlur: {
        glass: "18px",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 40s linear infinite",
        "spin-reverse": "spin-slow 55s linear infinite reverse",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
