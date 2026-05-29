import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1D9E75",
          50: "#e8f7f2",
          100: "#c5ecdf",
          200: "#8fd8be",
          300: "#5ac49d",
          400: "#2db082",
          500: "#1D9E75",
          600: "#17815e",
          700: "#116348",
          800: "#0b4532",
          900: "#06271c",
        },
        bg: {
          DEFAULT: "#0F1117",
          card: "#1A1D27",
          hover: "#222535",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Devanagari", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "system-ui", "sans-serif"],
      },
      animation: {
        "orb-idle": "orbIdle 3s ease-in-out infinite",
        "orb-listen": "orbListen 1s ease-in-out infinite",
        "orb-think": "orbThink 1.5s linear infinite",
        "orb-speak": "orbSpeak 0.8s ease-in-out infinite",
        "ring-expand": "ringExpand 1.5s ease-out infinite",
        "ring-expand-delay": "ringExpand 1.5s ease-out 0.5s infinite",
        "ring-expand-slow": "ringExpand 2s ease-out 1s infinite",
      },
      keyframes: {
        orbIdle: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        orbListen: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(29,158,117,0.6)" },
          "50%": { transform: "scale(1.08)", boxShadow: "0 0 0 20px rgba(29,158,117,0)" },
        },
        orbThink: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.05)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        orbSpeak: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.06)" },
          "75%": { transform: "scale(0.96)" },
        },
        ringExpand: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
