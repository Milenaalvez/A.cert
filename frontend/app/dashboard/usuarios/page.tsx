"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
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
const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrador", RH: "RH", EMPLOYEE: "Colaborador", DEVELOPER: "Desenvolvedor" };
const ROLE_BADGE: Record<string, string> = { ADMIN: "rgba(59,130,246,0.1)", RH: "rgba(16,185,129,0.1)", EMPLOYEE: "rgba(156,163,175,0.1)", DEVELOPER: "rgba(139,92,246,0.1)" };
const ROLE_COLOR: Record<string, string> = { ADMIN: "#3B82F6", RH: "#10B981", EMPLOYEE: "#6B7280", DEVELOPER: "#8B5CF6" };

/* ── Helpers ───────────────────────────────────────── */
function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) {
    const h = new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return diff < 21600 ? `Hoje às ${h}` : `Hoje às ${h}`;
  }
  if (diff < 172800) {
    const h = new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `Ontem às ${h}`;
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

  const fetchUsers = useCallback(async () => {
    try {
      const data = await teamApi.enriched();
      setUsers(data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.department || "").toLowerCase().includes(s);
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
    admins: users.filter(u => u.role === "ADMIN").length,
    rh: users.filter(u => u.role === "RH").length,
    employees: users.filter(u => u.role === "EMPLOYEE").length,
    developers: users.filter(u => u.role === "DEVELOPER").length,
    inactive: users.filter(u => u.isActive === false).length,
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

  const pillStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", maxWidth: 1400 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Usuários</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>Gerencie acessos, permissões e atividades da equipe.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: 10, top: 11 }} />
              <input
                placeholder="Buscar usuário..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220, height: 38, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 12px 0 32px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 18px", height: 38, borderRadius: 8, border: "none", background: "#FF7A00", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <UserPlus size={14} /> Novo Usuário
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "6px 16px", borderRadius: 20, border: activeFilter === f.key ? "1px solid #FF7A00" : "1px solid var(--border-default)",
                background: activeFilter === f.key ? "rgba(255,122,0,0.08)" : "var(--bg-app)",
                color: activeFilter === f.key ? "#FF7A00" : "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ border: "1px solid var(--border-default)", borderRadius: 12, background: "var(--bg-app)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-secondary)" }}>
                  {["Usuário", "Cargo", "Departamento", "Status", "Último acesso", "Carga horária", "Perfil de acesso", "Ações"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Nenhum usuário encontrado.</td></tr>
                ) : (
                  filtered.map(u => {
                    const st = statusDot(u.todayStatus || (u.isActive ? "offline" : undefined), u.isActive);
                    const Icon = st.Icon;
                    return (
                      <tr
                        key={u.id}
                        style={{ borderBottom: "1px solid var(--border-default)", cursor: "pointer", transition: "background 0.12s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => router.push(`/dashboard/usuarios/${u.id}`)}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                              {getInitials(u.name)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ ...pillStyle, background: ROLE_BADGE[u.role] || "rgba(156,163,175,0.1)", color: ROLE_COLOR[u.role] || "#6B7280" }}>{ROLE_LABEL[u.role] || u.role}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{u.department || "—"}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon size={14} color={st.color} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: st.color }}>{st.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{timeAgo(u.lastAccessAt)}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{u.weeklyHours || 40}h semanais</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: u.role === "ADMIN" ? "#3B82F6" : "var(--text-secondary)" }}>
                            {u.role === "ADMIN" ? "Administrador Total" : u.role === "RH" ? "Recursos Humanos" : u.role === "DEVELOPER" ? "Desenvolvedor" : "Operacional"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ position: "relative" }}>
                            <button
                              onClick={e => { e.stopPropagation(); setContextOpen(contextOpen === u.id ? null : u.id); }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "var(--text-tertiary)" }}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {contextOpen === u.id && (
                              <div style={{ position: "absolute", right: 0, top: 34, zIndex: 50, minWidth: 200, background: "var(--bg-app)", border: "1px solid var(--border-default)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", overflow: "hidden" }}
                                onClick={e => e.stopPropagation()}
                              >
                                {[
                                  { icon: UserCog, label: "Visualizar", action: () => router.push(`/dashboard/usuarios/${u.id}`) },
                                  { icon: Edit, label: "Editar", action: () => router.push(`/dashboard/usuarios/${u.id}`) },
                                  { icon: Shield, label: "Alterar permissões", action: () => { setPermUserId(u.id); setPermUserName(u.name); setPermOpen(true); } },
                                  { icon: Key, label: "Resetar senha", action: () => handleAction("reset", u) },
                                  { icon: u.isActive ? XCircle : CheckCircle2, label: u.isActive ? "Desativar" : "Ativar", action: () => handleAction("toggle", u) },
                                  { icon: Trash2, label: "Remover", action: () => handleAction("delete", u) },
                                ].map((item, i) => (
                                  <button
                                    key={i}
                                    onClick={() => item.action()}
                                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "none", background: "transparent", color: "var(--text-primary)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                  >
                                    <item.icon size={14} color="var(--text-tertiary)" /> {item.label}
                                  </button>
                                ))}
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

        <NovoUsuarioModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchUsers} />
        <PermissoesModal open={permOpen} onClose={() => setPermOpen(false)} userId={permUserId} userName={permUserName} />
      </div>
    </DashboardLayout>
  );
}
