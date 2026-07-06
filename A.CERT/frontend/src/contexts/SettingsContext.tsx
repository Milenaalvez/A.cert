"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AppSettings {
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  session_max: string;
  upload_limit: string;
  items_per_page: string;
  dossier_deadline: string;
  certs_per_dossier: string;
  trash_auto_purge_days: string;
  cert_expiry_warning_days: string;
  login_max_attempts: string;
  show_notifications: string;
  confirm_delete: string;
  confirm_finalize: string;
  expiry_warnings: string;
  email_notifications: string;
  alert_sound: string;
  auto_refresh: string;
  auto_dark_mode: string;
  remember_last_page: string;
  sidebar_collapsed_default: string;
  show_tips: string;
}

const DEFAULTS: AppSettings = {
  timezone: "America/Sao_Paulo",
  date_format: "DD/MM/YYYY",
  time_format: "24h",
  language: "pt-BR",
  session_max: "1440",
  upload_limit: "10",
  items_per_page: "50",
  dossier_deadline: "30",
  certs_per_dossier: "9",
  trash_auto_purge_days: "90",
  cert_expiry_warning_days: "30",
  login_max_attempts: "5",
  show_notifications: "true",
  confirm_delete: "true",
  confirm_finalize: "true",
  expiry_warnings: "true",
  email_notifications: "true",
  alert_sound: "false",
  auto_refresh: "true",
  auto_dark_mode: "false",
  remember_last_page: "true",
  sidebar_collapsed_default: "false",
  show_tips: "true",
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULTS,
  loading: true,
  refresh: async () => {},
});

let cachedSettings: AppSettings | null = null;
let fetchPromise: Promise<AppSettings> | null = null;

async function fetchSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const token = localStorage.getItem("acert_token");
      const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch("/api/settings", { headers: h });
      if (!r.ok) throw new Error("Falha ao carregar configurações");
      const data = await r.json();
      cachedSettings = { ...DEFAULTS, ...data };
    } catch {
      cachedSettings = { ...DEFAULTS };
    }
    fetchPromise = null;
    return cachedSettings!;
  })();

  return fetchPromise;
}

export function clearSettingsCache() {
  cachedSettings = null;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    clearSettingsCache();
    const s = await fetchSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    fetchSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function formatDate(date: Date | string, format: string, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const tz = timezone || "America/Sao_Paulo";

  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(d.toLocaleString("en-US", { timeZone: tz, day: "2-digit" }) as unknown as number || d.getDate());
  const month = pad(d.toLocaleString("en-US", { timeZone: tz, month: "2-digit" }) as unknown as number || d.getMonth() + 1);
  const year = d.toLocaleString("en-US", { timeZone: tz, year: "numeric" });

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());

  const resolvedDay = format.includes("DD") ? dd : day;
  const resolvedMonth = format.includes("MM") ? mm : month;
  const resolvedYear = format.includes("YYYY") ? yyyy : year;

  return format
    .replace("DD", resolvedDay)
    .replace("MM", resolvedMonth)
    .replace("YYYY", resolvedYear);
}

export function formatTime(date: Date | string, timeFormat: string, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const tz = timezone || "America/Sao_Paulo";
  const hour12 = timeFormat === "12h";

  return d.toLocaleTimeString("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

export function formatDateTime(date: Date | string, dateFormat: string, timeFormat: string, timezone?: string): string {
  return `${formatDate(date, dateFormat, timezone)} ${formatTime(date, timeFormat, timezone)}`;
}
