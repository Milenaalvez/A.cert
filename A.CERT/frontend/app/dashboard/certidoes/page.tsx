"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import {
  ScrollText, Search, User, Building2, X, Check, ChevronDown,
  AlertTriangle, Download, Plus, FileText, ExternalLink,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sectionTitle = { fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 } as React.CSSProperties;
const inputBase = { height: "42px", borderRadius: "6px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", padding: "0 12px", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s ease, box-shadow 0.15s ease" } as React.CSSProperties;
function focusIn(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,122,0,0.12)"; }
function focusOut(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }
function formatDate(dateStr: string) { const parts = dateStr.split("T")[0].split("-"); if (parts.length !== 3) return dateStr; const [y, m, d] = parts; return `${parseInt(d).toString().padStart(2,"0")}/${m}/${y}`; }

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [entityDossiers, setEntityDossiers] = useState<any[]>([]);
  const [entityCertificates, setEntityCertificates] = useState<any[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certResults, setCertResults] = useState<any[]>([]);
  const [processingFlow, setProcessingFlow] = useState(false);
  const [flowStatus, setFlowStatus] = useState("");

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch("http://localhost:3001/api/people", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await r.json();
      const q = searchQuery.toLowerCase();
      setSearchResults((data.people || []).filter((p: any) => p.name.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q))).slice(0, 5));
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [searchQuery]);

  const selectEntity = async (entity: any) => {
    setSelectedEntity(entity);
    setSearchResults([]);
    setSearchQuery("");
    try {
      const token = localStorage.getItem("acert_token");
      const [detailR, dossierR] = await Promise.all([
        fetch(`http://localhost:3001/api/people/${entity.id}/detail`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`http://localhost:3001/api/dossiers?search=${encodeURIComponent(entity.name)}&limit=20`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ]);
      const detail = await detailR.json();
      const dossiers = (await dossierR.json()).dossiers || [];
      setEntityDossiers(dossiers);
      if (detail.person) {
        setSelectedEntity({ ...entity, mother_name: detail.person.motherName || "", father_name: detail.person.fatherName || "", birth_date: detail.person.birthDate || "", email: detail.person.email || "", dossiers: detail.dossiers || [] });
        const certs: any[] = [];
        (detail.dossiers || []).forEach((d: any) => { (d.certificates || []).forEach((c: any) => { certs.push({ ...c, dossier_id: d.id, dossier_identifier: d.identifier }); }); });
        setEntityCertificates(certs);
      }
      setEntityDossiers(dossiers);
    } catch {}
  };

  const handleSelectCert = (sKey: string) => setSelectedCerts(p => p.includes(sKey) ? p.filter(k => k !== sKey) : [...p, sKey]);
  const handleSelectAll = () => { const all = CERT_CARDS.flatMap(c => c.subs.map(s => s.key)); setSelectedCerts(selectedCerts.length === all.length ? [] : all); };

  const handleDownloadAll = () => {
    const selected = CERT_CARDS.flatMap(c => c.subs.filter(s => selectedCerts.includes(s.key))).map(s => { const card = CERT_CARDS.find(c => c.subs.some(ss => ss.key === s.key)); return { key: s.key, label: s.label, url: card?.url || "" }; });
    if (selected.length === 0 || !selectedEntity) return;
    localStorage.setItem("acert_ext_data", JSON.stringify({ acert_person: selectedEntity, acert_dossier_id: entityDossiers[0]?.id || "" }));
    setProcessingFlow(true);
    selected.forEach((s, i) => {
      setTimeout(() => { if (s.url) { localStorage.setItem("acert_cert_key", s.key); window.open(s.url, `_cert_${s.key}`); } setFlowStatus(`${s.label} (${i + 1}/${selected.length})`); }, i * 1500 + 500);
    });
    setTimeout(() => { setProcessingFlow(false); setFlowStatus(""); setCertResults(selected.map(s => ({ key: s.key, label: s.label, obtained_at: new Date().toISOString() }))); setSelectedCerts([]); }, selected.length * 1500 + 2000);
  };

  const certCount = entityCertificates.length + certResults.length;

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
          {selectedEntity && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{selectedEntity.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
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
                <button onClick={() => setSelectedEntity(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }} onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}><X size={15} strokeWidth={2} /></button>
              </div>
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
              <button onClick={handleSelectAll} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", border: "none", background: "transparent", cursor: "pointer" }}>{selectedCerts.length === CERT_CARDS.flatMap(c => c.subs).length ? "Desmarcar todas" : "Selecionar todas"}</button>
              <button onClick={handleDownloadAll} disabled={selectedCerts.length === 0 || !selectedEntity} style={{ fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 5, border: "none", background: selectedCerts.length > 0 && selectedEntity ? "#FF7A00" : "var(--bg-muted)", color: selectedCerts.length > 0 && selectedEntity ? "#FFF" : "var(--text-muted)", cursor: selectedCerts.length > 0 && selectedEntity ? "pointer" : "default", opacity: selectedCerts.length === 0 || !selectedEntity ? 0.5 : 1 }}><Download size={13} strokeWidth={2} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />Emitir ({selectedCerts.length})</button>
            </div>
          </div>

          {processingFlow && (
            <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 8, background: "rgba(255,122,0,0.08)", border: "1px solid rgba(255,122,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,122,0,0.3)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#FF7A00", fontWeight: 600 }}>{flowStatus}</span>
            </div>
          )}

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
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{certCount} documentos</span>
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
                  {certResults.map((cert, i) => (
                    <tr key={`res-${i}`} style={{ borderBottom: "1px solid var(--border-light)" }}><td style={{ padding: "10px" }}><div style={{ width: 14, height: 14, borderRadius: 3, border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}></div></td><td style={{ padding: "10px", fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{cert.label}</td><td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)" }}>A.CERT</td><td style={{ padding: "10px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(5,150,105,0.12)", color: "#059669" }}>Emitida</span></td><td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)" }}>{formatDate(cert.obtained_at)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
