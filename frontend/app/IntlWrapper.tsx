'use client';

import { SettingsProvider } from "@/contexts/SettingsContext";

export default function IntlWrapper({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
