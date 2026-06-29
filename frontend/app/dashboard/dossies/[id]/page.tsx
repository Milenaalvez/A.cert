"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText, Clock, User, AlertCircle, ArrowLeft, Building2, ScrollText, Calendar,
  MapPin, Edit3, Printer, Archive, DollarSign, FileDown, X, Loader2, Check,
  Search, Unlink2, Link2, Plus, Repeat,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import DossierEditModal from "@/components/DossierEditModal";
import ConfirmModal from "@/components/ConfirmModal";

interface DossierDetail {
  id: string; identifier: string; status: string; priority: string; responsible: string;
  observation: string; createdAt: string; updatedAt: string;
  person: { id: string; name: string; cpf: string | null; rg: string | null; mother_name?: string; father_name?: string } | null;
  property: { identifier: string; type: string; address: string; registration: string | null } | null;
  personProperties: { id: string; identifier: string; registration: string; type: string; address: string; neighborhood: string; city: string; status: string }[];
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLinkProperty, setShowLinkProperty] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const token = localStorage.getItem("acert_token");
    fetch(`/api/dossiers/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error("Falha ao carregar"); return r.json(); })
      .then(setDossier).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const sc = STATUS_COLORS[dossier?.status || ""] || STATUS_COLORS["Pendente"];
  const scrollTo = (key: string) => { setActiveTab(key); const el = document.getElementById(key); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  async function linkProperty(propertyId: string) {
    if (!dossier) return;
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/dossiers/${dossier.id}/link-property`, {
        method: "PUT", headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }, body: JSON.stringify({ property_id: propertyId }),
      });
      if (!r.ok) throw new Error();
      setDossier(prev => {
        if (!prev) return prev;
        const prop = prev.personProperties.find(p => p.id === propertyId);
        if (!prop) return prev;
        return {
          ...prev,
          property: { identifier: prop.identifier, type: prop.type, address: prop.address, registration: prop.registration },
          personProperties: prev.personProperties.filter(p => p.id !== propertyId),
        };
      });
    } catch {}
  }

  if (loading) return <DashboardLayout><div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ background: "var(--bg-app)", minHeight: "100vh" }}><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] animate-spin" /></div></div></DashboardLayout>;
  if (error || !dossier) return <DashboardLayout><div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ background: "var(--bg-app)", minHeight: "100vh" }}><div className="flex flex-col items-center justify-center py-32 text-center"><AlertCircle size={32} className="text-secondary mb-3" /><span className="text-[15px] font-medium text-primary">Dossiê não encontrado</span><Link href="/dashboard/dossies" className="mt-3 flex items-center gap-1.5 h-9 px-4 bg-[#FF7A00] text-white text-[13px] font-medium"><ArrowLeft size={14} />Voltar para Dossiês</Link></div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full gap-8" style={{ background: "var(--bg-app)", minHeight: "100vh" }}>
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px]">
            <Link href="/dashboard/dossies" className="flex items-center gap-1 text-secondary hover:text-primary transition-colors"><ArrowLeft size={13} />Voltar</Link>
            <span className="text-secondary">/</span><Link href="/dashboard/dossies" className="text-secondary hover:text-primary">Dossiês</Link>
            <span className="text-secondary">/</span><span className="text-primary font-medium">{dossier.identifier}</span>
          </div>
          <div className="flex items-center gap-3" style={{ marginTop: 40 }}>
            <button onClick={() => setShowEditModal(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, padding: "0 24px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Edit3 size={15} strokeWidth={2.5} /> Editar dossiê
            </button>
            <button onClick={() => setShowGenerateModal(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, padding: "0 24px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <FileDown size={15} strokeWidth={2.5} /> Gerar dossiê
            </button>
            <button onClick={() => setShowArchiveConfirm(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, padding: "0 24px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Archive size={15} strokeWidth={2.5} /> Arquivar
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-surface p-6">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ background: sc.bg }}><FileText size={26} strokeWidth={1.5} style={{ color: sc.text }} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1"><h1 className="text-[26px] font-bold text-primary tracking-tight">Dossiê {dossier.identifier}</h1><span className="text-[12px] font-semibold px-3 py-1" style={{ background: sc.bg, color: sc.text }}>{dossier.status}</span></div>
                <div className="flex items-center gap-4 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5"><User size={13} className="text-secondary" />{dossier.responsible}</span>
                  <span className="text-secondary">·</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} className="text-secondary" />Criado {formatDate(dossier.createdAt)}</span>
                  <span className="text-secondary">·</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-secondary" />{timeAgo(dossier.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-default"><div className="flex items-center gap-14">{TABS.map(t => <button key={t.key} onClick={() => scrollTo(t.key)} className={`h-9 text-[13px] font-medium transition-colors -mb-px border-b-[3px] whitespace-nowrap ${activeTab === t.key ? "border-[#FF7A00] text-white" : "border-transparent text-secondary hover:text-white"}`}>{t.label}</button>)}</div></div>

        {/* Resumo */}
        <div id="resumo" className="bg-surface p-6">
          <div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#FF7A00" />Resumo do dossiê</div>
          <div className="flex" style={{ gap: 0 }}>
            <div style={{ flex: 1, paddingRight: "20px" }}>
              <span className="text-[11px] text-secondary uppercase font-semibold mb-1.5 block">Código</span>
              <span className="text-[16px] font-bold text-primary">{dossier.identifier}</span>
            </div>
            <div style={{ width: "1px", background: "var(--bg-elevated)", margin: "6px 0" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 20px" }}>
              <span className="text-[11px] text-secondary uppercase font-semibold mb-1.5 block">Situação</span>
              <span className="text-[12px] font-semibold px-3 py-1" style={{ background: sc.bg, color: sc.text }}>{dossier.status}</span>
            </div>
            <div style={{ width: "1px", background: "var(--bg-elevated)", margin: "6px 0" }} />
            <div style={{ flex: 1, padding: "0 20px" }}>
              <span className="text-[11px] text-secondary uppercase font-semibold mb-1.5 block">Prazo</span>
              <div className="flex items-center gap-2"><Calendar size={15} className="text-secondary" /><span className="text-[14px] font-semibold text-primary">{new Date(new Date(dossier.createdAt).getTime() + 15*86400000).toLocaleDateString("pt-BR")}</span></div>
              <span className="text-[10px] text-secondary mt-0.5 block">15 dias</span>
            </div>
            <div style={{ width: "1px", background: "var(--bg-elevated)", margin: "6px 0" }} />
            <div style={{ flex: 1.3, paddingLeft: "20px" }}>
              <span className="text-[11px] text-secondary uppercase font-semibold mb-1.5 block">Progresso</span>
              <span className="text-[12px] text-muted block mb-1">{dossier.certificatesObtidas}/{dossier.certificateCount} certidões</span>
              <div className="flex items-center gap-2">
                <div style={{ flex: 1, height: "5px", background: "var(--bg-elevated)" }}><div style={{ height: "5px", width: `${dossier.progress}%`, background: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }} /></div>
                <span className="text-[14px] font-bold" style={{ color: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }}>{dossier.progress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Three Panels */}
        <div className="grid grid-cols-3 gap-8">
          <div id="imoveis" className="bg-surface p-6">
            <div style={sectionTitle}><Building2 size={16} strokeWidth={2} color="#2563EB" />Informações do Imóvel</div>
            {dossier.property ? (
              <div className="flex flex-col gap-3">
                <div><span className="text-[10px] text-secondary uppercase tracking-wide font-semibold">Tipo</span><span className="text-[13px] text-primary block mt-0.5">{dossier.property.type}</span></div>
                {dossier.property.registration && <div><span className="text-[10px] text-secondary uppercase tracking-wide font-semibold">Matrícula</span><span className="text-[13px] text-primary block mt-0.5 font-mono">{dossier.property.registration}</span></div>}
                <div><span className="text-[10px] text-secondary uppercase tracking-wide font-semibold">Endereço</span><div className="flex items-start gap-1.5 mt-0.5"><MapPin size={13} className="text-secondary shrink-0 mt-0.5" /><span className="text-[13px] text-body leading-snug">{dossier.property.address}</span></div></div>
                <div style={{ height: "1px", background: "var(--border-light)", margin: "4px 0" }} />
                <button onClick={() => setShowLinkProperty(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 34, borderRadius: 6, border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                  <Repeat size={13} />
                  Trocar imóvel
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="text-[12px] text-secondary italic text-center py-4">Nenhum imóvel vinculado.</div>
                {dossier.person && (
                  <>
                    {dossier.personProperties.length > 0 && (
                      <div className="flex flex-col gap-2 mb-3">
                        <span className="text-[10px] text-secondary uppercase font-semibold">Imóveis do titular</span>
                        {dossier.personProperties.map(prop => (
                          <button key={prop.id} onClick={() => linkProperty(prop.id)}
                            className="flex items-center gap-2 p-2.5 w-full text-left"
                            style={{ borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)", cursor: "pointer" }}>
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] font-medium text-primary block">{prop.identifier}</span>
                              <span className="text-[10px] text-secondary">{prop.type} — {prop.address}</span>
                            </div>
                            <Link2 size={14} className="shrink-0 text-[#2563EB]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <button onClick={() => setShowLinkProperty(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 34, borderRadius: 6, border: "1px dashed var(--border-default)", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", width: "100%" }}>
                  <Plus size={14} />
                  Vincular imóvel
                </button>
              </div>
            )}
          </div>
          <div id="partes" className="bg-surface p-6">
            <div style={sectionTitle}><User size={16} strokeWidth={2} color="#FF7A00" />Partes Envolvidas</div>
            {dossier.person ? (<div className="flex flex-col gap-3">
              <div className="flex items-start justify-between"><div className="min-w-0 flex-1"><span className="text-[13px] font-semibold text-primary block">{dossier.person.name}</span><span className="text-[11px] text-secondary">Titular do dossiê</span></div><span className="text-[10px] font-semibold px-2 py-0.5 shrink-0" style={{ background: "rgba(5,150,105,0.15)", color: "#059669" }}>Completo</span></div>
              <div style={{ height: "1px", background: "var(--bg-elevated)" }} />
              <div className="flex flex-col gap-1.5">
                {dossier.person.cpf && <div className="flex items-center gap-2"><span className="text-[10px] text-secondary uppercase w-8">CPF</span><span className="text-[12px] text-primary">{dossier.person.cpf}</span></div>}
                {dossier.person.rg && <div className="flex items-center gap-2"><span className="text-[10px] text-secondary uppercase w-8">RG</span><span className="text-[12px] text-primary">{dossier.person.rg}</span></div>}
                <div className="flex items-center gap-2"><span className="text-[10px] text-secondary uppercase w-8">Status</span><div className="w-1.5 h-1.5" style={{ background: "#059669" }} /><span className="text-[12px] text-[#059669] font-medium">Documentação em dia</span></div>
              </div>
            </div>) : <div className="text-[12px] text-secondary italic text-center py-6">Nenhuma parte vinculada.</div>}
          </div>
          <div id="atividades" className="bg-surface p-6">
            <div style={sectionTitle}><ScrollText size={16} strokeWidth={2} color="#7C3AED" />Atividades Recentes</div>
            {dossier.activities.length === 0 ? <div className="text-[12px] text-secondary italic text-center py-6">Nenhuma atividade.</div> : (
              <div className="flex flex-col">{dossier.activities.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5" style={{ borderTop: i > 0 ? "1px solid var(--border-default)" : "none" }}>
                  <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--bg-elevated)" }}><ScrollText size={12} className="text-secondary" /></div>
                  <div className="min-w-0 flex-1"><div className="text-[12px] text-body leading-snug line-clamp-2">{a.action}</div>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-secondary">{a.user_name}</span><span className="text-[10px] text-secondary">·</span><span className="text-[10px] text-secondary">{timeAgo(a.created_at)}</span></div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>

        {/* Certidões */}
        <div id="certidoes" className="bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#FF7A00" />Certidões</div>
            <span className="text-[12px] text-secondary">{dossier.certificateCount} certidão{dossier.certificateCount !== 1 ? "ões" : ""}</span>
          </div>
          <div className="flex flex-col gap-3">
            {dossier.certificates.map((cert) => {
              const isObtida = cert.status === "Obtida";
              return (
                <div key={cert.id} className="flex items-center justify-between p-3" style={{ background: "var(--bg-app)" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 shrink-0" style={{ background: isObtida ? "#059669" : "#DC2626" }} />
                    <div className="min-w-0"><span className="text-[13px] font-semibold text-primary block leading-snug">{cert.name}</span><span className="text-[11px] text-secondary">{cert.organ}</span></div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 shrink-0" style={{ background: isObtida ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)", color: isObtida ? "#059669" : "#DC2626" }}>
                    {isObtida ? `Obtida ${cert.obtained_at ? new Date(cert.obtained_at).toLocaleDateString("pt-BR") : ""}` : "Pendente"}
                  </span>
                </div>
              );
            })}
          </div>
          {dossier.certificateCount === 0 && <div className="text-[12px] text-secondary italic text-center py-6">Nenhuma certidão vinculada.</div>}
        </div>

        {/* Documentos */}
        <div id="documentos" className="bg-surface p-6"><div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#7C3AED" />Documentos</div><div className="text-[12px] text-secondary italic text-center py-8">Nenhum documento anexado.</div></div>

        {/* Financeiro */}
        <div id="financeiro" className="bg-surface p-6"><div style={sectionTitle}><DollarSign size={16} strokeWidth={2} color="#059669" />Financeiro</div><div className="text-[12px] text-secondary italic text-center py-8">Nenhuma informação financeira registrada.</div></div>
      </div>

      {showEditModal && dossier && (
        <DossierEditModal
          dossier={dossier}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setDossier(prev => prev ? { ...prev, status: updated.status, priority: updated.priority, responsible: updated.responsible, observation: updated.observation || "" } : prev);
            setShowEditModal(false);
          }}
        />
      )}

      <ConfirmModal
        open={showArchiveConfirm}
        title="Arquivar dossiê"
        message={`Tem certeza que deseja arquivar o dossiê ${dossier?.identifier}? Ele ficará inativo e poderá ser restaurado depois.`}
        confirmLabel="Sim, Arquivar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={async () => {
          if (!dossier) return;
          try {
            const token = localStorage.getItem("acert_token");
            await fetch(`/api/dossiers/${dossier.id}`, {
              method: "PUT", headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              }, body: JSON.stringify({ status: "Cancelado" }),
            });
            setDossier(prev => prev ? { ...prev, status: "Cancelado" } : prev);
          } catch {}
          setShowArchiveConfirm(false);
        }}
        onCancel={() => setShowArchiveConfirm(false)}
        onClose={() => setShowArchiveConfirm(false)}
      />

      {showGenerateModal && dossier && (
        <GenerateDossierModal
          dossier={dossier}
          onClose={() => setShowGenerateModal(false)}
        />
      )}

      {showLinkProperty && dossier && (
        <VincularImovelModal
          dossierId={dossier.id}
          onClose={() => setShowLinkProperty(false)}
          onLinked={(prop) => {
            setDossier(prev => prev ? { ...prev, property: prop, personProperties: prev.personProperties.filter(p => p.id !== prop.id) } : prev);
            setShowLinkProperty(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function VincularImovelModal({ dossierId, onClose, onLinked }: {
  dossierId: string;
  onClose: () => void;
  onLinked: (property: { id: string; identifier: string; type: string; address: string; registration: string | null }) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async () => {
    if (!search.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/properties/search?q=${encodeURIComponent(search.trim())}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await r.json();
      setResults(d.properties || []);
    } catch {} finally { setSearching(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  async function linkProp(propertyId: string) {
    setLinking(true); setError("");
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/dossiers/${dossierId}/link-property`, {
        method: "PUT", headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }, body: JSON.stringify({ property_id: propertyId }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Erro ao vincular"); return; }
      const prop = results.find(p => p.id === propertyId);
      if (prop) onLinked({ id: prop.id, identifier: prop.identifier, type: prop.type, address: prop.address, registration: prop.registration });
      else onClose();
    } catch { setError("Erro ao vincular"); } finally { setLinking(false); }
  }

  const labelS2: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px" };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxWidth: "520px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center shrink-0" style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(37,99,235,0.12)" }}>
                <Building2 size={20} strokeWidth={1.5} color="#2563EB" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Vincular Imóvel</h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  Busque e vincule um imóvel a este dossiê
                </p>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
            {error && <div className="text-[12px] text-red-500 mb-3 p-2" style={{ background: "rgba(220,38,38,0.1)", borderRadius: 6 }}>{error}</div>}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelS2}>Buscar imóvel</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, matrícula ou endereço..."
                  style={{ height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1px solid var(--border-default)", padding: "0 12px 0 34px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>
            {searching ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} /></div>
            ) : results.length > 0 ? (
              <div className="flex flex-col gap-2">
                {results.map(prop => (
                  <div key={prop.id} className="flex items-center justify-between p-3" style={{ borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)" }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-primary block">{prop.identifier}</span>
                      <span className="text-[11px] text-secondary">{prop.type} — {prop.address}{prop.registration ? ` · Mat. ${prop.registration}` : ""}</span>
                    </div>
                    <button onClick={() => linkProp(prop.id)} disabled={linking}
                      style={{ height: "32px", padding: "0 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#FFF", fontSize: 12, fontWeight: 600, cursor: linking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                      {linking ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                      Vincular
                    </button>
                  </div>
                ))}
              </div>
            ) : search.trim() ? (
              <div className="text-[12px] text-secondary italic text-center py-8">Nenhum imóvel encontrado.</div>
            ) : null}
          </div>
          <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
            <button onClick={onClose}
              style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function GenerateDossierModal({ dossier, onClose }: { dossier: DossierDetail; onClose: () => void }) {
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const pendingCerts = dossier.certificates.filter(c => c.status === "Pendente");

  function toggleCert(id: string) {
    setSelectedCerts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/dossiers/${dossier.id}/generate`, {
        method: "POST", headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }, body: JSON.stringify({ certificateIds: selectedCerts.length > 0 ? selectedCerts : undefined }),
      });
      if (!r.ok) throw new Error("Erro ao gerar dossiê");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossie_${dossier.identifier.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(onClose, 1500);
    } catch {} finally { setGenerating(false); }
  }

  const labelS: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px" };
  const inputS: React.CSSProperties = { height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1px solid var(--border-default)", padding: "0 12px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxWidth: "520px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center shrink-0" style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--badge-orange-bg)" }}>
                <FileDown size={20} strokeWidth={1.5} color="#FF7A00" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Gerar Dossiê</h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  Selecione as certidões para incluir no dossiê
                </p>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
            {done ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.15)" }}>
                  <Check size={28} strokeWidth={2} color="#059669" />
                </div>
                <span className="text-[15px] font-semibold" style={{ color: "#059669" }}>Dossiê gerado com sucesso!</span>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelS}>Certidões disponíveis</label>
                  {dossier.certificates.length === 0 ? (
                    <div className="text-[12px] text-secondary italic text-center py-8">Nenhuma certidão vinculada.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dossier.certificates.map(cert => {
                        const sel = selectedCerts.includes(cert.id);
                        return (
                          <button key={cert.id} onClick={() => toggleCert(cert.id)}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", border: sel ? "2px solid #FF7A00" : "1px solid var(--border-light)", background: sel ? "rgba(255,122,0,0.06)" : "transparent", cursor: "pointer", transition: "all 0.15s ease", textAlign: "left" }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "6px", border: sel ? "none" : "2px solid var(--border-default)", background: sel ? "#FF7A00" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {sel && <Check size={13} strokeWidth={3} color="#FFF" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium block" style={{ color: "var(--text-primary)" }}>{cert.name}</span>
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{cert.organ}</span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 shrink-0" style={{ background: cert.status === "Obtida" ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)", color: cert.status === "Obtida" ? "#059669" : "#DC2626" }}>
                              {cert.status === "Obtida" ? "Obtida" : "Pendente"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {pendingCerts.length > 0 && (
                  <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(255,122,0,0.08)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    <AlertCircle size={13} className="inline mr-1.5" color="#FF7A00" />
                    {pendingCerts.length} certidão{pendingCerts.length !== 1 ? "ões" : ""} pendente{pendingCerts.length !== 1 ? "s" : ""}. Certidões pendentes serão emitidas antes da geração.
                  </div>
                )}
              </>
            )}
          </div>
          {!done && (
            <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={onClose}
                  style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={handleGenerate} disabled={generating}
                  style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: generating ? "not-allowed" : "pointer", background: generating ? "var(--text-muted)" : "#FF7A00", display: "flex", alignItems: "center", gap: "6px" }}>
                  {generating && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
                  {generating ? "Gerando..." : "Gerar Dossiê"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
