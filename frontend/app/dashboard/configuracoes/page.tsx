"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User, Settings, Building2, FileText, Activity,
  Save, Mail, CheckCircle2, Check, XCircle, Clock, Plus,
  Server, Eye, Trash2, Search, RefreshCw,
  Camera, Phone, Calendar, FileSpreadsheet, FileCheck,
  Shield, HardDrive, Download,
  Lock, LogOut, Database, Pencil,
  LogIn, X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmModal from "@/components/ConfirmModal";
import PasswordModal from "@/components/PasswordModal";
import SessionsModal from "@/components/SessionsModal";
import { useUser } from "@/contexts/UserContext";
import { useT } from "@/i18n/useT";

const apiBase = "";

const TABS = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "geral", label: "Geral", icon: Settings },
  { key: "orgaos", label: "Órgãos Integrados", icon: Building2 },
  { key: "email", label: "E-mail (SMTP)", icon: Mail },
  { key: "templates", label: "Templates PDF", icon: FileText },
  { key: "backup", label: "Backup", icon: HardDrive },
  { key: "auditoria", label: "Auditoria", icon: Activity },
  { key: "sistema", label: "Sistema", icon: Server },
];

const ROLES_MAP: Record<string, string> = {
  ADMIN: "Administrador",
  ANALYST: "Analista Documental",
  EMPLOYEE: "Vendedor",
};

const labelStyle = "block text-[11px] font-semibold text-muted uppercase tracking-[0.4px] mb-1.5";
const inputBase = "w-full h-10 rounded-[8px] text-[13px] text-primary outline-none font-[inherit] box-border border border-default bg-surface px-3 focus:border-[#FF7A00]";
const selectBase = "w-full h-10 rounded-[8px] text-[13px] text-primary outline-none font-[inherit] box-border border border-default bg-surface px-3 appearance-none focus:border-[#FF7A00] cursor-pointer";
const selectBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
const btnBase = "flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-semibold cursor-pointer transition-all duration-150";
const btnPrimary = `${btnBase} bg-[#FF7A00] text-white hover:bg-[#E06900] border-0 rounded-lg`;
const btnOutline = `${btnBase} bg-transparent text-secondary border border-default hover:border-[#FF7A00] hover:text-[#FF7A00] rounded-lg`;

const sectionBox = "bg-surface p-8 rounded-[10px]";
const grid2 = "grid grid-cols-2 gap-5";

const SWITCH_WRAP = "flex items-center justify-between py-6 border-b border-default last:border-0";
const SWITCH_LABEL = "text-[13px] text-body";
const SWITCH_DESC = "text-[11px] text-muted mt-0.5";

function FieldRow({ icon: Icon, label, value, editing, onEdit, onCancel, onConfirm, onChange, readOnly, badge }: {
  icon?: any; label: string; value: string; editing?: boolean; onEdit?: () => void; onCancel?: () => void; onConfirm?: () => void; onChange?: (v: string) => void; readOnly?: boolean; badge?: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">{Icon && <Icon size={14} strokeWidth={1.5} className="text-muted shrink-0" />}<span className="text-[13px] font-medium text-secondary">{label}</span></div>
        <div className="flex items-center gap-2">
          <input type="text" value={value} onChange={e => onChange?.(e.target.value)} className="w-[240px] h-10 rounded-[8px] text-[14px] text-primary outline-none border border-[#FF7A00] bg-app px-3 shadow-[0_0_0_3px_rgba(255,122,0,0.15)]" onKeyDown={e => { if (e.key === "Enter") onConfirm?.(); if (e.key === "Escape") onCancel?.(); }} autoFocus />
          <button onClick={onConfirm} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#059669] hover:bg-[#059669]/10 transition-colors"><Check size={16} strokeWidth={2.5} /></button>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"><X size={16} strokeWidth={2.5} /></button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">{Icon && <Icon size={15} strokeWidth={1.5} className="text-[#FF7A00]/70 shrink-0" />}<span className="text-[13px] font-medium text-secondary">{label}</span></div>
      <div className="flex items-center gap-1.5">
        {badge ? (<span className="text-[13px] font-semibold text-[#059669] bg-[#059669]/10 px-2.5 py-0.5 rounded">{value}</span>) : (<span className="text-[14px] font-semibold text-right" style={{ color: "#D97706" }}>{value}</span>)}
        {!readOnly && (<button onClick={onEdit} className="w-7 h-7 flex items-center justify-center text-muted hover:text-[#FF7A00] transition-colors"><Pencil size={13} /></button>)}
      </div>
    </div>
  );
}

