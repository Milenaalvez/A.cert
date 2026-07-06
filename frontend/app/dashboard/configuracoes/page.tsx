"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import {
  User, Settings, Building2, FileText, Activity,
  Save, CheckCircle2, Check, XCircle, Clock, Plus,
  Server, Trash2, RefreshCw, Radio,
  Camera, Phone, Calendar, FileCheck,
  Shield, Lock, LogOut, Pencil,
  LogIn, X, Mail,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmModal from "@/components/ConfirmModal";
import PasswordModal from "@/components/PasswordModal";
import SessionsModal from "@/components/SessionsModal";
import { useUser } from "@/contexts/UserContext";
import { useLocale } from "@/i18n/LocaleContext";
import { useSettings, clearSettingsCache } from "@/contexts/SettingsContext";
import { useT } from "@/i18n/useT";

const apiBase = "";

const TABS = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "geral", label: "Geral", icon: Settings },
  { key: "orgaos", label: "Conectores", icon: Radio },
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
  const { setLocale } = useLocale();
  const { refresh: refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("perfil");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [dirty, setDirty] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showEndSessionsConfirm, setShowEndSessionsConfirm] = useState(false);
  const [cardSessions, setCardSessions] = useState<any[]>([]);

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
  const [certsPerDossier, setCertsPerDossier] = useState("9");
  const [trashAutoPurgeDays, setTrashAutoPurgeDays] = useState("90");
  const [certExpiryWarningDays, setCertExpiryWarningDays] = useState("30");
  const [loginMaxAttempts, setLoginMaxAttempts] = useState("5");
  const [showNotifications, setShowNotifications] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [confirmFinalize, setConfirmFinalize] = useState(true);
  const [expiryWarnings, setExpiryWarnings] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertSound, setAlertSound] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoDarkMode, setAutoDarkMode] = useState(false);
  const [rememberLastPage, setRememberLastPage] = useState(true);
  const [sidebarCollapsedDefault, setSidebarCollapsedDefault] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const [organs, setOrgans] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [connectorsLoading, setConnectorsLoading] = useState(false);
  const [testingConnector, setTestingConnector] = useState<string | null>(null);
  const [testMessages, setTestMessages] = useState<Record<string, string>>({});
  const [newOrganName, setNewOrganName] = useState("");
  const [showNewOrgan, setShowNewOrgan] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
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
        setCertsPerDossier(sData.certs_per_dossier || "9");
        setTrashAutoPurgeDays(sData.trash_auto_purge_days || "90");
        setCertExpiryWarningDays(sData.cert_expiry_warning_days || "30");
        setLoginMaxAttempts(sData.login_max_attempts || "5");
        setShowNotifications(sData.show_notifications !== "false");
        setConfirmDelete(sData.confirm_delete !== "false");
        setConfirmFinalize(sData.confirm_finalize !== "false");
        setExpiryWarnings(sData.expiry_warnings !== "false");
        setEmailNotifications(sData.email_notifications !== "false");
        setAlertSound(sData.alert_sound === "true");
        setAutoRefresh(sData.auto_refresh !== "false");
        setAutoDarkMode(sData.auto_dark_mode === "true");
        setRememberLastPage(sData.remember_last_page !== "false");
        setSidebarCollapsedDefault(sData.sidebar_collapsed_default === "true");
        setShowTips(sData.show_tips !== "false");
        if (sData.language) setLocale(sData.language as any);
        setConfirmFinalize(sData.confirm_finalize !== "false");
        setExpiryWarnings(sData.expiry_warnings !== "false");
      } catch {}
    })();
  }, [getHeaders]);

  useEffect(() => {
    if (activeTab !== "geral") return;
    setDirty(true);
  }, [dossierDeadline, itemsPerPage, sessionMax, uploadLimit, timezone, dateFormat, timeFormat, lang, showNotifications, confirmDelete, confirmFinalize, expiryWarnings]);

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
    fetchConnectorStatus();
  }, [activeTab]);

  async function fetchConnectorStatus() {
    setConnectorsLoading(true);
    const h = getHeaders();
    try { const r = await fetch(`${apiBase}/api/settings/connectors-status`,{headers:h}); const d = await r.json(); setConnectors(Array.isArray(d)?d:[]); } catch { setConnectors([]); } finally { setConnectorsLoading(false); }
  }

  async function testConnector(connectorId: string) {
    setTestingConnector(connectorId);
    const h = getHeaders();
    try { const r = await fetch(`${apiBase}/api/settings/connectors/${connectorId}/test`,{method:"POST",headers:h}); return await r.json(); } catch { return {success:false,message:"Falha ao conectar"}; } finally { setTestingConnector(null); }
  }

  useEffect(() => {
    if (activeTab !== "auditoria") return;
    fetchAudit();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "auditoria") return;
    const t = setTimeout(() => fetchAudit(), 400);
    return () => clearTimeout(t);
  }, [auditFilter.user, auditFilter.action, auditFilter.module, auditFilter.result, auditFilter.period]);

  async function fetchAudit() {
    setAuditLoading(true);
    const h = getHeaders();
    const params = new URLSearchParams();
    if (auditFilter.user) params.set("user", auditFilter.user);
    if (auditFilter.action) params.set("action", auditFilter.action);
    if (auditFilter.module) params.set("module", auditFilter.module);
    if (auditFilter.result) params.set("result", auditFilter.result);
    if (auditFilter.period) params.set("period", auditFilter.period);
    try { const r = await fetch(`${apiBase}/api/settings/audit?${params}`,{headers:h}); const d = await r.json(); setAuditLogs(Array.isArray(d)?d:[]); } catch { setAuditLogs([]); } finally { setAuditLoading(false); }
  }

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

  async function endSessions() {
    const h = getHeaders();
    try { await fetch(`${apiBase}/api/auth/me/sessions/end`, { method: "POST", headers: h }); } catch {}
    localStorage.removeItem("acert_token");
    window.location.href = "/";
  }

  async function saveProfile() {
    setSaving(true);
    const h = { "Content-Type": "application/json", ...getHeaders() };
    try {
      const r = await fetch(`${apiBase}/api/auth/me`, { method: "PUT", headers: h, body: JSON.stringify({ phone }) });
      const data = await r.json();
      if (data.user) setUser(data.user);
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
          certs_per_dossier: certsPerDossier,
          trash_auto_purge_days: trashAutoPurgeDays,
          cert_expiry_warning_days: certExpiryWarningDays,
          login_max_attempts: loginMaxAttempts,
          show_notifications: showNotifications ? "true" : "false",
          confirm_delete: confirmDelete ? "true" : "false",
          confirm_finalize: confirmFinalize ? "true" : "false",
          expiry_warnings: expiryWarnings ? "true" : "false",
          email_notifications: emailNotifications ? "true" : "false",
          alert_sound: alertSound ? "true" : "false",
          auto_refresh: autoRefresh ? "true" : "false",
          auto_dark_mode: autoDarkMode ? "true" : "false",
          remember_last_page: rememberLastPage ? "true" : "false",
          sidebar_collapsed_default: sidebarCollapsedDefault ? "true" : "false",
          show_tips: showTips ? "true" : "false",
        }),
      });
      setLocale(lang as any);
      clearSettingsCache();
      await refreshSettings();
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
    if (activeTab === "perfil") await saveProfile();
    else if (activeTab === "geral") await saveGeneral();
    setDirty(false);
    setEditingField(null);
    if (pendingTab) setActiveTab(pendingTab);
    setShowConfirmExit(false);
    setPendingTab(null);
  }

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
        if (data.user) { setUser(data.user); setGlobalUser(data.user); }
      } catch {}
    };
    reader.readAsDataURL(file);
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
                      <FieldRow icon={User} label={t("people.fields.name")} value={user?.name || "—"} readOnly />
                      <FieldRow icon={Shield} label={t("users.table.role")} value={(user?.role && ROLES_MAP[user.role]) || "Corretor"} readOnly />
                      <FieldRow icon={Building2} label={t("profile.company")} value="Bloco Imobiliária" readOnly />
                      <FieldRow icon={Mail} label={t("profile.email")} value={user?.email || "—"} readOnly />
                      <FieldRow icon={Phone} label={t("people.fields.phone")} value={phone || "—"} editing={editingField === "phone"} onEdit={() => setEditingField("phone")} onCancel={() => { setEditingField(null); setPhone(user?.phone || ""); }} onChange={(v) => { setPhone(v); setDirty(true); }} readOnly={false} />
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
          <div className="flex gap-8" style={{ paddingTop: 40 }}>
            <div className="flex-1 min-w-0 bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
              style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-default)" }}>
                <Settings size={16} strokeWidth={2} color="#FF7A00" />
                <h3 className="text-[15px] font-bold text-primary">Operacional</h3>
              </div>
              <div className="flex flex-col gap-5">
                {[
                  {icon:Calendar,label:"Prazo padrão para conclusão de dossiês",val:dossierDeadline,set:setDossierDeadline,unit:"dias"},
                  {icon:FileText,label:"Itens por página nas listagens",val:itemsPerPage,set:setItemsPerPage,unit:"itens"},
                  {icon:Clock,label:"Tempo máximo de sessão",val:sessionMax,set:setSessionMax,unit:"min"},
                  {icon:Shield,label:"Limite de upload por arquivo",val:uploadLimit,set:setUploadLimit,unit:"MB"},
                  {icon:FileCheck,label:"Certidões necessárias por dossiê",val:certsPerDossier,set:setCertsPerDossier,unit:"cert"},
                  {icon:Shield,label:"Tentativas máximas de login",val:loginMaxAttempts,set:setLoginMaxAttempts,unit:"tent"},
                  {icon:Clock,label:"Aviso de expiração de certidões",val:certExpiryWarningDays,set:setCertExpiryWarningDays,unit:"dias"},
                  {icon:Trash2,label:"Auto-exclusão da lixeira",val:trashAutoPurgeDays,set:setTrashAutoPurgeDays,unit:"dias"},
                ].map((f,i)=>React.createElement("div",{key:i,className:"flex items-center justify-between pb-4"},
                  React.createElement("div",{className:"flex items-center gap-2.5"},
                    React.createElement(f.icon,{size:14,strokeWidth:1.5,className:"text-muted shrink-0"}),
                    React.createElement("span",{className:"text-[13px] text-secondary"},f.label)
                  ),
                  React.createElement("div",{className:"flex items-center gap-1.5"},
                    React.createElement("input",{type:"number",value:f.val,onChange:e=>f.set(e.target.value),className:"w-[88px] h-9 rounded-[7px] text-[13px] text-primary text-right outline-none border border-default bg-app px-3 focus:border-[#FF7A00]"}),
                    React.createElement("span",{className:"text-[12px] text-muted w-8"},f.unit)
                  )
                ))}
              </div>
              <div style={{ marginTop: 28, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-default)" }}>
                <h3 className="text-[13px] font-semibold text-muted uppercase tracking-[0.5px]">Regionalização</h3>
              </div>
              <div className="flex flex-col gap-5">
                {[
                  {icon:Clock,label:"Fuso horário",val:timezone,set:setTimezone,opts:[["America/Sao_Paulo (UTC-3)","America/Sao_Paulo"],["America/Manaus (UTC-4)","America/Manaus"],["America/Recife (UTC-3)","America/Recife"]]},
                  {icon:Calendar,label:"Formato de data",val:dateFormat,set:setDateFormat,opts:[["DD/MM/YYYY","DD/MM/YYYY"],["MM/DD/YYYY","MM/DD/YYYY"],["YYYY-MM-DD","YYYY-MM-DD"]]},
                  {icon:Clock,label:"Formato de hora",val:timeFormat,set:setTimeFormat,opts:[["24h","24h"],["12h (AM/PM)","12h"]]},
                  {icon:FileText,label:"Idioma do sistema",val:lang,set:setLang,opts:[["Português (Brasil)","pt-BR"],["English","en"],["Español","es"]]},
                ].map((f,i)=>React.createElement("div",{key:i,className:"flex items-center justify-between pb-4"},
                  React.createElement("div",{className:"flex items-center gap-2.5"},
                    React.createElement(f.icon,{size:14,strokeWidth:1.5,className:"text-muted shrink-0"}),
                    React.createElement("span",{className:"text-[13px] text-secondary"},f.label)
                  ),
                  React.createElement("select",{value:f.val,onChange:(e:any)=>f.set(e.target.value),
                    className:"w-[210px] h-10 rounded-[7px] text-[13px] text-primary outline-none border border-default bg-app appearance-none cursor-pointer focus:border-[#FF7A00]",
                    style:{paddingLeft:"20px",backgroundImage:selectBg,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",paddingRight:"32px"}},
                    f.opts.map((o,j)=>React.createElement("option",{key:j,value:o[1]},o[0]))
                  )
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0 bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
              style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-default)" }}>
                <Settings size={16} strokeWidth={2} color="#FF7A00" />
                <h3 className="text-[15px] font-bold text-primary">Preferências do Sistema</h3>
              </div>
              {[
                {t:"Alertas e notificações",items:[
                  [showNotifications,setShowNotifications,"Notificações no sistema","Alertas visuais de prazos e atualizações"],
                  [emailNotifications,setEmailNotifications,"Notificações por e-mail","Receber alertas também no seu e-mail"],
                  [alertSound,setAlertSound,"Som de alerta","Tocar som ao receber notificações importantes"],
                  [expiryWarnings,setExpiryWarnings,"Avisos de vencimento","Alertar quando certidões estiverem perto de expirar"],
                ]},
                {t:"Interface",items:[
                  [autoDarkMode,setAutoDarkMode,"Modo escuro automático","Acompanhar tema do sistema operacional"],
                  [sidebarCollapsedDefault,setSidebarCollapsedDefault,"Sidebar compacta por padrão","Iniciar com a barra lateral recolhida"],
                  [showTips,setShowTips,"Dicas e tutoriais","Exibir guias rápidos ao usar novas funcionalidades"],
                ]},
                {t:"Comportamento",items:[
                  [confirmDelete,setConfirmDelete,"Confirmar ao excluir","Pedir confirmação ao mover itens para a lixeira"],
                  [confirmFinalize,setConfirmFinalize,"Confirmar ao concluir","Pedir confirmação ao finalizar um dossiê"],
                  [autoRefresh,setAutoRefresh,"Atualização automática","Recarregar listas automaticamente a cada 2 minutos"],
                  [rememberLastPage,setRememberLastPage,"Lembrar última página","Abrir a última tela visitada ao fazer login"],
                ]},
              ].map((g,gi)=>React.createElement("div",{key:gi,style:gi>0?{marginTop:28,marginBottom:24,paddingBottom:16,borderBottom:"1px solid var(--border-default)"}:{marginBottom:24,paddingBottom:16,borderBottom:"1px solid var(--border-default)"}},
                React.createElement("h3",{className:"text-[13px] font-semibold text-muted uppercase tracking-[0.5px] mb-0"},g.t),
                React.createElement("div",{className:"flex flex-col gap-5",style:{marginTop:12}},g.items.map(([checked,onChange,label,desc]:any,i)=>React.createElement(Switch,{key:i,checked,onChange,label,desc})))
              ))}
            </div>
          </div>
        )}

        {activeTab === "orgaos" && (
          <div className="flex gap-8" style={{ paddingTop: 40 }}>
            <div className="flex-1 min-w-0 bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
              style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-default)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Radio size={16} strokeWidth={2} color="#FF7A00" />
                  <h3 className="text-[15px] font-bold text-primary">Monitor de Conectores</h3>
                </div>
                <button onClick={fetchConnectorStatus} className={btnOutline} style={{ height: 32, padding: "0 12px", fontSize: "12px" }}>
                  <RefreshCw size={13} /> Atualizar
                </button>
              </div>
              {!connectorsLoading && (
                <div className="flex items-center gap-6 mb-6 pb-4 border-b border-default">
                  {[{c:"#059669",l:"online"},{c:"#D97706",l:"instável"},{c:"#DC2626",l:"offline"}].map(s=>(
                    <div key={s.l} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background:s.c}} />
                      <span className="text-[12px] text-secondary">{connectors.filter((x:any)=>x.status===s.l).length} {s.l}</span>
                    </div>
                  ))}
                  <div className="flex-1" />
                  <span className="text-[12px] text-muted">
                    {connectors.reduce((s:number,x:any)=>s+x.certidoesObtidas,0)} obtidas · {(connectors.reduce((s:number,x:any)=>s+(x.totalCertidoes>0?x.taxaSucesso:0),0)/Math.max(1,connectors.filter((x:any)=>x.totalCertidoes>0).length)).toFixed(0)}% sucesso
                  </span>
                </div>
              )}
              {connectorsLoading ? (
                <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                  <thead>
                    <tr className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                      <th className="text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>Órgão</th>
                      <th className="text-center px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "80px" }}>Status</th>
                      <th className="text-center px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "70px" }}>Obtidas</th>
                      <th className="text-center px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "70px" }}>Hoje</th>
                      <th className="text-center px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "110px" }}>Sucesso</th>
                      <th className="text-center px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "90px" }}>Tempo médio</th>
                      <th className="text-right px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "150px" }}>Última consulta</th>
                      <th className="text-center px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)", width: "64px" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {connectors.map((c: any) => {
                      const sc = c.status==="online"?"#059669":c.status==="unstable"?"#D97706":"#DC2626";
                      const sb = c.status==="online"?"rgba(5,150,105,0.1)":c.status==="unstable"?"rgba(217,119,6,0.1)":"rgba(220,38,38,0.1)";
                      const sl = c.status==="online"?"Online":c.status==="unstable"?"Instável":"Offline";
                      const bc = c.taxaSucesso>=80?"#059669":c.taxaSucesso>=50?"#D97706":"#DC2626";
                      const tm = testMessages[c.id]||null;
                      return (
                        <tr key={c.id} className="transition-colors" onMouseEnter={e=>{e.currentTarget.style.background="var(--bg-subtle)"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[7px] flex items-center justify-center shrink-0" style={{background:sb}}><Building2 size={14} strokeWidth={2} style={{color:sc}} /></div>
                              <div className="min-w-0">
                                <span className="text-[13px] font-semibold text-primary block leading-tight">{c.name}</span>
                                {tm&&tm!=="..."&&<span className="text-[11px] text-muted block truncate mt-0.5" style={{maxWidth:"260px"}}>{tm}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{background:sb,color:sc}}><span className="w-1.5 h-1.5 rounded-full" style={{background:sc}} />{sl}</span>
                          </td>
                          <td className="px-4 py-3 text-center"><span className="text-[13px] font-semibold text-primary tabular-nums">{c.certidoesObtidas}</span>{c.totalCertidoes>0&&<span className="text-[11px] text-muted">/{c.totalCertidoes}</span>}</td>
                          <td className="px-4 py-3 text-center"><span className={`text-[13px] font-semibold tabular-nums ${c.certidoesHoje>0?"text-[#059669]":"text-muted"}`}>{c.certidoesHoje}</span></td>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.max(2,c.taxaSucesso)}%`,background:bc}} /></div><span className="text-[12px] font-semibold tabular-nums w-9 text-right" style={{color:bc}}>{c.taxaSucesso}%</span></div></td>
                          <td className="px-4 py-3 text-center"><span className="text-[13px] text-primary">{c.tempoMedio}</span></td>
                          <td className="px-4 py-3 text-right"><span className="text-[12px] text-muted">{c.ultimaConsulta?new Date(c.ultimaConsulta).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"}</span></td>
                          <td className="px-4 py-3 text-center">
                            {tm==="..."?<span className="text-[11px] text-muted">...</span>:
                            <button onClick={async()=>{setTestMessages(p=>({...p,[c.id]:"..."}));const r=await testConnector(c.id);setTestMessages(p=>({...p,[c.id]:r.message}));setTimeout(()=>setTestMessages(p=>{const n={...p};delete n[c.id];return n}),4000)}} disabled={testingConnector===c.id} className="h-7 px-3 rounded-[5px] text-[11px] font-medium border transition-colors" style={{color:sc,borderColor:sc+"30",opacity:testingConnector===c.id?0.5:1}}>Testar</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "auditoria" && (
          <div style={{ paddingTop: 40 }}>
            <div className="bg-surface border border-default" style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-default)" }}>
                <Activity size={18} color="#FF7A00" />
                <h3 className="text-[16px] font-bold text-primary">Log de Auditoria</h3>
                <span className="ml-auto text-[12px] text-muted">
                  {auditLoading ? (
                    <RefreshCw size={14} className="animate-spin text-[#FF7A00]" />
                  ) : (
                    <span className="text-[12px] font-medium text-secondary bg-elevated px-2.5 py-0.5 rounded">{Array.isArray(auditLogs) ? auditLogs.length : 0} registros</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <input type="text" placeholder="Usuário..." value={auditFilter.user}
                  onChange={e => setAuditFilter(p => ({ ...p, user: e.target.value }))}
                  className="w-[160px] h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-muted" />
                <input type="text" placeholder="Ação..." value={auditFilter.action}
                  onChange={e => setAuditFilter(p => ({ ...p, action: e.target.value }))}
                  className="w-[130px] h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-muted" />
                <input type="text" placeholder="Módulo..." value={auditFilter.module}
                  onChange={e => setAuditFilter(p => ({ ...p, module: e.target.value }))}
                  className="w-[130px] h-9 px-3 rounded-[8px] text-[13px] text-primary border border-default bg-surface outline-none placeholder:text-muted" />
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
                <button onClick={() => { setAuditFilter({ user: "", action: "", period: "", module: "", result: "" }); }} className={btnOutline}>
                  Limpar filtros
                </button>
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
                    {auditLoading ? (
                      <tr><td colSpan={7} className="py-16 text-center"><RefreshCw size={22} className="animate-spin mx-auto text-[#FF7A00]" /></td></tr>
                    ) : !Array.isArray(auditLogs) || auditLogs.length === 0 ? (
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
          <div style={{ paddingTop: 40 }}>
            <div className="bg-surface border border-default animate-in fade-in zoom-in-95 duration-200" style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", padding: "18px 36px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-default)" }}>
                <Server size={16} strokeWidth={2} color="#FF7A00" />
                <h3 className="text-[15px] font-bold text-primary">Informações do Sistema</h3>
              </div>
              {systemInfo ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[12px] font-semibold text-muted uppercase tracking-[0.5px] mb-4">Ambiente</h4>
                    <div className="flex flex-col gap-0.5">
                      {[{k:"Versão",v:systemInfo.version},{k:"Ambiente",v:systemInfo.environment},{k:"Servidor",v:systemInfo.server},{k:"Banco de dados",v:systemInfo.database},{k:"Última atualização",v:systemInfo.lastUpdate}].map(r=>(
                        <div key={r.k} className="flex items-center justify-between py-3 px-4 rounded-[7px] hover:bg-subtle"><span className="text-[13px] text-secondary">{r.k}</span><span className="text-[13px] font-semibold text-primary">{r.v}</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[12px] font-semibold text-muted uppercase tracking-[0.5px] mb-4">Recursos</h4>
                    <div className="flex flex-col gap-0.5">
                      {[{k:"Tempo de atividade",v:systemInfo.uptime},{k:"Memória em uso",v:systemInfo.resources?.memory||"—"},{k:"Banco de dados",v:"Conectado"},{k:"Conectores ativos",v:"7"},{k:"Próximo backup",v:"Não agendado"}].map(r=>(
                        <div key={r.k} className="flex items-center justify-between py-3 px-4 rounded-[7px] hover:bg-subtle"><span className="text-[13px] text-secondary">{r.k}</span><span className="text-[13px] font-semibold text-primary">{r.v}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center"><Server size={32} className="text-muted opacity-40" /><span className="text-[13px] text-secondary">Carregando informações do sistema...</span></div>
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
