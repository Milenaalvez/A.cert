"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ChevronRight, CirclePlay, Lightbulb, Mail, Clock, MessageSquare, Zap, X, SendHorizontal, CheckCircle2, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/contexts/UserContext";

const TICKET_CATEGORIES = [
  { key: "problema", label: "Problema técnico", emoji: "🔧" },
  { key: "duvida", label: "Dúvida", emoji: "❓" },
  { key: "certidao", label: "Erro em certidão", emoji: "📜" },
  { key: "acesso", label: "Acesso ou senha", emoji: "🔐" },
  { key: "sugestao", label: "Sugestão", emoji: "💡" },
  { key: "outro", label: "Outro", emoji: "📩" },
];

const cardStyle: React.CSSProperties = {
  borderRadius: "16px",
  boxShadow: "0 25px 80px rgba(0,0,0,0.18)",
  padding: "18px 36px 24px",
  minHeight: "420px",
};

const dicas = [
  { t: "Preencha todos os dados", d: "Quanto mais completo o cadastro da pessoa, maior a taxa de acerto nas consultas." },
  { t: "Mantenha o navegador visível", d: "Não minimize o navegador durante as consultas para evitar falhas nos CAPTCHAs." },
  { t: "Resolva CAPTCHAs rapidamente", d: "Quanto mais rápido resolver, menor a chance de timeout da sessão." },
  { t: "Verifique os PDFs emitidos", d: "Sempre confira se o documento gerado corresponde à certidão esperada." },
  { t: "Use a matrícula do imóvel", d: "Ative a opção de matrícula para obter certidões de ônus reais e ficha cadastral." },
  { t: "Mantenha backups regulares", d: "Faça backup dos dados periodicamente em Configurações → Sistema." },
  { t: "Atualize permissões da equipe", d: "Revise as permissões dos usuários para garantir que cada um acesse apenas o necessário." },
  { t: "Acompanhe os relatórios", d: "Use os relatórios para identificar gargalos e melhorar os processos da equipe." },
  { t: "Consulte a documentação", d: "Em caso de dúvidas, a documentação está sempre disponível nesta central de ajuda." },
  { t: "Mantenha o sistema atualizado", d: "Verifique regularmente se há novas versões disponíveis da plataforma." },
];

export default function CentralAjudaPage() {
  return (
    <DashboardLayout>
      <CentralAjudaContent />
    </DashboardLayout>
  );
}

