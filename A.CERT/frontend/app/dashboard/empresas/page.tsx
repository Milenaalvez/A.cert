"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2, Plus, Search, Trash2, Users, MoreHorizontal, AlertTriangle,
  ChevronLeft, ChevronRight, X, Building,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import ConfirmModal from "@/components/ConfirmModal";
import { useT } from "@/i18n/useT";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  plan: string;
  license_status: string;
  user_count: number;
  created_at: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  is_active: number;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#ECFDF5", text: "#059669" },
  pending: { bg: "#FFFBEB", text: "#D97706" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
};

const TABS = [
  { key: "", label: "Todos" },
  { key: "active", label: "Ativo" },
  { key: "pending", label: "Pendente" },
  { key: "cancelled", label: "Cancelado" },
] as const;

const PAGE_SIZE = 15;

function formatCNPJ(v: string): string {
  const d = v.replace(/\D/g, "");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v;
}

function formatDate(d: string) {
  if (!d) return "—";
  const parts = d.split(/[-T :]/);
  if (parts.length < 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

export default function EmpresasPage() {
  const { t } = useT();
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"" | "active" | "pending" | "cancelled">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showDelete, setShowDelete] = useState<Company | null>(null);
  const [showUsers, setShowUsers] = useState<Company | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  const [newName, setNewName] = useState("");
  const [newCnpj, setNewCnpj] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newError, setNewError] = useState("");
  const [saving, setSaving] = useState(false);

  const getHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("acert_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/companies", { headers: getHeaders() });
      if (r.ok) setAllCompanies(await r.json());
    } catch {} finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function handleCreate() {
    if (!newName || !newAdminName || !newAdminEmail) {
      setNewError("Nome, nome do admin e email são obrigatórios");
      return;
    }
    setSaving(true);
    setNewError("");
    try {
      const r = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          name: newName.trim(),
          cnpj: newCnpj || null,
          admin_name: newAdminName.trim(),
          admin_email: newAdminEmail.trim(),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao criar");
      setNewName(""); setNewCnpj(""); setNewAdminName(""); setNewAdminEmail("");
      setShowNew(false);
      fetchCompanies();
    } catch (err: any) {
      setNewError(err.message);
    } finally { setSaving(false); }
  }

  async function handleUpdateStatus(company: Company, newStatus: string) {
    try {
      await fetch(`/api/companies/${company.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ license_status: newStatus }),
      });
      setOpenMenuId(null);
      fetchCompanies();
    } catch {}
  }

  async function handleDelete() {
    if (!showDelete) return;
    try {
      await fetch(`/api/companies/${showDelete.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      setShowDelete(null);
      fetchCompanies();
    } catch {}
  }

  async function loadUsers(company: Company) {
    setShowUsers(company);
    setLoadingUsers(true);
    try {
      const r = await fetch(`/api/companies/${company.id}/users`, { headers: getHeaders() });
      if (r.ok) setPendingUsers(await r.json());
    } catch {} finally { setLoadingUsers(false); }
  }

  async function handleApproveUser(userId: string) {
    if (!showUsers) return;
    try {
      await fetch(`/api/companies/${showUsers.id}/users/${userId}/approve`, {
        method: "PUT",
        headers: getHeaders(),
      });
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      fetchCompanies();
    } catch {}
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const filtered = allCompanies.filter(c => {
    if (tab && c.license_status !== tab) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.cnpj || "").includes(searchQuery)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setTimeout(() => setPage(safePage), 0);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleTab = (t: typeof tab) => { setTab(t); setPage(1); };

  const stats = {
    total: allCompanies.length,
    active: allCompanies.filter(c => c.license_status === "active").length,
    pending: allCompanies.filter(c => c.license_status === "pending").length,
    cancelled: allCompanies.filter(c => c.license_status === "cancelled").length,
  };

  const tabCounts: Record<string, number> = {
    "": allCompanies.length,
    active: stats.active,
    pending: stats.pending,
    cancelled: stats.cancelled,
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const menuBtn = (label: string, color?: string): React.CSSProperties => ({
    display: "block", width: "100%", textAlign: "left",
    padding: "8px 16px", border: "none", background: "transparent",
    fontSize: "12px", color: color || "var(--text-body)", cursor: "pointer",
    fontFamily: "inherit",
  });

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">

        {/* Header */}
        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Empresas</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Gerencie as empresas cadastradas e autorize novos colaboradores.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              <div className="relative">
                <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input type="text" placeholder="Buscar por nome ou CNPJ..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} style={{ height: "44px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", paddingLeft: "42px", paddingRight: "16px", width: "340px", outline: "none" }} />
              </div>
              <button onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}><Plus size={16} strokeWidth={2.5} />Nova Empresa</button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats" style={{ marginBottom: "16px" }}>
          <StatsCard icon={Building} title="Total" value={String(stats.total)} complement={`${stats.active} ativas`} iconBg="var(--badge-orange-bg)" iconColor="#FF7A00" />
          <StatsCard icon={Building2} title="Ativas" value={String(stats.active)} complement="Empresas com licença ativa" iconBg="var(--badge-green-bg)" iconColor="#059669" />
          <StatsCard icon={AlertTriangle} title="Pendentes" value={String(stats.pending)} complement={stats.pending > 0 ? "Aguardando ação" : "Nenhuma pendente"} iconBg="var(--badge-amber-bg)" iconColor="#D97706" />
          <StatsCard icon={Trash2} title="Cancelados" value={String(stats.cancelled)} complement="Licenças canceladas" iconBg="var(--badge-red-bg)" iconColor="#DC2626" />
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0" }}>
            {TABS.map((t) => (
              <button key={t.key}
                onClick={() => handleTab(t.key)}
                style={{
                  padding: "10px 20px", fontSize: "13px", fontWeight: tab === t.key ? 600 : 500,
                  color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: tab === t.key ? "2px solid #FF7A00" : "2px solid transparent",
                  transition: "all 0.15s ease",
                }}>
                {t.label}
                <span style={{ marginLeft: "6px", fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-muted)", padding: "1px 7px", borderRadius: "10px" }}>
                  {tabCounts[t.key] || 0}
                </span>
              </button>
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {filtered.length} {filtered.length === 1 ? "empresa encontrada" : "empresas encontradas"}
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Building2 size={32} className="text-muted" />
            <span className="text-[13px] text-secondary">Nenhuma empresa encontrada.</span>
          </div>
        ) : (
          <>
            <div className="border border-default rounded-[10px] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-default bg-subtle">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide">Nome</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide">CNPJ</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide">Colaboradores</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide">Cadastro</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide w-12" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(c => (
                    <tr key={c.id} className="border-b border-light hover:bg-subtle transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.1)" }}>
                            <Building2 size={16} className="text-[#FF7A00]" />
                          </div>
                          <span className="text-[14px] font-medium text-primary">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-secondary font-mono">{c.cnpj ? formatCNPJ(c.cnpj) : "—"}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => loadUsers(c)} className="flex items-center gap-1.5 text-[13px] font-medium text-[#FF7A00] hover:underline bg-transparent border-0 cursor-pointer">
                          <Users size={13} /> {c.user_count}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center h-7 rounded-[6px] text-[12px] font-semibold" style={{
                          background: STATUS_COLORS[c.license_status]?.bg || "#F3F4F6",
                          color: STATUS_COLORS[c.license_status]?.text || "#6B7280",
                          padding: "0 12px",
                        }}>
                          {STATUS_LABEL[c.license_status] || c.license_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-secondary">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="relative" ref={menuRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === c.id ? null : c.id);
                            }}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted hover:bg-muted hover:text-primary transition-colors border-0 bg-transparent cursor-pointer"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenuId === c.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 rounded-[10px] bg-surface py-1.5 z-20 shadow-[0_4px_16px_rgba(0,0,0,0.1)]" style={{ width: "160px", border: "1px solid var(--border-light)" }}>
                                <button onClick={() => handleUpdateStatus(c, "active")} style={menuBtn("Marcar como Ativo")}>✓ Marcar como Ativo</button>
                                <button onClick={() => handleUpdateStatus(c, "pending")} style={menuBtn("Marcar Pendente")}>⏳ Marcar Pendente</button>
                                <button onClick={() => handleUpdateStatus(c, "cancelled")} style={menuBtn("Marcar Cancelado")}>✕ Marcar Cancelado</button>
                                <div className="h-px bg-light my-1" />
                                <button onClick={() => { setOpenMenuId(null); setShowDelete(c); }} style={menuBtn("Excluir", "#DC2626")}>🗑 Excluir</button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-light">
                <span className="text-[13px] text-secondary">
                  Mostrando {paginated.length} de {filtered.length} empresas
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                    className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-secondary">
                    <ChevronLeft size={14} strokeWidth={1.5} />
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === "ellipsis" ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-muted">...</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors ${
                          p === safePage ? "bg-[#FF7A00] text-white" : "text-secondary hover:bg-muted"
                        }`}>
                        {p}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => p + 1)} disabled={safePage >= totalPages}
                    className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-secondary">
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* New Company Modal */}
        {showNew && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setShowNew(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
              <div className="w-full bg-surface animate-in fade-in zoom-in-95 duration-200"
                style={{ maxWidth: "480px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ padding: "28px", borderBottom: "1px solid var(--border-light)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(255,122,0,0.12)" }}>
                        <Building2 size={18} className="text-[#FF7A00]" />
                      </div>
                      <h2 className="text-[16px] font-bold text-primary">Nova Empresa</h2>
                    </div>
                    <button onClick={() => setShowNew(false)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-muted hover:bg-subtle hover:text-primary transition-colors border-0 bg-transparent cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Nome da Empresa *</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: "100%", height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1.5px solid var(--border-default)", padding: "0 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="Nome da empresa" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>CNPJ</label>
                    <input type="text" value={newCnpj} onChange={e => setNewCnpj(e.target.value)} style={{ width: "100%", height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1.5px solid var(--border-default)", padding: "0 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="h-px bg-light" />
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Nome do Administrador *</label>
                    <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} style={{ width: "100%", height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1.5px solid var(--border-default)", padding: "0 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="Nome do admin" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Email do Administrador *</label>
                    <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} style={{ width: "100%", height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1.5px solid var(--border-default)", padding: "0 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="admin@empresa.com" />
                  </div>
                  {newError && (
                    <div className="flex items-center gap-2 text-[12px] text-[#DC2626]">
                      <AlertTriangle size={14} /> {newError}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-light">
                    <button onClick={() => setShowNew(false)} className="h-9 px-5 rounded-[8px] text-[13px] font-medium text-secondary border border-default hover:bg-subtle transition-colors bg-transparent cursor-pointer">Cancelar</button>
                    <button onClick={handleCreate} disabled={saving}
                      className="h-9 px-5 rounded-[8px] text-[13px] font-semibold text-white bg-[#FF7A00] hover:bg-[#E06900] transition-colors border-0 cursor-pointer disabled:opacity-50">
                      {saving ? "Criando..." : "Criar Empresa"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Modal */}
        {showUsers && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setShowUsers(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowUsers(null)}>
              <div className="w-full bg-surface animate-in fade-in zoom-in-95 duration-200"
                style={{ maxWidth: "560px", maxHeight: "70vh", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border-light)", flexShrink: 0 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(255,122,0,0.12)" }}>
                        <Users size={18} className="text-[#FF7A00]" />
                      </div>
                      <div>
                        <h2 className="text-[16px] font-bold text-primary">Colaboradores</h2>
                        <p className="text-[12px] text-muted">{showUsers.name}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowUsers(null)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-muted hover:bg-subtle hover:text-primary transition-colors border-0 bg-transparent cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px 24px" }}>
                  {loadingUsers ? (
                    <div className="flex justify-center py-12">
                      <div className="w-5 h-5 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12">
                      <Users size={28} className="text-muted" />
                      <span className="text-[13px] text-secondary">Nenhum colaborador encontrado.</span>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-default">
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted uppercase">Nome</th>
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted uppercase">Email</th>
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted uppercase">Status</th>
                          <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted uppercase">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map(u => (
                          <tr key={u.id} className="border-b border-light">
                            <td className="px-3 py-2.5 text-[13px] text-primary">{u.name}</td>
                            <td className="px-3 py-2.5 text-[13px] text-secondary">{u.email}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${u.is_active ? "text-[#059669] bg-[#059669]/10" : "text-[#D97706] bg-[#D97706]/10"}`}>
                                {u.is_active ? "Ativo" : "Pendente"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {!u.is_active && (
                                <button onClick={() => handleApproveUser(u.id)}
                                  className="h-7 px-3 rounded-[6px] text-[11px] font-semibold text-white bg-[#059669] hover:bg-[#047857] transition-colors border-0 cursor-pointer">
                                  Aprovar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <ConfirmModal
          open={!!showDelete}
          title="Excluir empresa?"
          message={`Tem certeza que deseja excluir a empresa ${showDelete?.name}? Todos os colaboradores serão removidos.`}
          variant="danger"
          confirmLabel="Sim, Excluir"
          cancelLabel="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(null)}
          onClose={() => setShowDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
}
