"use client";

import { useState, useEffect, useRef } from "react";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Rocket, CheckCircle2, Lightbulb, MessageCircleQuestion } from "lucide-react";
import { artigosDetalhes, categorias } from "@/data/ajuda";
import DashboardLayout from "@/components/DashboardLayout";
import TicketModal from "@/components/TicketModal";

const NIVEL_COR: Record<string, string> = {
  iniciante: "#059669",
  intermediario: "#D97706",
  avancado: "#DC2626",
};

const CARD_BLUE = { background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" };
const CARD_GREEN = { background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.12)" };
const CARD_AMBER = { background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.12)" };
const ICONE_ARTIGO: Record<string, any> = {
  "bem-vindo-a-acert": Rocket, "primeiro-acesso": Rocket, "conhecendo-dashboard": Rocket,
  "navegando-sistema": Rocket, "fluxo-completo": Rocket,
};

export default function ArtigoDetailClient() {
  const { slug, artigo: artigoSlug } = useParams<{ slug: string; artigo: string }>();
  const router = useRouter();
  const key = `${slug}/${artigoSlug}`;
  const artigo = artigosDetalhes[key];
  const categoria = categorias.find(c => c.slug === slug);

  const [showTicket, setShowTicket] = useState(false);

  if (!artigo || !categoria) {
    return (
      <DashboardLayout>
        <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[14px] text-muted">Artigo não encontrado.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>

        <div style={{ marginTop: 24, marginBottom: 32 }}>
          <div className="flex items-center gap-1.5 text-[12px] text-muted flex-wrap">
            <button onClick={() => router.push("/dashboard/suporte")} className="hover:text-[#FF7A00] transition-colors">Central de Ajuda</button>
            <ChevronRight size={12} strokeWidth={1.5} />
            <button onClick={() => router.push(`/dashboard/ajuda/${slug}`)} className="hover:text-[#FF7A00] transition-colors">Documentação</button>
            <ChevronRight size={12} strokeWidth={1.5} />
            <button onClick={() => router.push(`/dashboard/ajuda/${slug}`)} className="hover:text-[#FF7A00] transition-colors">{categoria.titulo}</button>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-primary font-medium">{artigo.titulo}</span>
          </div>
        </div>

        <div className="flex gap-10">
          <div className="flex-1 min-w-0">
            <div style={{ marginBottom: 48 }}>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.12)" }}>
                  {React.createElement(ICONE_ARTIGO[artigo.slug] || Rocket, { size: 26, strokeWidth: 1.5, color: "#FF7A00" })}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#FF7A00] uppercase tracking-wider mb-2">{artigo.subtitulo}</p>
                  <h1 className="text-[28px] font-bold text-primary tracking-tight leading-tight mb-3">{artigo.titulo}</h1>
                  <p className="text-[14px] text-secondary leading-relaxed max-w-[680px] mb-4">{artigo.descricao}</p>
                  <div className="flex items-center gap-5 pb-3 border-b border-default">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: NIVEL_COR[artigo.nivel] }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: NIVEL_COR[artigo.nivel] }} />
                      {artigo.nivel === "iniciante" ? "Iniciante" : artigo.nivel === "intermediario" ? "Intermediário" : "Avançado"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-muted">
                      <span className="w-1 h-1 rounded-full bg-muted" />
                      {artigo.tempo}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-muted">
                      <span className="w-1 h-1 rounded-full bg-muted" />
                      Atualizado em {artigo.atualizado || "07/07/2026"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {artigo.conteudo.map((bloco, i) => (
                <div key={i}>
                  {bloco.tipo === "hero" && (
                    <div>
                      <h2 className="text-[18px] font-bold text-primary mb-3">{bloco.titulo}</h2>
                      <p className="text-[15px] text-secondary leading-relaxed">{bloco.texto}</p>
                    </div>
                  )}
                  {bloco.tipo === "azul" && (
                    <div className="p-6 rounded-[16px]" style={{ ...CARD_BLUE, padding: "28px 32px" }}>
                      <h3 className="text-[16px] font-bold text-primary mb-3">{bloco.titulo}</h3>
                      <p className="text-[14px] text-secondary leading-relaxed">{bloco.texto}</p>
                    </div>
                  )}
                  {bloco.tipo === "verde" && (
                    <div className="p-6 rounded-[16px]" style={{ ...CARD_GREEN, padding: "28px 32px" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 size={20} strokeWidth={1.5} color="#059669" />
                        <h3 className="text-[16px] font-bold text-primary">{bloco.titulo}</h3>
                      </div>
                      <p className="text-[14px] text-secondary leading-relaxed">{bloco.texto}</p>
                    </div>
                  )}
                  {bloco.tipo === "amarelo" && (
                    <div className="p-6 rounded-[16px]" style={{ ...CARD_AMBER, padding: "28px 32px" }}>
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb size={20} strokeWidth={1.5} color="#D97706" />
                        <h3 className="text-[16px] font-bold text-primary">{bloco.titulo}</h3>
                      </div>
                      <p className="text-[14px] text-secondary leading-relaxed whitespace-pre-line">{bloco.texto}</p>
                    </div>
                  )}
                  {bloco.tipo === "timeline" && (
                    <div>
                      <h3 className="text-[18px] font-bold text-primary mb-6">{bloco.titulo}</h3>
                      <div className="flex flex-col">
                        {bloco.passos?.map((passo, j) => (
                          <div key={j} className="flex items-start gap-5 relative">
                            <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
                              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold shrink-0 relative z-10" style={{ background: "rgba(255,122,0,0.12)", color: "#FF7A00" }}>
                                {j + 1}
                              </div>
                              {j < (bloco.passos?.length || 0) - 1 && (
                                <div className="flex-1 w-0.5 my-1" style={{ background: "rgba(255,122,0,0.20)", minHeight: 40 }} />
                              )}
                            </div>
                            <div className="min-w-0 pb-8">
                              <h4 className="text-[15px] font-semibold text-primary">{passo.titulo}</h4>
                              <p className="text-[14px] text-secondary mt-1.5 leading-relaxed">{passo.texto}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {bloco.tipo === "problemas" && (
                    <div className="p-6 rounded-[16px] bg-surface border border-default" style={{ padding: "28px 32px" }}>
                      <div className="flex items-center gap-3 mb-5">
                        <MessageCircleQuestion size={20} strokeWidth={1.5} color="#FF7A00" />
                        <h3 className="text-[16px] font-bold text-primary">{bloco.titulo}</h3>
                      </div>
                      <div className="flex flex-col gap-4">
                        {bloco.problemas?.map((p, j) => (
                          <div key={j}>
                            <p className="text-[14px] font-semibold text-primary">"{p.q}"</p>
                            <p className="text-[14px] text-secondary mt-1.5">{p.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-default">
                <button
                  onClick={() => router.push(`/dashboard/ajuda/${slug}`)}
                  className="flex items-center gap-2 text-[13px] text-secondary hover:text-[#FF7A00] transition-colors cursor-pointer bg-transparent border-none"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                  Voltar para {categoria.titulo}
                </button>
              </div>
            </div>
          </div>
        </div>

        <TicketModal open={showTicket} onClose={() => setShowTicket(false)} />
      </div>
    </DashboardLayout>
  );
}
