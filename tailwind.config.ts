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
      colors: {
        // Background hierarchy — via CSS variables para suporte a temas
        bg: {
          base:    "var(--bg-base)",
          sidebar: "var(--bg-sidebar)",
          card:    "var(--bg-card)",
          hover:   "var(--bg-hover)",
          input:   "var(--bg-input)",
        },
        // Bordas
        border: {
          DEFAULT: "var(--border)",
          subtle:  "var(--border)",
          focus:   "var(--border-focus)",
        },
        // Texto
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
          label:     "var(--text-label)",
        },
        // Acento principal (laranja) — fixo em ambos os temas
        brand: {
          DEFAULT:      "#f97316",
          hover:        "#ea6c0a",
          muted:        "rgba(249,115,22,0.12)",
          "muted-hover": "rgba(249,115,22,0.2)",
        },
        // Status — fixos em ambos os temas
        success: "#22c55e",
        warning: "#eab308",
        error:   "#ef4444",
        info:    "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      boxShadow: {
        card:         "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.5)",
        orange:       "0 0 0 2px rgba(249,115,22,0.4)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        card:    "0.75rem",
      },
      animation: {
        "progress-pulse": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":        "fadeIn 0.2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
