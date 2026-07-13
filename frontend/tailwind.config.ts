import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        "accent-indigo": "var(--accent-indigo)",
        "accent-cyan": "var(--accent-cyan)",
        "border-subtle": "var(--border)",
        muted: "var(--muted)",
        foreground: "var(--text)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "accent-gradient": "var(--accent-gradient)",
      },
      animation: {
        "cursor-blink": "cursor-blink 1.1s steps(1) infinite",
        "orb-drift": "orb-drift 14s ease-in-out infinite",
        "orb-drift-delayed": "orb-drift-delayed 18s ease-in-out infinite",
        "orb-pulse": "orb-pulse 10s ease-in-out infinite",
        "float-y": "float-y 5s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
      },
      keyframes: {
        "cursor-blink": {
          "0%, 45%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -30px) scale(1.08)" },
        },
        "orb-drift-delayed": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-50px, 25px) scale(1.12)" },
        },
        "orb-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.15)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
