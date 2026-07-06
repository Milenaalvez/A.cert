"use client";

import { useState, useEffect } from "react";
import {
  LifeBuoy, MessageSquare, BookOpen, HelpCircle, FileText,
  Activity, RefreshCw, HardDrive,
  AlertTriangle, CheckCircle2, SendHorizontal,
  ChevronDown, Mail, Phone, MapPin, Clock,
  Shield, Zap, Search, Star,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/contexts/UserContext";

const apiBase = "";

const FAQ_DATA = [
  { q: "Como criar um dossiê?", a: "Acesse Dossiês pelo menu lateral, clique em \"Novo Dossiê\" e preencha os dados do proprietário e imóvel." },
  { q: "Como emitir certidões?", a: "Acesse Certidões, selecione uma pessoa cadastrada e marque os órgãos desejados. Resolva os CAPTCHAs quando solicitado." },
  { q: "Como cadastrar uma pessoa?", a: "Acesse Pessoas, clique em \"Nova Pessoa\" e preencha os dados. O CPF é validado automaticamente." },
  { q: "Como baixar os PDFs das certidões?", a: "Após a emissão, cada certidão aparece com um botão de download. Você também pode gerar o dossiê completo em PDF." },
  { q: "Como redefinir a senha de um usuário?", a: "Acesse Usuários, encontre o colaborador, clique nos três pontos e selecione \"Resetar Senha\"." },
  { q: "Como alterar permissões de acesso?", a: "Na página de detalhes do usuário, vá até a seção \"Permissões\" e utilize os switches para conceder ou revogar acessos." },
  { q: "Como recuperar um dossiê excluído?", a: "Acesse a Lixeira no menu lateral. Dossiês excluídos ficam armazenados por 30 dias antes da remoção permanente." },
  { q: "Como funciona o backup do sistema?", a: "Os dados são salvos automaticamente. Você também pode gerar um backup manual na seção Configurações → Sistema." },
];

const CATEGORIES = ["Problema técnico", "Dúvida sobre funcionalidade", "Erro em certidão", "Sugestão de melhoria", "Solicitação de acesso", "Outro"];

const sectionBox = "bg-surface p-8 rounded-[10px]";
const btnOutline = "flex items-center justify-center gap-1.5 h-[38px] px-5 text-[13px] font-semibold bg-transparent text-secondary border border-default hover:border-[#FF7A00] hover:text-[#FF7A00] rounded-lg cursor-pointer transition-all duration-150";
const inputField = "w-full h-10 rounded-[8px] text-[13px] text-primary outline-none font-[inherit] box-border border border-default bg-surface px-3 focus:border-[#FF7A00] placeholder:text-muted";
const selectField = "w-full h-10 rounded-[8px] text-[13px] text-primary outline-none font-[inherit] box-border border border-default bg-surface px-3 appearance-none focus:border-[#FF7A00] cursor-pointer";
const labelStyle = "block text-[12px] font-semibold text-secondary uppercase tracking-[0.3px] mb-1.5";

export default function SuportePage() {
  return (
    <DashboardLayout>
      <SuporteContent />
    </DashboardLayout>
  );
}

function SuporteContent() {
  const { user } = useUser();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState(CATEGORIES[0]);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketProtocol, setTicketProtocol] = useState("");
  const [ticketError, setTicketError] = useState("");

  useEffect(() => {
    if (user?.name && !ticketName) setTicketName(user.name);
    if (user?.email && !ticketEmail) setTicketEmail(user.email);
  }, [user]);

  async function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketName || !ticketEmail || !ticketSubject || !ticketMessage) {
      setTicketError("Preencha todos os campos obrigatórios.");
      return;
    }
    setTicketError("");
    setTicketSending(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`${apiBase}/api/support/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: ticketName, email: ticketEmail, subject: ticketSubject, category: ticketCategory, message: ticketMessage }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao enviar ticket");
      setTicketProtocol(data.protocol);
      setTicketSent(true);
    } catch (err: any) {
      setTicketError(err.message || "Erro ao enviar ticket");
    } finally {
      setTicketSending(false);
    }
  }

  const filteredFaq = FAQ_DATA.filter(
    f => !faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full">

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginTop: 24 }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,122,0,0.15), rgba(255,122,0,0.05))" }}>
              <LifeBuoy size={22} strokeWidth={1.5} color="#FF7A00" />
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Central de Ajuda</h1>
              <p className="text-[14px] text-secondary mt-1">Encontre respostas rápidas, aprenda a utilizar a A.CERT e resolva dúvidas sem precisar aguardar atendimento.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-5 mb-8">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <HelpCard
            icon={BookOpen} title="Base de Conhecimento"
            desc="Guias, manuais e documentação completa do sistema."
            action="Acessar guias" color="#FF7A00"
          />
          <HelpCard
            icon={FileText} title="Documentação Técnica"
            desc="Manual técnico de integrações e funcionalidades da plataforma."
            action="Abrir docs" color="#7C3AED"
          />
        </div>

        {/* Center column - tall */}
        <HelpCard
          icon={HelpCircle} title="Perguntas Frequentes"
          desc="Respostas rápidas para as dúvidas mais comuns dos usuários. Encontre soluções para emissão de certidões, cadastros, permissões e configurações do sistema."
          action="Ver FAQ" color="#3B82F6"
          onClick={() => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <HelpCard
            icon={MessageSquare} title="Abrir Chamado"
            desc="Precisa de ajuda? Envie uma solicitação diretamente para nossa equipe de suporte."
            action="Novo chamado" color="#059669"
            onClick={() => setTicketOpen(!ticketOpen)}
          />
          <HelpCard
            icon={Shield} title="Segurança"
            desc="Boas práticas, políticas de acesso e proteção de dados da plataforma."
            action="Saiba mais" color="#D97706"
          />
        </div>
      </div>

      {/* Ticket Form */}
      <div className={`${sectionBox} mb-8`} style={{ padding: "28px 32px" }}>
        <button
          onClick={() => { setTicketOpen(!ticketOpen); setTicketSent(false); setTicketError(""); }}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <MessageSquare size={18} strokeWidth={1.5} color="#059669" />
            <div>
              <h3 className="text-[15px] font-semibold text-primary">Chamado de Suporte</h3>
              <p className="text-[13px] text-muted mt-0.5">Envie uma solicitação diretamente para nossa equipe</p>
            </div>
          </div>
          <ChevronDown size={18} strokeWidth={1.5} className={`text-muted transition-transform duration-200 ${ticketOpen ? "rotate-180" : ""}`} />
        </button>

        {ticketOpen && (
          <div className="pt-6 mt-6 border-t border-default">
            {ticketSent ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(5,150,105,0.12)" }}>
                  <CheckCircle2 size={28} strokeWidth={1.5} color="#059669" />
                </div>
                <h3 className="text-[16px] font-bold text-primary mb-1">Chamado enviado com sucesso</h3>
                <p className="text-[13px] text-muted mb-1">Protocolo: <span className="font-semibold text-primary">{ticketProtocol}</span></p>
                <p className="text-[12px] text-muted">Nossa equipe responderá em até 24h úteis.</p>
                <button onClick={() => { setTicketSent(false); setTicketSubject(""); setTicketMessage(""); }} className={`${btnOutline} mt-6`}>
                  <MessageSquare size={14} /> Novo chamado
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelStyle}>Nome</label>
                    <input type="text" value={ticketName} onChange={e => setTicketName(e.target.value)} placeholder="Seu nome completo" className={inputField} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelStyle}>Email</label>
                    <input type="email" value={ticketEmail} onChange={e => setTicketEmail(e.target.value)} placeholder="seu@email.com" className={inputField} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelStyle}>Categoria</label>
                    <select value={ticketCategory} onChange={e => setTicketCategory(e.target.value)} className={selectField} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelStyle}>Assunto</label>
                    <input type="text" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Resumo do problema" className={inputField} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-5">
                  <label className={labelStyle}>Mensagem</label>
                  <textarea value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Descreva seu problema em detalhes para que possamos ajudar..." rows={4} className="w-full rounded-[8px] text-[13px] text-primary outline-none font-[inherit] box-border border border-default bg-surface px-3 py-2.5 focus:border-[#FF7A00] placeholder:text-muted resize-none" />
                </div>
                {ticketError && (
                  <div className="flex items-center gap-2 mt-4">
                    <AlertTriangle size={14} color="#DC2626" />
                    <span className="text-[13px] text-[#DC2626]">{ticketError}</span>
                  </div>
                )}
                <button type="submit" disabled={ticketSending} className="flex items-center justify-center gap-2 h-[38px] px-6 mt-5 rounded-lg bg-[#059669] text-white text-[13px] font-semibold hover:bg-[#047857] transition-all duration-150 disabled:opacity-50">
                  {ticketSending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando chamado...</> : <><SendHorizontal size={14} /> Enviar chamado</>}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Solutions + FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-8" id="faq-section">
        {/* Solutions */}
        <div className={sectionBox}>
          <div className="flex items-center gap-2 mb-5">
            <Zap size={16} strokeWidth={1.5} className="text-[#FF7A00]" />
            <h2 className="text-[15px] font-semibold text-primary">Soluções Rápidas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Activity, label: "Diagnóstico", desc: "Verifique a saúde do sistema", color: "#FF7A00" },
              { icon: Activity, label: "Integrações", desc: "Status dos órgãos conectados", color: "#3B82F6" },
              { icon: RefreshCw, label: "Atualizações", desc: "Histórico de versões e changelog", color: "#7C3AED" },
              { icon: HardDrive, label: "Backup", desc: "Gerencie cópias de segurança", color: "#DC2626" },
              { icon: Shield, label: "Segurança", desc: "Políticas e configurações de acesso", color: "#059669" },
              { icon: Search, label: "Consultar Ticket", desc: "Acompanhe o status do seu chamado", color: "#D97706" },
            ].map((sol, i) => {
              const Icon = sol.icon;
              return (
                <button key={i} className="flex items-center gap-3 p-4 rounded-[10px] text-left border border-transparent hover:border-[#FF7A00]/20 hover:bg-subtle transition-all duration-200 group">
                  <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: `${sol.color}12` }}>
                    <Icon size={16} strokeWidth={1.5} color={sol.color} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold text-primary group-hover:text-[#FF7A00] transition-colors block">{sol.label}</span>
                    <span className="text-[12px] text-muted mt-0.5 block">{sol.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className={sectionBox} style={{ padding: "28px" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} strokeWidth={1.5} className="text-[#3B82F6]" />
              <h3 className="text-[15px] font-semibold text-primary">FAQ</h3>
            </div>
            <span className="text-[12px] text-muted">{filteredFaq.length} perguntas</span>
          </div>
          <div className="relative mb-4">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder="Buscar pergunta..." className="w-full h-9 rounded-[8px] text-[13px] text-primary font-[inherit] outline-none border border-default bg-transparent pl-9 pr-3 focus:border-[#FF7A00] placeholder:text-muted" />
          </div>
          <div className="flex flex-col max-h-[380px] overflow-y-auto">
            {filteredFaq.length === 0 ? (
              <p className="text-[13px] text-muted text-center py-8">Nenhuma pergunta encontrada.</p>
            ) : (
              filteredFaq.map((faq, i) => (
                <div key={i} className="border-b border-default last:border-0">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex items-center justify-between w-full py-3 text-left group">
                    <span className={`text-[13px] transition-colors ${faqOpen === i ? "text-[#FF7A00] font-semibold" : "text-primary font-medium group-hover:text-[#FF7A00]"}`}>{faq.q}</span>
                    <ChevronDown size={14} strokeWidth={1.5} className={`text-muted shrink-0 transition-transform duration-200 ${faqOpen === i ? "rotate-180 text-[#FF7A00]" : ""}`} />
                  </button>
                  {faqOpen === i && <p className="text-[13px] text-muted pb-3 leading-relaxed">{faq.a}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className={sectionBox}>
        <div className="flex items-center gap-2 mb-5">
          <Phone size={16} strokeWidth={1.5} className="text-[#FF7A00]" />
          <h3 className="text-[15px] font-semibold text-primary">Canais de Atendimento</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: Mail, label: "contato@acert.tech", desc: "Email de suporte", color: "#3B82F6" },
            { icon: Clock, label: "Seg-Sex, 9h às 18h", desc: "Horário de atendimento", color: "#059669" },
            { icon: MapPin, label: "Brasília, DF", desc: "Sede da empresa", color: "#7C3AED" },
            { icon: Star, label: "+55 61 99999-9999", desc: "Telefone comercial", color: "#FF7A00" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: `${item.color}12` }}>
                  <Icon size={16} strokeWidth={1.5} color={item.color} />
                </div>
                <div>
                  <span className="text-[13px] font-medium text-primary block">{item.label}</span>
                  <span className="text-[12px] text-muted block mt-0.5">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function HelpCard({ icon: Icon, title, desc, action, color, onClick }: {
  icon: any; title: string; desc: string; action: string; color: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${sectionBox} text-left cursor-pointer border border-transparent hover:border-[#FF7A00]/20 hover:shadow-sm transition-all duration-200 group h-full flex flex-col`}
      style={{ padding: "24px 28px" }}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
          <Icon size={18} strokeWidth={1.5} color={color} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-primary group-hover:text-[#FF7A00] transition-colors">{title}</h3>
          <p className="text-[13px] text-muted mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-default">
        <span className="text-[12px] font-semibold" style={{ color }}>{action}</span>
        <ChevronDown size={12} style={{ color, transform: "rotate(-90deg)" }} />
      </div>
    </button>
  );
}
