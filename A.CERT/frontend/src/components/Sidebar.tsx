import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  ScrollText,
  BarChart3,
  UserCog,
  Settings,
  Plus,
  LifeBuoy,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Sun,
  Moon,
  Trash2,
  Building2,
  Pencil,
  Briefcase,
  User,
  Lock,
  Bell,
  ChevronRight,
  CalendarDays,
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useT } from "@/i18n/useT"

/* ── Types ─────────────────────────────────────────── */

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  onNovoDossie?: () => void
  user?: { name: string; position?: string | null; role?: string; avatar?: string | null; createdAt?: string } | null
  sidebarOpen: boolean
  onToggleSidebar: () => void
  collapsed: boolean
  onCollapseChange: (v: boolean) => void
}

interface MenuItem {
  label: string
  icon: any
  page: string
}

interface MenuGroup {
  label?: string
  items: MenuItem[]
}

/* ── Section keys ──────────────────────────────────── */

const SECTION_KEYS: Record<string, string> = {
  "GERENCIAMENTO": "gerenciamento",
  "CADASTROS": "cadastros",
  "DOCUMENTAÇÃO": "documentacao",
  "SISTEMA": "sistema",
}

function loadSectionState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("acert-sidebar-sections")
    if (raw) return JSON.parse(raw)
  } catch {}
  return { gerenciamento: true, cadastros: true, documentacao: true, sistema: true }
}

function saveSectionState(state: Record<string, boolean>) {
  localStorage.setItem("acert-sidebar-sections", JSON.stringify(state))
}

/* ── Helpers ───────────────────────────────────────── */

