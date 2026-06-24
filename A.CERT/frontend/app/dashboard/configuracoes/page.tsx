"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, Mail, Building2, Image, Shield, FileText, Database,
  Download, Upload, CheckCircle2, XCircle, AlertTriangle, Clock, Plus, Edit,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";

/* ── Types ─────────────────────────────────────────── */
interface SettingsData { [key: string]: string; }
interface Organ { id: string; name: string; status: string; updated_at: string; }
interface CertTemplate { id: string; key: string; label: string; category: string; site_url: string; type: string; ordem: number; }
interface AuditLog { id: string; user_name: string; action: string; module: string; detail: string; created_at: string; }

/* ── Constants ─────────────────────────────────────── */
const apiBase = "http://localhost:3001";

/* ── Component ─────────────────────────────────────── */
export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("geral");

  // General
  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companySite, setCompanySite] = useState("");

  // SMTP
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Organs
  const [organs, setOrgans] = useState<Organ[]>([]);

  // Templates
  const [templates, setTemplates] = useState<CertTemplate[]>([]);

  // Audit
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);

  // Backup
  const [backupInfo, setBackupInfo] = useState<{ lastBackupAt: string; size: string }>({ lastBackupAt: "", size: "0" });

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem("acert_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [sRes, oRes, tRes, aRes, bRes] = await Promise.all([
        fetch(`${apiBase}/api/settings`, { headers }),
        fetch(`${apiBase}/api/dashboard`, { headers }),
        fetch(`${apiBase}/api/settings/templates`, { headers }),
        fetch(`${apiBase}/api/settings/audit`, { headers }),
        fetch(`${apiBase}/api/settings/backup`, { headers }),
      ]);

      const sData = await sRes.json();
      const oData = await oRes.json();
      const tData = await tRes.json();
      const aData = await aRes.json();
      const bData = await bRes.json();

      setSettings(sData);
      setCompanyName(sData.company_name || "");
      setLegalName(sData.company_legal_name || "");
      setCnpj(sData.company_cnpj || "");
      setCompanyEmail(sData.company_email || "");
      setCompanyPhone(sData.company_phone || "");
      setCompanySite(sData.company_site || "");
      setSmtpHost(sData.smtp_host || "");
      setSmtpPort(sData.smtp_port || "587");
      setSmtpUser(sData.smtp_user || "");
      setSmtpPass(sData.smtp_pass || "");
      setSmtpFromEmail(sData.smtp_from_email || "");
      setSmtpFromName(sData.smtp_from_name || "");

      setOrgans(oData?.organs || []);
      setTemplates(tData || []);
      setAuditLog(aData || []);
      setBackupInfo(bData || { lastBackupAt: "", size: "0" });
    } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    const token = localStorage.getItem("acert_token");
    try {
      await fetch(`${apiBase}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          company_name: companyName, company_legal_name: legalName, company_cnpj: cnpj,
          company_email: companyEmail, company_phone: companyPhone, company_site: companySite,
          smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser, smtp_pass: smtpPass,
          smtp_from_email: smtpFromEmail, smtp_from_name: smtpFromName,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  }

  async function testSmtp() {
    setTesting(true);
    setTestResult(null);
    const token = localStorage.getItem("acert_token");
    try {
      const r = await fetch(`${apiBase}/api/settings/test-smtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass }),
      });
      const d = await r.json();
      setTestResult(d);
    } catch {
      setTestResult({ success: false, message: "Erro de conexão" });
    } finally { setTesting(false); }
  }

  async function updateOrganStatus(id: string, status: string) {
    const token = localStorage.getItem("acert_token");
    await fetch(`${apiBase}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ [`organ_${id}_status`]: status }),
    });
    fetchAll();
  }

  const statusIcon = (s: string) => {
    if (s === "online") return <CheckCircle2 size={14} color="#10B981" />;
    if (s === "unstable") return <AlertTriangle size={14} color="#F59E0B" />;
    if (s === "maintenance") return <Clock size={14} color="#3B82F6" />;
    return <XCircle size={14} color="#EF4444" />;
  };
  const statusLabel = (s: string) => s === "online" ? "Online" : s === "unstable" ? "Instável" : s === "maintenance" ? "Manutenção" : "Offline";
  const statusColor = (s: string) => s === "online" ? "#10B981" : s === "unstable" ? "#F59E0B" : s === "maintenance" ? "#3B82F6" : "#EF4444";

  const tabs = [
    { key: "geral", label: "Geral", icon: Building2 },
    { key: "identidade", label: "Identidade Visual", icon: Image },
    { key: "smtp", label: "SMTP", icon: Mail },
    { key: "orgaos", label: "Órgãos Integrados", icon: Shield },
    { key: "templates", label: "Templates", icon: FileText },
    { key: "auditoria", label: "Auditoria", icon: FileText },
    { key: "backup", label: "Backup", icon: Database },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[900px] mx-auto px-6 pt-7 pb-16">
        {/* Header */}
        <div className="mb-6">
          <PageHeader title="Configurações" subtitle="Gerencie as configurações globais do sistema." />
          <div className="flex justify-end mt-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors ${
                saved
                  ? "bg-[#10B981]"
                  : saving
                    ? "bg-[var(--accent-primary)] opacity-60 cursor-not-allowed"
                    : "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]"
              }`}
            >
              <Save size={14} /> {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
                  isActive
                    ? "border border-[var(--accent-primary)] bg-[var(--accent-light)] text-[var(--accent-primary)]"
                    : "border border-default bg-app text-secondary hover:text-primary hover:border-[var(--border-hover)]"
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* GERAL */}
        {activeSection === "geral" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <Building2 size={16} className="text-[var(--accent-primary)]" /> Configurações Gerais
            </h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { label: "Nome da empresa", value: companyName, set: setCompanyName, placeholder: "Ex: DONNOS Docs" },
                { label: "Razão social", value: legalName, set: setLegalName, placeholder: "Ex: Bloco Imobiliária LTDA" },
                { label: "CNPJ", value: cnpj, set: setCnpj, placeholder: "00.000.000/0001-00" },
                { label: "Email principal", value: companyEmail, set: setCompanyEmail, placeholder: "contato@empresa.com.br", type: "email" },
                { label: "Telefone principal", value: companyPhone, set: setCompanyPhone, placeholder: "(61) 3000-0000" },
                { label: "Site institucional", value: companySite, set: setCompanySite, placeholder: "https://..." },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-lg border border-default bg-surface text-[14px] text-primary outline-none placeholder:text-muted"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IDENTIDADE */}
        {activeSection === "identidade" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <Image size={16} className="text-[var(--accent-primary)]" /> Identidade Visual
            </h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { label: "Logo principal (URL)", value: settings.logo_url || "", placeholder: "https://.../logo.png" },
                { label: "Logo reduzida (URL)", value: settings.logo_small_url || "", placeholder: "https://.../logo-small.png" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">{f.label}</label>
                  <input
                    value={f.value}
                    readOnly
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-lg border border-default bg-surface text-[14px] text-primary outline-none placeholder:text-muted"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex gap-5">
              <div className="w-[120px] h-[60px] rounded-lg border border-dashed border-default flex items-center justify-center text-[11px] text-muted">
                Prévia logo
              </div>
              <div className="w-[60px] h-[60px] rounded-lg border border-dashed border-default flex items-center justify-center text-[11px] text-muted">
                Ícone
              </div>
            </div>
          </div>
        )}

        {/* SMTP */}
        {activeSection === "smtp" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <Mail size={16} className="text-[var(--accent-primary)]" /> Configuração SMTP
            </h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { label: "SMTP Host", value: smtpHost, set: setSmtpHost, placeholder: "smtp.gmail.com" },
                { label: "SMTP Porta", value: smtpPort, set: setSmtpPort, placeholder: "587" },
                { label: "SMTP Usuário", value: smtpUser, set: setSmtpUser, placeholder: "email@gmail.com" },
                { label: "SMTP Senha", value: smtpPass, set: setSmtpPass, placeholder: "••••••••", type: "password" },
                { label: "Email Remetente (From)", value: smtpFromEmail, set: setSmtpFromEmail, placeholder: "noreply@donnos.com.br" },
                { label: "Nome do Remetente", value: smtpFromName, set: setSmtpFromName, placeholder: "DONNOS Docs" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-lg border border-default bg-surface text-[14px] text-primary outline-none placeholder:text-muted"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={testSmtp}
                disabled={testing || !smtpHost || !smtpUser}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border text-[13px] font-semibold transition-colors ${
                  testing || !smtpHost || !smtpUser
                    ? "border-default text-muted cursor-not-allowed"
                    : "border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-light)] cursor-pointer"
                }`}
              >
                {testing ? "Testando..." : "Testar SMTP"}
              </button>
              {testResult && (
                <div className="flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 size={14} color="#10B981" /> : <XCircle size={14} color="#EF4444" />}
                  <span className={`text-[12px] ${testResult.success ? "text-[#10B981]" : "text-[#EF4444]"}`}>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÓRGÃOS */}
        {activeSection === "orgaos" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <Shield size={16} className="text-[var(--accent-primary)]" /> Órgãos Integrados
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {organs.map(org => (
                <div key={org.id} className="rounded-[10px] bg-app p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      {statusIcon(org.status)}
                      <span className="text-[13px] font-semibold text-primary">{org.name}</span>
                    </div>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-[10px]"
                      style={{ color: statusColor(org.status), background: `${statusColor(org.status)}15` }}
                    >
                      {statusLabel(org.status)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mb-2.5">
                    <span className="text-[11px] text-muted">
                      Última verificação: {new Date(org.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {["online", "offline", "maintenance"].map(s => (
                      <button
                        key={s}
                        onClick={() => updateOrganStatus(org.id, s)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          org.status === s
                            ? "border border-[var(--accent-primary)] bg-[var(--accent-light)] text-[var(--accent-primary)]"
                            : "border border-default bg-transparent text-muted hover:text-secondary"
                        }`}
                      >
                        {s === "online" ? "Online" : s === "offline" ? "Off" : "Manut."}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEMPLATES */}
        {activeSection === "templates" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <FileText size={16} className="text-[var(--accent-primary)]" /> Templates de Certidões
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-default">
                  {["Nome", "Tipo", "Categoria", "Ordem", "Status"].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[11px] font-bold text-muted uppercase text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`cursor-pointer transition-colors hover:bg-[var(--bg-hover)] ${
                      i < templates.length - 1 ? "border-b border-default" : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-[13px] font-medium text-primary">{t.label}</td>
                    <td className="px-3.5 py-3 text-[12px] text-secondary">
                      {t.type === "pessoa_fisica" ? "PF" : t.type === "pessoa_juridica" ? "PJ" : t.type === "imovel" ? "Imóvel" : "Ambos"}
                    </td>
                    <td className="px-3.5 py-3 text-[12px] text-secondary">{t.category}</td>
                    <td className="px-3.5 py-3 text-[12px] text-secondary">{t.ordem}</td>
                    <td className="px-3.5 py-3">
                      <span className="text-[11px] font-medium text-[#10B981] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-[10px]">Ativo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AUDITORIA */}
        {activeSection === "auditoria" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <FileText size={16} className="text-[var(--accent-primary)]" /> Auditoria do Sistema
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-default">
                    {["Data", "Usuário", "Ação", "Módulo"].map(h => (
                      <th key={h} className="px-3.5 py-2.5 text-[11px] font-bold text-muted uppercase text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[12px] text-muted">Nenhum registro de auditoria.</td>
                    </tr>
                  ) : (
                    auditLog.map((log, i) => (
                      <tr key={log.id} className={i < auditLog.length - 1 ? "border-b border-default" : ""}>
                        <td className="px-3.5 py-2.5 text-[12px] text-secondary whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-3.5 py-2.5 text-[12px] text-primary">{log.user_name || "Sistema"}</td>
                        <td className="px-3.5 py-2.5 text-[12px] text-primary">{log.action}</td>
                        <td className="px-3.5 py-2.5 text-[12px] text-secondary">{log.module}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BACKUP */}
        {activeSection === "backup" && (
          <div className="bg-surface rounded-xl p-6 mb-[18px]">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-2 pb-2.5 mb-4 border-b border-default">
              <Database size={16} className="text-[var(--accent-primary)]" /> Backup
            </h3>
            <div className="flex gap-3 mb-4">
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-default bg-transparent text-secondary text-[13px] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                <Download size={14} /> Gerar Backup
              </button>
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-default bg-transparent text-secondary text-[13px] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                <Download size={14} /> Baixar Backup
              </button>
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-default bg-transparent text-secondary text-[13px] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                <Upload size={14} /> Restaurar Backup
              </button>
            </div>
            <div className="flex gap-8 text-[12px] text-secondary">
              <span>Último backup: <strong className="text-primary font-semibold">{backupInfo.lastBackupAt ? new Date(backupInfo.lastBackupAt).toLocaleString("pt-BR") : "Nunca"}</strong></span>
              <span>Tamanho: <strong className="text-primary font-semibold">{backupInfo.size || "0"} KB</strong></span>
              <span>
                Status:{" "}
                <span className={`font-semibold ${backupInfo.lastBackupAt ? "text-[#10B981]" : "text-muted"}`}>
                  {backupInfo.lastBackupAt ? "Atualizado" : "Nenhum"}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
