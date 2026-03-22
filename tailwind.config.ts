import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Design system baseado na imagem de referência
      colors: {
        // Background hierarchy
        bg: {
          base: "#111111",      // fundo principal
          sidebar: "#0a0a0a",   // sidebar mais escura
          card: "#1c1c1c",      // cards
          hover: "#222222",     // hover em itens
          input: "#181818",     // campos de input
        },
        // Bordas
        border: {
          DEFAULT: "#2a2a2a",
          subtle: "#1f1f1f",
          focus: "#f97316",
        },
        // Texto
        text: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
          muted: "#71717a",
          label: "#52525b",
        },
        // Acento principal (laranja da imagem)
        brand: {
          DEFAULT: "#f97316",
          hover: "#ea6c0a",
          muted: "rgba(249,115,22,0.12)",
          "muted-hover": "rgba(249,115,22,0.2)",
        },
        // Status
        success: "#22c55e",
        warning: "#eab308",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "label": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.5)",
        "orange": "0 0 0 2px rgba(249,115,22,0.4)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        card: "0.75rem",
      },
      animation: {
        "progress-pulse": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
