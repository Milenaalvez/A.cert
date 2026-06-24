"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, Mail, Building2, Image, Shield, FileText, Database,
  Download, Upload, CheckCircle2, XCircle, AlertTriangle, Clock, Plus, Edit, Eye,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

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
    // Organ status is managed via the organs table directly
    const token = localStorage.getItem("acert_token");
    await fetch(`${apiBase}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ [`organ_${id}_status`]: status }),
    });
    fetchAll();
  }

  const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 };
  const SECTION_S: React.CSSProperties = { border: "1px solid var(--border-default)", borderRadius: 12, background: "var(--bg-app)", padding: "22px 24px", marginBottom: 18 };
  const SECT_T: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", gap: 8 };

  const statusIcon = (s: string) => {
    if (s === "online") return <CheckCircle2 size={14} color="#10B981" />;
    if (s === "unstable") return <AlertTriangle size={14} color="#F59E0B" />;
    if (s === "maintenance") return <Clock size={14} color="#3B82F6" />;
    return <XCircle size={14} color="#EF4444" />;
  };
  const statusLabel = (s: string) => s === "online" ? "Online" : s === "unstable" ? "Instável" : s === "maintenance" ? "Manutenção" : "Offline";
  const statusColor = (s: string) => s === "online" ? "#10B981" : s === "unstable" ? "#F59E0B" : s === "maintenance" ? "#3B82F6" : "#EF4444";

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 64px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,122,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={22} color="#FF7A00" strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Configurações</h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>Gerencie as configurações globais do sistema.</p>
            </div>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 8, border: "none", background: saved ? "#10B981" : saving ? "rgba(255,122,0,0.5)" : "#FF7A00", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
          >
            <Save size={14} /> {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "geral", label: "Geral", icon: Building2 },
            { key: "identidade", label: "Identidade Visual", icon: Image },
            { key: "smtp", label: "SMTP", icon: Mail },
            { key: "orgaos", label: "Órgãos Integrados", icon: Shield },
            { key: "templates", label: "Templates", icon: FileText },
            { key: "auditoria", label: "Auditoria", icon: FileText },
            { key: "backup", label: "Backup", icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveSection(tab.key)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                border: activeSection === tab.key ? "1px solid #FF7A00" : "1px solid var(--border-default)",
                background: activeSection === tab.key ? "rgba(255,122,0,0.08)" : "var(--bg-app)",
                color: activeSection === tab.key ? "#FF7A00" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}><Icon size={14} /> {tab.label}</button>
            );
          })}
        </div>

        {/* GERAL */}
        {activeSection === "geral" && (
          <div style={SECTION_S}>
            <h3 style={SECT_T}><Building2 size={16} color="#FF7A00" /> Configurações Gerais</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Nome da empresa", value: companyName, set: setCompanyName, placeholder: "Ex: DONNOS Docs" },
                { label: "Razão social", value: legalName, set: setLegalName, placeholder: "Ex: Bloco Imobiliária LTDA" },
                { label: "CNPJ", value: cnpj, set: setCnpj, placeholder: "00.000.000/0001-00" },
                { label: "Email principal", value: companyEmail, set: setCompanyEmail, placeholder: "contato@empresa.com.br", type: "email" },
                { label: "Telefone principal", value: companyPhone, set: setCompanyPhone, placeholder: "(61) 3000-0000" },
                { label: "Site institucional", value: companySite, set: setCompanySite, placeholder: "https://..." },
              ].map((f, i) => (
                <div key={i}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type || "text"} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IDENTIDADE */}
        {activeSection === "identidade" && (
          <div style={SECTION_S}>
            <h3 style={SECT_T}><Image size={16} color="#FF7A00" /> Identidade Visual</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Logo principal (URL)", value: settings.logo_url || "", placeholder: "https://.../logo.png" },
                { label: "Logo reduzida (URL)", value: settings.logo_small_url || "", placeholder: "https://.../logo-small.png" },
              ].map((f, i) => (
                <div key={i}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={f.value} readOnly placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
              <div style={{ width: 120, height: 60, borderRadius: 8, border: "1px dashed var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-tertiary)" }}>
                Prévia logo
              </div>
              <div style={{ width: 60, height: 60, borderRadius: 8, border: "1px dashed var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-tertiary)" }}>
                Ícone
              </div>
            </div>
          </div>
        )}

        {/* SMTP */}
        {activeSection === "smtp" && (
          <div style={SECTION_S}>
            <h3 style={SECT_T}><Mail size={16} color="#FF7A00" /> Configuração SMTP</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "SMTP Host", value: smtpHost, set: setSmtpHost, placeholder: "smtp.gmail.com" },
                { label: "SMTP Porta", value: smtpPort, set: setSmtpPort, placeholder: "587" },
                { label: "SMTP Usuário", value: smtpUser, set: setSmtpUser, placeholder: "email@gmail.com" },
                { label: "SMTP Senha", value: smtpPass, set: setSmtpPass, placeholder: "••••••••", type: "password" },
                { label: "Email Remetente (From)", value: smtpFromEmail, set: setSmtpFromEmail, placeholder: "noreply@donnos.com.br" },
                { label: "Nome do Remetente", value: smtpFromName, set: setSmtpFromName, placeholder: "DONNOS Docs" },
              ].map((f, i) => (
                <div key={i}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type || "text"} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={testSmtp}
                disabled={testing || !smtpHost || !smtpUser}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #FF7A00", background: "transparent", color: testing ? "var(--text-tertiary)" : "#FF7A00", fontSize: 13, fontWeight: 600, cursor: testing ? "not-allowed" : "pointer" }}
              >
                {testing ? "Testando..." : "Testar SMTP"}
              </button>
              {testResult && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {testResult.success ? <CheckCircle2 size={14} color="#10B981" /> : <XCircle size={14} color="#EF4444" />}
                  <span style={{ fontSize: 12, color: testResult.success ? "#10B981" : "#EF4444" }}>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÓRGÃOS */}
        {activeSection === "orgaos" && (
          <div style={SECTION_S}>
            <h3 style={SECT_T}><Shield size={16} color="#FF7A00" /> Órgãos Integrados</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {organs.map(org => (
                <div key={org.id} style={{ border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-app)", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {statusIcon(org.status)}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{org.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: statusColor(org.status), background: `${statusColor(org.status)}15`, padding: "2px 8px", borderRadius: 10 }}>{statusLabel(org.status)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Última verificação: {new Date(org.updated_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["online", "offline", "maintenance"].map(s => (
                      <button
                        key={s}
                        onClick={() => updateOrganStatus(org.id, s)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, border: org.status === s ? "1px solid #FF7A00" : "1px solid var(--border-default)",
                          background: org.status === s ? "rgba(255,122,0,0.1)" : "transparent",
                          color: org.status === s ? "#FF7A00" : "var(--text-tertiary)", fontSize: 11, fontWeight: 500, cursor: "pointer",
                        }}
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
          <div style={SECTION_S}>
            <h3 style={SECT_T}><FileText size={16} color="#FF7A00" /> Templates de Certidões</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  {["Nome", "Tipo", "Categoria", "Ordem", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < templates.length - 1 ? "1px solid var(--border-default)" : "none", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{t.label}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{t.type === "pessoa_fisica" ? "PF" : t.type === "pessoa_juridica" ? "PJ" : t.type === "imovel" ? "Imóvel" : "Ambos"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{t.category}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{t.ordem}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 10 }}>Ativo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AUDITORIA */}
        {activeSection === "auditoria" && (
          <div style={SECTION_S}>
            <h3 style={SECT_T}><FileText size={16} color="#FF7A00" /> Auditoria do Sistema</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                    {["Data", "Usuário", "Ação", "Módulo"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-tertiary)" }}>Nenhum registro de auditoria.</td></tr>
                  ) : (
                    auditLog.map((log, i) => (
                      <tr key={log.id} style={{ borderBottom: i < auditLog.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-primary)" }}>{log.user_name || "Sistema"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-primary)" }}>{log.action}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{log.module}</td>
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
          <div style={SECTION_S}>
            <h3 style={SECT_T}><Database size={16} color="#FF7A00" /> Backup</h3>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Download size={14} /> Gerar Backup
              </button>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Upload size={14} /> Restaurar Backup
              </button>
            </div>
            <div style={{ display: "flex", gap: 32, fontSize: 12, color: "var(--text-secondary)" }}>
              <span>Último backup: <strong>{backupInfo.lastBackupAt ? new Date(backupInfo.lastBackupAt).toLocaleString("pt-BR") : "Nunca"}</strong></span>
              <span>Tamanho: <strong>{backupInfo.size || "0"} KB</strong></span>
              <span>Status: <span style={{ color: backupInfo.lastBackupAt ? "#10B981" : "var(--text-tertiary)", fontWeight: 600 }}>{backupInfo.lastBackupAt ? "Atualizado" : "Nenhum"}</span></span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
