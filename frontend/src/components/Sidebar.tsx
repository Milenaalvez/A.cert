import { useState, useMemo, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Building2,
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
  Archive,
  Trash2,
  Star,
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

/* ── Types ─────────────────────────────────────────── */

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  onNovoDossie?: () => void
  user?: { name: string; position?: string | null; role?: string; avatar?: string | null } | null
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

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ── Component ─────────────────────────────────────── */

export function Sidebar({ activePage, onNavigate, onLogout, onNovoDossie, user, sidebarOpen, onToggleSidebar, collapsed, onCollapseChange }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarHover, setSidebarHover] = useState(false)
  const [dossieSubmenu, setDossieSubmenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
    setSectionState(loadSectionState())
  }, [])

  useEffect(() => {
    if (mounted) saveSectionState(sectionState)
  }, [sectionState, mounted])

  function closeAll() {
    setProfileOpen(false)
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
        { label: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
      ],
    },
    {
      label: "CADASTROS",
      items: [
        { label: "Pessoas", icon: Users, page: "pessoas" },
        { label: "Imóveis", icon: Building2, page: "imoveis" },
      ],
    },
    {
      label: "DOCUMENTAÇÃO",
      items: [
        { label: "Dossiês", icon: FolderOpen, page: "dossies" },
        { label: "Certidões", icon: ScrollText, page: "certidoes" },
        { label: "Relatórios", icon: BarChart3, page: "relatorios" },
      ],
    },
    {
      label: "SISTEMA",
      items: [
        { label: "Usuários", icon: UserCog, page: "usuarios" },
        { label: "Configurações", icon: Settings, page: "configuracoes" },
        { label: "Suporte", icon: LifeBuoy, page: "suporte" },
        { label: "Lixeira", icon: Trash2, page: "trash" },
      ],
    },
  ], [])

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
                  Central de Certidões
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
              className="flex items-center justify-center w-full h-9 bg-gradient-to-r from-[#FF7A00] to-[#FF9A3D] text-white font-semibold hover:brightness-110 transition-all duration-200"
              style={{ borderRadius: collapsed ? "0" : "4px", fontSize: collapsed ? "18px" : "13px", gap: collapsed ? "0" : "8px" }}
            >
              <Plus size={collapsed ? 20 : 16} strokeWidth={2.5} />
              {!collapsed && <span>Novo Dossiê</span>}
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
                    {group.items.map((item) =>
                      item.page === "dossies" ? (
                        <div key={item.page} className="flex flex-col">
                          <button
                            onClick={() => onNavigate(item.page)}
                            title={collapsed ? item.label : undefined}
                            style={collapsed ? undefined : { paddingLeft: "18px", paddingRight: "18px" }}
                            className={`group relative flex items-center gap-3 w-full h-11 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                              collapsed ? "justify-center px-0" : ""
                            } ${
                              activePage === item.page
                                ? "text-white"
                                : "text-[#F0F3FA]/70 hover:text-[#FFFFFF] hover:bg-white/[0.06]"
                            } ${collapsed ? "" : "pr-0"}`}
                          >
                            <FolderOpen
                              size={20}
                              strokeWidth={activePage === item.page ? 2.5 : 2}
                              className={`shrink-0 transition-all duration-200 ${
                                activePage === item.page
                                  ? "text-[#FF7A00]"
                                  : "text-[#F0F3FA]/50 group-hover:text-[#F0F3FA]/80"
                              }`}
                            />
                            {!collapsed && (
                              <div className="flex items-center gap-0 flex-1 min-w-0">
                                <span className="truncate">{item.label}</span>
                                <span
                                  onClick={(e) => { e.stopPropagation(); setDossieSubmenu(!dossieSubmenu); }}
                                  className="flex items-center justify-center text-[#F0F3FA]/40 hover:text-white transition-colors shrink-0 cursor-pointer select-none"
                                  style={{ width: "14px", height: "14px", marginLeft: "2px" }}
                                >
                                  <span className={`text-[10px] leading-none transition-transform duration-200 ${dossieSubmenu ? "rotate-90" : ""}`}>›</span>
                                </span>
                              </div>
                            )}
                          </button>
                          {!collapsed && dossieSubmenu && (
                            <div className="flex flex-col">
                              <button
                                onClick={() => onNavigate("dossies")}
                                className="group flex items-center gap-3 w-full h-10 text-[13px] text-[#F0F3FA]/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                                style={{ paddingLeft: "50px", paddingRight: "18px" }}
                              >
                                <Archive size={16} strokeWidth={1.5} className="shrink-0 text-[#F0F3FA]/40 group-hover:text-[#F0F3FA]/70" />
                                <span>Arquivados</span>
                              </button>
                              <button
                                onClick={() => onNavigate("dossies")}
                                className="group flex items-center gap-3 w-full h-10 text-[13px] text-[#F0F3FA]/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                                style={{ paddingLeft: "50px", paddingRight: "18px" }}
                              >
                                <Star size={16} strokeWidth={1.5} className="shrink-0 text-[#FFB800]/60 group-hover:text-[#FFB800]" />
                                <span>Prioridades</span>
                              </button>

                            </div>
                          )}
                        </div>
                      ) : (
                        <NavItem key={item.page} item={item} navCollapsed={collapsed} />
                      )
                    )}
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
            title={collapsed ? (theme === "light" ? "Modo claro" : "Modo escuro") : undefined}
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
            {!collapsed && <span>{!mounted || theme === "light" ? "Modo claro" : "Modo escuro"}</span>}
          </button>
        </div>

        {/* ══════ FOOTER: Perfil (estrutura igual ao Chronos) ══════ */}
        <div className={`shrink-0 border-t border-white/[0.08] ${collapsed ? "flex flex-col items-center pt-2 pb-5" : "px-6 pt-2 pb-5"}`}>
          <div className="relative w-full">
            <button
              onClick={() => { setProfileOpen((prev) => !prev) }}
              title={collapsed ? user?.name || 'Usuário' : undefined}
              className={`flex items-center gap-3 w-full h-14 rounded-xl text-[14px] font-medium text-[#F0F3FA] hover:text-[#FFFFFF] hover:bg-white/[0.06] transition-all duration-200 ${
                collapsed ? "justify-center px-0" : "px-0"
              }`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold overflow-hidden" style={{ background: "#FF7A00" }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white">{user?.name ? getInitials(user.name) : 'U'}</span>
                )}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 flex flex-col items-start text-left min-w-0">
                    <span className="text-[17px] font-semibold text-white truncate w-full">{user?.name || 'Usuário'}</span>
                    <span className="text-[12px] text-white/60 truncate w-full">{user?.position || user?.role || 'Colaborador'}</span>
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
                <div className={`absolute ${collapsed ? "left-full ml-2 bottom-0 w-56" : "bottom-full left-0 right-0 mb-1.5"} rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  style={{
                    background: "#0B1220",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="pt-5 pb-2 px-4 text-[9px] font-semibold uppercase tracking-widest text-[#F0F3FA]/50">
                    Trocar conta
                  </div>
                  <button
                    onClick={() => { closeAll(); onLogout() }}
                    className="flex items-center gap-3 w-full h-12 px-4 text-[13px] text-[#F0F3FA] hover:bg-[#FF7A00]/20 hover:text-white transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold overflow-hidden" style={{ background: "#FF7A00" }}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white">{user?.name ? getInitials(user.name) : 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0 leading-tight">
                      <div className="truncate text-[13px] font-medium">{user?.name || 'Usuário'}</div>
                      <div className="text-[10px] text-[#F0F3FA]/60 truncate">{user?.position || user?.role || 'Colaborador'}</div>
                    </div>
                  </button>
                  <div className="h-px bg-white/[0.06] mx-4 my-3" />
                  <div className="pb-2 px-4 text-[9px] font-semibold uppercase tracking-widest text-[#F0F3FA]/50">
                    Visualizar como
                  </div>
                  {["Corretora", "Administradora"].map((role) => (
                    <button
                      key={role}
                      onClick={() => { closeAll(); onLogout() }}
                      className="flex items-center gap-3 w-full h-12 px-4 text-[13px] text-[#F0F3FA] hover:bg-[#FF7A00]/20 hover:text-white transition-all duration-200"
                    >
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold overflow-hidden" style={{ background: "#0B1220", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span>{role.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0 leading-tight">
                        <div className="truncate text-[13px] font-medium">{role}</div>
                        <div className="text-[10px] text-[#F0F3FA]/60 truncate">Visualizar como</div>
                      </div>
                    </button>
                  ))}
                  <div className="h-px bg-white/[0.06] mx-4 my-3" />
                  <button
                    onClick={() => { closeAll(); onLogout() }}
                    className="flex items-center gap-3 w-full h-12 px-4 text-[13px] font-medium text-[#F0F3FA] hover:bg-[#D94A4A] hover:text-white transition-all duration-200"
                  >
                    <LogOut size={18} strokeWidth={2} className="shrink-0" />
                    <span>Sair da conta</span>
                  </button>
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
