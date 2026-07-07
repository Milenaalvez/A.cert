"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import NovoDossieModal from "./NovoDossieModal";
import PageLoadingOverlay from "./PageLoadingOverlay";
import ElectronTitleBar from "./ElectronTitleBar";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { useT } from "@/i18n/useT";

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
  empresas: "/dashboard/empresas",
  imoveis: "/dashboard/imoveis",
  certidoes: "/dashboard/certidoes",
  relatorios: "/dashboard/relatorios",
  usuarios: "/dashboard/usuarios",
  configuracoes: "/dashboard/configuracoes",
  suporte: "/dashboard/suporte",
  trash: "/dashboard/trash",
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
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNovoDossie, setShowNovoDossie] = useState(false);

  useEffect(() => {
    if (pathname && pathname.startsWith("/dashboard")) {
      localStorage.setItem("acert_last_page", pathname);
    }
  }, [pathname]);
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

  const activePage = pathToPage(pathname);

  return (
    <UserProvider>
      <DashboardInner
        activePage={activePage}
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={collapsed}
        handleCollapseChange={handleCollapseChange}
        handleNavigate={handleNavigate}
        handleNavigateWithLoading={handleNavigateWithLoading}
        handleLogout={handleLogout}
        showNovoDossie={showNovoDossie}
        setShowNovoDossie={setShowNovoDossie}
        pageLoading={pageLoading}
        sidebarWidth={sidebarWidth}
      >
        {children}
      </DashboardInner>
    </UserProvider>
  );
}

function DashboardInner({
  activePage, pathname, sidebarOpen, setSidebarOpen, collapsed, handleCollapseChange,
  handleNavigate, handleNavigateWithLoading, handleLogout,
  showNovoDossie, setShowNovoDossie, pageLoading, sidebarWidth, children,
}: {
  activePage: string; pathname: string; sidebarOpen: boolean; setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapsed: boolean; handleCollapseChange: (v: boolean) => void;
  handleNavigate: (p: string) => void; handleNavigateWithLoading: (p: string) => void; handleLogout: () => void;
  showNovoDossie: boolean; setShowNovoDossie: React.Dispatch<React.SetStateAction<boolean>>; pageLoading: boolean;
  sidebarWidth: number; children: React.ReactNode;
}) {
  const { user } = useUser();

  return (
    <div className="min-h-screen overflow-x-hidden bg-app">
      <ElectronTitleBar />
      <div style={{ display: "flex" }}>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="lg:hidden fixed top-3 left-3 z-[60] w-9 h-9 flex items-center justify-center rounded-lg bg-surface border border-default text-secondary hover:text-primary"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
      >
        {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />}

      <div className={`lg:relative ${sidebarOpen ? 'fixed z-50' : 'hidden lg:block'}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user ? { name: user.name || '', position: user.position, role: user.role, avatar: user.avatar, createdAt: user.created_at } : undefined}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        collapsed={collapsed}
        onCollapseChange={handleCollapseChange}
        onNovoDossie={() => setShowNovoDossie(true)}
      />
      </div>

      <div
        suppressHydrationWarning
        className="min-h-screen flex flex-col transition-all duration-250 ease-out bg-app"
        style={{
          marginLeft: `${sidebarWidth + 24}px`,
          marginRight: "24px",
          width: `calc(100% - ${sidebarWidth + 48}px)`,
        }}
      >
        <div className="flex-1">{children}</div>
        <footer className="py-6 text-center text-[11px] text-muted mt-auto" style={{ marginTop: 48 }}>
          © {new Date().getFullYear()} A.CERT — Todos os direitos reservados.
        </footer>
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