function CentralAjudaContent() {
  const { user } = useUser();
  const router = useRouter();
  const [expandedDica, setExpandedDica] = useState<number | null>(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketCategory, setTicketCategory] = useState("problema");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketProtocol, setTicketProtocol] = useState("");
  const [ticketError, setTicketError] = useState("");

  function openTicketModal() {
    setTicketName(user?.name || "");
    setTicketEmail(user?.email || "");
    setTicketCategory("problema");
    setTicketMessage("");
    setTicketSent(false);
    setTicketError("");
    setShowTicketModal(true);
  }

  async function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketName || !ticketEmail || !ticketMessage) {
      setTicketError("Preencha todos os campos.");
      return;
    }
    setTicketError("");
    setTicketSending(true);
    try {
      const cat = TICKET_CATEGORIES.find(c => c.key === ticketCategory);
      const token = localStorage.getItem("acert_token");
      const r = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: ticketName, email: ticketEmail, subject: cat?.label || ticketCategory, category: cat?.label || "Problema técnico", message: ticketMessage }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao enviar");
      setTicketProtocol(data.protocol);
      setTicketSent(true);
    } catch (err: any) {
      setTicketError(err.message || "Erro ao enviar ticket");
    } finally {
      setTicketSending(false);
    }
  }

  return (
    <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <div className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-1.5 min-w-0">
            <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Central de Ajuda</h1>
            <p className="text-[14px] text-secondary leading-relaxed">Encontre respostas rápidas, aprenda a utilizar a A.CERT e resolva dúvidas sem precisar aguardar atendimento.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 48 }}>
        <div className="flex items-center gap-3 w-full max-w-[640px] h-12 rounded-[12px] bg-surface border border-default px-4 focus-within:border-[#FF7A00] focus-within:shadow-[0_0_0_3px_rgba(255,122,0,0.12)] transition-all duration-150">
          <Search size={18} strokeWidth={1.5} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar tópicos, funcionalidades, dúvidas frequentes"
            className="flex-1 h-full bg-transparent text-[14px] text-primary outline-none placeholder:text-muted"
          />
        </div>
        <p className="text-[12px] text-muted mt-7">
          Exemplos: como criar um dossiê, emitir certidões, adicionar pessoa, permissões, PDF...
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Documentação */}
        <div className="bg-surface border border-default" style={cardStyle}>
          <div className="flex items-start gap-4" style={{ marginBottom: 20 }}>
            <BookOpen size={48} strokeWidth={1.5} color="#FF7A00" className="shrink-0" style={{ marginTop: 6 }} />
            <div>
              <h3 className="text-[16px] font-bold text-primary mb-1">Documentação</h3>
              <p className="text-[13px] text-secondary leading-relaxed">Guias completos, manuais e artigos para utilizar todos os recursos da A.CERT.</p>
            </div>
          </div>
          <div className="border-t border-default" style={{ marginBottom: 24 }} />
          <div className="flex flex-col gap-0.5">
            {[
              { t: "Primeiros passos", slug: "primeiros-passos" },
              { t: "Dossiês", slug: "dossies" },
              { t: "Pessoas", slug: "pessoas" },
              { t: "Emissão de Certidões", slug: "emissao-certidoes" },
              { t: "Órgãos Integrados", slug: "orgaos-integrados" },
              { t: "Dossiês e PDF", slug: "dossies-pdf" },
              { t: "Relatórios", slug: "relatorios" },
              { t: "Usuários e Empresas", slug: "usuarios-empresas" },
              { t: "Configurações", slug: "configuracoes" },
              { t: "Lixeira e recuperação", slug: "lixeira-recuperacao" },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => router.push(`/dashboard/ajuda/${item.slug}`)}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-subtle rounded-[6px] py-1.5 px-1.5 -mx-1.5 transition-colors"
              >
                <ChevronRight size={14} strokeWidth={2} className="text-muted shrink-0" />
                <span className="text-[12px] font-medium text-primary">{item.t}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard/ajuda/conhecendo-plataforma")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginTop: 20 }}
          >
            Acessar documentação <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Vídeo Tutoriais */}
        <div className="bg-surface border border-default" style={cardStyle}>
          <div className="flex items-start gap-4" style={{ marginBottom: 20 }}>
            <CirclePlay size={48} strokeWidth={1.5} color="#FF7A00" className="shrink-0" style={{ marginTop: 6 }} />
            <div>
              <h3 className="text-[16px] font-bold text-primary mb-1">Tutoriais</h3>
              <p className="text-[13px] text-secondary leading-relaxed">Guias passo a passo com vídeos e textos explicativos. Aprenda cada funcionalidade na prática.</p>
            </div>
          </div>
          <div className="border-t border-default" style={{ marginBottom: 24 }} />
          <div className="flex flex-col gap-0.5">
            {[
              { t: "Primeiros passos", slug: "primeiros-passos" },
              { t: "Dossiês", slug: "dossies" },
              { t: "Pessoas", slug: "pessoas" },
              { t: "Emissão de Certidões", slug: "emissao-certidoes" },
              { t: "Órgãos Integrados", slug: "orgaos-integrados" },
              { t: "Dossiês e PDF", slug: "dossies-pdf" },
              { t: "Relatórios", slug: "relatorios" },
              { t: "Usuários e Empresas", slug: "usuarios-empresas" },
              { t: "Configurações", slug: "configuracoes" },
              { t: "Lixeira e recuperação", slug: "lixeira-recuperacao" },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => router.push(`/dashboard/ajuda/${item.slug}`)}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-subtle rounded-[6px] py-1.5 px-1.5 -mx-1.5 transition-colors"
              >
                <ChevronRight size={14} strokeWidth={2} className="text-muted shrink-0" />
                <span className="text-[12px] font-medium text-primary">{item.t}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard/ajuda/conhecendo-plataforma")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginTop: 20 }}
          >
            Ver todos os tutoriais <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Dicas e Boas Práticas */}
        <div className="bg-surface border border-default" style={cardStyle}>
          <div className="flex items-start gap-4" style={{ marginBottom: 20 }}>
            <Lightbulb size={48} strokeWidth={1.5} color="#FF7A00" className="shrink-0" style={{ marginTop: 6 }} />
            <div>
              <h3 className="text-[16px] font-bold text-primary mb-1">Dicas e Boas Práticas</h3>
              <p className="text-[13px] text-secondary leading-relaxed">Recomendações para aumentar a eficiência e a taxa de sucesso das emissões de certidões.</p>
            </div>
          </div>
          <div className="border-t border-default" style={{ marginBottom: 24 }} />
          <div className="flex flex-col gap-0.5">
            {dicas.map((item, i) => (
              <div key={i}>
                <div
                  onClick={() => setExpandedDica(expandedDica === i ? null : i)}
                  className="flex items-center gap-2.5 cursor-pointer hover:bg-subtle rounded-[6px] py-1.5 px-1.5 -mx-1.5 transition-colors"
                >
                  <ChevronRight
                    size={14}
                    strokeWidth={2}
                    className={`text-muted shrink-0 transition-transform duration-150 ${expandedDica === i ? "rotate-90 text-[#FF7A00]" : ""}`}
                  />
                  <span className={`text-[12px] transition-colors ${expandedDica === i ? "font-semibold text-[#FF7A00]" : "font-medium text-primary"}`}>{item.t}</span>
                </div>
                {expandedDica === i && (
                  <p className="text-[11px] text-muted ml-6 mb-1.5 leading-relaxed">{item.d}</p>
                )}
              </div>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginTop: 20 }}>
            Ver mais dicas <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Contact Bar */}
      <div
        className="bg-surface border border-default grid items-center hover:shadow-lg transition-all duration-200"
        style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.18)", height: "104px", padding: "0 40px", marginTop: 40, gridTemplateColumns: "1.8fr 1fr 1fr 1fr" }}
      >
        {/* Col 1: Title */}
        <div className="flex items-center gap-5" style={{ paddingLeft: 24, paddingRight: 48 }}>
          <Mail size={48} strokeWidth={1.5} color="#FF7A00" className="shrink-0" />
          <div>
            <span className="text-[14px] font-semibold text-primary block">Ainda precisa de ajuda?</span>
            <span className="text-[12px] text-muted mt-0.5 block">Não encontrou sua resposta? Fale com nossa equipe.</span>
          </div>
        </div>

        {/* Col 2: Email */}
        <div onClick={openTicketModal} className="flex items-center gap-5 cursor-pointer hover:opacity-80 transition-opacity" style={{ paddingLeft: 40, paddingRight: 40, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <MessageSquare size={48} strokeWidth={1.5} color="#3B82F6" className="shrink-0" />
          <div>
            <span className="text-[14px] font-semibold text-primary block">suporte@acert.tech</span>
            <span className="text-[12px] text-muted mt-0.5 block">Clique para enviar um ticket</span>
          </div>
        </div>

        {/* Col 3: Hours */}
        <div className="flex items-center gap-5" style={{ paddingLeft: 40, paddingRight: 40, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <Clock size={48} strokeWidth={1.5} color="#059669" className="shrink-0" />
          <div>
            <span className="text-[14px] font-semibold text-primary block">Seg-Sex, 9h às 18h</span>
            <span className="text-[12px] text-muted mt-0.5 block">Horário de atendimento</span>
          </div>
        </div>

        {/* Col 4: Response time */}
        <div className="flex items-center gap-5" style={{ paddingLeft: 40, paddingRight: 40, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <Zap size={48} strokeWidth={1.5} color="#FF7A00" className="shrink-0" />
          <div>
            <span className="text-[14px] font-semibold text-primary block">Resposta em até 24h úteis</span>
            <span className="text-[12px] text-muted mt-0.5 block">Tempo médio de resposta</span>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTicketModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[480px] bg-surface border border-default animate-in fade-in zoom-in-95 duration-200"
            style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.35)", padding: "24px 40px 40px" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 19 }}>
              <div>
                <h2 className="text-[18px] font-bold text-primary">Ticket de Suporte</h2>
                <p className="text-[13px] text-muted mt-1">Envie uma mensagem direta para nossa equipe.</p>
              </div>
              <button onClick={() => setShowTicketModal(false)} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-muted hover:text-primary hover:bg-subtle transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {ticketSent ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(5,150,105,0.12)" }}>
                  <CheckCircle2 size={28} strokeWidth={1.5} color="#059669" />
                </div>
                <h3 className="text-[16px] font-bold text-primary mb-1">Ticket enviado!</h3>
                <p className="text-[13px] text-muted mb-1">Protocolo: <span className="font-semibold text-primary">{ticketProtocol}</span></p>
                <p className="text-[12px] text-muted">Responderemos em até 24h úteis.</p>
                <button onClick={() => { setTicketSent(false); setTicketCategory("problema"); setTicketMessage(""); }} className="flex items-center gap-1.5 h-[38px] px-5 mt-6 rounded-lg text-[13px] font-medium text-secondary border border-default hover:border-[#FF7A00] hover:text-[#FF7A00] transition-all">
                  <MessageSquare size={14} /> Novo ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit}>
                <div className="flex flex-col gap-7">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Nome</label>
                      <input type="text" value={ticketName} onChange={e => setTicketName(e.target.value)} placeholder="Seu nome" className="w-full h-12 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-surface px-5 focus:border-[#FF7A00] placeholder:text-muted" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Email</label>
                      <input type="email" value={ticketEmail} onChange={e => setTicketEmail(e.target.value)} placeholder="seu@email.com" className="w-full h-12 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-surface px-5 focus:border-[#FF7A00] placeholder:text-muted" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Qual o motivo?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TICKET_CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setTicketCategory(cat.key)}
                          className={`flex items-center gap-2 h-11 px-3 rounded-[8px] text-[12px] font-medium transition-all duration-150 border ${
                            ticketCategory === cat.key
                              ? "border-[#FF7A00] bg-[#FF7A00]/10 text-[#FF7A00]"
                              : "border-default text-secondary hover:border-[#FF7A00]/30 hover:text-primary"
                          }`}
                        >
                          <span className="text-[14px]">{cat.emoji}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Mensagem</label>
                    <textarea value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Descreva sua dúvida ou problema..." rows={4} className="w-full rounded-[8px] text-[13px] text-primary outline-none border border-default bg-surface px-5 py-4 focus:border-[#FF7A00] placeholder:text-muted resize-none" />
                  </div>
                </div>
                {ticketError && (
                  <div className="flex items-center gap-2 mt-4">
                    <AlertTriangle size={14} color="#DC2626" />
                    <span className="text-[13px] text-[#DC2626]">{ticketError}</span>
                  </div>
                )}
                <button type="submit" disabled={ticketSending} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 44, marginTop: 48, borderRadius: 8, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {ticketSending ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><SendHorizontal size={14} /> Enviar ticket</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
