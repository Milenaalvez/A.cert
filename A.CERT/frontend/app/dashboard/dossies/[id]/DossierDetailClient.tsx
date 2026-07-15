"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Clock, User, AlertCircle, ArrowLeft, Building2, ScrollText, Calendar,
  Edit3, Archive, FileDown, Download, X, Loader2, Check,
  Search, Link2, Plus, Users, ChevronUp, ChevronDown, Trash2, Upload,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import DossierEditModal from "@/components/DossierEditModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useT } from "@/i18n/useT";
import { useSettings } from "@/contexts/SettingsContext";

interface DossierDetail {
  id: string; identifier: string; status: string; priority: string; responsible: string;
  observation: string; createdAt: string; updatedAt: string; transactionType?: string;
  person: { id: string; name: string; cpf: string | null; rg: string | null; mother_name?: string; father_name?: string } | null;
  property: { identifier: string; type: string; address: string; registration: string | null; cartorio?: string } | null;
  personProperties: { id: string; identifier: string; registration: string; type: string; address: string; neighborhood: string; city: string; status: string }[];
  participants?: { id: string; name: string; cpf: string | null; role: string; certTotal: number; certObtidas: number }[];
  certificateCount: number; certificatesObtidas: number; certificatesPendentes: number; progress: number;
  certificates: { id: string; name: string; organ: string; status: string; protocol: string | null; obtained_at: string | null; created_at: string; document_path?: string; person_id?: string; sort_order?: number }[];
  activities: { user_name: string; action: string; reference: string | null; created_at: string }[];
  documents: { id: string; dossier_id: string; person_id: string | null; name: string; label: string; file_path: string; file_type: string; file_size: number; uploaded_at: string; description?: string; sort_order?: number; uploaded_by?: string }[];
  observations: { id: string; dossier_id: string; user_id: string | null; user_name: string; text: string; created_at: string }[];
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
  { key: "resumo", label: "Resumo" },
  { key: "partes", label: "Partes Envolvidas" },
  { key: "atividades", label: "Atividades" },
];

