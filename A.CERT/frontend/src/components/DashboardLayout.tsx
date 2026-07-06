"use client";

import { useState, useEffect } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [initialCollapsed, setInitialCollapsed] = useState(true);

  useEffect(() => {
    setInitialCollapsed(document.cookie.includes("sidebar-collapsed=true"));
  }, []);

  return (
    <DashboardLayoutClient initialCollapsed={initialCollapsed}>
      {children}
    </DashboardLayoutClient>
  );
}