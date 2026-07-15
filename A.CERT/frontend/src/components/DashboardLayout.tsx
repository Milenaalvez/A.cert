"use client";

import { useContext } from "react";
import DashboardLayoutClient, { DashboardLayoutContext } from "./DashboardLayoutClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isNested = useContext(DashboardLayoutContext);
  if (isNested) return <>{children}</>;
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
