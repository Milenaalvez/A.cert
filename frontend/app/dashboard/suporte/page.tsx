"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy, Search, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertTriangle, Clock, Send,
  FileText, Download, HelpCircle, Shield, MessageSquare,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";

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
    const token = localStorage.getItem("acert_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${apiBase}/api/dashboard`, { headers })
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
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ marginTop: 24 }}>
            <PageHeader
              title="Suporte"
              subtitle="Central de ajuda, documentação e contato com a equipe responsável pelo sistema."
            />
          </div>
        </div>

        {/* FAQ Search */}
        <div className="relative mb-8">
          <Search size={18} className="absolute left-[14px] top-[13px] text-muted" />
          <input
            placeholder="Como podemos ajudar? Ex: Como emitir uma certidão?"
            value={search}
            onChange={e => { setSearch(e.target.value); setExpandedFAQ(null); }}
            className="w-full h-[46px] rounded-[10px] border border-default bg-surface pl-[42px] pr-[14px] text-[14px] text-primary outline-none placeholder:text-muted"
            onFocus={e => e.currentTarget.style.borderColor = "#FF7A00"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
          />
        </div>

        {/* FAQ Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setExpandedFAQ(null); }}
                className={`px-4 py-1.5 rounded-[20px] border text-[13px] font-medium cursor-pointer transition-colors ${
                  active ? "border-[#FF7A00] bg-accent/8 text-[#FF7A00]" : "border-default bg-surface text-secondary hover:border-hover"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="mb-10">
          <h3 className="text-[15px] font-semibold text-primary mb-3.5">Perguntas Frequentes</h3>
          <div className="flex flex-col gap-2">
            {filteredFAQ.length === 0 && (
              <p className="text-muted text-[14px] text-center py-6">Nenhum resultado encontrado para &quot;{search}&quot;.</p>
            )}
            {filteredFAQ.map((faq, i) => (
              <div
                key={i}
                className="rounded-[10px] bg-surface overflow-hidden cursor-pointer"
                onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
              >
                <div className="flex items-center justify-between px-[18px] py-3.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] text-[#FF7A00] font-semibold uppercase tracking-[0.5px]">{faq.category}</span>
                    <p className="text-[14px] font-medium text-primary mt-1">{faq.q}</p>
                  </div>
                  {expandedFAQ === i ? <ChevronUp size={18} className="text-muted shrink-0 ml-3" /> : <ChevronDown size={18} className="text-muted shrink-0 ml-3" />}
                </div>
                {expandedFAQ === i && (
                  <div className="px-[18px] pb-4">
                    <p className="text-[14px] text-secondary leading-relaxed border-t border-default pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="mb-10">
          <h3 className="text-[15px] font-semibold text-primary mb-3.5">Status do Sistema</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
            {(organStatus.length > 0 ? organStatus : [
              { name: "TJDFT", status: "online" },
              { name: "TRF1", status: "online" },
              { name: "TRT", status: "online" },
              { name: "SEFAZ-DF", status: "unstable" },
              { name: "Receita Federal", status: "online" },
            ]).map((org, i) => (
              <div key={i} className="rounded-[10px] bg-surface p-4 flex items-center gap-2.5">
                {statusIcon(org.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-primary">{org.name}</div>
                  <div className="text-[12px] font-medium" style={{ color: statusColor(org.status) }}>{statusLabel(org.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation */}
        <div className="mb-10">
          <h3 className="text-[15px] font-semibold text-primary mb-3.5">Documentação</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
            {DOCUMENTATION.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <div key={i} className="rounded-[10px] bg-surface p-4 flex gap-3 items-start">
                  <div className="w-[38px] h-[38px] rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
                    <Icon size={18} color="#FF7A00" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-primary mb-0.5">{doc.title}</div>
                    <div className="text-[12px] text-muted mb-2">{doc.desc}</div>
                    <button className="inline-flex items-center gap-1 bg-transparent border-none text-[#FF7A00] text-[12px] font-medium cursor-pointer p-0">
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
          <h3 className="text-[15px] font-semibold text-primary mb-3.5">Fale Conosco</h3>
          {formSent ? (
            <div className="border border-[#10B981] rounded-[10px] bg-[rgba(16,185,129,0.06)] p-6 text-center">
              <CheckCircle2 size={40} color="#10B981" className="mb-3 mx-auto" />
              <h3 className="text-[16px] font-bold text-primary mb-1">Solicitação enviada!</h3>
              <p className="text-[14px] text-secondary mb-3">Protocolo: <strong className="text-[#FF7A00] font-mono">{formProtocol}</strong></p>
              <button
                onClick={() => { setFormSent(false); setFormName(""); setFormEmail(""); setFormSubject(""); setFormMessage(""); setFormProtocol(""); }}
                className="px-5 py-2 rounded-lg border border-[#FF7A00] bg-transparent text-[#FF7A00] text-[13px] font-semibold cursor-pointer hover:bg-accent/8 transition-colors"
              >
                Nova solicitação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[12px] bg-surface p-6 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">Nome</label>
                  <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Seu nome completo" className="w-full h-10 rounded-lg border border-default bg-surface px-3 text-[13px] text-primary outline-none placeholder:text-muted" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">Email</label>
                  <input required type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="seu@email.com" className="w-full h-10 rounded-lg border border-default bg-surface px-3 text-[13px] text-primary outline-none placeholder:text-muted" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">Assunto</label>
                  <input required value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Descreva o assunto" className="w-full h-10 rounded-lg border border-default bg-surface px-3 text-[13px] text-primary outline-none placeholder:text-muted" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-secondary block mb-1">Categoria</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full h-10 rounded-lg border border-default bg-surface px-2.5 text-[13px] text-primary outline-none cursor-pointer">
                    <option>Problema técnico</option>
                    <option>Sugestão</option>
                    <option>Financeiro</option>
                    <option>Integração</option>
                    <option>Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-secondary block mb-1">Mensagem</label>
                <textarea required value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4} placeholder="Descreva sua dúvida ou problema em detalhes..." className="w-full rounded-lg border border-default bg-surface px-3 py-2.5 text-[13px] text-primary outline-none resize-y font-[inherit] placeholder:text-muted" />
              </div>
              {formError && <p className="text-[12px] text-[#EF4444] m-0">{formError}</p>}
              <button
                type="submit"
                disabled={formSending}
                className={`self-end inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-none text-white text-[13px] font-semibold transition-colors ${
                  formSending ? "bg-[rgba(255,122,0,0.5)] cursor-not-allowed" : "bg-[#FF7A00] cursor-pointer hover:bg-[#E06900]"
                }`}
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
