"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, Search, Trash2, Pencil, Check, X,
  Users, MoreHorizontal, AlertTriangle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import ConfirmModal from "@/components/ConfirmModal";
import { useT } from "@/i18n/useT";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  plan: string;
  license_status: string;
  user_count: number;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#ECFDF5", text: "#059669" },
  pending: { bg: "#FFFBEB", text: "#D97706" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  cancelled: "Cancelado",
};

const FILTER_OPTIONS = [
  { key: "", label: "Todos" },
  { key: "active", label: "Ativo" },
  { key: "pending", label: "Pendente" },
  { key: "cancelled", label: "Cancelado" },
];

export default function EmpresasPage() {
  const { t } = useT();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [showDelete, setShowDelete] = useState<Company | null>(null);
  const [showUsers, setShowUsers] = useState<Company | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    try {
      const r = await fetch("/api/companies", { headers: getHeaders() });
      if (r.ok) setCompanies(await r.json());
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
    } catch {}
  }

  const filtered = companies.filter(c => {
    if (filter && c.license_status !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.cnpj || "").includes(search)) return false;
    return true;
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", height: "40px", borderRadius: "8px", fontSize: "13px",
    color: "var(--text-primary)", background: "var(--bg-app)",
    border: "1.5px solid var(--border-default)", padding: "0 12px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  const statusBtn = (s: string, label: string): React.CSSProperties => ({
    display: "block", width: "100%", textAlign: "left",
    padding: "6px 14px", border: "none", background: "transparent",
    fontSize: "12px", color: s === "cancelled" ? "#DC2626" : "var(--text-body)",
    cursor: "pointer", fontFamily: "inherit",
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <PageHeader
            title="Empresas"
            subtitle="Gerencie as empresas cadastradas e autorize novos colaboradores."
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar empresa..."
                className="w-[220px] h-9 pl-9 pr-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-muted"
              />
            </div>
            <div className="flex items-center border border-default rounded-[8px] overflow-hidden">
              {FILTER_OPTIONS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`h-8 px-4 text-[12px] font-medium transition-colors ${
                    filter === f.key ? "bg-[#FF7A00] text-white" : "text-secondary hover:text-body"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#E06900] transition-colors border-0 cursor-pointer"
          >
            <Plus size={15} /> Nova Empresa
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Building2 size={32} className="text-muted" />
            <span className="text-[13px] text-secondary">Nenhuma empresa encontrada.</span>
          </div>
        ) : (
          <div className="border border-default rounded-[10px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-default bg-subtle">
                  {["Nome", "CNPJ", "Colaboradores", "Plano", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-light hover:bg-subtle transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.1)" }}>
                          <Building2 size={16} className="text-[#FF7A00]" />
                        </div>
                        <span className="text-[14px] font-medium text-primary">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-secondary">{c.cnpj || "—"}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => loadUsers(c)}
                        className="flex items-center gap-1.5 text-[13px] font-medium text-[#FF7A00] hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        <Users size={13} /> {c.user_count}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-body">{c.plan === "trial" ? "Trial" : c.plan || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center h-7 rounded-[6px] text-[12px] font-semibold" style={{
                        background: STATUS_COLORS[c.license_status]?.bg || "#F3F4F6",
                        color: STATUS_COLORS[c.license_status]?.text || "#6B7280",
                        padding: "0 12px",
                      }}>
                        {STATUS_LABEL[c.license_status] || c.license_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted hover:bg-muted hover:text-primary transition-colors border-0 bg-transparent cursor-pointer"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuId === c.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 rounded-[10px] bg-surface py-1.5 z-20 shadow-[0_4px_16px_rgba(0,0,0,0.1)]" style={{ width: "150px", border: "1px solid var(--border-light)" }}>
                              <button onClick={() => handleUpdateStatus(c, "active")} style={statusBtn("active", "Marcar como Ativo")}>✓ Marcar como Ativo</button>
                              <button onClick={() => handleUpdateStatus(c, "pending")} style={statusBtn("pending", "Marcar Pendente")}>⏳ Marcar Pendente</button>
                              <button onClick={() => handleUpdateStatus(c, "cancelled")} style={statusBtn("cancelled", "Marcar Cancelado")}>✕ Marcar Cancelado</button>
                              <div className="h-px bg-light my-1" />
                              <button onClick={() => { setOpenMenuId(null); setShowDelete(c); }} style={{ ...statusBtn("cancelled", "Excluir"), color: "#DC2626" }}>🗑 Excluir</button>
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
        )}

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
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} placeholder="Nome da empresa" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>CNPJ</label>
                    <input type="text" value={newCnpj} onChange={e => setNewCnpj(e.target.value)} style={inputStyle} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="h-px bg-light" />
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Nome do Administrador *</label>
                    <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} style={inputStyle} placeholder="Nome do admin" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Email do Administrador *</label>
                    <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} style={inputStyle} placeholder="admin@empresa.com" />
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
                      <span className="text-[13px] text-secondary">Nenhum colaborador pendente.</span>
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
                              <span className="text-[11px] font-semibold text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded">Pendente</span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                onClick={() => handleApproveUser(u.id)}
                                className="h-7 px-3 rounded-[6px] text-[11px] font-semibold text-white bg-[#059669] hover:bg-[#047857] transition-colors border-0 cursor-pointer"
                              >
                                Aprovar
                              </button>
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
