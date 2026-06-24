"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import NovoDossieModal from "./NovoDossieModal";
import PageLoadingOverlay from "./PageLoadingOverlay";
import ElectronTitleBar from "./ElectronTitleBar";

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

export default function DashboardLayoutClient({
  children,
  initialCollapsed,
}: {
  children: React.ReactNode;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNovoDossie, setShowNovoDossie] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const sidebarWidth = collapsed ? 68 : 250;

  const handleCollapseChange = useCallback((v: boolean) => {
    setCollapsed(v);
    localStorage.setItem("acert-sidebar-collapsed", v ? "true" : "false");
    document.cookie = `sidebar-collapsed=${v ? "true" : "false"}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const handleNavigate = useCallback(
    (page: string) => {
      const href = PAGE_HREF[page] || `/dashboard/${page}`;
      router.push(href);
    },
    [router],
  );

  const handleNavigateWithLoading = useCallback(
    (page: string) => {
      setPageLoading(true);
      const href = PAGE_HREF[page] || `/dashboard/${page}`;
      setTimeout(() => router.push(href), 400);
      setTimeout(() => setPageLoading(false), 1200);
    },
    [router],
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("acert_token");
    router.push("/");
  }, [router]);

  const user = { name: "Milena Santos", position: "Corretora", role: "Corretora" };

  useEffect(() => {
    if (typeof window !== "undefined") (window as any).__acertUser = user.name;
  }, [user.name]);

  const activePage = pathToPage(pathname);

  return (
    <div className="min-h-screen overflow-x-hidden bg-app">
      <ElectronTitleBar />
      <div style={{ display: "flex" }}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        collapsed={collapsed}
        onCollapseChange={handleCollapseChange}
        onNovoDossie={() => setShowNovoDossie(true)}
      />
      <div
        suppressHydrationWarning
        className="min-h-screen flex flex-col transition-all duration-250 ease-out bg-app"
        style={{
          marginLeft: `${sidebarWidth + 24}px`,
          marginRight: "24px",
          width: `calc(100% - ${sidebarWidth + 48}px)`,
        }}
      >
        {children}
      </div>
      {showNovoDossie && (
        <NovoDossieModal
          onClose={() => setShowNovoDossie(false)}
          onCreated={() => {
            setShowNovoDossie(false);
            window.location.href = "/dashboard/dossies";
          }}
        />
      )}
      {pageLoading && <PageLoadingOverlay />}
    </div>
    </div>
  );
}
