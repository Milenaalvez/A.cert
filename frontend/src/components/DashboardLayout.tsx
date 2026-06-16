"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";

function pathToPage(pathname: string): string {
  if (pathname === "/dashboard") return "dashboard";
  const p = pathname.replace(/^\/dashboard\//, "");
  return p || "dashboard";
}

const PAGE_HREF: Record<string, string> = {
  dashboard: "/dashboard",
  dossies: "/dashboard/dossies",
  "dossies/novo": "/dashboard/dossies/novo",
  pessoas: "/dashboard/pessoas",
  imoveis: "/dashboard/imoveis",
  certidoes: "/dashboard/certidoes",
  relatorios: "/dashboard/relatorios",
  usuarios: "/dashboard/usuarios",
  configuracoes: "/dashboard/configuracoes",
  suporte: "/dashboard/suporte",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("acert-sidebar-collapsed") === "true" } catch { return false }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarWidth = collapsed ? 68 : 240;

  const handleCollapseChange = useCallback((v: boolean) => {
    setCollapsed(v);
    localStorage.setItem("acert-sidebar-collapsed", v ? "true" : "false");
  }, []);

  const handleNavigate = useCallback(
    (page: string) => {
      const href = PAGE_HREF[page] || `/dashboard/${page}`;
      router.push(href);
    },
    [router],
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("acert_token");
    router.push("/");
  }, [router]);

  const user = { name: "Milena Santos", position: "Corretora", role: "Corretora" };

  const activePage = pathToPage(pathname);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#FAFAFA" }}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        collapsed={collapsed}
        onCollapseChange={handleCollapseChange}
      />
      <div
        className="min-h-screen flex flex-col transition-all duration-250 ease-out"
        style={{
          background: "#FAFAFA",
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
