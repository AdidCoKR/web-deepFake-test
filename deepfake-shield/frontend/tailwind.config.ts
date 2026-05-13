/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan semua file TypeScript/TSX untuk class Tailwind
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Palet warna kustom untuk tema Cyberpunk/Futuristik
      colors: {
        "neon-cyan"   : "#00FFFF",
        "neon-green"  : "#39FF14",
        "neon-red"    : "#FF3131",
        "neon-yellow" : "#FFD700",
        "dark-bg"     : "#050A14",
        "dark-card"   : "#0D1B2E",
        "dark-border" : "#1A2E4A",
        "cyber-blue"  : "#00A8FF",
        "cyber-purple": "#A855F7",
      },
      // Font keluarga kustom
      fontFamily: {
        sans  : ["var(--font-inter)", "Inter", "sans-serif"],
        mono  : ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        orbitron: ["Orbitron", "sans-serif"],
      },
      // Animasi kustom
      animation: {
        "pulse-slow"  : "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line"   : "scanLine 2s linear infinite",
        "glow-pulse"  : "glowPulse 2s ease-in-out infinite",
        "float"       : "float 3s ease-in-out infinite",
        "spin-slow"   : "spin 8s linear infinite",
      },
      keyframes: {
        // Animasi garis scan kamera
        scanLine: {
          "0%"  : { transform: "translateY(-100%)", opacity: "0" },
          "50%" : { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        // Efek glow pada elemen penting
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1)" },
          "50%"     : { boxShadow: "0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)" },
        },
        // Efek melayang
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%"     : { transform: "translateY(-8px)" },
        },
      },
      // Background gradient kustom
      backgroundImage: {
        "cyber-grid"   : "linear-gradient(rgba(0,168,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,168,255,0.05) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic" : "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "cyber-grid": "40px 40px",
      },
      // Blur untuk efek glassmorphism
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
