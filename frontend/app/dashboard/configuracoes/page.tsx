"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  User, Settings, Building2, FileText, Activity,
  Save, Mail, CheckCircle2, XCircle, AlertTriangle, Clock, Plus,
  Server, Eye, Edit3, Trash2, Search, RefreshCw,
  Camera, Phone, Calendar, FileSpreadsheet, FileCheck,
  Upload, Shield, HardDrive, Download,
  Lock, Smartphone, Database,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const apiBase = "";

const TABS = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "geral", label: "Geral", icon: Settings },
  { key: "seguranca", label: "Segurança", icon: Lock },
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
  EMPLOYE: "Corretor",
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
  const [activeTab, setActiveTab] = useState("perfil");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [phone, setPhone] = useState("");

  // Segurança state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");

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

  async function saveSecurity() {
    if (newPassword !== confirmPassword) {
      setPassError("As senhas não conferem");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setSaving(true);
    setPassError("");
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      const r = await fetch(`${apiBase}/api/auth/me/password`, {
        method: "PUT", headers: h,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await r.json();
      if (data.success) {
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setSaved(true); setTimeout(() => setSaved(false), 2000);
      } else {
        setPassError(data.error || "Erro ao alterar senha");
      }
    } catch {
      setPassError("Erro ao conectar com o servidor");
    } finally { setSaving(false); }
  }

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
      const r = await fetch(`${apiBase}/api/auth/me`, { method: "PUT", headers: h, body: JSON.stringify({ phone }) });
      const data = await r.json();
      if (data.user) setUser(data.user);
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
      EMPLOYE: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
    };
    return (
      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${colors[role || ""] || colors.EMPLOYE}`}>
        {label}
      </span>
    );
  };

  const activityIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("criou") || a.includes("criação")) return <FileSpreadsheet size={16} className="text-[#3B82F6]" />;
    if (a.includes("certidão") || a.includes("certidao") || a.includes("emitiu")) return <FileCheck size={16} className="text-[#059669]" />;
    if (a.includes("anexo") || a.includes("upload")) return <Upload size={16} className="text-[#FF7A00]" />;
    if (a.includes("alterou") || a.includes("editou") || a.includes("atualizou")) return <Edit3 size={16} className="text-[#D97706]" />;
    if (a.includes("excluiu") || a.includes("removeu")) return <Trash2 size={16} className="text-[#DC2626]" />;
    return <Clock size={16} className="text-muted" />;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const h = { "Content-Type": "application/json", ...getHeaders() };
      try {
        const r = await fetch(`${apiBase}/api/auth/me`, { method: "PUT", headers: h, body: JSON.stringify({ avatar: base64 }) });
        const data = await r.json();
        if (data.user) setUser(data.user);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>
        <div style={{ marginTop: 24, marginBottom: 28 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Configurações</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Central de gerenciamento da sua conta e do sistema.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              {activeTab === "perfil" && (
                <button onClick={saveProfile} className={btnPrimary}>
                  <Save size={15} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Perfil"}
                </button>
              )}
              {activeTab === "geral" && (
                <button onClick={saveGeneral} className={btnPrimary}>
                  <Save size={15} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
                </button>
              )}
              {activeTab === "seguranca" && (
                <button onClick={saveSecurity} className={btnPrimary}>
                  <Save size={15} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Senha"}
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

        <div className="border-b border-default mb-12">
          <div className="flex items-center gap-14">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
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
          <div>
            <div className="flex gap-8">
              <div className="flex-1 min-w-0">
                <div className={sectionBox}>
                  <div className="flex items-start gap-6 mb-8 pb-8 border-b border-default">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full border-2 border-default overflow-hidden bg-elevated flex items-center justify-center">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-muted" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                        <Camera size={18} className="text-white" />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="min-w-0 pt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-[20px] font-bold text-primary">{user?.name || "Carregando..."}</h2>
                        {roleBadge(user?.role)}
                      </div>
                      <p className="text-[13px] text-muted">{user?.email}</p>
                    </div>
                  </div>

                  <div className={grid2}>
                    <div>
                      <label className={labelStyle}>Nome completo</label>
                      <input type="text" value={user?.name || ""} readOnly className={inputBase} />
                    </div>
                    <div>
                      <label className={labelStyle}>Cargo</label>
                      <input type="text" value={(user?.role && ROLES_MAP[user.role]) || "Corretor"} readOnly className={inputBase} />
                    </div>
                    <div>
                      <label className={labelStyle}>Matrícula</label>
                      <input type="text" value={user?.registration_number || "—"} readOnly className={inputBase} />
                    </div>
                    <div>
                      <label className={labelStyle}>E-mail corporativo</label>
                      <input type="text" value={user?.email || ""} readOnly className={inputBase} />
                    </div>
                    <div>
                      <label className={labelStyle}>Telefone</label>
                      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputBase} placeholder="(61) 99999-9999" />
                    </div>
                    <div>
                      <label className={labelStyle}>Data de criação da conta</label>
                      <input type="text" value={formatDateShort(user?.created_at)} readOnly className={inputBase} />
                    </div>
                    <div>
                      <label className={labelStyle}>Último acesso</label>
                      <input type="text" value={user?.last_access_at ? formatDate(user.last_access_at) : "—"} readOnly className={inputBase} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: "320px", minWidth: "320px" }}>
                <div className="bg-surface rounded-[10px] p-6">
                  <h3 className="text-[15px] font-semibold text-primary mb-6">Informações da Conta</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4 py-4 border-b border-default last:border-0">
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.1)" }}>
                        <Clock size={18} className="text-[#3B82F6]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Último acesso</p>
                        <p className="text-[15px] font-semibold text-primary mt-0.5">{user?.last_access_at ? formatTimeAgo(user.last_access_at) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-b border-default last:border-0">
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.1)" }}>
                        <Calendar size={18} className="text-[#FF7A00]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Data de criação</p>
                        <p className="text-[15px] font-semibold text-primary mt-0.5">{formatDateShort(user?.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-b border-default last:border-0">
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,6,0.1)" }}>
                        <FileSpreadsheet size={18} className="text-[#D97706]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Dossiês em andamento</p>
                        <p className="text-[15px] font-semibold text-primary mt-0.5">{stats?.dossiersEmAndamento ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-b border-default last:border-0">
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(5,150,105,0.1)" }}>
                        <FileCheck size={18} className="text-[#059669]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Dossiês concluídos</p>
                        <p className="text-[15px] font-semibold text-primary mt-0.5">{stats?.dossiersConcluidos ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-b border-default last:border-0">
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.1)" }}>
                        <Shield size={18} className="text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Total de certidões</p>
                        <p className="text-[15px] font-semibold text-primary mt-0.5">{stats?.totalCertidoes ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${sectionBox} mt-6`}>
              <h3 className="text-[15px] font-semibold text-primary mb-6">Atividades Recentes</h3>
              {!stats?.recentActivities?.length ? (
                <p className="text-[13px] text-secondary py-8 text-center">Nenhuma atividade recente encontrada.</p>
              ) : (
                <div className="relative pl-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border-default">
                  {stats.recentActivities.map((act: any, i: number) => (
                    <div key={act.id} className={`relative pb-6 last:pb-0 ${i > 0 ? "pt-2" : ""}`}>
                      <div className="absolute -left-8 w-8 flex items-start justify-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-surface border border-default rounded-full">
                          {activityIcon(act.action)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-primary font-medium">{act.action}</p>
                        {(act.reference || act.dossier_ref) && (
                          <p className="text-[12px] text-muted mt-0.5">{act.reference || act.dossier_ref}</p>
                        )}
                        <p className="text-[11px] text-secondary mt-1">{formatDate(act.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "geral" && (
          <div className="flex gap-8">
            <div className="flex-1 min-w-0">
              <div className={sectionBox}>
                <h3 className="text-[15px] font-semibold text-primary mb-8">Configurações Operacionais</h3>
                <div className={grid2}>
                  <div>
                    <label className={labelStyle}>Prazo padrão para conclusão de dossiês (dias)</label>
                    <input type="number" value={dossierDeadline} onChange={e => setDossierDeadline(e.target.value)} className={inputBase} />
                  </div>
                  <div>
                    <label className={labelStyle}>Itens por página</label>
                    <input type="number" value={itemsPerPage} onChange={e => setItemsPerPage(e.target.value)} className={inputBase} />
                  </div>
                  <div>
                    <label className={labelStyle}>Tempo máximo de sessão (min)</label>
                    <input type="number" value={sessionMax} onChange={e => setSessionMax(e.target.value)} className={inputBase} />
                  </div>
                  <div>
                    <label className={labelStyle}>Limite de upload (MB)</label>
                    <input type="number" value={uploadLimit} onChange={e => setUploadLimit(e.target.value)} className={inputBase} />
                  </div>
                  <div>
                    <label className={labelStyle}>Fuso horário</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)} className={selectBase} style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                      <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                      <option value="America/Manaus">America/Manaus (UTC-4)</option>
                      <option value="America/Recife">America/Recife (UTC-3)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Formato de data</label>
                    <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className={selectBase} style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Formato de hora</label>
                    <select value={timeFormat} onChange={e => setTimeFormat(e.target.value)} className={selectBase} style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                      <option value="24h">24h</option>
                      <option value="12h">12h (AM/PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Idioma</label>
                    <select value={lang} onChange={e => setLang(e.target.value)} className={selectBase} style={{ backgroundImage: selectBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ width: "320px", minWidth: "320px" }}>
              <div className="bg-surface rounded-[10px] p-6">
                <h3 className="text-[15px] font-semibold text-primary mb-6">Preferências do Sistema</h3>
                <Switch checked={showNotifications} onChange={setShowNotifications} label="Exibir notificações" desc="Alertas e notificações do sistema" />
                <Switch checked={confirmDelete} onChange={setConfirmDelete} label="Confirmar antes de excluir" desc="Exibir confirmação ao mover para lixeira" />
                <Switch checked={confirmFinalize} onChange={setConfirmFinalize} label="Confirmar finalização de dossiê" desc="Exibir confirmação ao concluir um dossiê" />
                <Switch checked={expiryWarnings} onChange={setExpiryWarnings} label="Avisos de certidões próximas do vencimento" desc="Alertar quando certidões estiverem perto de expirar" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "seguranca" && (
          <div>
            <div className="flex gap-8">
              <div className="flex-1 min-w-0">
                <div className={sectionBox}>
                  <h3 className="text-[15px] font-semibold text-primary mb-8">Alterar Senha</h3>
                  <div className="flex flex-col gap-5 max-w-md">
                    <div>
                      <label className={labelStyle}>Senha atual</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        className={inputBase} placeholder="••••••••" />
                    </div>
                    <div>
                      <label className={labelStyle}>Nova senha</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className={inputBase} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div>
                      <label className={labelStyle}>Confirmar nova senha</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className={inputBase} placeholder="Repita a nova senha" />
                    </div>
                    {passError && (
                      <div className="flex items-center gap-2 text-[13px] text-[#DC2626]">
                        <AlertTriangle size={14} /> {passError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ width: "320px", minWidth: "320px" }}>
                <div className="bg-surface rounded-[10px] p-6">
                  <h3 className="text-[15px] font-semibold text-primary mb-6">Sessões Ativas</h3>
                  <p className="text-[13px] text-secondary">Você será desconectado dos outros dispositivos após alterar a senha.</p>
                  <div className="mt-6 flex items-center gap-4 py-4 border-t border-default">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.1)" }}>
                      <Smartphone size={18} className="text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-primary">Este dispositivo</p>
                      <p className="text-[11px] text-secondary">Sessão atual</p>
                    </div>
                    <span className="ml-auto text-[11px] font-semibold text-[#059669] px-2 py-0.5 rounded" style={{ background: "rgba(5,150,105,0.1)" }}>Ativo</span>
                  </div>
                </div>
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
              <h3 className="text-[15px] font-semibold text-primary mb-8">Configuração de E-mail (SMTP)</h3>
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
              <h3 className="text-[15px] font-semibold text-primary mb-8">Modelos de Documentos</h3>
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

              <h3 className="text-[15px] font-semibold text-primary mb-8">Personalização de PDFs</h3>
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
              <h3 className="text-[15px] font-semibold text-primary mb-8">Gerenciamento de Backup</h3>
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
              <h3 className="text-[15px] font-semibold text-primary mb-8">Log de Auditoria</h3>
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
              <h3 className="text-[15px] font-semibold text-primary mb-8">Informações do Sistema</h3>
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
    </DashboardLayout>
  );
}
