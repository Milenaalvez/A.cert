"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy, Search, ChevronDown, ChevronUp, ExternalLink,
  AlertTriangle, CheckCircle2, XCircle, Clock, Send,
  FileText, Download, Shield, HelpCircle, MessageSquare,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/* ── Types ─────────────────────────────────────────── */
interface FAQItem {
  q: string;
  a: string;
  category: string;
}

interface OrganStatus {
  name: string;
  status: string;
  responseTime?: string;
}

/* ── FAQ Data ──────────────────────────────────────── */
const FAQ_DATA: FAQItem[] = [
  { category: "Dossiês", q: "Como criar um dossiê?", a: "Acesse Dossiês pelo menu lateral, clique em \"Novo Dossiê\" e preencha os dados do proprietário e imóvel. O sistema associará automaticamente as certidões conforme forem emitidas." },
  { category: "Dossiês", q: "Como concluir um dossiê?", a: "Quando todas as certidões estiverem emitidas, abra o dossiê e clique em \"Concluir\". O sistema gerará o PDF consolidado automaticamente." },
  { category: "Dossiês", q: "Como arquivar um dossiê?", a: "Abra o dossiê, clique nos três pontos (⋮) e selecione \"Arquivar\". Dossiês arquivados ficam ocultos da lista principal mas podem ser acessados pelo filtro." },
  { category: "Pessoas", q: "Como cadastrar uma pessoa?", a: "Acesse Pessoas pelo menu lateral, clique em \"Nova Pessoa\" e preencha CPF, nome, data de nascimento e filiação. O CPF é validado automaticamente." },
  { category: "Pessoas", q: "Como vincular imóveis a uma pessoa?", a: "Na página de detalhes da pessoa, vá até a seção \"Imóveis\" e clique em \"Vincular Imóvel\". Selecione o imóvel desejado e a participação percentual." },
  { category: "Imóveis", q: "Como cadastrar um imóvel?", a: "Acesse Imóveis pelo menu lateral, clique em \"Novo Imóvel\", preencha endereço, tipo, metragem e cartório. A inscrição imobiliária é validada conforme o formato do DF." },
  { category: "Imóveis", q: "Como alterar a categoria de um imóvel?", a: "Abra os detalhes do imóvel, clique em \"Editar\" e altere o campo \"Tipo\". As mudanças são registradas na linha do tempo do imóvel." },
  { category: "Certidões", q: "Como emitir certidões?", a: "Acesse Certidões, selecione uma pessoa cadastrada e marque os órgãos desejados. O sistema abrirá os portais automaticamente via automação. Resolva os CAPTCHAs quando solicitado." },
  { category: "Certidões", q: "Como baixar os PDFs das certidões?", a: "Após a emissão, cada certidão aparece com um botão de download. Você também pode gerar o dossiê completo em PDF com todas as certidões consolidadas." },
  { category: "Certidões", q: "Como adicionar certidões ao dossiê?", a: "As certidões emitidas são automaticamente vinculadas ao dossiê ativo da pessoa. Caso precise adicionar manualmente, use a opção \"Ingerir Certidão\" na página do dossiê." },
  { category: "Usuários", q: "Como redefinir a senha de um usuário?", a: "Acesse Usuários, encontre o colaborador, clique nos três pontos (⋮) e selecione \"Resetar Senha\". Uma senha temporária será gerada." },
  { category: "Usuários", q: "Como alterar permissões de acesso?", a: "Na página de detalhes do usuário, vá até a seção \"Permissões\" e utilize os switches para conceder ou revogar acessos por módulo." },
];

/* ── Categories ────────────────────────────────────── */
const CATEGORIES = ["Todas", "Dossiês", "Pessoas", "Imóveis", "Certidões", "Usuários"];

const DOCUMENTATION = [
  { title: "Manual de Dossiês", desc: "Criação, gestão e conclusão de dossiês", icon: FileText },
  { title: "Manual de Certidões", desc: "Emissão e consolidação de certidões", icon: Shield },
  { title: "Manual de Imóveis", desc: "Cadastro e gestão de propriedades", icon: FileText },
  { title: "Manual de Usuários", desc: "Permissões e administração de equipe", icon: HelpCircle },
];

/* ── Helper ────────────────────────────────────────── */
const apiBase = "http://localhost:3001";

