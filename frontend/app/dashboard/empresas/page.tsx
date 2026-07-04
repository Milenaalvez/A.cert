"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2, Plus, Search, Trash2, Users, MoreVertical, X,
  AlertTriangle, Eye, CheckCircle2, Clock, XCircle, Loader2, Camera,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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

interface UserRow {
  id: string;
  name: string;
  email: string;
  is_active: number;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(5,150,105,0.12)", text: "#059669" },
  pending: { bg: "rgba(217,119,6,0.12)", text: "#D97706" },
  cancelled: { bg: "rgba(220,38,38,0.12)", text: "#DC2626" },
};

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "active", label: "Ativo" },
  { key: "pending", label: "Pendente" },
  { key: "cancelled", label: "Cancelado" },
] as const;

type FilterKey = "" | "active" | "pending" | "cancelled";

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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [showNew, setShowNew] = useState(false);
  const [showDelete, setShowDelete] = useState<Company | null>(null);
  const [showUsers, setShowUsers] = useState<Company | null>(null);
  const [showProfile, setShowProfile] = useState<Company | null>(null);
  const [modalUsers, setModalUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [contextOpen, setContextOpen] = useState<string | null>(null);
  const [contextPos, setContextPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const contextRef = useRef<HTMLDivElement>(null);

  const [newName, setNewName] = useState("");
  const [newCnpj, setNewCnpj] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newError, setNewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const initialRef = useRef({ name: "", adminName: "", adminEmail: "" });
  const hasChanges = newName !== initialRef.current.name || newAdminName !== initialRef.current.adminName || newAdminEmail !== initialRef.current.adminEmail || logoFile !== null;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCloseNew() {
    if (hasChanges && !showConfirmCancel) { setShowConfirmCancel(true); return; }
    setShowNew(false);
    setNewName(""); setNewCnpj(""); setNewAdminName(""); setNewAdminEmail("");
    setNewError(""); setLogoFile(null); setLogoPreview(null);
  }

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

      if (logoFile && data?.company?.id) {
        const formData = new FormData();
        formData.append("logotipo", logoFile);
        formData.append("companyId", data.company.id);
        await fetch("/api/upload/company-logo", {
          method: "POST",
          headers: getHeaders(),
          body: formData,
        });
      }

      setNewName(""); setNewCnpj(""); setNewAdminName(""); setNewAdminEmail("");
      setLogoFile(null); setLogoPreview(null);
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
      setContextOpen(null);
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
      if (r.ok) setModalUsers(await r.json());
    } catch {} finally { setLoadingUsers(false); }
  }

  async function handleApproveUser(userId: string) {
    if (!showUsers) return;
    try {
      await fetch(`/api/companies/${showUsers.id}/users/${userId}/approve`, {
        method: "PUT",
        headers: getHeaders(),
      });
      setModalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: 1 } : u));
      fetchCompanies();
    } catch {}
  }

  const filtered = allCompanies.filter(c => {
    if (activeFilter && c.license_status !== activeFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.cnpj || "").includes(search)) return false;
    return true;
  });

  const counts: Record<string, number> = {
    "": allCompanies.length,
    active: allCompanies.filter(c => c.license_status === "active").length,
    pending: allCompanies.filter(c => c.license_status === "pending").length,
    cancelled: allCompanies.filter(c => c.license_status === "cancelled").length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ background: "var(--bg-app)", minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-8" style={{ marginTop: 40, marginBottom: 28 }}>
          <div className="flex flex-col gap-1.5 min-w-0">
            <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Empresas</h1>
            <p className="text-[14px] text-muted leading-relaxed">Gerencie as empresas cadastradas e autorize novos colaboradores.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input ref={searchRef} type="text" placeholder="Buscar por nome ou CNPJ..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: "44px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", paddingLeft: "42px", paddingRight: "16px", width: "340px", outline: "none" }} />
            </div>
            <button onClick={() => { setNewName(""); setNewCnpj(""); setNewAdminName(""); setNewAdminEmail(""); setNewError(""); setLogoFile(null); setLogoPreview(null); initialRef.current = { name: "", adminName: "", adminEmail: "" }; setShowNew(true); }} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus size={16} strokeWidth={2.5} />Nova Empresa
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-14">
            {FILTERS.map((f) => {
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
                    style={{ background: isActive ? "rgba(255,122,0,0.12)" : "var(--bg-elevated)" }}>{counts[f.key] || 0}</span>
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
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "240px" }}>Empresa</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Colaboradores</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Plano</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Cadastro</th>
                <th style={{ width: "36px", padding: "10px 8px", borderBottom: "1px solid var(--border-default)" }}></th>
                <th style={{ width: "36px", padding: "10px 8px", borderBottom: "1px solid var(--border-default)" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 0", textAlign: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Carregando...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 0", textAlign: "center" }}>
                    <div className="flex flex-col items-center gap-3">
                      <Building2 size={32} strokeWidth={1.5} color="var(--text-secondary)" />
                      <span className="text-[15px] font-semibold text-muted">Nenhuma empresa encontrada</span>
                      <span className="text-[13px] text-secondary">Ajuste os filtros ou cadastre uma nova empresa.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const sc = STATUS_COLORS[c.license_status] || STATUS_COLORS.pending;
                  return (
                    <tr key={c.id} className="hover-bg-hover transition-colors">
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center bg-[#FF7A00] overflow-hidden shrink-0">
                            <Building2 size={15} strokeWidth={2} color="#FFF" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[14px] font-semibold text-primary block truncate">{c.name}</span>
                            <span className="text-[11px] text-secondary">{c.cnpj ? formatCNPJ(c.cnpj) : "CNPJ não informado"}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <button onClick={() => loadUsers(c)} className="bg-transparent border-0 cursor-pointer p-0">
                          <span className="inline-block text-[12px] font-semibold text-[#FF7A00] px-2 py-1" style={{ background: "rgba(255,122,0,0.12)" }}>{c.user_count}</span>
                        </button>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="text-[13px] text-body">{c.plan === "trial" ? "Trial" : c.plan || "—"}</span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="inline-block text-[12px] font-semibold px-2 py-1" style={{ background: sc.bg, color: sc.text, borderRadius: "4px" }}>
                          {STATUS_LABEL[c.license_status] || c.license_status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: "1px solid var(--border-default)" }}>
                        <span className="text-[12px] text-secondary">{formatDate(c.created_at)}</span>
                      </td>
                      <td style={{ padding: "14px 8px", borderBottom: "1px solid var(--border-default)", textAlign: "center" }}>
                        <button onClick={() => setShowProfile(c)}
                          className="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover-bg-hover transition-colors cursor-pointer border-0"
                          title="Ver perfil">
                          <Eye size={15} strokeWidth={1.5} />
                        </button>
                      </td>
                      <td style={{ padding: "14px 8px", borderBottom: "1px solid var(--border-default)", textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setContextPos({ top: rect.bottom + 4, left: rect.right - 220 }); setContextOpen(contextOpen === c.id ? null : c.id); }}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-secondary hover-bg-muted hover:text-primary transition-colors">
                          <MoreVertical size={15} strokeWidth={1.5} />
                        </button>
                        {contextOpen === c.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setContextOpen(null)} />
                            <div ref={contextRef}
                              className="fixed z-20 rounded-[10px] bg-surface py-1.5 animate-in fade-in zoom-in-95 duration-150"
                              style={{ width: "220px", top: contextPos.top, left: contextPos.left, border: "1px solid var(--border-light)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                              onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleUpdateStatus(c, "active")}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <CheckCircle2 size={14} strokeWidth={1.5} className="shrink-0 text-secondary" />
                                <span>Marcar como Ativo</span>
                              </button>
                              <button onClick={() => handleUpdateStatus(c, "pending")}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <Clock size={14} strokeWidth={1.5} className="shrink-0 text-secondary" />
                                <span>Marcar Pendente</span>
                              </button>
                              <button onClick={() => handleUpdateStatus(c, "cancelled")}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <XCircle size={14} strokeWidth={1.5} className="shrink-0 text-secondary" />
                                <span>Marcar Cancelado</span>
                              </button>
                              <div className="h-px bg-light my-1.5" style={{ marginLeft: "20px", marginRight: "20px" }} />
                              <button onClick={() => { setContextOpen(null); setShowDelete(c); }}
                                className="flex items-center gap-3 w-full h-9 text-[13px] text-[#DC2626] hover:bg-[rgba(220,38,38,0.1)] transition-colors"
                                style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <Trash2 size={14} strokeWidth={1.5} className="shrink-0" />
                                <span>Excluir</span>
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
          <span className="text-[12px] text-secondary">Mostrando {filtered.length} de {allCompanies.length} empresas</span>
        </div>
      </div>

      {/* New Company Modal */}
      {showNew && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={handleCloseNew} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleCloseNew}>
            <div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              style={{ maxWidth: "620px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-[12px] flex items-center justify-center overflow-hidden" style={{ background: "var(--badge-orange-bg)" }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={20} strokeWidth={1.5} color="#FF7A00" />
                      )}
                    </div>
                    <label style={{ position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#FF7A00", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Camera size={10} strokeWidth={2.5} color="#FFF" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Nova Empresa</h2>
                    <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>Cadastre uma nova empresa e seu administrador</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseNew}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted transition-colors"
                  style={{ border: "none", background: "transparent", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-1.5" style={{ color: "var(--text-primary)", fontWeight: 700 }}>Nome da Empresa *</label>
                    <input
                      required
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Nome da empresa"
                      className="w-full h-10 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-app px-3 focus:border-[#FF7A00] font-inherit box-border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.4px] mb-1.5">CNPJ</label>
                    <input
                      type="text"
                      value={newCnpj}
                      onChange={e => setNewCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full h-10 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-app px-3 focus:border-[#FF7A00] font-inherit box-border"
                    />
                  </div>
                  <div className="h-px bg-light" />
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-1.5" style={{ color: "var(--text-primary)", fontWeight: 700 }}>Nome do Administrador *</label>
                    <input
                      required
                      type="text"
                      value={newAdminName}
                      onChange={e => setNewAdminName(e.target.value)}
                      placeholder="Nome do administrador"
                      className="w-full h-10 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-app px-3 focus:border-[#FF7A00] font-inherit box-border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-1.5" style={{ color: "var(--text-primary)", fontWeight: 700 }}>Email do Administrador *</label>
                    <input
                      required
                      type="email"
                      value={newAdminEmail}
                      onChange={e => setNewAdminEmail(e.target.value)}
                      placeholder="admin@empresa.com"
                      className="w-full h-10 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-app px-3 focus:border-[#FF7A00] font-inherit box-border"
                    />
                  </div>
                  {newError && (
                    <div className="text-[13px] p-3 rounded-[8px]" style={{ background: "var(--badge-red-bg)", color: "var(--error)" }}>
                      <AlertTriangle size={14} className="inline mr-1.5 align-middle" /> {newError}
                    </div>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-between shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
                <span className="text-[11px] text-muted">
                  <span style={{ color: "#DC2626" }}>*</span> Campos obrigatórios
                </span>
                <div className="flex gap-2.5">
                  <button onClick={handleCloseNew}
                    style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    Cancelar
                  </button>
                  <button onClick={handleCreate} disabled={saving}
                    style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", background: saving ? "var(--text-muted)" : "#FF7A00", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease", opacity: saving ? 0.8 : 1 }}
                    onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#E06900"; }}
                    onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#FF7A00"; }}>
                    {saving && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
                    {saving ? "Criando..." : "Criar Empresa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={showConfirmCancel}
        title="Descartar alterações?"
        message="Você preencheu alguns campos. Tem certeza que deseja sair? As informações serão perdidas."
        variant="warning"
        confirmLabel="Sim, Descartar"
        cancelLabel="Continuar Editando"
        onConfirm={() => { setShowConfirmCancel(false); setShowNew(false); setNewName(""); setNewCnpj(""); setNewAdminName(""); setNewAdminEmail(""); setNewError(""); setLogoFile(null); setLogoPreview(null); }}
        onCancel={() => setShowConfirmCancel(false)}
        onClose={() => setShowConfirmCancel(false)}
      />

      {/* Profile Modal */}
      {showProfile && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setShowProfile(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowProfile(null)}>
            <div className="w-full bg-surface animate-in fade-in zoom-in-95 duration-200"
              style={{ maxWidth: "460px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 flex items-center justify-center bg-[#FF7A00] overflow-hidden shrink-0" style={{ borderRadius: "12px" }}>
                      <Building2 size={20} strokeWidth={1.5} color="#FFF" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>{showProfile.name}</h2>
                      <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>Perfil da empresa</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProfile(null)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted transition-colors"
                    style={{ border: "none", background: "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div style={{ padding: "24px 28px" }}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted uppercase tracking-[0.4px]">CNPJ</span>
                    <span className="text-[13px] text-primary font-medium">{showProfile.cnpj ? formatCNPJ(showProfile.cnpj) : "Não informado"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted uppercase tracking-[0.4px]">Plano</span>
                    <span className="text-[13px] text-primary font-medium">{showProfile.plan === "trial" ? "Trial" : showProfile.plan || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted uppercase tracking-[0.4px]">Status</span>
                    <span className="inline-block text-[12px] font-semibold px-2 py-1" style={{ background: (STATUS_COLORS[showProfile.license_status] || STATUS_COLORS.pending).bg, color: (STATUS_COLORS[showProfile.license_status] || STATUS_COLORS.pending).text, borderRadius: "4px" }}>
                      {STATUS_LABEL[showProfile.license_status] || showProfile.license_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted uppercase tracking-[0.4px]">Colaboradores</span>
                    <span className="inline-block text-[12px] font-semibold text-[#FF7A00] px-2 py-1" style={{ background: "rgba(255,122,0,0.12)" }}>{showProfile.user_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted uppercase tracking-[0.4px]">Desde</span>
                    <span className="text-[13px] text-primary font-medium">{formatDate(showProfile.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
                <button onClick={() => setShowProfile(null)}
                  style={{ height: "38px", padding: "0 22px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: "pointer", background: "#FF7A00" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#E06900"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FF7A00"; }}>
                  Fechar
                </button>
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
                  ) : modalUsers.length === 0 ? (
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
                        {modalUsers.map(u => (
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
        cancelLabel={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(null)}
        onClose={() => setShowDelete(null)}
      />
    </DashboardLayout>
  );
}
