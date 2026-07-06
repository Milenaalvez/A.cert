"use client";

import { useState, useEffect } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";
import { useSettings } from "@/contexts/SettingsContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [initialCollapsed, setInitialCollapsed] = useState(true);

  useEffect(() => {
    const cookie = document.cookie.includes("sidebar-collapsed=true");
    const cookieFalse = document.cookie.includes("sidebar-collapsed=false");
    if (cookie) {
      setInitialCollapsed(true);
    } else if (cookieFalse) {
      setInitialCollapsed(false);
    } else if (settings.sidebar_collapsed_default === "true") {
      setInitialCollapsed(true);
    } else {
      setInitialCollapsed(false);
    }
  }, [settings.sidebar_collapsed_default]);

  return (
    <DashboardLayoutClient initialCollapsed={initialCollapsed}>
      {children}
    </DashboardLayoutClient>
  );
}