function getRoleLabel(role?: string, position?: string | null): string {
  if (position) return position;
  const map: Record<string, string> = {
    ADMIN: "Administrador",
    ANALYST: "Analista",
    EMPLOYEE: "Corretor",
    EMPLOYE: "Corretor",
  };
  return map[role || ""] || role || "Colaborador";
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Component ─────────────────────────────────────── */

export function Sidebar({ activePage, onNavigate, onLogout, onNovoDossie, user, sidebarOpen, onToggleSidebar, collapsed, onCollapseChange }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useT()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarHover, setSidebarHover] = useState(false)

  const [notifCount, setNotifCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifsLoading, setNotifsLoading] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({})

  function loadNotifCount() {
    const token = localStorage.getItem("acert_token")
    if (!token) return
    fetch("/api/notifications/count", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifCount(d.count || 0))
      .catch(() => {})
  }

  function loadNotifications() {
    setNotifsLoading(true)
    const token = localStorage.getItem("acert_token")
    if (!token) return
    fetch("/api/notifications?limit=20", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setNotifsLoading(false))
  }

  function markAsRead(id: string) {
    const token = localStorage.getItem("acert_token")
    if (!token) return
    fetch(`/api/notifications/${id}/read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n))
        setNotifCount(c => Math.max(0, c - 1))
      })
      .catch(() => {})
  }

  function markAllRead() {
    const token = localStorage.getItem("acert_token")
    if (!token) return
    fetch("/api/notifications/mark-all-read", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })))
        setNotifCount(0)
      })
      .catch(() => {})
  }

  function openProfileDropdown() {
    setShowNotifications(notifCount > 0)
    if (notifCount > 0) loadNotifications()
    setProfileOpen(true)
  }

  function closeDrop() {
    setProfileOpen(false)
    setShowNotifications(false)
  }

  useEffect(() => {
    setMounted(true)
    setSectionState(loadSectionState())
    loadNotifCount()
    const interval = setInterval(loadNotifCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (mounted) saveSectionState(sectionState)
  }, [sectionState, mounted])

  function closeAll() {
    closeDrop()
  }

  const toggleSection = useCallback((label: string) => {
    const key = SECTION_KEYS[label]
    if (!key) return
    setSectionState(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const isSectionOpen = useCallback((label: string) => {
    const key = SECTION_KEYS[label]
    return key ? sectionState[key] ?? true : true
  }, [sectionState])

  const menuGroups: MenuGroup[] = useMemo(() => [
    {
      label: "GERENCIAMENTO",
      items: [
        { label: t("sidebar.dashboard"), icon: LayoutDashboard, page: "dashboard" },
      ],
    },
    {
      label: "CADASTROS",
      items: [
        { label: t("sidebar.people"), icon: Users, page: "pessoas" },
        { label: "Empresas", icon: Building2, page: "empresas" },
      ],
    },
    {
      label: "DOCUMENTAÇÃO",
      items: [
        { label: t("sidebar.dossiers"), icon: FolderOpen, page: "dossies" },
        { label: t("sidebar.certificates"), icon: ScrollText, page: "certidoes" },
        { label: t("sidebar.reports"), icon: BarChart3, page: "relatorios" },
      ],
    },
    {
      label: "SISTEMA",
      items: [
        { label: t("sidebar.users"), icon: UserCog, page: "usuarios" },
        { label: t("sidebar.settings"), icon: Settings, page: "configuracoes" },
        { label: t("sidebar.support"), icon: LifeBuoy, page: "suporte" },
        { label: t("sidebar.trash"), icon: Trash2, page: "trash" },
      ],
    },
  ], [t])

  function NavItem({ item, navCollapsed }: { item: MenuItem; navCollapsed: boolean }) {
    const Icon = item.icon
    const isActive = activePage === item.page
    return (
      <button
        onClick={() => onNavigate(item.page)}
        title={navCollapsed ? item.label : undefined}
        style={navCollapsed ? undefined : { paddingLeft: "18px", paddingRight: "18px" }}
        className={`group relative flex items-center gap-3 w-full h-11 rounded-xl text-[14px] font-medium transition-all duration-200 ${
          navCollapsed ? "justify-center px-0" : ""
        } ${
          isActive
            ? "text-white"
            : "text-[#F0F3FA]/70 hover:text-[#FFFFFF] hover:bg-white/[0.06]"
        }`}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.5 : 2}
          className={`shrink-0 transition-all duration-200 ${
            isActive
              ? "text-[#FF7A00]"
              : "text-[#F0F3FA]/50 group-hover:text-[#F0F3FA]/80"
          }`}
        />
        {!navCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </button>
    )
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onToggleSidebar} />
      )}
      <aside
        suppressHydrationWarning
        data-tour="menu-lateral"
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
        className={`fixed top-0 left-0 h-screen flex flex-col select-none z-30 transition-all duration-250 ease-out lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "w-[68px]" : ""}`}
        style={{
          width: collapsed ? "68px" : "250px",
          backgroundImage: "linear-gradient(180deg, #07101F 0%, #020817 100%)",
        }}
      >
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center text-[#F0F3FA]/60 hover:text-[#FFFFFF] hover:bg-white/5 transition-all duration-200 lg:hidden"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* ══════ HEADER: Logo ══════ */}
        <div className={`shrink-0 ${collapsed ? "flex justify-center" : "px-6"}`} style={{ paddingTop: "25px", paddingBottom: "25px" }}>
          {collapsed ? (
            <img
              src="/images/logo.png"
              alt="A.CERT"
              className="shrink-0 object-contain"
              style={{ width: 52, height: 52 }}
            />
          ) : (
            <div className="flex items-center" style={{ gap: "8px" }}>
              <img
                src="/images/logo.png"
                alt="A.CERT"
                className="shrink-0 object-contain"
                style={{ width: 52, height: 52 }}
              />
              <div className="flex flex-col">
                <span className="text-white text-[22px] font-bold tracking-tight leading-none">
                  A.CERT
                </span>
                <span className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.15em] mt-1.5 leading-none">
                  {t("sidebar.subtitle")}
                </span>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            width: 3px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.08);
            border-radius: 99px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.15);
          }
          .sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.08) transparent;
          }
        `}</style>

        {/* ══════ CONTEÚDO CENTRAL SCROLLÁVEL ══════ */}
        <nav className="flex-1 flex flex-col overflow-y-auto sidebar-scroll">
          {/* Novo Dossiê */}
          <div className="shrink-0" style={{ marginBottom: "19px", paddingLeft: collapsed ? "0" : "18px", paddingRight: collapsed ? "0" : "18px" }}>
            <button
              onClick={() => onNovoDossie ? onNovoDossie() : onNavigate("dossies")}
              data-tour="btn-novo-dossie"
              className="flex items-center justify-center w-full h-9 bg-gradient-to-r from-[#FF7A00] to-[#FF9A3D] text-white font-semibold hover:brightness-110 transition-all duration-200"
              style={{ borderRadius: collapsed ? "0" : "4px", fontSize: collapsed ? "18px" : "13px", gap: collapsed ? "0" : "8px" }}
            >
              <Plus size={collapsed ? 20 : 16} strokeWidth={2.5} />
              {!collapsed && <span>{t("sidebar.newDossier")}</span>}
            </button>
          </div>

          {menuGroups.map((group, gi) => {
            const hasLabel = !!group.label
            const sectionOpen = group.label ? isSectionOpen(group.label) : true

            return (
              <div key={gi} className="flex flex-col border-t border-white/[0.08]" style={{ paddingTop: "19px", paddingBottom: "4px" }}>
                {hasLabel && (
                  <>
                    {collapsed ? (
                      <div className="flex justify-center items-center h-6 mb-2">
                        <div className="w-6 h-px bg-white/[0.08]" />
                      </div>
                    ) : (
                      <div className="w-full mb-3" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
                        <span className="text-[10px] font-semibold text-white/45 uppercase tracking-[0.18em]">{group.label}</span>
                      </div>
                    )}
                  </>
                )}
                {(!hasLabel || sectionOpen || collapsed) && (
                  <div className={`flex flex-col gap-0.5 ${collapsed ? "items-center" : ""}`}>
                    {group.items.map((item) => (
                      <NavItem key={item.page} item={item} navCollapsed={collapsed} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="shrink-0 h-3" />
        </nav>

        {/* ══════ THEME TOGGLE ══════ */}
        <div className={`shrink-0 ${collapsed ? "flex flex-col items-center pt-4 pb-2" : "px-6 pt-4 pb-2"}`}>
          <button
            onClick={toggleTheme}
            title={collapsed ? (theme === "light" ? t("sidebar.lightMode") : t("sidebar.darkMode")) : undefined}
            className={`flex items-center gap-4 w-full h-11 rounded-xl text-[14px] font-medium text-[#F0F3FA] hover:text-[#FFFFFF] hover:bg-white/[0.06] transition-all duration-200 group ${
              collapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            <div className="relative w-10 h-5 rounded-full bg-white/[0.08] border border-white/[0.06] transition-all duration-300 group-hover:border-white/20 shrink-0">
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#FFFFFF] shadow-sm transition-all duration-300 flex items-center justify-center ${
                  !mounted || theme === "light" ? "left-0.5" : "left-[22px]"
                }`}
              >
                {mounted ? (
                  theme === "light" ? (
                    <Sun size={8} className="text-[#FF7A00]" />
                  ) : (
                    <Moon size={8} className="text-[#FF7A00]" />
                  )
                ) : (
                  <Sun size={8} className="text-[#FF7A00]" />
                )}
              </div>
            </div>
            {!collapsed && <span>{!mounted || theme === "light" ? t("sidebar.lightMode") : t("sidebar.darkMode")}</span>}
          </button>
        </div>

        {/* ══════ FOOTER: Perfil (estrutura igual ao Chronos) ══════ */}
        <div className={`shrink-0 border-t border-white/[0.08] ${collapsed ? "flex flex-col items-center pt-2 pb-5" : "px-6 pt-2 pb-5"}`}>
          <div className="relative w-full">
            <button
              onClick={() => { profileOpen ? closeDrop() : openProfileDropdown() }}
              data-tour="sidebar-perfil"
              title={collapsed ? user?.name || 'Usuário' : undefined}
              className={`flex items-center gap-3 w-full h-14 rounded-xl text-[14px] font-medium text-[#F0F3FA] hover:text-[#FFFFFF] hover:bg-white/[0.06] transition-all duration-200 ${
                collapsed ? "justify-center px-0" : "px-0"
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[13px] font-bold overflow-hidden" style={{ background: "#FF7A00" }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white">{user?.name ? getInitials(user.name) : 'U'}</span>
                  )}
                </div>
                {notifCount > 0 && (
                  <div
                    className={`absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-[#DC2626] border-2 border-[#0B1220] ${collapsed ? "-top-1 -right-1 w-[18px] h-[18px]" : ""}`}
                    style={collapsed ? {} : { top: -2, right: -4, minWidth: 18, height: 18, padding: "0 4px" }}
                  >
                    {notifCount}
                  </div>
                )}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 flex flex-col items-start text-left min-w-0">
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-[14px] font-semibold text-white truncate">{user?.name || 'Usuário'}</span>
                      {notifCount > 0 && (
                        <span className="shrink-0 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center" style={{ minWidth: 18, height: 18, padding: "0 5px" }}>{notifCount}</span>
                      )}
                    </div>
                    <span className="text-[12px] text-white/60 truncate w-full">{getRoleLabel(user?.role, user?.position)}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={`text-white/40 shrink-0 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => closeAll()} />
                <div
                  className="fixed z-20 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  style={{
                    width: 340,
                    bottom: 96,
                    left: collapsed ? 92 : 274,
                    maxHeight: "calc(100vh - 32px)",
                    borderRadius: 22,
                    background: "linear-gradient(180deg, #0B1220 0%, #07101F 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  {showNotifications ? (
                    <>
                      <div style={{ padding: "20px 24px 0" }}>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                        >
                          <ChevronRight size={14} strokeWidth={2} style={{ transform: "rotate(180deg)" }} />
                          Voltar ao perfil
                        </button>
                        <div className="mt-4 mb-3 flex items-center justify-between">
                          <h3 className="text-[14px] font-semibold text-white">
                            Notificações
                            {notifCount > 0 && <span className="ml-2 text-[11px] font-normal text-white/40">{notifCount} nova{notifCount > 1 ? "s" : ""}</span>}
                          </h3>
                        </div>
                      </div>
                      <div className="flex flex-col" style={{ minHeight: 300, maxHeight: 420, overflowY: "auto" }}>
                        {notifsLoading ? (
                          <div className="flex items-center justify-center" style={{ height: 300 }}>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center" style={{ height: 280 }}>
                            <Bell size={32} strokeWidth={1.5} className="text-white/10 mb-4" />
                            <p className="text-[13px] text-white/40">Nenhuma notificação.</p>
                            <p className="text-[11px] text-white/20 mt-1">As notificações do sistema aparecerão aqui.</p>
                          </div>
                        ) : (
                          notifications.map((n: any) => (
                            <div
                              key={n.id}
                              className={`flex items-start gap-3 px-6 py-3.5 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors ${!n.isRead ? "bg-white/[0.02]" : ""}`}
                              onClick={() => { markAsRead(n.id); if (n.link) { closeAll(); router.push(n.link); } }}
                            >
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                style={{ background: n.isRead ? "transparent" : "#FF7A00" }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] text-white/90 leading-snug">{n.title}</p>
                                <p className="text-[11px] text-white/40 mt-0.5">{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.filter((n: any) => !n.isRead).length > 0 && (
                        <>
                          <div className="mx-7 border-t border-white/[0.06]" />
                          <button
                            onClick={markAllRead}
                            className="flex items-center justify-center gap-2 w-full h-12 text-[12px] text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                          >
                            Marcar todas como lidas
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Header */}
                      <div style={{ padding: "28px 24px 20px" }}>

                        <div className="flex flex-col items-center gap-2.5">
                          <div
                            className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ width: 64, height: 64, background: "#FF7A00" }}
                          >
                            {user?.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-[22px] font-bold">{user?.name ? getInitials(user.name) : 'U'}</span>
                            )}
                          </div>
                          <div className="text-center">
                            <h3 className="text-[13px] font-semibold text-white leading-tight">{user?.name || 'Usuário'}</h3>
                            <p className="text-[11px] text-white/40 mt-0.5">{getRoleLabel(user?.role, user?.position)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="flex flex-col py-1" style={{ padding: "0 28px" }}>
                          {[
                            { icon: Briefcase, label: "Cargo", value: getRoleLabel(user?.role, user?.position) },
                            { icon: Building2, label: "Empresa", value: "A.CERT" },
                            { icon: CalendarDays, label: "Membro desde", value: user?.createdAt ? formatDate(user.createdAt) : "—" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 h-12">
                              <item.icon size={16} strokeWidth={1.5} className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                              <span className="text-[12px] text-white/40">{item.label}</span>
                              <span className="flex-1 text-right text-[13px] text-[#FF7A00] font-medium">{item.value}</span>
                            </div>
                          ))}
                      </div>

                      {/* Divider */}
                      <div className="mx-7 my-5 border-t border-white/[0.06]" />
                      {/* Actions */}
                      <div className="flex flex-col py-1">
                        {[
                          { icon: User, label: "Editar perfil", path: "/dashboard/configuracoes" },
                          { icon: Lock, label: "Alterar senha", path: "/dashboard/configuracoes" },
                          { icon: Bell, label: notifCount > 0 ? `Notificações (${notifCount})` : "Notificações", action: () => { loadNotifications(); setShowNotifications(true); } },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => { if ("action" in item) (item as any).action(); else { closeAll(); router.push((item as any).path); } }}
                            className="flex items-center gap-3 w-full h-12 px-7 text-[13px] text-white/80 hover:bg-white/[0.04] transition-colors cursor-pointer"
                          >
                            <item.icon size={16} strokeWidth={1.5} className="text-white/50 shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight size={14} strokeWidth={2} className="text-white/30 shrink-0" />
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="mx-7 border-t border-white/[0.06]" />

                      {/* Logout */}
                      <button
                        onClick={() => { closeAll(); onLogout(); }}
                        className="flex items-center gap-3 w-full h-12 px-7 text-[13px] font-medium text-[#F87171] hover:bg-[#DC2626]/10 transition-colors cursor-pointer"
                      >
                        <LogOut size={16} strokeWidth={2} className="shrink-0" />
                        <span>{t("sidebar.logout")}</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Collapse toggle fantasma (fora da sidebar) */}
      <div
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
        className="hidden lg:block fixed top-0 h-screen z-40"
        style={{
          left: collapsed ? "56px" : "238px",
          width: "24px",
          transition: "left 250ms ease-out",
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => onCollapseChange(!collapsed)}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="absolute top-1/2 -translate-y-1/2 left-0 w-7 h-16 flex items-center justify-center"
          style={{
            opacity: sidebarHover ? 1 : 0,
            pointerEvents: sidebarHover ? "auto" : "none",
            transition: "opacity 300ms",
            backgroundImage: "linear-gradient(180deg, #07101F 0%, #020817 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderLeft: "none",
            borderRadius: "0 6px 6px 0",
            color: "rgba(255,255,255,0.3)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "white" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)" }}
        >
          {collapsed ? (
            <PanelRightOpen size={12} strokeWidth={2} />
          ) : (
            <PanelRightClose size={12} strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  )
}
