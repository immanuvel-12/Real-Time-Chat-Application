/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ChatConnect brand palette
        jet: "#0A0A0A", // main page background
        surface: "#121212", // sidebars, cards, modals, panels
        incoming: "#1C1C1E", // incoming message bubbles
        cerulean: "#007FFF", // primary buttons, active items, outgoing bubbles
        "cerulean-hover": "#1A8CFF",
        rose: "#FF2E88", // unread badges, notification accents
        "text-primary": "#F5F5F5",
        "text-secondary": "#A1A1AA",
        line: "#262626", // borders
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        "neon-blue": "0 0 0 1px rgba(0,127,255,0.35), 0 0 18px rgba(0,127,255,0.25)",
        "neon-rose": "0 0 0 1px rgba(255,46,136,0.35), 0 0 14px rgba(255,46,136,0.22)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.18s ease-out",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
