"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, UserPlus, MoreVertical, Edit, Shield, Key,
  CheckCircle2, XCircle, Circle, Eye, Users, Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import NovoUsuarioModal from "@/components/NovoUsuarioModal";
import PermissoesModal from "@/components/PermissoesModal";
import UserSidePanel from "@/components/UserSidePanel";
import ConfirmModal from "@/components/ConfirmModal";
import * as teamApi from "@/services/teamApi";
import { useT } from "@/i18n/useT";

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
  birthDate?: string;
  city?: string;
  uf?: string;
  stats?: {
    dossiersCreated: number;
    dossiersCompleted: number;
    clientsRegistered: number;
    propertiesLinked: number;
  };
  lastSession?: {
    date: string | null;
    ip: string;
    device: string;
    browser: string;
    os: string;
  };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  VENDOR: "Vendedor",
  EMPLOYEE: "Colaborador",
  DEVELOPER: "Desenvolvedor",
  SUPERVISOR: "Supervisor",
  RH: "RH",
  MANAGER: "Gerente",
};

const FILTER_CONFIG = {
  todos: { label: "Todos" },
  admins: { label: "Administradores", role: "ADMIN" },
  vendors: { label: "Vendedores", role: "VENDOR" },
  employees: { label: "Colaboradores", role: "EMPLOYEE" },
  developers: { label: "Desenvolvedores", role: "DEVELOPER" },
  inactive: { label: "Inativos", inactive: true },
};

type FilterKey = keyof typeof FILTER_CONFIG;

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Agora há pouco";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `Hoje, ${new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800) return `Ontem, ${new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const ACCESS_PROFILE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  VENDOR: "Vendedor",
  EMPLOYEE: "Operacional",
  DEVELOPER: "Desenvolvedor",
  RH: "RH",
};

const sectionBox = "border border-default bg-surface p-8";
const btnBase = "flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-semibold cursor-pointer transition-all duration-150";

