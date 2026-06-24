"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText, Clock, User, AlertCircle, ArrowLeft, Building2, ScrollText, Calendar,
  MapPin, Plus, AlertTriangle, Copy, CheckCheck, Edit3, Printer, Archive, DollarSign, Check,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface DossierDetail {
  id: string; identifier: string; status: string; priority: string; responsible: string;
  observation: string; createdAt: string; updatedAt: string;
  person: { id: string; name: string; cpf: string | null; rg: string | null; mother_name?: string; father_name?: string } | null;
  property: { identifier: string; type: string; address: string; registration: string | null } | null;
  certificateCount: number; certificatesObtidas: number; certificatesPendentes: number; progress: number;
  certificates: { id: string; name: string; organ: string; status: string; protocol: string | null; obtained_at: string | null; created_at: string }[];
  activities: { user_name: string; action: string; reference: string | null; created_at: string }[];
}

const sectionTitle = { fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 } as React.CSSProperties;
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Concluído: { bg: "rgba(5,150,105,0.18)", text: "#059669", dot: "#059669" },
  Pendente: { bg: "rgba(220,38,38,0.18)", text: "#DC2626", dot: "#DC2626" },
  Cancelado: { bg: "rgba(220,38,38,0.18)", text: "#DC2626", dot: "#DC2626" },
};
function timeAgo(d: string) { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return "Agora mesmo"; if (m < 60) return `Há ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `Há ${h} h`; const dd = Math.floor(h / 24); if (dd < 30) return `Há ${dd} dia${dd > 1 ? "s" : ""}`; return new Date(d).toLocaleDateString("pt-BR"); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); }

const TABS = [
  { key: "resumo", label: "Resumo" }, { key: "certidoes", label: "Certidões" },
  { key: "partes", label: "Partes Envolvidas" }, { key: "imoveis", label: "Imóveis" },
  { key: "documentos", label: "Documentos" }, { key: "atividades", label: "Atividades" },
  { key: "financeiro", label: "Financeiro" },
];

export default function DossierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resumo");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const token = localStorage.getItem("acert_token");
    fetch(`http://localhost:3001/api/dossiers/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error("Falha ao carregar"); return r.json(); })
      .then(setDossier).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const sc = STATUS_COLORS[dossier?.status || ""] || STATUS_COLORS["Pendente"];
  const scrollTo = (key: string) => { setActiveTab(key); const el = document.getElementById(key); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  if (loading) return <DashboardLayout><div className="flex flex-col px-16 pt-12 pb-24 w-full"><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div></div></DashboardLayout>;
  if (error || !dossier) return <DashboardLayout><div className="flex flex-col px-16 pt-12 pb-24 w-full"><div className="flex flex-col items-center justify-center py-32 text-center"><AlertCircle size={32} className="text-muted mb-3" /><span className="text-[15px] font-medium text-primary">Dossiê não encontrado</span><Link href="/dashboard/dossies" className="mt-3 flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-medium"><ArrowLeft size={14} />Voltar para Dossiês</Link></div></div></DashboardLayout>;

  const certObtidas = dossier.certificatesObtidas;
  const certPendentes = dossier.certificatesPendentes;
  const certTotal = dossier.certificateCount;
  const deadline = new Date(dossier.createdAt); deadline.setDate(deadline.getDate() + 15);

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full gap-8">
        {/* Topbar */}
        <div className="flex items-center justify-between" style={{ marginTop: "40px" }}>
          <div className="flex items-center gap-2 text-[11px]">
            <Link href="/dashboard/dossies" className="flex items-center gap-1 text-muted hover:text-body transition-colors"><ArrowLeft size={13} />Voltar</Link>
            <span className="text-muted">/</span><Link href="/dashboard/dossies" className="text-muted hover:text-body">Dossiês</Link>
            <span className="text-muted">/</span><span className="text-primary font-medium">{dossier.identifier}</span>
          </div>
          <div className="flex items-center gap-3">
            {["Editar dossiê","Imprimir PDF","Arquivar"].map((label, i) => (
              <button key={i} className="flex items-center gap-1.5 h-9 px-5 rounded-lg text-[11px] font-medium transition-all duration-300 border border-default text-secondary hover:bg-[rgba(255,122,0,0.1)] hover:text-[#FF7A00] hover:border-[rgba(255,122,0,0.4)]" style={{ backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,122,0,0.08)"; e.currentTarget.style.color = "#FF7A00"; e.currentTarget.style.borderColor = "rgba(255,122,0,0.35)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(255,122,0,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}>
                {i === 0 ? <Edit3 size={13} /> : i === 1 ? <Printer size={13} /> : <Archive size={13} />}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="bg-surface rounded-[14px] p-6">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0" style={{ background: sc.bg }}><FileText size={26} strokeWidth={1.5} style={{ color: sc.text }} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1"><h1 className="text-[26px] font-bold text-primary tracking-tight">Dossiê {dossier.identifier}</h1><span className="text-[12px] font-semibold px-3 py-1 rounded-[4px]" style={{ background: sc.bg, color: sc.text }}>{dossier.status}</span></div>
                <div className="flex items-center gap-4 text-[13px] text-secondary">
                  <span className="flex items-center gap-1.5"><User size={13} className="text-muted" />{dossier.responsible}</span>
                  <span className="text-muted">·</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} className="text-muted" />Criado {formatDate(dossier.createdAt)}</span>
                  <span className="text-muted">·</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-muted" />{timeAgo(dossier.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-default"><div className="flex items-center gap-14">{TABS.map(t => <button key={t.key} onClick={() => scrollTo(t.key)} className={`h-9 text-[13px] font-medium transition-colors -mb-px border-b-[3px] whitespace-nowrap ${activeTab === t.key ? "border-[#FF7A00] text-primary" : "border-transparent text-secondary hover:text-body"}`}>{t.label}</button>)}</div></div>

        {/* Resumo */}
        <div id="resumo" className="bg-surface rounded-[14px] p-6">
          <div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#FF7A00" />Resumo do dossiê</div>
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <div style={{ flex: 1, paddingRight: "20px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px", display: "block" }}>Código</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{dossier.identifier}</span>
                <button onClick={() => { navigator.clipboard.writeText(dossier.identifier); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer" }}>{copied ? <CheckCheck size={13} strokeWidth={1.5} style={{ color: "#059669" }} /> : <Copy size={13} style={{ color: "var(--text-muted)" }} />}</button>
              </div>
            </div>
            <div style={{ width: "1px", background: "var(--border-default)", margin: "6px 0" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 20px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px", display: "block" }}>Situação</span>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "4px", background: sc.bg, color: sc.text }}>{dossier.status}</span>
            </div>
            <div style={{ width: "1px", background: "var(--border-default)", margin: "6px 0" }} />
            <div style={{ flex: 1, padding: "0 20px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px", display: "block" }}>Prazo</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={15} style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-body)" }}>{deadline.toLocaleDateString("pt-BR")}</span></div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>15 dias</span>
            </div>
            <div style={{ width: "1px", background: "var(--border-default)", margin: "6px 0" }} />
            <div style={{ flex: 1.3, paddingLeft: "20px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px", display: "block" }}>Progresso</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>{certObtidas}/{certTotal} certidões</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: "230px", height: "5px", borderRadius: "9999px", background: "var(--border-default)" }}><div style={{ height: "5px", borderRadius: "9999px", width: `${dossier.progress}%`, background: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }} /></div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }}>{dossier.progress}%</span>
              </div>
            </div>
            <div style={{ width: "1px", background: "var(--border-default)", margin: "6px 0" }} />
            <div style={{ flex: 1.1, paddingLeft: "20px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "8px", display: "block" }}>Status do dossiê</span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <svg viewBox="0 0 200 200" style={{ width: "100px", height: "100px", flexShrink: 0 }}>
                  <circle cx="100" cy="100" r="78" fill="none" stroke="var(--border-default)" strokeWidth="30" />
                  <circle cx="100" cy="100" r="78" fill="none" stroke={dossier.status === "Concluído" ? "#059669" : dossier.status === "Pendente" ? "#7C3AED" : "#6B7280"} strokeWidth="30" strokeDasharray={`${(dossier.progress / 100) * 490.1} 490.1`} strokeLinecap="round" transform="rotate(-90 100 100)" />
                  <text x="100" y="94" textAnchor="middle" fill="var(--text-primary)" fontSize="19" fontFamily="monospace" fontWeight="800">{dossier.progress}%</text>
                  <text x="100" y="114" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="500">{dossier.status}</text>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["#7C3AED","#D97706","#059669"].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }} />
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{["Pendente","Andamento","Concluído"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Panels */}
        <div className="grid grid-cols-3 gap-8">
          <div id="imoveis" className="bg-surface rounded-[14px] p-6">
            <div style={sectionTitle}><Building2 size={16} strokeWidth={2} color="#2563EB" />Informações do Imóvel</div>
            {dossier.property ? (<div className="flex flex-col gap-3">
              <div><span className="text-[10px] text-muted uppercase tracking-wide font-semibold">Tipo</span><span className="text-[13px] text-body block mt-0.5">{dossier.property.type}</span></div>
              {dossier.property.registration && <div><span className="text-[10px] text-muted uppercase tracking-wide font-semibold">Matrícula</span><span className="text-[13px] text-body block mt-0.5 font-mono">{dossier.property.registration}</span></div>}
              <div><span className="text-[10px] text-muted uppercase tracking-wide font-semibold">Endereço</span><div className="flex items-start gap-1.5 mt-0.5"><MapPin size={13} className="text-muted shrink-0 mt-0.5" /><span className="text-[13px] text-body leading-snug">{dossier.property.address}</span></div></div>
            </div>) : <div className="text-[12px] text-muted italic text-center py-6">Nenhum imóvel vinculado.</div>}
          </div>
          <div id="partes" className="bg-surface rounded-[14px] p-6">
            <div style={sectionTitle}><User size={16} strokeWidth={2} color="#FF7A00" />Partes Envolvidas</div>
            {dossier.person ? (<div className="flex flex-col gap-3">
              <div className="flex items-start justify-between"><div className="min-w-0 flex-1"><span className="text-[13px] font-semibold text-body block">{dossier.person.name}</span><span className="text-[11px] text-muted">Titular do dossiê</span></div><span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] shrink-0" style={{ background: "var(--badge-green-bg)", color: "#059669" }}>Completo</span></div>
              <div style={{ height: "1px", background: "var(--border-light)" }} />
              <div className="flex flex-col gap-1.5">
                {dossier.person.cpf && <div className="flex items-center gap-2"><span className="text-[10px] text-muted uppercase w-8">CPF</span><span className="text-[12px] text-body">{dossier.person.cpf}</span></div>}
                {dossier.person.rg && <div className="flex items-center gap-2"><span className="text-[10px] text-muted uppercase w-8">RG</span><span className="text-[12px] text-body">{dossier.person.rg}</span></div>}
                <div className="flex items-center gap-2"><span className="text-[10px] text-muted uppercase w-8">Status</span><div className="w-1.5 h-1.5 rounded-full" style={{ background: "#059669" }} /><span className="text-[12px] text-[#059669] font-medium">Documentação em dia</span></div>
              </div>
            </div>) : <div className="text-[12px] text-muted italic text-center py-6">Nenhuma parte vinculada.</div>}
          </div>
          <div id="atividades" className="bg-surface rounded-[14px] p-6">
            <div style={sectionTitle}><ScrollText size={16} strokeWidth={2} color="#7C3AED" />Atividades Recentes</div>
            {dossier.activities.length === 0 ? <div className="text-[12px] text-muted italic text-center py-6">Nenhuma atividade.</div> : (
              <div className="flex flex-col">{dossier.activities.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5" style={{ borderTop: i > 0 ? "1px solid var(--border-light)" : "none" }}>
                  <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--border-default)" }}><ScrollText size={12} className="text-muted" /></div>
                  <div className="min-w-0 flex-1"><div className="text-[12px] text-body leading-snug line-clamp-2">{a.action}</div>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-muted">{a.user_name}</span><span className="text-[10px] text-muted">·</span><span className="text-[10px] text-muted">{timeAgo(a.created_at)}</span></div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>

        {/* Certidões */}
        <div id="certidoes" className="bg-surface rounded-[14px] p-6">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#FF7A00" />Certidões</div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{certTotal} certidão{certTotal !== 1 ? "ões" : ""}</span>
          </div>
          {certTotal > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border-default)", display: "flex", overflow: "hidden" }}><div style={{ height: 6, width: `${dossier.progress}%`, background: "#059669", borderRadius: dossier.progress < 100 ? "3px 0 0 3px" : "3px" }} /></div>
                <span style={{ fontSize: 14, fontWeight: 700, color: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626", whiteSpace: "nowrap" }}>{dossier.progress}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingLeft: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /><span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Obtidas</span><span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>{certObtidas}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} /><span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Pendentes</span><span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>{certPendentes}</span></div>
              </div>
            </div>
          ) : <div className="text-[12px] text-muted italic text-center py-6">Nenhuma certidão vinculada.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dossier.certificates.map((cert) => {
              const isObtida = cert.status === "Obtida";
              return (
                <div key={cert.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: isObtida ? "#059669" : "#DC2626" }} />
                    <div style={{ minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}>{cert.name}</span><span style={{ fontSize: 11, color: "var(--text-muted)" }}>{cert.organ}</span></div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: isObtida ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)", color: isObtida ? "#059669" : "#DC2626", whiteSpace: "nowrap" }}>{isObtida ? `Obtida ${cert.obtained_at ? new Date(cert.obtained_at).toLocaleDateString("pt-BR") : ""}` : "Pendente"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documentos */}
        <div id="documentos" className="bg-surface rounded-[14px] p-6"><div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#7C3AED" />Documentos</div><div className="text-[12px] text-muted italic text-center py-8">Nenhum documento anexado.</div></div>

        {/* Financeiro */}
        <div id="financeiro" className="bg-surface rounded-[14px] p-6"><div style={sectionTitle}><DollarSign size={16} strokeWidth={2} color="#059669" />Financeiro</div><div className="text-[12px] text-muted italic text-center py-8">Nenhuma informação financeira registrada.</div></div>
      </div>
    </DashboardLayout>
  );
}