/* ── Component ─────────────────────────────────────── */
export default function SuportePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [organStatus, setOrganStatus] = useState<OrganStatus[]>([]);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formCategory, setFormCategory] = useState("Problema técnico");
  const [formMessage, setFormMessage] = useState("");
  const [formSending, setFormSending] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formProtocol, setFormProtocol] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/dashboard`)
      .then(r => r.json())
      .then(d => {
        if (d?.organs) setOrganStatus(d.organs.map((o: any) => ({
          name: o.name,
          status: o.status || "online",
          responseTime: o.avgResponseTime ? `${o.avgResponseTime}ms` : undefined,
        })));
      })
      .catch(() => {});
  }, []);

  const filteredFAQ = FAQ_DATA.filter(f => {
    const matchCat = activeCategory === "Todas" || f.category === activeCategory;
    if (!search.trim()) return matchCat;
    const s = search.toLowerCase();
    return matchCat && (f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s));
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formEmail || !formSubject || !formMessage || formSending) return;
    setFormSending(true);
    setFormError("");
    try {
      const r = await fetch(`${apiBase}/api/support/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, subject: formSubject, category: formCategory, message: formMessage }),
      });
      const d = await r.json();
      if (d.success) {
        setFormSent(true);
        setFormProtocol(d.protocol);
      } else {
        setFormError(d.error || "Erro ao enviar");
      }
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
    } finally {
      setFormSending(false);
    }
  }

  const statusIcon = (s: string) => {
    if (s === "online") return <CheckCircle2 size={14} color="#10B981" />;
    if (s === "unstable") return <AlertTriangle size={14} color="#F59E0B" />;
    if (s === "maintenance") return <Clock size={14} color="#3B82F6" />;
    return <XCircle size={14} color="#EF4444" />;
  };
  const statusLabel = (s: string) => {
    if (s === "online") return "Operacional";
    if (s === "unstable") return "Instabilidade";
    if (s === "maintenance") return "Manutenção";
    return "Indisponível";
  };
  const statusColor = (s: string) => {
    if (s === "online") return "#10B981";
    if (s === "unstable") return "#F59E0B";
    if (s === "maintenance") return "#3B82F6";
    return "#EF4444";
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,122,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LifeBuoy size={22} color="#FF7A00" strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>Suporte</h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>Central de ajuda, documentação e contato com a equipe responsável pelo sistema.</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 32, position: "relative" }}>
          <Search size={18} color="var(--text-tertiary)" style={{ position: "absolute", left: 14, top: 13 }} />
          <input
            placeholder="Como podemos ajudar? Ex: Como emitir uma certidão?"
            value={search}
            onChange={e => { setSearch(e.target.value); setExpandedFAQ(null); }}
            style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 14px 0 42px", fontSize: 14, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* FAQ Categories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setExpandedFAQ(null); }}
              style={{
                padding: "6px 16px", borderRadius: 20, border: activeCategory === cat ? "1px solid #FF7A00" : "1px solid var(--border-default)",
                background: activeCategory === cat ? "rgba(255,122,0,0.08)" : "var(--bg-app)",
                color: activeCategory === cat ? "#FF7A00" : "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Perguntas Frequentes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredFAQ.length === 0 && (
              <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: 24 }}>Nenhum resultado encontrado para "{search}".</p>
            )}
            {filteredFAQ.map((faq, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-app)",
                  overflow: "hidden", transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: "#FF7A00", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{faq.category}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: "4px 0 0" }}>{faq.q}</p>
                  </div>
                  {expandedFAQ === i ? <ChevronUp size={18} color="var(--text-tertiary)" /> : <ChevronDown size={18} color="var(--text-tertiary)" />}
                </div>
                {expandedFAQ === i && (
                  <div style={{ padding: "0 18px 16px" }}>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, borderTop: "1px solid var(--border-default)", paddingTop: 12 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Status do Sistema</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {(organStatus.length > 0 ? organStatus : [
              { name: "TJDFT", status: "online" },
              { name: "TRF1", status: "online" },
              { name: "TRT", status: "online" },
              { name: "SEFAZ-DF", status: "unstable" },
              { name: "Receita Federal", status: "online" },
            ]).map((org, i) => (
              <div key={i} style={{ border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-app)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                {statusIcon(org.status)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{org.name}</div>
                  <div style={{ fontSize: 12, color: statusColor(org.status), fontWeight: 500 }}>{statusLabel(org.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Documentação</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {DOCUMENTATION.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <div key={i} style={{ border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-app)", padding: "16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(255,122,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color="#FF7A00" strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>{doc.desc}</div>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: "#FF7A00", fontSize: 12, fontWeight: 500, cursor: "pointer", padding: 0 }}>
                      <Download size={12} /> Baixar PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Fale Conosco</h3>
          {formSent ? (
            <div style={{ border: "1px solid #10B981", borderRadius: 10, background: "rgba(16,185,129,0.06)", padding: 24, textAlign: "center" }}>
              <CheckCircle2 size={40} color="#10B981" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>Solicitação enviada!</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 12px" }}>Protocolo: <strong style={{ color: "#FF7A00", fontFamily: "monospace" }}>{formProtocol}</strong></p>
              <button
                onClick={() => { setFormSent(false); setFormName(""); setFormEmail(""); setFormSubject(""); setFormMessage(""); setFormProtocol(""); }}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #FF7A00", background: "transparent", color: "#FF7A00", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Nova solicitação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ border: "1px solid var(--border-default)", borderRadius: 12, background: "var(--bg-app)", padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Nome</label>
                  <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Seu nome completo" style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Email</label>
                  <input required type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="seu@email.com" style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Assunto</label>
                  <input required value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Descreva o assunto" style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Categoria</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 10px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}>
                    <option>Problema técnico</option>
                    <option>Sugestão</option>
                    <option>Financeiro</option>
                    <option>Integração</option>
                    <option>Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Mensagem</label>
                <textarea required value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4} placeholder="Descreva sua dúvida ou problema em detalhes..." style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "10px 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              {formError && <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{formError}</p>}
              <button
                type="submit"
                disabled={formSending}
                style={{ alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 8, border: "none", background: formSending ? "rgba(255,122,0,0.5)" : "#FF7A00", color: "#fff", fontSize: 13, fontWeight: 600, cursor: formSending ? "not-allowed" : "pointer" }}
              >
                {formSending ? "Enviando..." : <><Send size={14} /> Enviar</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
