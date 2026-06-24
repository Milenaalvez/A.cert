"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserPlus, MoreHorizontal, UserCog,
  CheckCircle2, XCircle, Clock, Circle, Shield, Key, Trash2, Edit,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import NovoUsuarioModal from "@/components/NovoUsuarioModal";
import PermissoesModal from "@/components/PermissoesModal";
import * as teamApi from "@/services/teamApi";

/* ── Types ─────────────────────────────────────────── */
interface EnrichedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  departmentId?: string;
  position?: string;
  positionId?: string;
  contractType?: string;
  registrationNumber?: string;
  phone?: string;
  avatar?: string | null;
  employeeCode?: string;
  weeklyHours?: number;
  workSchedule?: string;
  hireDate?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  lastAccessAt?: string;
  todayStatus?: string;
  isOnline?: boolean;
}

/* ── Constants ─────────────────────────────────────── */
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  RH: "RH",
  EMPLOYEE: "Colaborador",
  DEVELOPER: "Desenvolvedor",
};

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6" },
  RH: { bg: "rgba(16,185,129,0.1)", text: "#10B981" },
  EMPLOYEE: { bg: "rgba(156,163,175,0.1)", text: "#6B7280" },
  DEVELOPER: { bg: "rgba(139,92,246,0.1)", text: "#8B5CF6" },
};