function Switch({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className={SWITCH_WRAP}>
      <div>
        <span className={SWITCH_LABEL}>{label}</span>
        {desc && <p className={SWITCH_DESC}>{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-[44px] h-[24px] rounded-full transition-all duration-200 shrink-0 ${checked ? 'bg-[#FF7A00]' : 'bg-elevated'}`}>
        <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200 shadow-sm ${checked ? 'left-[23px]' : 'left-[3px]'}`} />
      </button>
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTimeAgo(d: string) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora mesmo";
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return formatDateShort(d);
}

export default function ConfiguracoesPage() {
  return (
    <DashboardLayout>
      <ConfiguracoesContent />
    </DashboardLayout>
  );
}

function ConfiguracoesContent() {
  const { setUser: setGlobalUser } = useUser();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState("perfil");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dirty, setDirty] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState("system");
  const [density, setDensity] = useState("default");

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showEndSessionsConfirm, setShowEndSessionsConfirm] = useState(false);
  const [cardSessions, setCardSessions] = useState<any[]>([]);

  // Email state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpResult, setSmtpResult] = useState<{ success: boolean; message: string } | null>(null);

  // Backup state
  const [backupInfo, setBackupInfo] = useState<{ lastBackupAt: string; size: string; files: any[] } | null>(null);
  const [backupGenerating, setBackupGenerating] = useState(false);

  // Sistema state
  const [systemInfo, setSystemInfo] = useState<any>(null);

  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [lang, setLang] = useState("pt-BR");
  const [sessionMax, setSessionMax] = useState("1440");
  const [uploadLimit, setUploadLimit] = useState("10");
  const [itemsPerPage, setItemsPerPage] = useState("50");
  const [dossierDeadline, setDossierDeadline] = useState("30");
  const [showNotifications, setShowNotifications] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [confirmFinalize, setConfirmFinalize] = useState(true);
  const [expiryWarnings, setExpiryWarnings] = useState(true);

  const [organs, setOrgans] = useState<any[]>([]);
  const [newOrganName, setNewOrganName] = useState("");
  const [showNewOrgan, setShowNewOrgan] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [pdfConfig, setPdfConfig] = useState<Record<string, string>>({});

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState({ user: "", action: "", period: "", module: "", result: "" });

  const getHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("acert_token");
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
  }, []);

  useEffect(() => {
    const h = getHeaders();
    (async () => {
      try {
        const [meRes, sRes] = await Promise.all([
          fetch(`${apiBase}/api/auth/me`, { headers: h }),
          fetch(`${apiBase}/api/settings`, { headers: h }),
        ]);
        const meData = await meRes.json();
        if (meData.user) {
          setUser(meData.user);
          setPhone(meData.user.phone || "");
          setName(meData.user.name || "");
          setEmail(meData.user.email || "");
        }
        const sData = await sRes.json();
        setTimezone(sData.timezone || "America/Sao_Paulo");
        setDateFormat(sData.date_format || "DD/MM/YYYY");
        setTimeFormat(sData.time_format || "24h");
        setLang(sData.language || "pt-BR");
        setSessionMax(sData.session_max || "1440");
        setUploadLimit(sData.upload_limit || "10");
        setItemsPerPage(sData.items_per_page || "50");
        setDossierDeadline(sData.dossier_deadline || "30");
        setShowNotifications(sData.show_notifications !== "false");
        setConfirmDelete(sData.confirm_delete !== "false");
        setConfirmFinalize(sData.confirm_finalize !== "false");
        setExpiryWarnings(sData.expiry_warnings !== "false");
      } catch {}
    })();
  }, [getHeaders]);

  useEffect(() => {
    if (activeTab !== "perfil") return;
    const h = getHeaders();
    (async () => {
      try {
        const r = await fetch(`${apiBase}/api/auth/me/stats`, { headers: h });
        setStats(await r.json());
      } catch {}
    })();
  }, [activeTab, getHeaders]);

  useEffect(() => {
    if (activeTab !== "perfil") return;
    const h = getHeaders();
    (async () => {
      try {
        const r = await fetch(`${apiBase}/api/auth/me/sessions`, { headers: h });
        const sessions = await r.json();
        setCardSessions((sessions || []).slice(0, 3));
      } catch {}
    })();
  }, [activeTab, getHeaders]);

  useEffect(() => {
    if (activeTab !== "orgaos") return;
    const h = getHeaders();
    (async () => {
      try {
        const [oRes, tRes] = await Promise.all([
          fetch(`${apiBase}/api/settings/organs`, { headers: h }),
          fetch(`${apiBase}/api/settings/templates`, { headers: h }),
        ]);
        setOrgans(await oRes.json());
        setTemplates(await tRes.json());
      } catch {}
    })();
  }, [activeTab, getHeaders]);

  useEffect(() => {
    if (activeTab !== "templates") return;
    const h = getHeaders();
    (async () => {
      try {
        const pRes = await fetch(`${apiBase}/api/settings/pdf-templates`, { headers: h });
        setPdfConfig(await pRes.json());
      } catch {}
    })();
  }, [activeTab, getHeaders]);

  useEffect(() => {
    if (activeTab !== "auditoria") return;
    fetchAudit();
  }, [activeTab]);

  async function fetchAudit() {
    const h = getHeaders();
    const params = new URLSearchParams();
    if (auditFilter.user) params.set("user", auditFilter.user);
    if (auditFilter.action) params.set("action", auditFilter.action);
    if (auditFilter.module) params.set("module", auditFilter.module);
    if (auditFilter.result) params.set("result", auditFilter.result);
    if (auditFilter.period) params.set("period", auditFilter.period);
    try {
      const r = await fetch(`${apiBase}/api/settings/audit?${params}`, { headers: h });
      setAuditLogs(await r.json());
    } catch {}
  }

  useEffect(() => {
    if (activeTab !== "backup") return;
    const h = getHeaders();
    (async () => {
      try {
        const r = await fetch(`${apiBase}/api/settings/backup`, { headers: h });
        setBackupInfo(await r.json());
      } catch {}
    })();
  }, [activeTab, getHeaders]);

  useEffect(() => {
    if (activeTab !== "sistema") return;
    const h = getHeaders();
    (async () => {
      try {
        const r = await fetch(`${apiBase}/api/settings/system-info`, { headers: h });
        setSystemInfo(await r.json());
      } catch {}
    })();
  }, [activeTab, getHeaders]);

  async function testSmtp() {
    setSmtpResult(null);
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      const r = await fetch(`${apiBase}/api/settings/test-smtp`, {
        method: "POST", headers: h,
        body: JSON.stringify({ host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass }),
      });
      setSmtpResult(await r.json());
    } catch {
      setSmtpResult({ success: false, message: "Erro ao conectar com o servidor" });
    }
  }

  async function endSessions() {
    const h = getHeaders();
    try {
      await fetch(`${apiBase}/api/auth/me/sessions/end`, { method: "POST", headers: h });
      setCardSessions([]);
    } catch {}
  }

  async function generateBackup() {
    setBackupGenerating(true);
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      const r = await fetch(`${apiBase}/api/settings/backup/generate`, { method: "POST", headers: h });
      const result = await r.json();
      if (result.success) {
        const infoR = await fetch(`${apiBase}/api/settings/backup`, { headers: getHeaders() });
        setBackupInfo(await infoR.json());
      }
    } catch {} finally { setBackupGenerating(false); }
  }

  async function downloadBackup(filename: string) {
    const h = getHeaders();
    try {
      const r = await fetch(`${apiBase}/api/settings/backup/download/${filename}`, { headers: h });
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }

  async function deleteBackup(filename: string) {
    const h = getHeaders();
    try {
      await fetch(`${apiBase}/api/settings/backup/${filename}`, { method: "DELETE", headers: h });
      const infoR = await fetch(`${apiBase}/api/settings/backup`, { headers: getHeaders() });
      setBackupInfo(await infoR.json());
    } catch {}
  }

  async function saveProfile() {
    setSaving(true);
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      const r = await fetch(`${apiBase}/api/auth/me`, { method: "PUT", headers: h, body: JSON.stringify({ name, email, phone }) });
      const data = await r.json();
      if (data.user) { setUser(data.user); setGlobalUser(data.user); }
      setDirty(false);
      setEditingField(null);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  }

  async function saveGeneral() {
    setSaving(true);
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      await fetch(`${apiBase}/api/settings`, {
        method: "PUT", headers: h,
        body: JSON.stringify({
          timezone, date_format: dateFormat, time_format: timeFormat, language: lang,
          session_max: sessionMax, upload_limit: uploadLimit, items_per_page: itemsPerPage,
          dossier_deadline: dossierDeadline,
          show_notifications: showNotifications ? "true" : "false",
          confirm_delete: confirmDelete ? "true" : "false",
          confirm_finalize: confirmFinalize ? "true" : "false",
          expiry_warnings: expiryWarnings ? "true" : "false",
        }),
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  }

  async function savePDFConfig() {
    setSaving(true);
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      await fetch(`${apiBase}/api/settings/pdf-templates`, { method: "PUT", headers: h, body: JSON.stringify(pdfConfig) });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  }

  async function addOrgan() {
    if (!newOrganName.trim()) return;
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      const r = await fetch(`${apiBase}/api/settings/organs`, { method: "POST", headers: h, body: JSON.stringify({ name: newOrganName.trim() }) });
      const organ = await r.json();
      setOrgans(prev => [...prev, organ]);
      setNewOrganName(""); setShowNewOrgan(false);
    } catch {}
  }

  async function removeOrgan(id: string) {
    const h = getHeaders();
    try {
      await fetch(`${apiBase}/api/settings/organs/${id}`, { method: "DELETE", headers: h });
      setOrgans(prev => prev.filter(o => o.id !== id));
    } catch {}
  }

  const roleBadge = (role?: string) => {
    const label = (role && ROLES_MAP[role]) || role || "Corretor";
    const colors: Record<string, string> = {
      ADMIN: "bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20",
      ANALYST: "bg-[#059669]/10 text-[#059669] border-[#059669]/20",
      EMPLOYEE: "bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20",
    };
    return (
      <span className={`text-[11px] font-semibold px-4 py-1 border text-center min-w-[90px] inline-block ${colors[role || ""] || colors.EMPLOYEE}`}>
        {label}
      </span>
    );
  };

  function handleTabChange(key: string) {
    if (dirty) { setPendingTab(key); setShowConfirmExit(true); }
    else setActiveTab(key);
  }

  function discardAndGo() {
    setDirty(false);
    setEditingField(null);
    if (pendingTab) setActiveTab(pendingTab);
    setShowConfirmExit(false);
    setPendingTab(null);
  }

  async function saveAndGo() {
    await saveProfile();
    setDirty(false);
    setEditingField(null);
    if (pendingTab) setActiveTab(pendingTab);
    setShowConfirmExit(false);
    setPendingTab(null);
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("userId", user.id);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/upload/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await r.json();
      if (data.avatarUrl) {
        setUser((prev: any) => prev ? { ...prev, avatar: data.avatarUrl } : prev);
        const updated = { ...user, avatar: data.avatarUrl };
        setGlobalUser(updated);
      }
    } catch {}
    e.target.value = "";
  };

  return (
    <>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>
        <div style={{ marginTop: 24, marginBottom: 28 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Configurações</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Central de gerenciamento da sua conta e do sistema.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              {dirty && activeTab === "perfil" && (
                <button onClick={saveProfile} className={btnPrimary}>
                  <Save size={15} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
                </button>
              )}
              {activeTab === "geral" && (
                <button onClick={saveGeneral} className={btnPrimary}>
                  <Save size={15} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
                </button>
              )}
              {activeTab === "templates" && (
                <button onClick={savePDFConfig} className={btnPrimary}>
                  <Save size={15} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Cores"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-default mb-28">
          <div className="flex items-center gap-14">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => handleTabChange(t.key)}
                  className={`flex items-center gap-2 h-9 text-[13px] font-medium transition-colors -mb-px border-b-[3px] ${
                    isActive ? "border-[#FF7A00] text-primary" : "border-transparent text-secondary hover:text-body"
                  }`}>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "perfil" && (
          <div className="flex flex-col gap-6" style={{ paddingTop: 40 }}>
            <div className="flex gap-6">
              {/* Left: Perfil do Usuário (portrait) */}
              <div className="flex-1 min-w-0">
                <div className="relative w-full h-full bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
                  style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border-default)" }}>
                    <User size={18} className="text-[#FF7A00]" />
                    <h3 className="text-[16px] font-bold text-primary">Perfil do Usuário</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                    <label className="relative group shrink-0 cursor-pointer">
                      <div className="w-40 h-40 rounded-full border-2 border-default overflow-hidden bg-elevated flex items-center justify-center">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={76} className="text-muted" />
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                        <Camera size={40} className="text-white" />
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    <div className="min-w-0 flex-1">
                      <FieldRow icon={User} label={t("people.fields.name")} value={name || "—"} editing={editingField === "name"} onEdit={() => setEditingField("name")} onCancel={() => { setEditingField(null); setName(user?.name || ""); }} onChange={(v) => { setName(v); setDirty(true); }} />
                      <FieldRow icon={Shield} label={t("users.table.role")} value={(user?.role && ROLES_MAP[user.role]) || "Corretor"} readOnly />
                      <FieldRow icon={Building2} label={t("profile.company")} value="Bloco Imobiliária" readOnly />
                      <FieldRow icon={Mail} label={t("profile.email")} value={email || "—"} editing={editingField === "email"} onEdit={() => setEditingField("email")} onCancel={() => { setEditingField(null); setEmail(user?.email || ""); }} onChange={(v) => { setEmail(v); setDirty(true); }} />
                      <FieldRow icon={Phone} label={t("people.fields.phone")} value={phone || "—"} editing={editingField === "phone"} onEdit={() => setEditingField("phone")} onCancel={() => { setEditingField(null); setPhone(user?.phone || ""); }} onChange={(v) => { setPhone(v); setDirty(true); }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Preferências do Usuário (square) */}
              <div className="flex-1 min-w-0">
                <div className="relative w-full h-full bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
                  style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-default">
                    <Settings size={18} className="text-[#FF7A00]" />
                    <h3 className="text-[16px] font-bold text-primary">Preferências</h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={labelStyle}>Idioma</label>
                      <select value={lang} onChange={e => { setLang(e.target.value); setDirty(true); }} className={selectBase}
                        style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Formato de data</label>
                      <select value={dateFormat} onChange={e => { setDateFormat(e.target.value); setDirty(true); }} className={selectBase}
                        style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Fuso horário</label>
                      <select value={timezone} onChange={e => { setTimezone(e.target.value); setDirty(true); }} className={selectBase}
                        style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                        <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                        <option value="America/Manaus">America/Manaus (UTC-4)</option>
                        <option value="America/Recife">America/Recife (UTC-3)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Segurança da Conta */}
            <div className="bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
              style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--border-default)", paddingBottom: 12 }}>
                <Shield size={16} strokeWidth={2} color="#FF7A00" />
                <h3 className="text-[14px] font-bold text-primary">Segurança da Conta</h3>
              </div>
              <div style={{ display: "flex", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingRight: 32, borderRight: "1px solid var(--border-light)" }}>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 h-9 px-4 rounded-[7px] text-[13px] font-medium text-secondary border border-default hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors bg-transparent cursor-pointer"
                  >
                    <Lock size={14} strokeWidth={1.5} />
                    Alterar senha
                  </button>
                  <button
                    onClick={() => setShowEndSessionsConfirm(true)}
                    className="flex items-center gap-2 h-9 px-4 rounded-[7px] text-[13px] font-medium text-secondary border border-default hover:border-[#DC2626] hover:text-[#DC2626] transition-colors bg-transparent cursor-pointer"
                  >
                    <LogOut size={14} strokeWidth={1.5} />
                    Encerrar sessões
                  </button>
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingLeft: 32 }}>
                  <h4 className="text-[12px] font-semibold text-muted uppercase tracking-[0.5px] mb-3">Últimos dispositivos autenticados</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                        <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Dispositivo</th>
                        <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Navegador</th>
                        <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Localização</th>
                        <th style={{ textAlign: "right", padding: "6px 10px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Último acesso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardSessions.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: "16px 10px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Nenhuma sessão registrada.</td>
                        </tr>
                      ) : (
                        cardSessions.map((s: any, i: number) => (
                          <tr key={s.id || i} style={{ borderBottom: i < cardSessions.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                            <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-primary)" }}>{s.device || s.os || "—"}</td>
                            <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-primary)" }}>{s.browser || "—"}</td>
                            <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-secondary)" }}>{s.location || "—"}</td>
                            <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-secondary)", textAlign: "right" }}>{formatDate(s.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => setShowSessionsModal(true)}
                      className="text-[12px] font-medium text-[#FF7A00] hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Ver todas as sessões →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              {/* Card 4: Acesso à Conta */}
              <div className="flex-1 min-w-0 bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
                style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border-default)", paddingBottom: 12 }}>
                  <LogIn size={16} strokeWidth={2} color="#FF7A00" />
                  <h3 className="text-[14px] font-bold text-primary">Acesso à Conta</h3>
                </div>
                <div className="flex flex-col gap-0.5 text-[13px]">
                  <div className="flex justify-between py-2"><span className="text-secondary">Último login</span><span className="text-primary font-medium">{user?.last_access_at ? formatDate(user.last_access_at) : "—"}</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Primeiro acesso</span><span className="text-primary font-medium">{user?.created_at ? formatDate(user.created_at) : "—"}</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Último IP utilizado</span><span className="text-primary font-medium">189.xxx.xxx.xx</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Navegador</span><span className="text-primary font-medium">Chrome 126</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Sistema operacional</span><span className="text-primary font-medium">Windows 11</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Dispositivo</span><span className="text-primary font-medium">Desktop</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Status da conta</span><span className="font-semibold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded">Ativa</span></div>
                </div>
              </div>

              {/* Card 5: Resumo da Atividade */}
              <div className="flex-1 min-w-0 bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
                style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border-default)", paddingBottom: 12 }}>
                  <Activity size={16} strokeWidth={2} color="#FF7A00" />
                  <h3 className="text-[14px] font-bold text-primary">Resumo da Atividade</h3>
                </div>
                <div className="flex flex-col gap-0.5 text-[13px]">
                  <div className="flex justify-between py-2"><span className="text-secondary">Dossiês criados</span><span className="text-primary font-semibold">{stats?.dossiersEmAndamento ?? "—"} <span className="text-[11px] text-[#059669]">+12%</span></span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Dossiês concluídos</span><span className="text-primary font-semibold">{stats?.dossiersConcluidos ?? "—"} <span className="text-[11px] text-[#059669]">+8%</span></span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Certidões emitidas</span><span className="text-primary font-semibold">{stats?.totalCertidoes ?? "—"} <span className="text-[11px] text-[#059669]">+15%</span></span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Último acesso</span><span className="text-primary font-semibold">{user?.last_access_at ? formatTimeAgo(user.last_access_at) : "—"}</span></div>
                  <div className="flex justify-between py-2"><span className="text-secondary">Tempo médio diário</span><span className="text-primary font-semibold">— <span className="text-[11px] text-[#059669]">+0,5h</span></span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmExit && (
          <ConfirmModal
            open={showConfirmExit}
            title="Alterações não salvas"
            message="Você tem alterações não salvas. Deseja salvar antes de sair?"
            variant="warning"
            confirmLabel={t("common.save")}
            cancelLabel="Descartar"
            onConfirm={saveAndGo}
            onCancel={discardAndGo}
            onClose={() => { setShowConfirmExit(false); setPendingTab(null); }}
          />
        )}

        {activeTab === "geral" && (
          <div className="flex gap-8">
            <div className="flex-1 min-w-0">
              <div>
                <div className="mb-6 pb-4 border-b border-default">
                  <h3 className="text-[15px] font-semibold text-primary">Configurações Operacionais</h3>
                </div>
                <div className="border border-default p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Prazo padrão para conclusão de dossiês</span>
                    <input type="number" value={dossierDeadline} onChange={e => setDossierDeadline(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 focus:border-[#FF7A00]" />
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Itens por página</span>
                    <input type="number" value={itemsPerPage} onChange={e => setItemsPerPage(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 focus:border-[#FF7A00]" />
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Tempo máximo de sessão (min)</span>
                    <input type="number" value={sessionMax} onChange={e => setSessionMax(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 focus:border-[#FF7A00]" />
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Limite de upload (MB)</span>
                    <input type="number" value={uploadLimit} onChange={e => setUploadLimit(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 focus:border-[#FF7A00]" />
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Fuso horário</span>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 appearance-none cursor-pointer focus:border-[#FF7A00]"
                      style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                      <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                      <option value="America/Manaus">America/Manaus (UTC-4)</option>
                      <option value="America/Recife">America/Recife (UTC-3)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Formato de data</span>
                    <select value={dateFormat} onChange={e => setDateFormat(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 appearance-none cursor-pointer focus:border-[#FF7A00]"
                      style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-default">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Formato de hora</span>
                    <select value={timeFormat} onChange={e => setTimeFormat(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 appearance-none cursor-pointer focus:border-[#FF7A00]"
                      style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                      <option value="24h">24h</option>
                      <option value="12h">12h (AM/PM)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Idioma</span>
                    <select value={lang} onChange={e => setLang(e.target.value)}
                      className="w-[180px] h-9 rounded-[6px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 appearance-none cursor-pointer focus:border-[#FF7A00]"
                      style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ width: "320px", minWidth: "320px" }}>
              <div className="bg-surface p-6 border border-default">
                <div className="mb-5 pb-3 border-b border-default">
                  <h3 className="text-[15px] font-semibold text-primary">Preferências do Sistema</h3>
                </div>
                <Switch checked={showNotifications} onChange={setShowNotifications} label={t("config.exibir_notif")} desc="Alertas e notificações do sistema" />
                <Switch checked={confirmDelete} onChange={setConfirmDelete} label={t("config.confirmar_excluir")} desc="Exibir confirmação ao mover para lixeira" />
                <Switch checked={confirmFinalize} onChange={setConfirmFinalize} label={t("config.confirmar_finalizar")} desc="Exibir confirmação ao concluir um dossiê" />
                <Switch checked={expiryWarnings} onChange={setExpiryWarnings} label={t("config.avisos_vencimento")} desc="Alertar quando certidões estiverem perto de expirar" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "orgaos" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-semibold text-primary">Integrações</h3>
              <button onClick={() => setShowNewOrgan(true)} className={btnOutline}>
                <Plus size={14} /> Adicionar Órgão
              </button>
            </div>
            {showNewOrgan && (
              <div className="flex items-center gap-3 mb-6 p-4 border border-default">
                <input type="text" value={newOrganName} onChange={e => setNewOrganName(e.target.value)}
                  placeholder="Nome do novo órgão..." className={inputBase} style={{ maxWidth: "400px" }}
                  onKeyDown={e => { if (e.key === "Enter") addOrgan(); }} />
                <button onClick={addOrgan} className={btnPrimary}>Adicionar</button>
                <button onClick={() => { setShowNewOrgan(false); setNewOrganName(""); }} className={btnOutline}>Cancelar</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-6">
              {organs.map((o: any) => (
                <div key={o.id} className="bg-surface p-6 flex flex-col gap-4 rounded-[10px]">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-primary">{o.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${o.status === "online" ? "bg-[#059669]" : o.status === "offline" ? "bg-[#DC2626]" : "bg-[#D97706]"}`} />
                        <span className={`text-[12px] font-medium ${o.status === "online" ? "text-[#059669]" : o.status === "offline" ? "text-[#DC2626]" : "text-[#D97706]"}`}>
                          {o.status === "online" ? "Conectado" : o.status === "offline" ? "Desconectado" : "Instável"}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removeOrgan(o.id)} className="w-8 h-8 flex items-center justify-center text-[#DC2626] hover:bg-white/[0.05] transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-secondary">Última sincronização</span>
                      <span className="text-primary font-medium">{o.last_sync ? formatDate(o.last_sync) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Tempo médio de resposta</span>
                      <span className="text-primary font-medium">{o.avg_response_time || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Última consulta</span>
                      <span className="text-primary font-medium">{o.last_query ? formatDate(o.last_query) : "—"}</span>
                    </div>
                    {o.token_expiry && (
                      <div className="flex justify-between">
                        <span className="text-secondary">Validade do token</span>
                        <span className={`font-medium ${new Date(o.token_expiry) < new Date() ? "text-[#DC2626]" : "text-[#059669]"}`}>
                          {formatDateShort(o.token_expiry)}
                        </span>
                      </div>
                    )}
                    {o.token_updated_at && (
                      <div className="flex justify-between">
                        <span className="text-secondary">Última atualização do token</span>
                        <span className="text-primary font-medium">{formatDateShort(o.token_updated_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-default mt-auto">
                    <select value={o.status} onChange={async e => {
                      const h = { "Content-Type": "application/json", ...getHeaders() };
                      await fetch(`${apiBase}/api/settings/organs/${o.id}`, {
                        method: "PUT", headers: h, body: JSON.stringify({ status: e.target.value }),
                      });
                      const r = await fetch(`${apiBase}/api/settings/organs`, { headers: getHeaders() });
                      setOrgans(await r.json());
                    }}
                      className="h-8 px-3 text-[12px] text-muted border border-default bg-surface outline-none cursor-pointer appearance-none flex-1"
                      style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                      <option value="online">Conectado</option>
                      <option value="offline">Desconectado</option>
                      <option value="unstable">Instável</option>
                    </select>
                    <button className="h-8 px-3 text-[12px] font-medium text-[#FF7A00] border border-[#FF7A00]/30 hover:bg-[#FF7A00]/10 transition-colors">
                      Testar
                    </button>
                  </div>
                </div>
              ))}
              {organs.length === 0 && (
                <div className="col-span-3 py-16 text-center">
                  <Building2 size={32} className="mx-auto text-muted mb-3" />
                  <p className="text-[14px] text-secondary">Nenhum órgão integrado cadastrado.</p>
                  <p className="text-[12px] text-muted mt-1">Clique em "Adicionar Órgão" para começar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <div>
            <div className={sectionBox} style={{ maxWidth: "640px" }}>
              <div className="mb-6 pb-4 border-b border-default">
                <h3 className="text-[15px] font-semibold text-primary">Configuração de E-mail (SMTP)</h3>
              </div>
              <p className="text-[13px] text-muted mb-8">Configure o servidor SMTP para envio de e-mails do sistema.</p>
              <div className="flex flex-col gap-5">
                <div className={grid2}>
                  <div>
                    <label className={labelStyle}>Servidor SMTP</label>
                    <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
                      className={inputBase} placeholder="smtp.exemplo.com" />
                  </div>
                  <div>
                    <label className={labelStyle}>Porta</label>
                    <input type="text" value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
                      className={inputBase} placeholder="587" />
                  </div>
                  <div>
                    <label className={labelStyle}>Usuário</label>
                    <input type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)}
                      className={inputBase} placeholder="contato@exemplo.com" />
                  </div>
                  <div>
                    <label className={labelStyle}>Senha</label>
                    <input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)}
                      className={inputBase} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={labelStyle}>E-mail de remetente</label>
                    <input type="email" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)}
                      className={inputBase} placeholder="nao-responder@exemplo.com" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-default">
                  <button onClick={testSmtp} className={btnPrimary}>
                    <Mail size={15} /> Testar Conexão
                  </button>
                </div>
                {smtpResult && (
                  <div className={`flex items-start gap-3 p-4 rounded-[10px] text-[13px] ${
                    smtpResult.success ? "bg-[rgba(5,150,105,0.1)] text-[#059669]" : "bg-[rgba(220,38,38,0.1)] text-[#DC2626]"
                  }`}>
                    {smtpResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
                    <span>{smtpResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div>
            <div className={sectionBox} style={{ maxWidth: "800px" }}>
              <div className="mb-6 pb-4 border-b border-default">
                <h3 className="text-[15px] font-semibold text-primary">Modelos de Documentos</h3>
              </div>
              <div className="space-y-4 mb-10">
                {[
                  { key: "dossie_operacional", label: "Dossiê Operacional", desc: "Modelo padrão para dossiês operacionais do sistema." },
                  { key: "dossie_executivo", label: "Dossiê Executivo", desc: "Modelo executivo com layout diferenciado." },
                  { key: "relatorios", label: "Relatórios", desc: "Modelo utilizado na geração de relatórios." },
                  { key: "certidoes_consolidadas", label: "Certidões Consolidadas", desc: "Modelo para consolidação de certidões emitidas." },
                ].map(t => (
                  <div key={t.key} className="flex items-center justify-between p-5 border border-default">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-primary">{t.label}</h4>
                      <p className="text-[12px] text-muted mt-1">{t.desc}</p>
                      <p className="text-[11px] text-secondary mt-1.5">Última modificação: — | Versão: 1.0</p>
                    </div>
                    <button className={btnOutline} style={{ height: 34, padding: "0 14px", fontSize: "12px" }}>
                      <Eye size={13} /> Visualizar
                    </button>
                  </div>
                ))}
              </div>

              <div className="mb-6 pb-4 border-b border-default">
                <h3 className="text-[15px] font-semibold text-primary">Personalização de PDFs</h3>
              </div>
              <p className="text-[13px] text-muted mb-8">Configure as cores e logotipo utilizados nos PDFs gerados pelo sistema.</p>
              <div className={grid2}>
                {[
                  { label: "Cor principal", key: "pdf_primary_color", value: "#FF7A00" },
                  { label: "Cor secundária", key: "pdf_secondary_color", value: "#111827" },
                  { label: "Cor de destaque", key: "pdf_accent_color", value: "#059669" },
                  { label: "Cor de sucesso", key: "pdf_success_color", value: "#059669" },
                ].map(c => (
                  <div key={c.key}>
                    <label className={labelStyle}>{c.label}</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={pdfConfig[c.key] || c.value}
                        onChange={e => setPdfConfig(prev => ({ ...prev, [c.key]: e.target.value }))}
                        className="w-10 h-10 border-0 cursor-pointer bg-transparent" />
                      <input type="text" value={pdfConfig[c.key] || c.value}
                        onChange={e => setPdfConfig(prev => ({ ...prev, [c.key]: e.target.value }))}
                        className={inputBase} />
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-[14px] font-semibold text-primary mt-10 mb-6">Elementos incluídos nos documentos</h4>
              <div className="space-y-3">
                {[
                  { key: "include_history", label: "Histórico de atividades", default: true },
                  { key: "include_notes", label: "Observações", default: true },
                  { key: "include_parties", label: "Dados das partes envolvidas", default: true },
                  { key: "include_protocols", label: "Protocolos", default: true },
                  { key: "include_financial", label: "Informações financeiras", default: false },
                ].map(el => (
                  <Switch
                    key={el.key}
                    checked={pdfConfig[el.key] !== "false"}
                    onChange={v => setPdfConfig(prev => ({ ...prev, [el.key]: v ? "true" : "false" }))}
                    label={el.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "backup" && (
          <div>
            <div className={sectionBox} style={{ maxWidth: "720px" }}>
              <div className="mb-6 pb-4 border-b border-default">
                <h3 className="text-[15px] font-semibold text-primary">Gerenciamento de Backup</h3>
              </div>
              <p className="text-[13px] text-muted mb-8">Gerencie os backups do sistema. Os backups incluem todos os dados e configurações.</p>

              <div className="flex items-center justify-between p-6 rounded-[10px] border border-default mb-8">
                <div>
                  <p className="text-[13px] text-secondary">Último backup</p>
                  <p className="text-[15px] font-semibold text-primary mt-1">
                    {backupInfo?.lastBackupAt ? formatDate(backupInfo.lastBackupAt) : "Nenhum backup realizado"}
                  </p>
                  {backupInfo?.size && backupInfo.size !== "0" && (
                    <p className="text-[12px] text-muted mt-0.5">Tamanho: {backupInfo.size}</p>
                  )}
                </div>
                <button onClick={generateBackup} disabled={backupGenerating} className={btnPrimary}>
                  {backupGenerating ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gerando...</>
                  ) : (
                    <><Download size={15} /> Gerar Backup</>
                  )}
                </button>
              </div>

              {backupInfo?.files && backupInfo.files.length > 0 ? (
                <div>
                  <h4 className="text-[13px] font-medium text-secondary mb-4">Backups disponíveis</h4>
                  <div className="flex flex-col gap-3">
                    {backupInfo.files.map((file: any) => (
                      <div key={file.name} className="flex items-center justify-between p-4 rounded-[10px] border border-default">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-primary truncate">{file.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-[11px] text-muted">{file.size > 1048576 ? `${(file.size / 1048576).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`}</span>
                            <span className="text-[11px] text-muted">{formatDate(file.date)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => downloadBackup(file.name)} className={btnOutline} style={{ height: 32, padding: "0 12px", fontSize: "12px" }}>
                            <Download size={13} /> Baixar
                          </button>
                          <button onClick={() => deleteBackup(file.name)} className="flex items-center justify-center gap-1.5 h-8 px-3 text-[12px] font-semibold cursor-pointer transition-all duration-150 bg-transparent text-[#DC2626] border border-[#DC2626]/30 hover:bg-[rgba(220,38,38,0.1)] rounded-lg">
                            <Trash2 size={13} /> Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Database size={32} className="text-muted" />
                  <span className="text-[15px] font-semibold text-primary">Nenhum backup encontrado</span>
                  <span className="text-[13px] text-secondary">Clique em "Gerar Backup" para criar o primeiro.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "auditoria" && (
          <div>
            <div className={sectionBox}>
              <div className="mb-6 pb-4 border-b border-default">
                <h3 className="text-[15px] font-semibold text-primary">Log de Auditoria</h3>
              </div>
              <div className="flex items-center gap-4 mb-8 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                  <input type="text" placeholder="Usuário..." value={auditFilter.user}
                    onChange={e => setAuditFilter(p => ({ ...p, user: e.target.value }))}
                    className="w-[170px] h-9 pl-9 pr-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-secondary" />
                </div>
                <input type="text" placeholder="Ação..." value={auditFilter.action}
                  onChange={e => setAuditFilter(p => ({ ...p, action: e.target.value }))}
                  className="w-[140px] h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-secondary" />
                <input type="text" placeholder="Módulo..." value={auditFilter.module}
                  onChange={e => setAuditFilter(p => ({ ...p, module: e.target.value }))}
                  className="w-[140px] h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-secondary" />
                <select value={auditFilter.result} onChange={e => setAuditFilter(p => ({ ...p, result: e.target.value }))}
                  className="h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none cursor-pointer appearance-none"
                  style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                  <option value="">Todos os resultados</option>
                  <option value="success">Sucesso</option>
                  <option value="error">Erro</option>
                </select>
                <select value={auditFilter.period} onChange={e => setAuditFilter(p => ({ ...p, period: e.target.value }))}
                  className="h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none cursor-pointer appearance-none"
                  style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                  <option value="">Todos os períodos</option>
                  <option value="hoje">Hoje</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mês</option>
                </select>
                <button onClick={fetchAudit} className={btnOutline}><RefreshCw size={14} /> Buscar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                  <thead>
                    <tr className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", minWidth: "150px" }}>Data/Hora</th>
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", minWidth: "130px" }}>Usuário</th>
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", minWidth: "140px" }}>Ação</th>
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", minWidth: "100px" }}>Módulo</th>
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", minWidth: "120px" }}>IP</th>
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", minWidth: "90px" }}>Resultado</th>
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-[13px] text-secondary">Nenhum registro de auditoria encontrado.</td></tr>
                    ) : auditLogs.map((log: any) => (
                      <tr key={log.id} className="group transition-colors" style={{ borderRadius: "8px" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <td className="px-4 py-3 text-[12px] text-muted font-mono">{formatDate(log.created_at)}</td>
                        <td className="px-4 py-3 text-[13px] text-primary">{log.user_name}</td>
                        <td className="px-4 py-3 text-[13px] text-primary">{log.action}</td>
                        <td className="px-4 py-3 text-[12px] text-[#FF7A00] font-medium">{log.module}</td>
                        <td className="px-4 py-3 text-[12px] text-muted font-mono">{log.ip_address || "—"}</td>
                        <td className="px-4 py-3">
                          {log.result === "error" ? (
                            <span className="text-[11px] font-semibold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded">Erro</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded">Sucesso</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-muted truncate block" style={{ maxWidth: "260px" }}>{log.detail || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sistema" && (
          <div>
            <div className={sectionBox} style={{ maxWidth: "600px" }}>
              <div className="mb-6 pb-4 border-b border-default">
                <h3 className="text-[15px] font-semibold text-primary">Informações do Sistema</h3>
              </div>
              {systemInfo ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-4 px-4 rounded-[10px] border border-default">
                    <span className="text-[13px] text-secondary">Versão</span>
                    <span className="text-[13px] font-semibold text-primary">{systemInfo.version}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 px-4 rounded-[10px] border border-default">
                    <span className="text-[13px] text-secondary">Ambiente</span>
                    <span className="text-[13px] font-semibold text-primary">{systemInfo.environment}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 px-4 rounded-[10px] border border-default">
                    <span className="text-[13px] text-secondary">Servidor</span>
                    <span className="text-[13px] font-semibold text-primary">{systemInfo.server}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 px-4 rounded-[10px] border border-default">
                    <span className="text-[13px] text-secondary">Banco de dados</span>
                    <span className="text-[13px] font-semibold text-primary">{systemInfo.database}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 px-4 rounded-[10px] border border-default">
                    <span className="text-[13px] text-secondary">Tempo de atividade</span>
                    <span className="text-[13px] font-semibold text-primary">{systemInfo.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 px-4 rounded-[10px] border border-default">
                    <span className="text-[13px] text-secondary">Última atualização</span>
                    <span className="text-[13px] font-semibold text-primary">{systemInfo.lastUpdate}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Server size={32} className="text-muted" />
                  <span className="text-[13px] text-secondary">Carregando informações do sistema...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <PasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <SessionsModal
        open={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
      />
      <ConfirmModal
        open={showEndSessionsConfirm}
        title="Encerrar sessões ativas"
        message="Tem certeza que deseja encerrar todas as sessões ativas? Você será desconectado de todos os outros dispositivos."
        variant="warning"
        confirmLabel="Sim, encerrar sessões"
        cancelLabel="Não, voltar"
        onConfirm={() => { endSessions(); setShowEndSessionsConfirm(false); }}
        onCancel={() => setShowEndSessionsConfirm(false)}
        onClose={() => setShowEndSessionsConfirm(false)}
      />
    </>
  );
}
