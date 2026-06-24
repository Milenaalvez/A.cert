"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme || "light");

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      const root = document.documentElement;
      root.className = next === "dark" ? "dark" : "";
      localStorage.setItem("acert-theme", next);
      document.cookie = `acert-theme=${next};path=/;max-age=31536000`;
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("acert-theme") as Theme | null;
    if (stored === "dark" || stored === "light") {
      root.className = stored === "dark" ? "dark" : "";
      setTheme(stored);
      document.cookie = `acert-theme=${stored};path=/;max-age=31536000`;
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