/* ── Helpers ───────────────────────────────────────── */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) {
    return `Hoje às ${new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diff < 172800) {
    return `Ontem às ${new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function statusDot(status: string | undefined, isActive: boolean | undefined) {
  if (isActive === false) return { color: "#EF4444", label: "Desativado", Icon: XCircle };
  if (status === "online") return { color: "#10B981", label: "Online", Icon: CheckCircle2 };
  if (status === "away") return { color: "#F59E0B", label: "Ausente", Icon: Clock };
  return { color: "#6B7280", label: "Offline", Icon: Circle };
}

/* ── Component ─────────────────────────────────────── */
export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [permUserId, setPermUserId] = useState("");
  const [permUserName, setPermUserName] = useState("");
  const [contextOpen, setContextOpen] = useState<string | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await teamApi.enriched();
      setUsers(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!contextOpen) return;
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextOpen]);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.department || "").toLowerCase().includes(s);
    if (!matchSearch) return false;
    if (activeFilter === "admins") return u.role === "ADMIN";
    if (activeFilter === "rh") return u.role === "RH";
    if (activeFilter === "employees") return u.role === "EMPLOYEE";
    if (activeFilter === "developers") return u.role === "DEVELOPER";
    if (activeFilter === "inactive") return u.isActive === false;
    return true;
  });

  const counts = {
    todos: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    rh: users.filter((u) => u.role === "RH").length,
    employees: users.filter((u) => u.role === "EMPLOYEE").length,
    developers: users.filter((u) => u.role === "DEVELOPER").length,
    inactive: users.filter((u) => u.isActive === false).length,
  };

  const FILTERS = [
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "admins", label: "Administradores", count: counts.admins },
    { key: "rh", label: "RH", count: counts.rh },
    { key: "employees", label: "Colaboradores", count: counts.employees },
    { key: "developers", label: "Desenvolvedores", count: counts.developers },
    { key: "inactive", label: "Inativos", count: counts.inactive },
  ];

  async function handleAction(action: string, user: EnrichedUser) {
    setContextOpen(null);
    try {
      if (action === "toggle") {
        await teamApi.updateStatus(user.id, !user.isActive);
      } else if (action === "reset") {
        await teamApi.resetPassword(user.id);
      } else if (action === "delete") {
        if (!confirm(`Remover ${user.name}?`)) return;
        await teamApi.remove(user.id);
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Erro");
    }
  }

  const contextMenuItems = (u: EnrichedUser) => [
    {
      icon: UserCog,
      label: "Visualizar",
      action: () => router.push(`/dashboard/usuarios/${u.id}`),
    },
    {
      icon: Edit,
      label: "Editar",
      action: () => router.push(`/dashboard/usuarios/${u.id}`),
    },
    {
      icon: Shield,
      label: "Alterar permissões",
      action: () => {
        setPermUserId(u.id);
        setPermUserName(u.name);
        setPermOpen(true);
      },
    },
    { icon: Key, label: "Resetar senha", action: () => handleAction("reset", u) },
    {
      icon: u.isActive ? XCircle : CheckCircle2,
      label: u.isActive ? "Desativar" : "Ativar",
      action: () => handleAction("toggle", u),
    },
    { icon: Trash2, label: "Remover", action: () => handleAction("delete", u) },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">

        {/* Header */}
        <div style={{ marginTop: 24 }} className="flex items-start justify-between gap-8 mb-5">
          <div className="flex flex-col gap-1.5 min-w-0">
            <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Usuários</h1>
            <p className="text-[14px] text-secondary leading-relaxed">Gerencie acessos, permissões e atividades da equipe.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-0.5">
            <div className="relative">
              <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[260px] h-[44px] rounded-[8px] border border-default text-[14px] text-primary bg-surface placeholder:text-muted outline-none transition-colors"
                style={{ paddingLeft: "42px", paddingRight: "16px" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
              />
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 h-10 px-6 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#E06900] transition-colors"
            >
              <UserPlus size={16} strokeWidth={2.5} /> Novo Usuário
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 rounded-[20px] text-[13px] font-medium transition-colors cursor-pointer border ${
                activeFilter === f.key
                  ? "border-[#FF7A00] text-[#FF7A00]"
                  : "border-default text-secondary hover:text-primary"
              }`}
              style={{
                background: activeFilter === f.key ? "var(--badge-orange-bg)" : "transparent",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div           className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-app)" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr
                  className="border-b border-default"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  {[
                    "Usuário",
                    "Cargo",
                    "Departamento",
                    "Status",
                    "Último acesso",
                    "Carga horária",
                    "Perfil de acesso",
                    "Ações",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-[0.5px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[13px] text-muted">
                      Carregando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[13px] text-muted">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const st = statusDot(
                      u.todayStatus || (u.isActive ? "offline" : undefined),
                      u.isActive
                    );
                    const Icon = st.Icon;
                    const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.EMPLOYEE;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-default cursor-pointer transition-colors"
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        onClick={() => router.push(`/dashboard/usuarios/${u.id}`)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[14px] font-bold text-primary shrink-0"
                              style={{ background: "var(--bg-elevated)" }}
                            >
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-primary truncate">{u.name}</div>
                              <div className="text-[12px] text-muted truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[12px] text-[11px] font-semibold whitespace-nowrap"
                            style={{ background: roleStyle.bg, color: roleStyle.text }}
                          >
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[13px] text-secondary">
                            {u.department || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Icon size={14} strokeWidth={2} style={{ color: st.color }} />
                            <span className="text-[12px] font-medium" style={{ color: st.color }}>
                              {st.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-secondary">
                          {timeAgo(u.lastAccessAt)}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-secondary">
                          {u.weeklyHours || 40}h semanais
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="text-[12px] font-medium"
                            style={{
                              color: u.role === "ADMIN" ? "#3B82F6" : "var(--text-secondary)",
                            }}
                          >
                            {u.role === "ADMIN"
                              ? "Administrador Total"
                              : u.role === "RH"
                                ? "Recursos Humanos"
                                : u.role === "DEVELOPER"
                                  ? "Desenvolvedor"
                                  : "Operacional"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="relative" ref={contextOpen === u.id ? contextRef : undefined}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextOpen(contextOpen === u.id ? null : u.id);
                              }}
                              className="w-8 h-8 rounded-[6px] flex items-center justify-center text-muted hover:text-primary transition-colors"
                              style={{ background: contextOpen === u.id ? "var(--bg-muted)" : "transparent" }}
                              onMouseEnter={(e) => { if (contextOpen !== u.id) e.currentTarget.style.background = "var(--bg-muted)"; }}
                              onMouseLeave={(e) => { if (contextOpen !== u.id) e.currentTarget.style.background = "transparent"; }}
                            >
                              <MoreHorizontal size={16} strokeWidth={1.5} />
                            </button>
                            {contextOpen === u.id && (
                              <div
                                className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-[10px] overflow-hidden border border-default"
                                style={{
                                  background: "var(--bg-surface)",
                                  boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contextMenuItems(u).map((item, i) => {
                                  const isDanger = item.label === "Remover";
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => item.action()}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-left transition-colors"
                                      style={{ background: "transparent", border: "none", cursor: "pointer", color: isDanger ? "#DC2626" : "var(--text-primary)" }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = isDanger ? "var(--badge-red-bg)" : "var(--bg-muted)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <item.icon size={14} strokeWidth={1.5} style={{ color: isDanger ? "#DC2626" : "var(--text-muted)" }} />
                                      {item.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <NovoUsuarioModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={fetchUsers}
        />
        <PermissoesModal
          open={permOpen}
          onClose={() => setPermOpen(false)}
          userId={permUserId}
          userName={permUserName}
        />
      </div>
    </DashboardLayout>
  );
}
