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
  LogOut,
} from "lucide-react"

/* ── Types ─────────────────────────────────────────── */

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  onLogout: () => void
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
  addButton?: boolean
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

export function Sidebar({ activePage, onNavigate, onLogout, user, sidebarOpen, onToggleSidebar, collapsed, onCollapseChange }: SidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [sectionState, setSectionState] = useState<Record<string, boolean>>(loadSectionState)

  useEffect(() => {
    saveSectionState(sectionState)
  }, [sectionState])

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
        { label: "Dossiês", icon: FolderOpen, page: "dossies", addButton: true },
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
        { label: "Certidões", icon: ScrollText, page: "certidoes" },
        { label: "Relatórios", icon: BarChart3, page: "relatorios" },
      ],
    },
    {
      label: "SISTEMA",
      items: [
        { label: "Usuários", icon: UserCog, page: "usuarios" },
        { label: "Configurações", icon: Settings, page: "configuracoes" },
      ],
    },
  ], [])

  function NavItem({ item, collapsed: navCollapsed }: { item: MenuItem; collapsed: boolean }) {
    const Icon = item.icon
    const isActive = activePage === item.page
    const content = (
      <button
        onClick={() => onNavigate(item.page)}
        title={navCollapsed ? item.label : undefined}
        className={`group relative flex items-center gap-4 w-full h-11 rounded-xl text-[14px] font-medium transition-all duration-200 ${
          navCollapsed ? "justify-center px-0" : "px-4"
        } ${
          isActive
            ? "bg-[rgba(255,122,0,0.12)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
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
          <>
            <span className="truncate flex-1 text-left">{item.label}</span>
            {item.addButton && (
              <span
                className="shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/[0.1]"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate("dossies/novo")
                }}
                title="Novo Dossiê"
              >
                <Plus size={14} strokeWidth={2.5} className="text-[#FF7A00]" />
              </span>
            )}
          </>
        )}
      </button>
    )
    return content
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onToggleSidebar} />
      )}
      <aside className={`fixed top-0 left-0 h-screen flex flex-col select-none z-30 transition-all duration-250 ease-out lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "w-[68px]" : "w-60"}`}
        style={{
          background: "linear-gradient(180deg, #07101F 0%, #020817 100%)",
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

        {/* Logo */}
        <div className={`flex items-center gap-3.5 px-8 pt-14 pb-14 ${collapsed ? "justify-center px-0" : ""}`}>
          <img
            src="/images/logo.png"
            alt="A.CERT"
            className="shrink-0 object-contain"
            style={{ width: collapsed ? 36 : 44, height: collapsed ? 36 : 44 }}
          />
          {!collapsed && (
            <span className="text-white text-[20px] font-bold tracking-tight leading-tight" style={{ letterSpacing: "-0.03em" }}>
              A.CERT
            </span>
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
        <nav className="flex-1 flex flex-col px-3 pt-6 overflow-y-auto sidebar-scroll">
          {menuGroups.map((group, gi) => {
            const hasLabel = !!group.label
            const sectionOpen = group.label ? isSectionOpen(group.label) : true

            return (
              <div key={gi} className={gi < menuGroups.length - 1 ? "mb-6" : ""}>
                {hasLabel && (
                  <button
                    onClick={() => group.label && toggleSection(group.label)}
                    title={collapsed ? group.label : undefined}
                    className={`flex items-center w-full mb-1.5 transition-all duration-200 ${
                      collapsed
                        ? "justify-center h-9"
                        : "gap-2 px-4 h-9"
                    }`}
                  >
                    {collapsed ? (
                      <div className="w-6 h-px bg-white/[0.08]" />
                    ) : (
                      <>
                        <ChevronDown
                          size={11}
                          strokeWidth={2.5}
                          className={`shrink-0 text-[#F0F3FA]/60 transition-transform duration-200 ${
                            sectionOpen ? "" : "-rotate-90"
                          }`}
                        />
                        <span className="text-[9px] font-semibold text-[#F0F3FA]/70 uppercase tracking-[0.18em]">{group.label}</span>
                        <div className="flex-1 h-px bg-white/[0.10]" />
                      </>
                    )}
                  </button>
                )}
                {(!hasLabel || sectionOpen) && (
                  <div className={`flex flex-col gap-1.5 ${collapsed ? "items-center" : ""}`}>
                    {group.items.map((item) => (
                      <NavItem key={item.page} item={item} collapsed={collapsed} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className={`flex flex-col gap-1 pt-3 pb-5 border-t border-white/[0.06] mt-auto ${collapsed ? "items-center px-2" : "px-3"}`}>
          <div className="relative w-full">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              title={collapsed ? user?.name || 'Usuário' : undefined}
              className={`flex items-center gap-4 w-full h-11 rounded-xl text-[14px] font-medium text-[#F0F3FA] hover:text-[#FFFFFF] hover:bg-white/[0.06] transition-all duration-200 ${
                collapsed ? "justify-center px-0" : "px-4"
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-semibold overflow-hidden" style={{ background: "#FF7A00" }}>
                <span className="text-white">{user?.name ? getInitials(user.name) : 'U'}</span>
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 flex flex-col items-start text-left min-w-0">
                    <span className="text-[14px] font-medium text-[#FFFFFF] truncate w-full">{user?.name || 'Usuário'}</span>
                    <span className="text-[10px] text-[#F0F3FA]/60 truncate w-full">{user?.position || user?.role || 'Colaborador'}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    strokeWidth={2}
                    className={`text-[#F0F3FA]/40 shrink-0 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => closeAll()} />
                <div className={`absolute ${collapsed ? "left-full ml-2 bottom-0 w-56" : "bottom-full left-0 right-0 mb-1.5"} rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[60vh] overflow-y-auto`}
                  style={{
                    background: "#0B1220",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="px-4 py-3 border-b border-white/[0.05]">
                    <p className="text-[14px] font-medium text-[#FFFFFF]">{user?.name || 'Usuário'}</p>
                    <p className="text-[10px] text-[#F0F3FA]/60 mt-[1px]">{user?.position || user?.role || 'Colaborador'}</p>
                  </div>
                  <button
                    onClick={() => {
                      closeAll()
                      onLogout()
                    }}
                    className="flex items-center gap-4 w-full h-11 px-4 text-[14px] font-medium text-[#F0F3FA] hover:bg-[#D94A4A] hover:text-[#FFFFFF] transition-all duration-200"
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
    </>
  )
}
