"use client";

import { useState } from "react";
import { X, SendHorizontal, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";

const CATEGORIES = [
  { key: "problema", label: "Problema técnico", emoji: "🔧" },
  { key: "duvida", label: "Dúvida", emoji: "❓" },
  { key: "certidao", label: "Erro em certidão", emoji: "📜" },
  { key: "acesso", label: "Acesso ou senha", emoji: "🔐" },
  { key: "sugestao", label: "Sugestão", emoji: "💡" },
  { key: "outro", label: "Outro", emoji: "📩" },
];

export default function TicketModal({ open, onClose, user }: {
  open: boolean;
  onClose: () => void;
  user?: { name?: string; email?: string } | null;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("problema");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function close() {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setCategory("problema");
    setMessage("");
    setSent(false);
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) {
      setError("Preencha todos os campos.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const cat = CATEGORIES.find(c => c.key === category);
      const token = localStorage.getItem("acert_token");
      const r = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, email, subject: cat?.label || category, category: cat?.label || "Problema técnico", message }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao enviar");
      setProtocol(data.protocol);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar ticket");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={close}>
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
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-muted hover:text-primary hover:bg-subtle transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(5,150,105,0.12)" }}>
              <CheckCircle2 size={28} strokeWidth={1.5} color="#059669" />
            </div>
            <h3 className="text-[16px] font-bold text-primary mb-1">Ticket enviado!</h3>
            <p className="text-[13px] text-muted mb-1">Protocolo: <span className="font-semibold text-primary">{protocol}</span></p>
            <p className="text-[12px] text-muted">Responderemos em até 24h úteis.</p>
            <button onClick={() => { setSent(false); setCategory("problema"); setMessage(""); }} className="flex items-center gap-1.5 h-[38px] px-5 mt-6 rounded-lg text-[13px] font-medium text-secondary border border-default hover:border-[#FF7A00] hover:text-[#FF7A00] transition-all">
              <MessageSquare size={14} /> Novo ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-7">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="w-full h-12 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-surface px-5 focus:border-[#FF7A00] placeholder:text-muted" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full h-12 rounded-[8px] text-[13px] text-primary outline-none border border-default bg-surface px-5 focus:border-[#FF7A00] placeholder:text-muted" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.4px]">Qual o motivo?</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`flex items-center gap-2 h-11 px-3 rounded-[8px] text-[12px] font-medium transition-all duration-150 border ${
                        category === cat.key
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
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Descreva sua dúvida ou problema..." rows={4} className="w-full rounded-[8px] text-[13px] text-primary outline-none border border-default bg-surface px-5 py-4 focus:border-[#FF7A00] placeholder:text-muted resize-none" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-4">
                <AlertTriangle size={14} color="#DC2626" />
                <span className="text-[13px] text-[#DC2626]">{error}</span>
              </div>
            )}
            <button type="submit" disabled={sending} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 44, marginTop: 48, borderRadius: 8, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {sending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
              ) : (
                <><SendHorizontal size={14} /> Enviar ticket</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
