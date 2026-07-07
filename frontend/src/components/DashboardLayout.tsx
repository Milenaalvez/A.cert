"use client";

import DashboardLayoutClient from "./DashboardLayoutClient";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("acert-sidebar-collapsed") === "true";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayoutClient initialCollapsed={getInitialCollapsed()}>
      {children}
    </DashboardLayoutClient>
  );
}