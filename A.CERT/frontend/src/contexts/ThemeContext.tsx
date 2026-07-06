"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: Theme }) {
  const { settings } = useSettings();
  const [theme, setTheme] = useState<Theme>(initialTheme || "light");

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.className = t === "dark" ? "dark" : "";
    localStorage.setItem("acert-theme", t);
    document.cookie = `acert-theme=${t};path=/;max-age=31536000`;
    setTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  }, [theme, applyTheme]);

  useEffect(() => {
    const stored = localStorage.getItem("acert-theme") as Theme | null;
    const autoDark = settings.auto_dark_mode === "true";

    if (stored === "dark" || stored === "light") {
      applyTheme(stored);
    } else if (autoDark) {
      applyTheme(getSystemTheme());
    }
  }, []);

  useEffect(() => {
    const autoDark = settings.auto_dark_mode === "true";
    if (!autoDark) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("acert-theme");
      if (!stored) applyTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.auto_dark_mode, applyTheme]);

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
