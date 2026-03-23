"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hydration mismatch: só renderiza o ícone correto após montar no cliente
  useEffect(() => { setMounted(true); }, []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-hover transition-colors"
      aria-label="Alternar tema claro/escuro"
      title={mounted ? (theme === "dark" ? "Modo claro" : "Modo escuro") : "Alternar tema"}
    >
      {mounted && theme === "dark" ? (
        <Sun className="w-4 h-4 text-text-secondary" />
      ) : (
        <Moon className="w-4 h-4 text-text-secondary" />
      )}
    </button>
  );
}
