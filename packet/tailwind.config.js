/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "night": "#0b0f14",
        "panel": "#111827",
        "glass": "rgba(255, 255, 255, 0.08)",
        "accent": "#38bdf8",
        "accent-2": "#22d3ee",
        "warning": "#f59e0b",
        "danger": "#ef4444"
      },
      boxShadow: {
        glow: "0 0 30px rgba(56, 189, 248, 0.25)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};
