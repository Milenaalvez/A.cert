"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ScrollText, Search, User, Building2, X, Check, ChevronDown,
  AlertTriangle, Download, Plus, FileText, ExternalLink, RefreshCw,
  Image, Users, ChevronRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/i18n/useT";

const apiBase = "http://localhost:3001";

const sectionTitle = { fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 } as React.CSSProperties;
const inputBase = { height: "42px", borderRadius: "6px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", padding: "0 12px", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s ease, box-shadow 0.15s ease" } as React.CSSProperties;
const labelStyle = "block text-[11px] font-semibold text-muted uppercase tracking-[0.4px] mb-1.5";
function focusIn(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,122,0,0.12)"; }
function focusOut(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }
function formatDate(dateStr: string) { const parts = dateStr.split("T")[0].split("-"); if (parts.length !== 3) return dateStr; const [y, m, d] = parts; return `${parseInt(d).toString().padStart(2,"0")}/${m}/${y}`; }

const ORGAO_MAP: Record<string, string> = {
  RF: "Receita Federal",
  TRF1: "TRF1",
  TJDFT: "TJDFT",
  TRT: "TRT",
  TST: "TST",
  SEFAZ: "SEFAZ-DF",
  ONR: "Certidão de Ônus (ONR)",
};

const ORGAO_LABEL: Record<string, string> = {
  "Receita Federal": "RF", TRF1: "TRF1", TJDFT: "TJDFT",
  TRT: "TRT", TST: "TST", "SEFAZ-DF": "SEFAZ", "Certidão de Ônus (ONR)": "ONR",
};

const CERT_CARDS = [
  { key: "TRF1", label: "TRF1", icon: ScrollText, color: "#2563EB", url: "https://sistemas.trf1.jus.br/certidao/#/solicitacao",
    subs: [{ key: "TRF1_CIVEL", label: "Certidão Cível", desc: "Seção Judiciária do DF — automático" }, { key: "TRF1_CRIMINAL", label: "Certidão Criminal", desc: "TRF 1ª Região 2º Grau — automático" }],
    note: "Aguardar alguns segundos entre a emissão da civil para a criminal." },
  { key: "TRT", label: "TRT 10ª Região", icon: ScrollText, color: "#DC2626", url: "https://www.trt10.jus.br/certidao_online/jsf/publico/certidaoOnline.jsf",
    subs: [{ key: "TRT", label: "Certidão Trabalhista", desc: "Preenche CPF ou nome automaticamente." }], note: "Captcha será preenchido pelo usuário." },
  { key: "TST", label: "TST", icon: ScrollText, color: "#7C3AED", url: "https://www.tst.jus.br/certidao1",
    subs: [{ key: "TST", label: "Certidão Trabalhista Superior", desc: "Aceita cookies + preenche CPF/CNPJ." }], note: "Captcha será preenchido pelo usuário." },
  { key: "TJDFT", label: "TJDFT", icon: ScrollText, color: "#059669", url: "https://cnc.tjdft.jus.br/solicitacao-externa",
    subs: [{ key: "TJDFT", label: "Certidão Especial (Cível + Criminal)", desc: "Nome, CPF, Mãe e Pai — automático." }], note: "O tipo será o Especial." },
  { key: "RF", label: "Receita Federal", icon: ScrollText, color: "#D97706", url: "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf",
    subs: [{ key: "RF", label: "Certidão de CPF/CNPJ", desc: "Preenche documento + clica avisos automaticamente." }] },
  { key: "SEFAZ", label: "SEFAZ-DF", icon: Building2, color: "#FF7A00", url: "https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao",
    subs: [{ key: "SEFAZ_PF", label: "Pessoa Física", desc: "Usa CPF. Finalidade: Lavratura Pública." }, { key: "SEFAZ_PJ", label: "Pessoa Jurídica", desc: "Usa CNPJ. Finalidade: Lavratura Pública." }, { key: "SEFAZ_IMOVEL", label: "Imóvel", desc: "Usa inscrição imobiliária." }],
    note: "Aguardar alguns segundos se for selecionado mais de uma opção." },
  { key: "FICHA", label: "Ficha Cadastral", icon: Building2, color: "#2563EB", url: "https://ww1.receita.fazenda.df.gov.br/cidadao/consulta/imoveis/iptu-tlp/FichaCadastral",
    subs: [{ key: "FICHA_CADASTRAL", label: "Ficha Cadastral do Imóvel", desc: "Usa inscrição imobiliária automaticamente." }] },
  { key: "ONR", label: "ONR", icon: Building2, color: "#6B7280", url: "https://registradores.onr.org.br/",
    subs: [{ key: "ONR", label: "Certidão de Ônus", desc: "Login automático → DF → Cartório → Matrícula → Crédito." }] },
];

export default function CertidoesPage() {
  const { t } = useT();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [entityDossiers, setEntityDossiers] = useState<any[]>([]);
  const [entityCertificates, setEntityCertificates] = useState<any[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [processingFlow, setProcessingFlow] = useState(false);
  const [flowStatus, setFlowStatus] = useState("");
  const [captchaModal, setCaptchaModal] = useState<any>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [resolving, setResolving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfileIdx, setActiveProfileIdx] = useState(0);
  const [showJointModal, setShowJointModal] = useState(false);
  const [mergingDossiers, setMergingDossiers] = useState(false);
  const [jointResult, setJointResult] = useState<string | null>(null);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  const allSubKeys = CERT_CARDS.flatMap(c => c.subs.map(s => s.key));
  const selectedCount = selectedCerts.length;

  const token = typeof window !== "undefined" ? localStorage.getItem("acert_token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const jsonHeaders: Record<string, string> = { "Content-Type": "application/json", ...authHeaders };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(`${apiBase}/api/people`, { headers: authHeaders });
      const data = await r.json();
      const q = searchQuery.toLowerCase();
      setSearchResults((data.people || []).filter((p: any) => p.name.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q))).slice(0, 5));
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [searchQuery]);

  const loadProfileCertificates = (profile: any) => {
    const certs: any[] = [];
    (profile.dossiers || []).forEach((d: any) => {
      (d.certificates || []).forEach((c: any) => {
        certs.push({ ...c, dossier_id: d.id, dossier_identifier: d.identifier });
      });
    });
    return certs;
  };

  const switchToProfile = (idx: number) => {
    const profile = profiles[idx];
    if (!profile) return;
    setActiveProfileIdx(idx);
    setSelectedEntity(profile);
    setJobId(profile.jobId || null);
    setJobStatus(profile.jobStatus || null);
    setEntityDossiers(profile.dossiers || []);
    setEntityCertificates(loadProfileCertificates(profile));
    setPolling(false);
    setProcessingFlow(false);
    setFlowStatus("");
    setSelectedCerts([]);
  };

  const selectEntity = async (entity: any) => {
    setSelectedEntity(entity);
    setSearchResults([]);
    setSearchQuery("");
    setJobId(null);
    setJobStatus(null);
    setSelectedCerts([]);
    setActiveProfileIdx(0);
    setPolling(false);
    setProcessingFlow(false);
    setFlowStatus("");
    setProfiles([]);
    try {
      const [detailR, dossierR] = await Promise.all([
        fetch(`${apiBase}/api/people/${entity.id}/detail`, { headers: authHeaders }),
        fetch(`${apiBase}/api/dossiers?search=${encodeURIComponent(entity.name)}&limit=20`, { headers: authHeaders }),
      ]);
      const detail = await detailR.json();
      const dossiers = (await dossierR.json()).dossiers || [];
      setEntityDossiers(dossiers);
      if (detail.person) {
        const mainProfile = {
          ...entity,
          mother_name: detail.person.motherName || "",
          father_name: detail.person.fatherName || "",
          birth_date: detail.person.birthDate || "",
          email: detail.person.email || "",
          dossiers: detail.dossiers || [],
          status: "pending",
          jobId: null as string | null,
          jobStatus: null as any,
        };
        const newProfiles = [mainProfile];
        setLoadingRelationships(true);
        try {
          const relsR = await fetch(`${apiBase}/api/people/${entity.id}/relationships`, { headers: authHeaders });
          const relsData = await relsR.json();
          const rels = relsData.relationships || [];
          for (const rel of rels) {
            if (rel.other_id === entity.id) continue;
            try {
              const rdR = await fetch(`${apiBase}/api/people/${rel.other_id}/detail`, { headers: authHeaders });
              const rd = await rdR.json();
              if (rd.person) {
                newProfiles.push({
                  id: rel.other_id,
                  name: rd.person.name,
                  cpf: rd.person.cpf,
                  mother_name: rd.person.motherName || "",
                  father_name: rd.person.fatherName || "",
                  birth_date: rd.person.birthDate || "",
                  email: rd.person.email || "",
                  dossiers: rd.dossiers || [],
                  status: "pending",
                  jobId: null as string | null,
                  jobStatus: null as any,
                });
              }
            } catch {}
          }
        } catch {}
        setLoadingRelationships(false);
        setProfiles(newProfiles);
        setSelectedEntity(newProfiles[0]);
        setEntityCertificates(loadProfileCertificates(newProfiles[0]));
      }
    } catch {}
  };

  const handleSelectCert = (sKey: string) => setSelectedCerts(p => p.includes(sKey) ? p.filter(k => k !== sKey) : [...p, sKey]);
  const handleSelectAll = () => { setSelectedCerts(selectedCerts.length === allSubKeys.length ? [] : [...allSubKeys]); };

  function getOrgansFromSelected(): string[] {
    const unique = new Set<string>();
    selectedCerts.forEach(key => {
      for (const [prefix, name] of Object.entries(ORGAO_MAP)) {
        if (key === prefix || key.startsWith(prefix + "_")) {
          unique.add(name);
          break;
        }
      }
    });
    return Array.from(unique);
  }

  const startJob = async () => {
    const profile = profiles[activeProfileIdx];
    if (!profile || selectedCerts.length === 0) return;
    try {
      const organs = getOrgansFromSelected();
      const body: any = {
        nome: profile.name,
        cpf: profile.cpf,
        dataNascimento: profile.birth_date?.split("T")[0] || profile.birth_date || "2000-01-01",
        nomeMae: profile.mother_name || "Não informado",
        nomePai: profile.father_name || "",
        email: profile.email || "email@nao.informado",
        personId: profile.id,
        organs,
        certKeys: selectedCerts,
      };
      setProcessingFlow(true);
      setFlowStatus("Iniciando consultas...");
      const r = await fetch(`${apiBase}/api/consultar`, {
        method: "POST", headers: jsonHeaders, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.jobId) {
        setJobId(data.jobId);
        setJobStatus(null);
        setPolling(true);
        setFlowStatus("Consultando órgãos...");
        const updated = [...profiles];
        updated[activeProfileIdx] = { ...updated[activeProfileIdx], status: "processing", jobId: data.jobId, selectedCerts };
        setProfiles(updated);
      } else {
        setProcessingFlow(false);
        setFlowStatus("");
      }
    } catch {
      setProcessingFlow(false);
      setFlowStatus("");
    }
  };

  useEffect(() => {
    if (!polling || !jobId) return;
    const poll = async () => {
      try {
        const r = await fetch(`${apiBase}/api/consultar/${jobId}`, { headers: authHeaders });
        const data = await r.json();
        setJobStatus(data);
        if (data.status === "complete" || data.status === "partial") {
          setPolling(false);
          const updated = [...profiles];
          updated[activeProfileIdx] = {
            ...updated[activeProfileIdx],
            status: "completed",
            jobStatus: data,
          };
          setProfiles(updated);
          const nextIdx = activeProfileIdx + 1;
          const hasNext = nextIdx < updated.length;
          const pendingNext = hasNext && updated[nextIdx].status === "pending";
          if (pendingNext) {
            const prevCerts = updated[activeProfileIdx]?.selectedCerts || [];
            setTimeout(() => {
              setActiveProfileIdx(nextIdx);
              setJobId(null);
              setJobStatus(null);
              const nextProfile = updated[nextIdx];
              setSelectedEntity(nextProfile);
              setEntityDossiers(nextProfile.dossiers || []);
              setEntityCertificates(loadProfileCertificates(nextProfile));
              setSelectedCerts(prevCerts);
              setPolling(false);
              setProcessingFlow(true);
              setFlowStatus("Iniciando consultas...");
            }, 800);
          } else {
            setProcessingFlow(false);
            setFlowStatus("");
            const allDone = updated.every((p: any) => p.status === "completed");
            if (allDone && updated.length > 1) {
              setTimeout(() => setShowJointModal(true), 600);
            }
          }
        }
        if (data.captchaPendente?.length > 0 && !captchaModal) {
          const pendente = data.captchaPendente[0];
          setCaptchaModal(pendente);
          setCaptchaAnswer("");
          setPolling(false);
          setProcessingFlow(false);
          setFlowStatus("");
        }
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [polling, jobId, captchaModal, activeProfileIdx]);

  const handleCaptchaSubmit = async () => {
    if (!captchaModal || !captchaAnswer.trim() || !jobId) return;
    setResolving(true);
    try {
      await fetch(`${apiBase}/api/consultar/${jobId}/captcha`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ chave: captchaModal.chave, solution: captchaAnswer.trim() }),
      });
      setCaptchaModal(null);
      setCaptchaAnswer("");
      setPolling(true);
      setProcessingFlow(true);
      setFlowStatus("Continuando consultas...");
    } catch {} finally { setResolving(false); }
  };

  const handleRetry = async () => {
    if (!jobId) return;
    try {
      setProcessingFlow(true);
      setFlowStatus("Tentando novamente...");
      await fetch(`${apiBase}/api/consultar/${jobId}/retry`, {
        method: "POST",
        headers: authHeaders,
      });
      setPolling(true);
    } catch {
      setProcessingFlow(false);
      setFlowStatus("");
    }
  };

  const goToNextProfile = () => {
    const nextIdx = activeProfileIdx + 1;
    if (nextIdx >= profiles.length) return;
    switchToProfile(nextIdx);
  };

  const activeProfile = profiles[activeProfileIdx];
  const allProfilesDone = profiles.length > 0 && profiles.every((p: any) => p.status === "completed");
  const hasMoreProfiles = activeProfileIdx < profiles.length - 1;
  const certCount = entityCertificates.length + (jobStatus?.resultados?.filter((r: any) => r.status === "success").length || 0);

  const handleCreateJointDossier = async () => {
    setMergingDossiers(true);
    setJointResult(null);
    try {
      const personIds = profiles.map((p: any) => p.id);
      const r = await fetch(`${apiBase}/api/dossiers/merge`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ person_ids: personIds }),
      });
      const data = await r.json();
      if (data.success) {
        setJointResult(`Dossiê conjunto criado: ${data.identifier}`);
      } else {
        setJointResult("Erro ao criar dossiê conjunto.");
      }
    } catch {
      setJointResult("Erro ao conectar com o servidor.");
    } finally {
      setMergingDossiers(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full gap-8">
        <div style={{ marginTop: 24 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Certidões</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Busque uma pessoa, empresa ou imóvel para emitir e gerenciar certidões.</p>
            </div>
          </div>
        </div>

        {/* Etapa 1: Busca */}
        <div className="bg-surface rounded-[14px] p-6">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>1</div>
            <div style={sectionTitle}>Buscar Pessoa, Empresa ou Imóvel</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input type="text" placeholder="Buscar por nome, CPF, CNPJ, matrícula ou inscrição..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} style={{ ...inputBase, paddingLeft: 36 }} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <button onClick={handleSearch} disabled={searching || !searchQuery.trim()} style={{ height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: searching || !searchQuery.trim() ? 0.5 : 1, whiteSpace: "nowrap" }}>{searching ? "Buscando..." : "Buscar"}</button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 4, borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--bg-surface)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", position: "absolute", left: 0, right: 0, zIndex: 10 }}>
                {searchResults.map((p: any) => (
                  <button key={p.id} onClick={() => selectEntity(p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, textAlign: "left", borderBottom: "1px solid var(--border-light)", color: "var(--text-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                      <div><span style={{ display: "block" }}>{p.name}</span>{p.cpf && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.cpf}</span>}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "var(--bg-subtle)", color: "var(--text-muted)" }}>Pessoa</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingRelationships && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "var(--bg-subtle)" }}>
              <div style={{ width: 14, height: 14, border: "2px solid rgba(255,122,0,0.3)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Verificando vínculos parentais...</span>
            </div>
          )}

          {profiles.length > 0 && (
            <div style={{ marginTop: 20 }}>
              {/* Profile tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {profiles.map((profile: any, idx: number) => {
                  const isActive = idx === activeProfileIdx;
                  const isDone = profile.status === "completed";
                  const initials = profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={profile.id}
                      onClick={() => !processingFlow && switchToProfile(idx)}
                      disabled={processingFlow}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 14px", borderRadius: 8,
                        border: isActive ? "1.5px solid #FF7A00" : "1px solid var(--border-default)",
                        background: isActive ? "rgba(255,122,0,0.06)" : "transparent",
                        cursor: processingFlow ? "default" : "pointer",
                        fontSize: 12, fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#FF7A00" : "var(--text-secondary)",
                        opacity: processingFlow && !isActive ? 0.5 : 1,
                      }}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: isDone ? "#059669" : isActive ? "#FF7A00" : "var(--bg-muted)",
                        color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, flexShrink: 0,
                      }}>
                        {isDone ? <Check size={11} strokeWidth={2.5} /> : initials}
                      </div>
                      <span>{profile.name.split(" ")[0]}</span>
                      {isDone && <Check size={12} strokeWidth={2.5} color="#059669" />}
                      {isActive && !isDone && profile.status === "pending" && (
                        <span style={{ fontSize: 9, color: "#FF7A00", fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: "rgba(255,122,0,0.1)" }}>ATIVO</span>
                      )}
                      {isActive && profile.status === "processing" && (
                        <div style={{ width: 10, height: 10, border: "1.5px solid rgba(255,122,0,0.3)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {profiles.length > 1 && activeProfile && (
                <div style={{ marginBottom: 16, padding: "8px 14px", borderRadius: 8, background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={14} strokeWidth={1.5} color="#059669" />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {profiles.length} perfis encontrados (vínculo parental). Processe cada um sequencialmente.
                  </span>
                </div>
              )}

              {/* Active profile details */}
              {selectedEntity && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: profiles[activeProfileIdx]?.status === "completed" ? "#059669" : "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {profiles[activeProfileIdx]?.status === "completed" ? <Check size={18} strokeWidth={2.5} /> : selectedEntity.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", display: "block" }}>{selectedEntity.name}</span>
                    {selectedEntity.cpf && <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginTop: 2 }}>CPF: {selectedEntity.cpf}</span>}
                    <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Mãe: {selectedEntity.mother_name || "Não informado"}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Pai: {selectedEntity.father_name || "Não informado"}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Nasc: {selectedEntity.birth_date ? formatDate(selectedEntity.birth_date) : "Não informado"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 6, paddingTop: 8, borderTop: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}><strong style={{ color: "var(--text-primary)" }}>{entityDossiers.length}</strong> dossiê{entityDossiers.length !== 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}><strong style={{ color: "var(--text-primary)" }}>{entityCertificates.length}</strong> certidõe{entityCertificates.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedEntity(null); setJobId(null); setJobStatus(null); setSelectedCerts([]); setProcessingFlow(false); setFlowStatus(""); setProfiles([]); setActiveProfileIdx(0); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }} onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}><X size={15} strokeWidth={2} /></button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Etapa 2: Seleção */}
        <div className="bg-surface rounded-[14px] p-6">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563EB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</div>
              <div style={sectionTitle}>Selecionar Certidões</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={handleSelectAll} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", border: "none", background: "transparent", cursor: "pointer" }}>{selectedCerts.length === allSubKeys.length ? "Desmarcar todas" : "Selecionar todas"}</button>
              <button
                onClick={startJob}
                disabled={selectedCerts.length === 0 || !activeProfile || processingFlow || (activeProfile?.status === "completed")}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 5, border: "none",
                  background: selectedCerts.length > 0 && activeProfile && !processingFlow && activeProfile.status !== "completed" ? "#FF7A00" : "var(--bg-muted)",
                  color: selectedCerts.length > 0 && activeProfile && !processingFlow && activeProfile.status !== "completed" ? "#FFF" : "var(--text-muted)",
                  cursor: selectedCerts.length > 0 && activeProfile && !processingFlow && activeProfile.status !== "completed" ? "pointer" : "default",
                  opacity: selectedCerts.length === 0 || !activeProfile || activeProfile.status === "completed" ? 0.5 : 1,
                }}
              >
                {processingFlow ? <RefreshCw size={13} strokeWidth={2} style={{ marginRight: 4, display: "inline", verticalAlign: "middle", animation: "spin 0.6s linear infinite" }} /> : <Download size={13} strokeWidth={2} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />}
                {processingFlow ? "Consultando..." : `Emitir (${selectedCount})`}
              </button>
            </div>
          </div>

          {/* Processing indicator */}
          {processingFlow && (
            <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 8, background: "rgba(255,122,0,0.08)", border: "1px solid rgba(255,122,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,122,0,0.3)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#FF7A00", fontWeight: 600 }}>{flowStatus}</span>
            </div>
          )}

          {/* Profile completed indicator + next */}
          {activeProfile?.status === "completed" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={16} strokeWidth={2.5} color="#059669" />
                  <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>Certidões emitidas para {activeProfile.name.split(" ")[0]}</span>
                </div>
                {hasMoreProfiles && (
                  <button onClick={goToNextProfile} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Próximo perfil
                    <ChevronRight size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Job status results */}
          {jobStatus && (jobStatus.status === "complete" || jobStatus.status === "partial") && (
            <div style={{ marginBottom: 14 }}>
              <div className="flex flex-col gap-1 p-3" style={{ borderRadius: 8, background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)" }}>
                {(jobStatus.resultados || []).filter((r: any) => selectedCerts.some(s => s === r.orgao || s.startsWith(Object.entries(ORGAO_MAP).find(([,v]) => v === r.orgao)?.[0] + "_") || s === Object.entries(ORGAO_MAP).find(([,v]) => v === r.orgao)?.[0])).map((r: any, i: number) => {
                  const isSuccess = r.status === "success";
                  return (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: isSuccess ? "#059669" : "#DC2626" }}>{isSuccess ? "✓" : "✗"}</span>
                        <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{r.orgao}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.protocolo && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.protocolo}</span>}
                        {isSuccess && r.documentoId && (
                          <a href={`${apiBase}/api/documentos/${r.documentoId}`} target="_blank" style={{ fontSize: 11, color: "#FF7A00", textDecoration: "none" }}>📄 PDF</a>
                        )}
                        {r.status === "error" && <span style={{ fontSize: 10, color: "#DC2626", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.error}>{r.error}</span>}
                      </div>
                    </div>
                  );
                })}
                {jobStatus.resultados?.some((r: any) => r.status === "error") && (
                  <button onClick={handleRetry} className="flex items-center gap-1 px-3 py-1.5 mt-1 text-[11px] font-medium" style={{ borderRadius: 4, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", alignSelf: "flex-start" }}>
                    <RefreshCw size={11} /> Tentar novamente
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cert cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {CERT_CARDS.map((card) => {
              const cardSelected = card.subs.some(s => selectedCerts.includes(s.key));
              return (
                <div key={card.key} style={{ borderRadius: 10, background: cardSelected ? `${card.color}08` : "var(--bg-subtle)", padding: "16px", transition: "all 0.15s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><card.icon size={15} strokeWidth={1.5} color={card.color} /></div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{card.label}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {card.subs.map((sub) => {
                      const isSelected = selectedCerts.includes(sub.key);
                      return (
                        <button key={sub.key} onClick={() => handleSelectCert(sub.key)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 6, border: isSelected ? `1px solid ${card.color}` : "1px solid transparent", background: isSelected ? `${card.color}0D` : "transparent", cursor: "pointer", textAlign: "left", width: "100%" }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: isSelected ? "none" : "1px solid var(--border-default)", background: isSelected ? card.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{isSelected && <Check size={10} strokeWidth={2.5} color="#FFF" />}</div>
                          <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "block" }}>{sub.label}</span><span style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.3 }}>{sub.desc}</span></div>
                        </button>
                      );
                    })}
                  </div>
                  {card.note && <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 5, background: "rgba(217,119,6,0.08)", fontSize: 10, color: "#D97706", lineHeight: 1.4 }}>⚠️ {card.note}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Etapa 3: Resultados */}
        <div className="bg-surface rounded-[14px] p-6">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#059669", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>3</div>
              <div style={sectionTitle}>Certidões Encontradas</div>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{certCount} documento{certCount !== 1 ? "s" : ""}</span>
          </div>
          {certCount === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>Nenhuma certidão encontrada. Selecione os órgãos acima e clique em Emitir.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid var(--border-default)" }}><th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}></th><th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Nome</th><th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Órgão</th><th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th><th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Data</th></tr></thead>
                <tbody>
                  {entityCertificates.map((cert, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}><td style={{ padding: "10px" }}><div style={{ width: 14, height: 14, borderRadius: 3, border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}></div></td><td style={{ padding: "10px", fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{cert.name}</td><td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)" }}>{cert.organ || "—"}</td><td style={{ padding: "10px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: cert.status === "Obtida" ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)", color: cert.status === "Obtida" ? "#059669" : "#DC2626" }}>{cert.status === "Obtida" ? "Válida" : "Pendente"}</span></td><td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)" }}>{cert.obtained_at ? formatDate(cert.obtained_at) : "—"}</td></tr>
                  ))}
                  {jobStatus?.resultados?.filter((r: any) => r.status === "success").map((r: any, i: number) => (
                    <tr key={`res-${i}`} style={{ borderBottom: "1px solid var(--border-light)" }}><td style={{ padding: "10px" }}><div style={{ width: 14, height: 14, borderRadius: 3, border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}></div></td><td style={{ padding: "10px", fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{r.orgao}</td><td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)" }}>{r.orgao}</td><td style={{ padding: "10px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(5,150,105,0.12)", color: "#059669" }}>Obtida</span></td><td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)" }}>{r.dataConsulta ? formatDate(r.dataConsulta) : "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CAPTCHA Modal */}
      {captchaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-surface rounded-[14px] p-6 w-full max-w-md mx-4" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
            <h3 className="text-[16px] font-bold text-primary mb-2">CAPTCHA necessário</h3>
            <p className="text-[13px] text-secondary mb-6">
              Órgão: <span className="text-primary font-semibold">{captchaModal.orgao}</span>
            </p>
            <div className="mb-6">
              {captchaModal.captchaUrl && (
                <img src={`${apiBase}${captchaModal.captchaUrl}`} alt="CAPTCHA"
                  style={{ borderRadius: 8, border: "1px solid var(--border-default)", width: "100%", maxHeight: 160, objectFit: "contain", background: "var(--bg-app)" }} />
              )}
              {captchaModal.tipo === "hcaptcha" && (
                <div style={{ borderRadius: 8, border: "1px solid var(--border-default)", padding: "16px", textAlign: "center", background: "var(--bg-subtle)" }}>
                  <Image size={32} className="text-muted mx-auto mb-2" />
                  <p className="text-[12px] text-muted">hCaptcha detectado. Resolva no navegador e insira o token.</p>
                </div>
              )}
            </div>
            <label className={labelStyle}>Digite o texto do CAPTCHA</label>
            <input type="text" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)}
              style={{ ...inputBase, marginBottom: 24 }} placeholder="Resposta do CAPTCHA..." autoFocus
              onKeyDown={e => e.key === "Enter" && handleCaptchaSubmit()} />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { setCaptchaModal(null); setPolling(true); setProcessingFlow(true); setFlowStatus("Continuando..."); }}
                style={{ height: 38, padding: "0 16px", borderRadius: 6, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Pular</button>
              <button onClick={handleCaptchaSubmit} disabled={resolving || !captchaAnswer.trim()}
                style={{ height: 38, padding: "0 16px", borderRadius: 6, border: "none", background: resolving || !captchaAnswer.trim() ? "var(--bg-muted)" : "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: resolving || !captchaAnswer.trim() ? "default" : "pointer", opacity: resolving || !captchaAnswer.trim() ? 0.5 : 1 }}>
                {resolving ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Joint Dossier Modal */}
      {showJointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-surface rounded-[14px] p-6 w-full max-w-lg mx-4" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(5,150,105,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} strokeWidth={1.5} color="#059669" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-primary">Certidões emitidas para todos os perfis</h3>
                <p className="text-[12px] text-secondary mt-0.5">Deseja vincular as certidões em um dossiê conjunto ou manter individuais?</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {profiles.map((p: any, idx: number) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "var(--bg-subtle)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: idx === 0 ? "#FF7A00" : "#2563EB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>CPF: {p.cpf || "—"}</span>
                  </div>
                  <Check size={14} strokeWidth={2.5} color="#059669" />
                </div>
              ))}
            </div>

            {jointResult && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: jointResult.includes("Erro") ? "rgba(220,38,38,0.08)" : "rgba(5,150,105,0.08)", border: `1px solid ${jointResult.includes("Erro") ? "rgba(220,38,38,0.2)" : "rgba(5,150,105,0.2)"}`, fontSize: 12, fontWeight: 500, color: jointResult.includes("Erro") ? "#DC2626" : "#059669" }}>
              {jointResult}
            </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowJointModal(false); setJointResult(null); }}
                style={{ height: 40, padding: "0 18px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Manter individuais
              </button>
              <button
                onClick={handleCreateJointDossier}
                disabled={mergingDossiers}
                style={{
                  height: 40, padding: "0 18px", borderRadius: 8, border: "none",
                  background: mergingDossiers ? "var(--bg-muted)" : "#059669",
                  color: "#FFF", fontSize: 13, fontWeight: 600,
                  cursor: mergingDossiers ? "default" : "pointer",
                  opacity: mergingDossiers ? 0.6 : 1,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {mergingDossiers && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
                {mergingDossiers ? "Criando..." : "Criar dossiê conjunto"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}