export default function DossierDetailClient() {
  const { t } = useT();
  const { settings } = useSettings();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deadlineDays = parseInt(settings.dossier_deadline || "30", 10);
  const searchParams = useSearchParams();
  const emitir = searchParams.get("emitir") === "true";
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(emitir ? "partes" : "resumo");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLinkProperty, setShowLinkProperty] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docPersonId, setDocPersonId] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [certUploading, setCertUploading] = useState<string | null>(null);
  const [showCertPicker, setShowCertPicker] = useState<string | null>(null);
  const [certTemplates, setCertTemplates] = useState<any[]>([]);
  const [addingCert, setAddingCert] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [selectedCertKey, setSelectedCertKey] = useState<string>("");
  const [obsText, setObsText] = useState("");
  const [obsSubmitting, setObsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const token = localStorage.getItem("acert_token");
    fetch(`/api/dossiers/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error("Falha ao carregar"); return r.json(); })
      .then(setDossier).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const sc = STATUS_COLORS[dossier?.status || ""] || STATUS_COLORS["Pendente"];

  async function downloadCert(certId: string, certName: string) {
    try {
      const res = await fetch(`/api/certificates/${certId}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${certName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch {}
  }

  async function downloadDoc(docId: string, label: string) {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = label;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch {}
  }

  async function deleteDoc(docId: string) {
    if (!dossier) return;
    const token = localStorage.getItem("acert_token");
    const r = await fetch(`/api/dossiers/${dossier.id}/documents/${docId}`, {
      method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (r.ok) setDossier(prev => prev ? { ...prev, documents: prev.documents.filter(d => d.id !== docId) } : prev);
  }

  async function moveDoc(docId: string, direction: 'up' | 'down') {
    if (!dossier) return;
    const docs = [...dossier.documents].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = docs.findIndex(d => d.id === docId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= docs.length) return;

    const swapped = docs[targetIdx];
    const current = docs[idx];
    const newOrder = [
      { id: current.id, sort_order: swapped.sort_order || targetIdx + 1 },
      { id: swapped.id, sort_order: current.sort_order || idx + 1 },
    ];

    const token = localStorage.getItem("acert_token");
    const r = await fetch(`/api/dossiers/${dossier.id}/documents/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ items: newOrder }),
    });
    if (r.ok) {
      setDossier(prev => {
        if (!prev) return prev;
        const updatedDocs = prev.documents.map(d => {
          if (d.id === current.id) return { ...d, sort_order: swapped.sort_order || targetIdx + 1 };
          if (d.id === swapped.id) return { ...d, sort_order: current.sort_order || idx + 1 };
          return d;
        });
        return { ...prev, documents: updatedDocs };
      });
    }
  }

  async function handleDocUpload() {
    if (!dossier || !docFile || !docName.trim()) return;
    setDocUploading(true); setDocError(null);
    try {
      const token = localStorage.getItem("acert_token");
      const fd = new FormData(); fd.append("file", docFile); fd.append("name", docName.trim());
      if (docDescription.trim()) fd.append("description", docDescription.trim());
      if (docPersonId) fd.append("personId", docPersonId);
      const r = await fetch(`/api/dossiers/${dossier.id}/documents`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      if (!r.ok) { const e = await r.json().catch(() => ({})); setDocError(e.error || "Erro ao enviar"); return; }
      const newDoc = await r.json();
      setDossier(prev => prev ? { ...prev, documents: [...prev.documents, newDoc] } : prev);
      setShowDocUpload(false); setDocFile(null); setDocName(""); setDocDescription(""); setDocPersonId(null);
    } catch { setDocError("Erro de conexão"); }
    finally { setDocUploading(false); }
  }

  async function handleCertUpload(certId: string, file: File) {
    if (!dossier) return;
    setCertUploading(certId);
    try {
      const token = localStorage.getItem("acert_token");
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch(`/api/certificates/${certId}/upload`, {
        method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        console.error('Erro ao fazer upload da certidão:', r.status, errBody.error || errBody.message || r.statusText);
        return;
      }
      const updated = await r.json();
      setDossier(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          certificates: prev.certificates.map(c =>
            c.id === certId ? { ...c, status: 'Obtida', document_path: updated.document_path, obtained_at: updated.obtained_at } : c
          ),
        };
      });
    } catch { /* ignore */ }
    finally { setCertUploading(null); }
  }

  async function loadTemplatesForPicker() {
    if (!dossier) return;
    const token = localStorage.getItem("acert_token");
    const r = await fetch(`/api/dossiers/${dossier.id}/certificates`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (r.ok) { const d = await r.json(); setCertTemplates(d); }
  }

  async function addCertWithFile(personId: string) {
    if (!dossier || !selectedCertKey) return;
    setAddingCert(true);
    try {
      const token = localStorage.getItem("acert_token");
      const fd = new FormData();
      fd.append("cert_key", selectedCertKey);
      fd.append("person_id", personId);
      if (certFile) fd.append("file", certFile);

      const r = await fetch(`/api/dossiers/${dossier.id}/certificates/add`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!r.ok) return;
      const newCert = await r.json();
      setDossier(prev => {
        if (!prev) return prev;
        const updated = prev.certificates.some(c => c.id === newCert.cert_id);
        if (updated) {
          return {
            ...prev,
            certificates: prev.certificates.map(c => c.id === newCert.cert_id ? { ...c, status: 'Obtida', obtained_at: newCert.obtained_at, document_path: newCert.document_path, sort_order: newCert.sort_order } : c),
          };
        }
        return {
          ...prev,
          certificates: [...prev.certificates, { id: newCert.cert_id, name: newCert.name, organ: newCert.organ, status: newCert.status, person_id: personId, obtained_at: newCert.obtained_at, created_at: newCert.created_at, protocol: null, document_path: newCert.document_path, sort_order: newCert.sort_order }],
        };
      });
      setShowCertPicker(null); setCertFile(null); setSelectedCertKey("");
    } catch {} finally { setAddingCert(false); }
  }

  async function moveCert(certId: string, direction: 'up' | 'down') {
    if (!dossier) return;
    const certs = [...dossier.certificates].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = certs.findIndex((c: any) => c.id === certId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= certs.length) return;

    const swapped = certs[targetIdx];
    const current = certs[idx];
    const newOrder = [
      { id: current.id, sort_order: swapped.sort_order || targetIdx + 1 },
      { id: swapped.id, sort_order: current.sort_order || idx + 1 },
    ];

    const token = localStorage.getItem("acert_token");
    const r = await fetch(`/api/dossiers/${dossier.id}/certificates/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ items: newOrder }),
    });
    if (r.ok) {
      setDossier(prev => {
        if (!prev) return prev;
        const updatedCerts = prev.certificates.map((c: any) => {
          if (c.id === current.id) return { ...c, sort_order: swapped.sort_order || targetIdx + 1 };
          if (c.id === swapped.id) return { ...c, sort_order: current.sort_order || idx + 1 };
          return c;
        });
        return { ...prev, certificates: updatedCerts };
      });
    }
  }

  async function deleteCert(certId: string) {
    if (!dossier) return;
    const token = localStorage.getItem("acert_token");
    const r = await fetch(`/api/dossiers/${dossier.id}/certificates/${certId}`, {
      method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (r.ok) setDossier(prev => prev ? { ...prev, certificates: prev.certificates.filter(c => c.id !== certId) } : prev);
  }

  async function submitObservation() {
    if (!dossier || !obsText.trim()) return;
    setObsSubmitting(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/dossiers/${dossier.id}/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: obsText.trim() }),
      });
      if (!r.ok) return;
      const newObs = await r.json();
      setDossier(prev => prev ? { ...prev, observations: [newObs, ...prev.observations] } : prev);
      setObsText("");
    } catch {} finally { setObsSubmitting(false); }
  }

  if (loading) return <DashboardLayout><div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ background: "var(--bg-app)", minHeight: "100vh" }}><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] animate-spin" /></div></div></DashboardLayout>;
  if (error || !dossier) return <DashboardLayout><div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ background: "var(--bg-app)", minHeight: "100vh" }}><div className="flex flex-col items-center justify-center py-32 text-center"><AlertCircle size={32} className="text-secondary mb-3" /><span className="text-[15px] font-medium text-primary">Dossiê não encontrado</span><Link href="/dashboard/dossies" className="mt-3 flex items-center gap-1.5 h-9 px-4 bg-[#FF7A00] text-white text-[13px] font-medium"><ArrowLeft size={14} />Voltar para Dossiês</Link></div></div></DashboardLayout>;

  const feed: { type: 'cert' | 'doc'; text: string; time: string; personName: string; timestamp: number }[] = [];
  dossier.certificates.filter(c => c.status === 'Obtida').forEach(c => {
    feed.push({ type: 'cert', text: c.name, time: timeAgo(c.obtained_at || c.created_at), personName: dossier.participants?.find(p => p.id === c.person_id)?.name || dossier.person?.name || '', timestamp: new Date(c.obtained_at || c.created_at).getTime() });
  });
  dossier.documents.forEach(d => {
    feed.push({ type: 'doc', text: d.name, time: timeAgo(d.uploaded_at), personName: dossier.participants?.find(p => p.id === d.person_id)?.name || dossier.property?.identifier || 'Imóvel', timestamp: new Date(d.uploaded_at).getTime() });
  });
  feed.sort((a, b) => b.timestamp - a.timestamp);
  const recentDocs = feed.slice(0, 10);

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-6 pb-24 w-full gap-5" style={{ background: "var(--bg-app)", minHeight: "100vh" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px]">
            <Link href="/dashboard/dossies" className="flex items-center gap-1 text-secondary hover:text-primary"><ArrowLeft size={13} />Voltar</Link>
            <span className="text-secondary">/</span><Link href="/dashboard/dossies" className="text-secondary hover:text-primary">Dossiês</Link>
            <span className="text-secondary">/</span><span className="text-primary font-medium">{dossier.identifier}</span>
          </div>
        </div>
        <div style={{ height: 8 }} />

        {/* Header */}
        <div className="bg-surface p-6">
          <div className="flex items-start justify-between gap-6">
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
            <div className="flex items-center gap-2 shrink-0" style={{ marginTop: 4 }}>
              <button onClick={() => router.push(`/dashboard/certidoes?dossierId=${dossier.id}`)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 40, padding: "0 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF7A00, #E06900)", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(255,122,0,0.25)" }}>
                <ScrollText size={15} strokeWidth={2} /> Emitir Certidões
              </button>
              <button onClick={() => setShowEditModal(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 40, padding: "0 16px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}><Edit3 size={14} strokeWidth={2} /> Editar</button>
              <button onClick={() => setShowGenerateModal(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 40, padding: "0 16px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}><FileDown size={14} strokeWidth={2} /> Gerar</button>
              <button onClick={() => setShowArchiveConfirm(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 40, padding: "0 16px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}><Archive size={14} strokeWidth={1.5} /></button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-default"><div className="flex items-center gap-14">{TABS.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} className={`h-9 text-[13px] font-medium transition-colors -mb-px border-b-[3px] whitespace-nowrap ${activeTab === t.key ? "border-[#FF7A00] text-primary font-semibold" : "border-transparent text-secondary hover:text-primary"}`}>{t.label}</button>)}</div></div>

        {/* ===================== RESUMO (tab) ===================== */}
        {activeTab === "resumo" && (<>
        <div className="bg-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div style={sectionTitle}><FileText size={16} strokeWidth={2} color="#FF7A00" />Resumo do dossiê</div>
            <button onClick={() => setShowEditModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}><Edit3 size={12} /> Editar</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <div style={{ padding: "20px 18px", background: "var(--bg-app)", borderRadius: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#FF7A00", borderRadius: "0 4px 4px 0" }} />
              <div style={{ paddingLeft: 4 }}>
                <span className="text-[10px] text-secondary uppercase tracking-[0.5px] font-semibold block mb-3">Código</span>
                <span className="text-[20px] font-bold text-primary tracking-tight">{dossier.identifier}</span>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="text-[11px] font-medium px-2 py-0.5" style={{ background: dossier.transactionType === 'locacao' ? "rgba(37,99,235,0.1)" : "rgba(5,150,105,0.1)", color: dossier.transactionType === 'locacao' ? "#2563EB" : "#059669", borderRadius: 4 }}>{dossier.transactionType === 'locacao' ? 'Locação' : 'Venda'}</span>
                  <span className="text-[11px] text-muted">{formatDate(dossier.createdAt)}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "20px 18px", background: "var(--bg-app)", borderRadius: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: sc.dot, borderRadius: "0 4px 4px 0" }} />
              <div style={{ paddingLeft: 4 }}>
                <span className="text-[10px] text-secondary uppercase tracking-[0.5px] font-semibold block mb-3">Situação</span>
                <span className="text-[13px] font-semibold px-3 py-1.5 inline-block" style={{ background: sc.bg, color: sc.text, borderRadius: 6 }}>{dossier.status}</span>
                <div style={{ marginTop: 8 }}><span className="text-[11px] text-muted">Resp. {dossier.responsible}</span></div>
              </div>
            </div>
            <div style={{ padding: "20px 18px", background: "var(--bg-app)", borderRadius: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#2563EB", borderRadius: "0 4px 4px 0" }} />
              <div style={{ paddingLeft: 4 }}>
                <span className="text-[10px] text-secondary uppercase tracking-[0.5px] font-semibold block mb-3">Prazo</span>
                <span className="text-[20px] font-bold text-primary tracking-tight">{new Date(new Date(dossier.createdAt).getTime() + deadlineDays * 86400000).toLocaleDateString("pt-BR")}</span>
                <div style={{ marginTop: 8 }}><span className="text-[11px] text-muted">em {deadlineDays} dias corridos</span></div>
              </div>
            </div>
            <div style={{ padding: "20px 18px", background: "var(--bg-app)", borderRadius: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626", borderRadius: "0 4px 4px 0" }} />
              <div style={{ paddingLeft: 4 }}>
                <span className="text-[10px] text-secondary uppercase tracking-[0.5px] font-semibold block mb-3">Certidões</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-bold" style={{ color: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }}>{dossier.certificatesObtidas}</span>
                  <span className="text-[15px] text-muted font-medium">/ {dossier.certificateCount}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 5, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${dossier.progress}%`, background: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626", borderRadius: 3, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
            <div style={{ padding: "14px 18px", background: "var(--bg-app)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <User size={16} strokeWidth={1.5} style={{ color: "#FF7A00", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}><span className="text-[10px] text-secondary uppercase tracking-wide font-semibold block">Titular</span><span className="text-[12px] font-semibold text-primary truncate block">{dossier.person?.name || "Não definido"}</span></div>
            </div>
            <div style={{ padding: "14px 18px", background: "var(--bg-app)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={16} strokeWidth={1.5} style={{ color: "#2563EB", flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}><span className="text-[10px] text-secondary uppercase tracking-wide font-semibold block">Imóvel</span><span className="text-[12px] font-semibold text-primary truncate block">{dossier.property ? `${dossier.property.type} — ${dossier.property.address?.split('—')[0]?.trim() || dossier.property.address || ''}` : "Não vinculado"}</span></div>
              <button onClick={() => setShowLinkProperty(true)} style={{ fontSize: 10, fontWeight: 600, color: "#2563EB", border: "none", background: "transparent", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Trocar</button>
            </div>
            <div style={{ padding: "14px 18px", background: "var(--bg-app)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={16} strokeWidth={1.5} style={{ color: "#7C3AED", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}><span className="text-[10px] text-secondary uppercase tracking-wide font-semibold block">Participantes</span><span className="text-[12px] font-semibold text-primary block">{dossier.participants?.length || 0} pessoa{(dossier.participants?.length || 0) !== 1 ? 's' : ''}</span></div>
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--border-light)", margin: "18px 0 0" }} />

          {/* ── Partes Envolvidas (RESUMO condensado) ── */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Users size={14} strokeWidth={2} color="#FF7A00" />
              <span className="text-[13px] font-bold text-primary">Partes Envolvidas</span>
              <span className="text-[10px] text-muted">({dossier.participants?.length || 0})</span>
            </div>
            {dossier.participants && dossier.participants.length > 0 ? (
              <div className="flex flex-col gap-2">
                {dossier.participants.map((p) => {
                  const roleLabel = p.role === 'proprietario' ? 'Proprietário' : p.role === 'comprador' ? 'Comprador' : p.role === 'vendedor' ? 'Vendedor' : p.role === 'locador' ? 'Locador' : p.role === 'locatario' ? 'Locatário' : p.role;
                  const roleColor = p.role === 'proprietario' ? "#FF7A00" : p.role === 'comprador' ? "#2563EB" : p.role === 'vendedor' ? "#7C3AED" : p.role === 'locador' ? "#059669" : p.role === 'locatario' ? "#D97706" : "#6B7280";
                  const initials = p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  const progress = (p.certTotal || 0) > 0 ? Math.round((p.certObtidas / (p.certTotal || 1)) * 100) : 0;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-light)", background: "var(--bg-app)" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${roleColor}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: roleColor, flexShrink: 0 }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="text-[12px] font-semibold text-primary block truncate">{p.name}</span>
                        <span className="text-[10px] text-muted">{p.cpf ? `CPF ${p.cpf}` : 'Sem CPF'} · {p.certObtidas}/{p.certTotal} certidões</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0" style={{ background: `${roleColor}12`, color: roleColor, borderRadius: 4 }}>{roleLabel}</span>
                      {(p.certTotal || 0) > 0 ? (
                        <div style={{ width: 60, height: 5, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${progress}%`, background: progress >= 80 ? "#059669" : progress >= 50 ? "#D97706" : "#DC2626", borderRadius: 3 }} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-muted italic">Nenhuma parte vinculada.</div>
            )}
          </div>

          {/* ── Atividades Recentes (RESUMO condensado, últimas 5) ── */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Clock size={14} strokeWidth={2} color="#7C3AED" />
              <span className="text-[13px] font-bold text-primary">Atividades Recentes</span>
            </div>
            {dossier.activities.length === 0 ? (
              <div className="text-[11px] text-muted italic">Nenhuma atividade.</div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {dossier.activities.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < Math.min(dossier.activities.length, 5) - 1 ? "1px solid var(--border-light)" : "none" }}>
                    <span className="text-[11px] text-body truncate" style={{ flex: 1 }}>{a.action}</span>
                    <span className="text-[10px] text-muted whitespace-nowrap">{a.user_name}</span>
                    <span className="text-[10px] text-muted whitespace-nowrap">·</span>
                    <span className="text-[10px] text-muted whitespace-nowrap">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Documentos Recentes (RESUMO condensado) ── */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <FileDown size={14} strokeWidth={2} color="#059669" />
              <span className="text-[13px] font-bold text-primary">Documentos Recentes</span>
              {recentDocs.length > 0 && <span className="text-[10px] text-muted">({recentDocs.length})</span>}
            </div>
            {recentDocs.length === 0 ? (
              <span className="text-[11px] text-muted italic">Nenhum documento recente</span>
            ) : (
              <div className="flex flex-col gap-0.5">
                {recentDocs.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: i < recentDocs.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.type === 'cert' ? <ScrollText size={11} strokeWidth={1.5} style={{ color: "#FF7A00", flexShrink: 0 }} /> : <FileText size={11} strokeWidth={1.5} style={{ color: "#7C3AED", flexShrink: 0 }} />}
                      <span className="text-[11px] text-primary truncate">{item.text}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted whitespace-nowrap">{item.time}</span>
                      {item.personName && <span className="text-[9px] text-muted whitespace-nowrap" style={{ background: "var(--bg-subtle)", padding: "0px 5px", borderRadius: 3 }}>{item.personName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Observações (RESUMO) ── */}
        <div className="bg-surface" style={{ borderRadius: 14, border: "1px solid var(--border-default)", padding: "16px 20px", marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <FileText size={14} strokeWidth={2} color="#2563EB" />
            <span className="text-[13px] font-bold text-primary">Observações</span>
            <span className="text-[10px] text-muted">({dossier.observations?.length || 0})</span>
          </div>

          {dossier.observations && dossier.observations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {dossier.observations.map((obs) => (
                <div key={obs.id} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--bg-app)", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#FFF",
                  }}>
                    {obs.user_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span className="text-[11px] font-semibold text-primary">{obs.user_name}</span>
                      <span className="text-[9px] text-muted">{timeAgo(obs.created_at)}</span>
                    </div>
                    <div className="text-[12px] text-body leading-snug">{obs.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={obsText}
              onChange={e => setObsText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitObservation(); } }}
              placeholder="Adicionar uma observação..."
              style={{
                flex: 1, height: 36, borderRadius: 8, border: "1px solid var(--border-default)",
                background: "var(--bg-app)", fontSize: 12, color: "var(--text-primary)",
                padding: "0 12px", outline: "none", fontFamily: "inherit",
              }}
            />
            <button
              onClick={submitObservation}
              disabled={obsSubmitting || !obsText.trim()}
              style={{
                height: 36, padding: "0 16px", borderRadius: 8, border: "none",
                background: obsSubmitting || !obsText.trim() ? "var(--text-muted)" : "#2563EB",
                color: "#FFF", fontSize: 12, fontWeight: 600, cursor: obsSubmitting || !obsText.trim() ? "not-allowed" : "pointer",
                opacity: obsSubmitting || !obsText.trim() ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >
              {obsSubmitting ? "..." : "Enviar"}
            </button>
          </div>
        </div>

        {dossier.participants && dossier.participants.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 14, background: "var(--bg-surface)", border: "1px solid var(--border-default)", marginTop: 0 }}>
            <ScrollText size={24} strokeWidth={1.5} color="#FF7A00" />
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Emitir Certidões</div><div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{dossier.participants.length} participante{dossier.participants.length > 1 ? 's' : ''} neste dossiê. Vá para a página de <Link href="/dashboard/certidoes" style={{ color: "#FF7A00", fontWeight: 600, textDecoration: "underline" }}>Certidões</Link> para emitir para cada pessoa.</div></div>
          </div>
        )}
        </>)}

        {/* ===================== PARTES ENVOLVIDAS (tab) ===================== */}
        {activeTab === "partes" && (
          <>
            {dossier.participants?.map((p) => {
              const roleLabel = p.role === 'proprietario' ? 'Proprietário' : p.role === 'comprador' ? 'Comprador' : p.role === 'vendedor' ? 'Vendedor' : p.role === 'locador' ? 'Locador' : p.role === 'locatario' ? 'Locatário' : p.role;
              const roleColor = p.role === 'proprietario' ? "#FF7A00" : p.role === 'comprador' ? "#2563EB" : p.role === 'vendedor' ? "#7C3AED" : p.role === 'locador' ? "#059669" : p.role === 'locatario' ? "#D97706" : "#6B7280";
              const initials = p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const progress = (p.certTotal || 0) > 0 ? Math.round((p.certObtidas / (p.certTotal || 1)) * 100) : 0;
              const personDocs = dossier.documents.filter(d => d.person_id === p.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
              const personCerts = dossier.certificates.filter(c => c.person_id === p.id).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
              const certObtidas = personCerts.filter(c => c.status === 'Obtida').length;
              const isFirstCert = personCerts.length > 0 ? personCerts[0].id : null;
              const isLastCert = personCerts.length > 0 ? personCerts[personCerts.length - 1].id : null;
              const isFirst = personDocs.length > 0 ? personDocs[0].id : null;
              const isLast = personDocs.length > 0 ? personDocs[personDocs.length - 1].id : null;

              return (
                <div key={p.id} className="bg-surface" style={{ borderRadius: 16, border: "1px solid var(--border-default)", overflow: "hidden", marginBottom: 20 }}>
                  {/* Cabeçalho do participante */}
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${roleColor}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: roleColor, flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="text-[16px] font-bold text-primary">{p.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider" style={{ background: `${roleColor}12`, color: roleColor, borderRadius: 5 }}>{roleLabel}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted">
                        <span>{p.cpf ? `CPF ${p.cpf}` : 'Sem CPF'}</span>
                        <span>·</span>
                        <span>{p.certObtidas}/{p.certTotal} certidões</span>
                        {(p.certTotal || 0) > 0 && (
                          <>
                            <span>·</span>
                            <div style={{ width: 50, height: 5, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${progress}%`, background: progress >= 80 ? "#059669" : progress >= 50 ? "#D97706" : "#DC2626", borderRadius: 3 }} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documentos Pessoais */}
                  <div style={{ borderTop: "1px solid var(--border-light)", padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={14} strokeWidth={2} color={roleColor} />
                        <span className="text-[13px] font-bold text-primary">Documentos Pessoais</span>
                        <span className="text-[10px] text-muted">({personDocs.length})</span>
                      </div>
                      <button
                        onClick={() => { setDocPersonId(p.id); setShowDocUpload(true); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 600, color: roleColor }}
                      >
                        <Plus size={13} /> Adicionar
                      </button>
                    </div>
                    {personDocs.length === 0 ? (
                      <div className="text-[11px] text-muted italic py-4 text-center" style={{ background: "var(--bg-app)", borderRadius: 8 }}>
                        Nenhum documento anexado
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {personDocs.map((doc, i) => (
                          <div key={doc.id} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                            borderRadius: 10, border: "1px solid var(--border-light)", background: "var(--bg-app)",
                          }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${roleColor}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <FileText size={15} strokeWidth={1.5} color={roleColor} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span className="text-[12px] font-semibold text-primary block truncate">{doc.name}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <span className="text-[10px] text-muted">{formatDate(doc.uploaded_at)}</span>
                                <span className="text-[9px] text-muted whitespace-nowrap" style={{ background: "var(--bg-subtle)", padding: "0px 5px", borderRadius: 3 }}>{doc.uploaded_by || '-'}</span>
                                {doc.description && <span className="text-[10px] text-muted truncate" style={{ opacity: 0.6 }}>— {doc.description}</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                              <button onClick={() => moveDoc(doc.id, 'up')} disabled={doc.id === isFirst}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: doc.id === isFirst ? "default" : "pointer", color: doc.id === isFirst ? "var(--text-muted)" : "var(--text-secondary)", opacity: doc.id === isFirst ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Mover para cima"><ChevronUp size={14} /></button>
                              <button onClick={() => moveDoc(doc.id, 'down')} disabled={doc.id === isLast}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: doc.id === isLast ? "default" : "pointer", color: doc.id === isLast ? "var(--text-muted)" : "var(--text-secondary)", opacity: doc.id === isLast ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Mover para baixo"><ChevronDown size={14} /></button>
                              <button onClick={() => downloadDoc(doc.id, doc.label)}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Download"><Download size={13} /></button>
                              <button onClick={() => deleteDoc(doc.id)}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Remover"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certidões */}
                  <div style={{ borderTop: "1px solid var(--border-light)", padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ScrollText size={14} strokeWidth={2} color="#FF7A00" />
                        <span className="text-[13px] font-bold text-primary">Certidões</span>
                        <span className="text-[10px] text-muted">({certObtidas}/{personCerts.length})</span>
                      </div>
                      <div>
                        <button
                          onClick={() => { setShowCertPicker(p.id); loadTemplatesForPicker(); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#FF7A00" }}
                        >
                          <Plus size={13} /> Adicionar
                        </button>
                      </div>
                    </div>
                    {personCerts.length === 0 ? (
                      <div className="text-[11px] text-muted italic py-4 text-center" style={{ background: "var(--bg-app)", borderRadius: 8 }}>
                        Nenhuma certidão para esta pessoa
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {personCerts.map((cert) => {
                          const isObtida = cert.status === 'Obtida' && cert.document_path;
                          const isUploading = certUploading === cert.id;
                          return (
                          <div key={cert.id} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                            borderRadius: 10, border: "1px solid var(--border-light)", background: "var(--bg-app)",
                          }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: isObtida ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {isUploading ? <Loader2 size={15} strokeWidth={2} className="animate-spin" style={{ color: "#FF7A00" }} />
                              : <ScrollText size={15} strokeWidth={1.5} color={isObtida ? "#059669" : "#DC2626"} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span className="text-[12px] font-semibold text-primary block truncate">{cert.name}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <span className="text-[9px] font-medium px-1.5 py-0.5" style={{ background: isObtida ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", color: isObtida ? "#059669" : "#DC2626", borderRadius: 3 }}>{cert.organ}</span>
                                <span className="text-[9px] font-medium px-1.5 py-0.5" style={{ background: isObtida ? "rgba(5,150,105,0.08)" : "rgba(245,158,11,0.1)", color: isObtida ? "#059669" : "#D97706", borderRadius: 3 }}>{cert.status}</span>
                                <span className="text-[10px] text-muted">{cert.obtained_at ? formatDate(cert.obtained_at) : formatDate(cert.created_at)}</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                              <button onClick={() => moveCert(cert.id, 'up')} disabled={cert.id === isFirstCert}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: cert.id === isFirstCert ? "default" : "pointer", color: cert.id === isFirstCert ? "var(--text-muted)" : "var(--text-secondary)", opacity: cert.id === isFirstCert ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Mover para cima"><ChevronUp size={14} /></button>
                              <button onClick={() => moveCert(cert.id, 'down')} disabled={cert.id === isLastCert}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: cert.id === isLastCert ? "default" : "pointer", color: cert.id === isLastCert ? "var(--text-muted)" : "var(--text-secondary)", opacity: cert.id === isLastCert ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Mover para baixo"><ChevronDown size={14} /></button>
                              {isObtida ? (
                                <button onClick={() => downloadCert(cert.id, cert.name)}
                                  style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "rgba(5,150,105,0.08)", cursor: "pointer", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}
                                  title="Download certidão"><Download size={13} /></button>
                              ) : (
                                <label style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "rgba(245,158,11,0.1)", cursor: isUploading ? "not-allowed" : "pointer", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", opacity: isUploading ? 0.5 : 1 }}
                                  title="Upload manual da certidão">
                                  <Upload size={13} />
                                  <input type="file" accept=".pdf" disabled={isUploading}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCertUpload(cert.id, f); e.target.value = ''; }}
                                    style={{ display: "none" }} />
                                </label>
                              )}
                              <button onClick={() => deleteCert(cert.id)}
                                style={{ width: 24, height: 24, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Remover certidão"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(!dossier.participants || dossier.participants.length === 0) && (
              <div className="bg-surface p-6" style={{ borderRadius: 16 }}>
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Users size={40} strokeWidth={1} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                  <span className="text-[13px] text-muted">Nenhuma parte vinculada a este dossiê.</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===================== ATIVIDADES (tab) ===================== */}
        {activeTab === "atividades" && (
          <div className="bg-surface" style={{ borderRadius: 16, border: "1px solid var(--border-default)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Clock size={18} strokeWidth={2} color="#7C3AED" />
              </div>
              <div>
                <span className="text-[15px] font-bold text-primary">Registro de Atividades</span>
                <div className="text-[11px] text-muted">Todas as ações realizadas neste dossiê</div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-light)", padding: "20px 24px" }}>
              {dossier.activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Clock size={40} strokeWidth={1} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                  <span className="text-[13px] text-muted">Nenhuma atividade registrada ainda.</span>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  {/* Timeline line */}
                  <div style={{ position: "absolute", left: 10, top: 8, bottom: 8, width: 2, background: "var(--border-light)" }} />
                  <div className="flex flex-col gap-1">
                    {dossier.activities.map((a, i) => (
                      <div key={i} style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: i < dossier.activities.length - 1 ? "none" : "none" }}>
                        {/* Timeline dot */}
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: i === 0 ? "rgba(124,58,237,0.12)" : "var(--bg-app)",
                          border: `2px solid ${i === 0 ? "#7C3AED" : "var(--border-light)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, zIndex: 1, marginTop: 2,
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: i === 0 ? "#7C3AED" : "var(--text-muted)",
                            opacity: i === 0 ? 1 : 0.4,
                          }} />
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0, paddingBottom: i < dossier.activities.length - 1 ? 12 : 0 }}>
                          <div className="text-[13px] text-primary font-medium leading-snug">{a.action}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span className="text-[11px] text-secondary font-medium">{a.user_name}</span>
                            <span className="text-[10px] text-muted">·</span>
                            <span className="text-[10px] text-muted">{timeAgo(a.created_at)}</span>
                            {a.reference && (
                              <>
                                <span className="text-[10px] text-muted">·</span>
                                <span className="text-[9px] text-muted whitespace-nowrap" style={{ background: "var(--bg-subtle)", padding: "0px 6px", borderRadius: 3 }}>{a.reference}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {showEditModal && dossier && (
        <DossierEditModal dossier={dossier} onClose={() => setShowEditModal(false)}
          onSave={(updated) => { setDossier(prev => prev ? { ...prev, status: updated.status, priority: updated.priority, responsible: updated.responsible, observation: updated.observation || "" } : prev); setShowEditModal(false); }} />
      )}

      <ConfirmModal open={showArchiveConfirm} title="Arquivar dossiê" message={`Tem certeza que deseja arquivar o dossiê ${dossier?.identifier}?`} confirmLabel="Sim, Arquivar" cancelLabel={t("common.cancel")} variant="warning"
        onConfirm={async () => { if (!dossier) return; try { const token = localStorage.getItem("acert_token"); await fetch(`/api/dossiers/${dossier.id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status: "Cancelado" }) }); setDossier(prev => prev ? { ...prev, status: "Cancelado" } : prev); } catch {} setShowArchiveConfirm(false); }}
        onCancel={() => setShowArchiveConfirm(false)} onClose={() => setShowArchiveConfirm(false)} />

      {showGenerateModal && dossier && (
        <GenerateDossierModal dossier={dossier} onClose={() => setShowGenerateModal(false)} />
      )}

      {showLinkProperty && dossier && (
        <VincularImovelModal dossierId={dossier.id} onClose={() => setShowLinkProperty(false)}
          onLinked={(prop: any) => { setDossier(prev => prev ? { ...prev, property: prop, personProperties: prev.personProperties.filter(p => p.id !== prop.id) } : prev); setShowLinkProperty(false); }} />
      )}

      {showDocUpload && dossier && (
        <UploadDocModal dossier={dossier} personId={docPersonId} personName={docPersonId ? dossier.participants?.find(p => p.id === docPersonId)?.name : dossier.property?.identifier}
          docName={docName} setDocName={setDocName} docDescription={docDescription} setDocDescription={setDocDescription}
          docFile={docFile} setDocFile={setDocFile}
          uploading={docUploading} error={docError} onUpload={handleDocUpload}
          onClose={() => { setShowDocUpload(false); setDocError(null); setDocFile(null); setDocName(""); setDocDescription(""); }} />
      )}

      {showCertPicker && dossier && (
        <AddCertModal
          personName={dossier.participants?.find(p => p.id === showCertPicker)?.name || ''}
          templates={certTemplates}
          adding={addingCert}
          selectedCertKey={selectedCertKey}
          setSelectedCertKey={setSelectedCertKey}
          certFile={certFile}
          setCertFile={setCertFile}
          onConfirm={() => addCertWithFile(showCertPicker)}
          onClose={() => { setShowCertPicker(null); setCertFile(null); setSelectedCertKey(""); }}
        />
      )}
    </DashboardLayout>
  );
}

function AddCertModal({ personName, templates, adding, selectedCertKey, setSelectedCertKey, certFile, setCertFile, onConfirm, onClose }: { personName: string; templates: any[]; adding: boolean; selectedCertKey: string; setSelectedCertKey: (v: string) => void; certFile: File | null; setCertFile: (f: File | null) => void; onConfirm: () => void; onClose: () => void }) {
  return (<>
    <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full bg-surface flex flex-col max-h-[90vh] overflow-hidden" style={{ maxWidth: "480px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center shrink-0" style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,122,0,0.12)" }}><ScrollText size={20} strokeWidth={1.5} color="#FF7A00" /></div>
            <div><h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Adicionar Certidão</h2><p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>Para: {personName}</p></div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} strokeWidth={1.5} /></button>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
          {templates.length === 0 ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} /></div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "8px", display: "block" }}>Tipo de certidão</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {templates.map((tpl: any) => (
                    <button key={tpl.key} onClick={() => setSelectedCertKey(tpl.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8,
                        border: selectedCertKey === tpl.key ? "1.5px solid #FF7A00" : "1px solid var(--border-default)",
                        background: selectedCertKey === tpl.key ? "rgba(255,122,0,0.06)" : "var(--bg-app)",
                        cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600,
                        color: selectedCertKey === tpl.key ? "#FF7A00" : "var(--text-primary)",
                        width: "100%",
                      }}
                    >
                      <ScrollText size={15} strokeWidth={1.5} color={selectedCertKey === tpl.key ? "#FF7A00" : "var(--text-muted)"} />
                      <span>{tpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "8px", display: "block" }}>Anexar PDF (opcional)</label>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: "80px", borderRadius: "10px", border: "2px dashed var(--border-default)", cursor: "pointer", background: certFile ? "rgba(255,122,0,0.04)" : "var(--bg-app)", fontSize: 12, color: certFile ? "#FF7A00" : "var(--text-muted)", fontWeight: 500 }}>
                  {certFile ? <><FileText size={18} strokeWidth={1.5} color="#FF7A00" /> {certFile.name} ({(certFile.size / 1024).toFixed(0)}KB)</> : <><Plus size={16} /> Selecionar PDF</>}
                  <input type="file" accept=".pdf" onChange={e => setCertFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                </label>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>Cancelar</button>
            <button onClick={onConfirm} disabled={adding || !selectedCertKey}
              style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: adding || !selectedCertKey ? "not-allowed" : "pointer", background: adding || !selectedCertKey ? "var(--text-muted)" : "#FF7A00", opacity: adding || !selectedCertKey ? 0.5 : 1 }}>
              {adding ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>);
}

function DocumentCard({ doc, onDownload, onDelete }: { doc: { id: string; name: string; label: string; file_path: string; file_type: string; file_size: number; uploaded_at: string }; onDownload: (id: string, label: string) => void; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-light)", background: "var(--bg-app)", minWidth: 160, maxWidth: 220 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={16} strokeWidth={1.5} color="#7C3AED" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="text-[12px] font-semibold text-primary truncate block">{doc.name}</span>
        <span className="text-[10px] text-muted block">{doc.label} {doc.file_size ? `· ${(doc.file_size / 1024).toFixed(0)}KB` : ''}</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={() => onDownload(doc.id, doc.label)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}><Download size={13} /></button>
        {confirmDelete ? <button onClick={() => onDelete(doc.id)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(220,38,38,0.1)", cursor: "pointer", color: "#DC2626", fontSize: 12, fontWeight: 700 }}>✓</button>
          : <button onClick={() => setConfirmDelete(true)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><X size={13} /></button>}
      </div>
    </div>
  );
}

function UploadDocModal({ dossier: _dossier, personId: _personId, personName, docName, setDocName, docDescription, setDocDescription, docFile, setDocFile, uploading, error, onUpload, onClose }: { dossier: any; personId: string | null; personName?: string; docName: string; setDocName: (v: string) => void; docDescription: string; setDocDescription: (v: string) => void; docFile: File | null; setDocFile: (f: File | null) => void; uploading: boolean; error: string | null; onUpload: () => void; onClose: () => void }) {
  const docTypes = _personId ? ["RG / CNH", "CPF", "Comprovante de Residência", "Certidão de Casamento", "Contrato Social", "Procuração", "Declaração", "Outro"] : ["Matrícula", "IPTU", "Escritura", "Certidão de Ônus", "Planta", "Habite-se", "Outro"];
  const labelS: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px" };
  return (<>
    <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden" style={{ maxWidth: "480px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center shrink-0" style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(124,58,237,0.12)" }}><FileText size={20} strokeWidth={1.5} color="#7C3AED" /></div>
            <div><h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Upload de Documento</h2><p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>{personName ? `Enviar para: ${personName}` : "Documento do imóvel"}</p></div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} strokeWidth={1.5} /></button>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
          {error && <div className="text-[12px] text-red-500 mb-4 p-2" style={{ background: "rgba(220,38,38,0.08)", borderRadius: 6, border: "1px solid rgba(220,38,38,0.15)" }}>{error}</div>}
          <div style={{ marginBottom: 20 }}><label style={labelS}>Título</label><input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Nome do documento..." style={{ height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1px solid var(--border-default)", padding: "0 12px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div>
          <div style={{ marginBottom: 20 }}><label style={labelS}>Tipo</label><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{docTypes.map(t => <button key={t} onClick={() => setDocName(t)} className="text-[11px] font-medium py-1.5 px-3" style={{ borderRadius: 6, border: docName === t ? "1.5px solid #7C3AED" : "1px solid var(--border-default)", background: docName === t ? "rgba(124,58,237,0.08)" : "transparent", color: docName === t ? "#7C3AED" : "var(--text-secondary)", cursor: "pointer" }}>{t}</button>)}</div></div>
          <div style={{ marginBottom: 20 }}><label style={labelS}>Descrição</label><input value={docDescription} onChange={e => setDocDescription(e.target.value)} placeholder="Descrição opcional..." style={{ height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1px solid var(--border-default)", padding: "0 12px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div>
          <div style={{ marginBottom: 24 }}><label style={labelS}>Arquivo</label><label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: "80px", borderRadius: "10px", border: "2px dashed var(--border-default)", cursor: "pointer", background: docFile ? "rgba(124,58,237,0.04)" : "var(--bg-app)", fontSize: 12, color: docFile ? "#7C3AED" : "var(--text-muted)", fontWeight: 500 }}>{docFile ? <><FileText size={18} strokeWidth={1.5} color="#7C3AED" /> {docFile.name} ({(docFile.size / 1024).toFixed(0)}KB)</> : <><Plus size={16} /> Selecionar arquivo</>}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ display: "none" }} /></label></div>
        </div>
        <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}><div style={{ display: "flex", gap: 10 }}><button onClick={onClose} style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>Cancelar</button><button onClick={onUpload} disabled={uploading || !docFile || !docName.trim()} style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: uploading || !docFile || !docName.trim() ? "not-allowed" : "pointer", background: uploading || !docFile || !docName.trim() ? "var(--text-muted)" : "#7C3AED", opacity: uploading || !docFile || !docName.trim() ? 0.5 : 1 }}>{uploading ? "Enviando..." : "Enviar"}</button></div></div>
      </div>
    </div>
  </>);
}

function VincularImovelModal({ dossierId, onClose, onLinked }: { dossierId: string; onClose: () => void; onLinked: (property: any) => void }) {
  const [search, setSearch] = useState(""); const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false); const [linking, setLinking] = useState(false); const [error, setError] = useState("");
  const doSearch = useCallback(async () => { if (!search.trim()) { setResults([]); return; } setSearching(true); try { const token = localStorage.getItem("acert_token"); const r = await fetch(`/api/properties/search?q=${encodeURIComponent(search.trim())}&limit=10`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); const d = await r.json(); setResults(d.properties || []); } catch {} finally { setSearching(false); } }, [search]);
  useEffect(() => { const t = setTimeout(doSearch, 300); return () => clearTimeout(t); }, [search, doSearch]);
  async function linkProp(propertyId: string) { setLinking(true); setError(""); try { const token = localStorage.getItem("acert_token"); const r = await fetch(`/api/dossiers/${dossierId}/link-property`, { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ property_id: propertyId }) }); const d = await r.json(); if (!r.ok) { setError(d.error || "Erro ao vincular"); return; } const prop = results.find(p => p.id === propertyId); if (prop) onLinked({ id: prop.id, identifier: prop.identifier, type: prop.type, address: prop.address, registration: prop.registration }); else onClose(); } catch { setError("Erro ao vincular"); } finally { setLinking(false); } }
  return (<><div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} /><div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}><div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden" style={{ maxWidth: "520px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}><div className="flex items-center gap-4"><div className="flex items-center justify-center shrink-0" style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(37,99,235,0.12)" }}><Building2 size={20} strokeWidth={1.5} color="#2563EB" /></div><div><h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Vincular Imóvel</h2><p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>Busque e vincule um imóvel a este dossiê</p></div></div><button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} strokeWidth={1.5} /></button></div><div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>{error && <div className="text-[12px] text-red-500 mb-3 p-2" style={{ background: "rgba(220,38,38,0.1)", borderRadius: 6 }}>{error}</div>}<div style={{ marginBottom: "20px" }}><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, matrícula ou endereço..." style={{ height: "40px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-app)", border: "1px solid var(--border-default)", padding: "0 12px 0 34px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>{searching ? <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} /></div> : results.length > 0 ? <div className="flex flex-col gap-2">{results.map(prop => <div key={prop.id} className="flex items-center justify-between p-3" style={{ borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)" }}><div className="flex-1 min-w-0"><span className="text-[13px] font-medium text-primary block">{prop.identifier}</span><span className="text-[11px] text-secondary">{prop.type} — {prop.address}{prop.registration ? ` · Mat. ${prop.registration}` : ""}</span></div><button onClick={() => linkProp(prop.id)} disabled={linking} style={{ height: "32px", padding: "0 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#FFF", fontSize: 12, fontWeight: 600, cursor: linking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>{linking ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}Vincular</button></div>)}</div> : search.trim() ? <div className="text-[12px] text-secondary italic text-center py-8">Nenhum imóvel encontrado.</div> : null}</div><div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}><button onClick={onClose} style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>Fechar</button></div></div></div></>);
}

function GenerateDossierModal({ dossier, onClose }: { dossier: DossierDetail; onClose: () => void }) {
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false); const [done, setDone] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  function toggleCert(id: string) { setSelectedCerts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]); }
  async function handleGenerate() {
    setGenerating(true); setGenError(null);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/dossiers/${dossier.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ certificateIds: selectedCerts.length > 0 ? selectedCerts : undefined }),
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        setGenError(errBody.error || `Erro ${r.status}`);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `dossie_${dossier.identifier.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      setDone(true); setTimeout(onClose, 1500);
    } catch (e: any) { setGenError(e.message || 'Erro ao gerar'); }
    finally { setGenerating(false); }
  }
  return (<><div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} /><div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}><div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden" style={{ maxWidth: "520px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between shrink-0" style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}><div className="flex items-center gap-4"><div className="flex items-center justify-center shrink-0" style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--badge-orange-bg)" }}><FileDown size={20} strokeWidth={1.5} color="#FF7A00" /></div><div><h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Gerar Dossiê</h2><p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>Selecione as certidões para incluir</p></div></div><button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} strokeWidth={1.5} /></button></div><div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>{done ? <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.15)" }}><Check size={28} strokeWidth={2} color="#059669" /></div><span className="text-[15px] font-semibold" style={{ color: "#059669" }}>Dossiê gerado!</span></div> : <>{genError && <div className="text-[12px] text-red-500 mb-4 p-2" style={{ background: "rgba(220,38,38,0.08)", borderRadius: 6, border: "1px solid rgba(220,38,38,0.15)" }}>{genError}</div>}<div style={{ marginBottom: "20px" }}>{dossier.certificates.length === 0 ? <div className="text-[12px] text-secondary italic text-center py-8">Nenhuma certidão vinculada.</div> : <div className="flex flex-col gap-2">{dossier.certificates.map(cert => { const sel = selectedCerts.includes(cert.id); return <button key={cert.id} onClick={() => toggleCert(cert.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", border: sel ? "2px solid #FF7A00" : "1px solid var(--border-light)", background: sel ? "rgba(255,122,0,0.06)" : "transparent", cursor: "pointer", transition: "all 0.15s ease", textAlign: "left" }}><div style={{ width: "20px", height: "20px", borderRadius: "6px", border: sel ? "none" : "2px solid var(--border-default)", background: sel ? "#FF7A00" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{sel && <Check size={13} strokeWidth={3} color="#FFF" />}</div><div className="flex-1 min-w-0"><span className="text-[13px] font-medium block" style={{ color: "var(--text-primary)" }}>{cert.name}</span><span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{cert.organ}</span></div><span className="text-[10px] font-semibold px-2 py-0.5 shrink-0" style={{ background: cert.status === "Obtida" ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)", color: cert.status === "Obtida" ? "#059669" : "#DC2626" }}>{cert.status}</span></button>; })}</div>}</div></>}</div><div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}><div style={{ display: "flex", gap: "10px" }}><button onClick={onClose} style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>Cancelar</button><button onClick={handleGenerate} disabled={generating} style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: generating ? "not-allowed" : "pointer", background: generating ? "var(--text-muted)" : "#FF7A00", display: "flex", alignItems: "center", gap: "6px" }}>{generating && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}{generating ? "Gerando..." : "Gerar Dossiê"}</button></div></div></div></div></>);
}
