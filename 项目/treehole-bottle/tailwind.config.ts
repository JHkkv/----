import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sea-deep": "#060d1a",
        "sea-ocean": "#0c1e40",
        "sea-surface": "#0e234a",
        "gold-primary": "#e8b86d",
        "gold-light": "#ffe0c0",
        "gold-soft": "#ffc080",
        moon: "#fffaee",
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "sans-serif"],
        display: ['"ZCOOL KuaiLe"', "cursive"],
      },
      keyframes: {
        moonGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 250, 238, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 250, 238, 0.6)" },
        },
        starPulse: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        moonGlow: "moonGlow 5s ease-in-out infinite",
        starPulse: "starPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