export default function UsuariosPage() {
  const { t } = useT();
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<EnrichedUser | null>(null);
  const [permOpen, setPermOpen] = useState(false);
  const [permUserId, setPermUserId] = useState("");
  const [permUserName, setPermUserName] = useState("");
  const [contextOpen, setContextOpen] = useState<string | null>(null);
  const [contextPos, setContextPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<EnrichedUser | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await teamApi.enriched();
      setUsers(data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!contextOpen) return;
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) setContextOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone || "").toLowerCase().includes(s);
    if (!matchSearch) return false;
    const cfg = FILTER_CONFIG[activeFilter];
    if ("role" in cfg && cfg.role) return u.role === cfg.role;
    if ("inactive" in cfg && cfg.inactive) return u.isActive === false;
    return true;
  });

  const counts = {
    todos: users.length,
    admins: users.filter(u => u.role === "ADMIN").length,
    vendors: users.filter(u => u.role === "VENDOR").length,
    employees: users.filter(u => u.role === "EMPLOYEE").length,
    developers: users.filter(u => u.role === "DEVELOPER").length,
    inactive: users.filter(u => u.isActive === false).length,
  };

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "admins", label: "Administradores", count: counts.admins },
    { key: "vendors", label: "Vendedores", count: counts.vendors },
    { key: "employees", label: "Colaboradores", count: counts.employees },
    { key: "developers", label: "Desenvolvedores", count: counts.developers },
    { key: "inactive", label: "Inativos", count: counts.inactive },
  ];

  async function handleAction(action: string, u: EnrichedUser) {
    setContextOpen(null);
    try {
      if (action === "toggle") {
        await teamApi.updateStatus(u.id, !u.isActive);
      } else if (action === "reset") {
        await teamApi.resetPassword(u.id);
      } else if (action === "edit") {
        setEditUser(u);
      } else if (action === "permissions") {
        setPermUserId(u.id);
        setPermUserName(u.name);
        setPermOpen(true);
      } else if (action === "delete") {
        setDeleteConfirm(u);
        return;
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Erro");
    }
  }

  async function handleDeleteUser() {
    if (!deleteConfirm) return;
    try {
      await teamApi.remove(deleteConfirm.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir");
    } finally { setDeleteConfirm(null); }
  }

  function handleToggleStatus(u: EnrichedUser) {
    handleAction("toggle", u);
    if (selectedUser?.id === u.id) setSelectedUser(null);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full" style={{ background: "var(--bg-app)", minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-8" style={{ marginTop: "clamp(16px, 5vw, 40px)", marginBottom: 28 }}>
          <div className="flex flex-col gap-1.5 min-w-0">
            <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Usuários</h1>
            <p className="text-[14px] text-muted leading-relaxed">Gerencie os colaboradores que possuem acesso ao sistema A.CERT.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input ref={searchRef} type="text" placeholder={t("users.search")} value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: "44px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", paddingLeft: "42px", paddingRight: "16px", width: "340px", outline: "none" }} />
            </div>
            <button onClick={() => { setEditUser(null); setCreateOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <UserPlus size={16} strokeWidth={2.5} />Novo Usuário
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-14">
            {FILTERS.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`h-9 px-4 text-[13px] font-medium transition-colors -mb-px border-b-[3px] cursor-pointer ${
                    isActive ? "border-[#FF7A00] text-primary" : "border-transparent text-secondary hover:text-primary"
                  }`}>
                  {f.label}{' '}
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 ${
                    isActive ? "text-[#FF7A00]" : "text-secondary"
                  }`}
                    style={{ background: isActive ? "rgba(255,122,0,0.12)" : "var(--bg-elevated)" }}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "240px" }}>Usuário</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "140px" }}>Cargo</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Departamento</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Último acesso</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "90px" }}>Carga horária</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Perfil</th>
                <th style={{ width: "36px", padding: "10px 8px", borderBottom: "1px solid var(--border-default)" }}></th>
                <th style={{ width: "36px", padding: "10px 8px", borderBottom: "1px solid var(--border-default)" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 0", textAlign: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Carregando...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 0", textAlign: "center" }}>
                    <div className="flex flex-col items-center gap-3">
                      <Users size={32} strokeWidth={1.5} color="var(--text-secondary)" />
                      <span className="text-[15px] font-semibold text-muted">Nenhum usuário encontrado</span>
                      <span className="text-[13px] text-secondary">Ajuste os filtros ou cadastre um novo usuário.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isInactive = u.isActive === false;
                  const statusColor = isInactive ? "#EF4444" : u.isOnline ? "#22C55E" : "var(--text-secondary)";
                  const statusLabel = isInactive ? "Inativo" : u.isOnline ? "Online" : "Offline";
                  const StatusIcon = isInactive ? XCircle : u.isOnline ? CheckCircle2 : Circle;
                  const accessProfile = ACCESS_PROFILE_LABEL[u.role] || "Operacional";
                  const cargoDisplay = u.position || ROLE_LABEL[u.role] || u.role;

                  return (
                    <tr key={u.id} className="hover-bg-hover transition-colors">
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center bg-[#FF7A00] overflow-hidden shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-[11px] font-bold">{getInitials(u.name)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[14px] font-semibold text-primary block truncate">{u.name}</span>
                            <span className="text-[11px] text-secondary">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="inline-block text-[12px] font-semibold text-[#FF7A00] px-2 py-1" style={{ background: "rgba(255,122,0,0.12)" }}>
                          {cargoDisplay}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="text-[13px] text-body">{u.department || "—"}</span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <div className="flex items-center gap-2">
                          <StatusIcon size={13} strokeWidth={2} color={statusColor} />
                          <span className="text-[12px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="text-[12px] text-secondary">{timeAgo(u.lastAccessAt)}</span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="text-[13px] text-body">{u.weeklyHours || 40}h</span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="text-[12px] font-medium text-secondary px-2 py-1" style={{ background: "var(--bg-elevated)" }}>{accessProfile}</span>
                      </td>
                      <td style={{ padding: "14px 8px", borderBottom: "1px solid var(--border-default)", textAlign: "center" }}>
                        <button onClick={() => setSelectedUser(u)}
                          className="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover-bg-hover transition-colors cursor-pointer border-0"
                          title="Visualizar perfil">
                          <Eye size={15} strokeWidth={1.5} />
                        </button>
                      </td>
                      <td style={{ padding: "14px 8px", borderBottom: "1px solid var(--border-default)", textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setContextPos({ top: rect.bottom + 4, left: rect.right - 220 }); setContextOpen(contextOpen === u.id ? null : u.id); }}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-secondary hover-bg-muted hover:text-primary transition-colors">
                          <MoreVertical size={15} strokeWidth={1.5} />
                        </button>
                        {contextOpen === u.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setContextOpen(null)} />
                            <div ref={contextRef}
                              className="fixed z-20 rounded-[10px] bg-surface py-1.5 animate-in fade-in zoom-in-95 duration-150"
                              style={{ width: "220px", top: contextPos.top, left: contextPos.left, border: "1px solid var(--border-light)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                              onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setEditUser(u); setContextOpen(null); }}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <Edit size={14} strokeWidth={1.5} className="shrink-0 text-secondary" />
                                <span>Editar usuário</span>
                              </button>
                              <button onClick={() => { setPermUserId(u.id); setPermUserName(u.name); setPermOpen(true); setContextOpen(null); }}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <Shield size={14} strokeWidth={1.5} className="shrink-0 text-secondary" />
                                <span>Alterar permissões</span>
                              </button>
                              <button onClick={async () => { setContextOpen(null); try { await teamApi.resetPassword(u.id); fetchUsers(); } catch {} }}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <Key size={14} strokeWidth={1.5} className="shrink-0 text-secondary" />
                                <span>Resetar senha</span>
                              </button>
                              <div className="h-px bg-light my-1.5" style={{ marginLeft: "20px", marginRight: "20px" }} />
                              <button onClick={async () => { setContextOpen(null); try { await teamApi.updateStatus(u.id, !u.isActive); fetchUsers(); } catch {} }}
                                className="flex items-center gap-3 w-full h-9 text-[13px] transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px", color: u.isActive ? "#EF4444" : "var(--text-body)" }}>
                                {u.isActive
                                  ? <><XCircle size={14} strokeWidth={1.5} className="shrink-0" /><span>Desativar acesso</span></>
                                  : <><CheckCircle2 size={14} strokeWidth={1.5} className="shrink-0" /><span>Ativar acesso</span></>}
                              </button>
                              <button onClick={() => { setDeleteConfirm(u); setContextOpen(null); }}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-[#DC2626] hover:bg-[rgba(220,38,38,0.1)] transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <Trash2 size={14} strokeWidth={1.5} className="shrink-0" />
                                <span>Mover para lixeira</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <span className="text-[12px] text-secondary">Mostrando {filtered.length} de {users.length} usuários</span>
        </div>
      </div>

      {selectedUser && (
        <UserSidePanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={(u) => { setSelectedUser(null); setEditUser(u); }}
          onPermissions={(u) => { setSelectedUser(null); setPermUserId(u.id); setPermUserName(u.name); setPermOpen(true); }}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <NovoUsuarioModal
        open={createOpen || !!editUser}
        onClose={() => { setCreateOpen(false); setEditUser(null); }}
        onCreated={fetchUsers}
        editUser={editUser}
      />
      <PermissoesModal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        userId={permUserId}
        userName={permUserName}
      />
      <ConfirmModal
        open={!!deleteConfirm}
        title="Mover para lixeira"
        message={`Deseja mover "${deleteConfirm?.name}" para a Lixeira? Você poderá restaurar ou excluir permanentemente depois.`}
        variant="warning"
        confirmLabel="Mover para lixeira"
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteConfirm(null)}
        onClose={() => setDeleteConfirm(null)}
      />
    </DashboardLayout>
  );
}
