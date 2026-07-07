"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, HelpCircle } from "lucide-react";
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

export default function ArtigoDetailClient() {
  const { slug, artigo: artigoSlug } = useParams<{ slug: string; artigo: string }>();
  const router = useRouter();
  const key = `${slug}/${artigoSlug}`;
  const artigo = artigosDetalhes[key];
  const categoria = categorias.find(c => c.slug === slug);

  const [activeId, setActiveId] = useState("");
  const [showTicket, setShowTicket] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    artigo?.conteudo.forEach((bloco) => {
      const el = sectionRefs.current[bloco.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [artigo]);

  function scrollTo(id: string) {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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

        {/* Breadcrumb */}
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

        {/* 2-col layout */}
        <div className="flex gap-10">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.12)", fontSize: 28 }}>{artigo.icone}</div>
                <div>
                  <p className="text-[12px] font-semibold text-[#FF7A00] uppercase tracking-wider mb-1">{artigo.subtitulo}</p>
                  <h1 className="text-[28px] font-bold text-primary tracking-tight leading-tight">{artigo.titulo}</h1>
                  <p className="text-[14px] text-secondary mt-2 leading-relaxed max-w-[640px]">{artigo.descricao}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: NIVEL_COR[artigo.nivel] }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: NIVEL_COR[artigo.nivel] }} />
                      {artigo.nivel === "iniciante" ? "Iniciante" : artigo.nivel === "intermediario" ? "Intermediário" : "Avançado"}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-muted"><Clock size={12} /> {artigo.tempo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content blocks */}
            <div className="flex flex-col gap-8">
              {artigo.conteudo.map((bloco, i) => {
                const content = (
                  <div key={i} id={bloco.id} ref={(el) => { sectionRefs.current[bloco.id] = el; }}>
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
                        <h3 className="text-[16px] font-bold text-primary mb-3">{bloco.titulo}</h3>
                        <p className="text-[14px] text-secondary leading-relaxed">{bloco.texto}</p>
                      </div>
                    )}
                    {bloco.tipo === "amarelo" && (
                      <div className="p-6 rounded-[16px]" style={{ ...CARD_AMBER, padding: "28px 32px" }}>
                        <h3 className="text-[16px] font-bold text-primary mb-4">{bloco.titulo}</h3>
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
                        <h3 className="text-[16px] font-bold text-primary mb-5">{bloco.titulo}</h3>
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
                    {bloco.tipo === "veja-tambem" && (
                      <div className="hidden">{/* moved to sidebar */}</div>
                    )}
                  </div>
                );
                return content;
              })}
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-default">
              <button
                onClick={() => router.push(`/dashboard/ajuda/${slug}`)}
                className="flex items-center gap-2 text-[13px] text-secondary hover:text-[#FF7A00] transition-colors cursor-pointer bg-transparent border-none"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
                Voltar para {categoria.titulo}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block shrink-0" style={{ width: 280, position: "relative" }}>
            <div style={{ position: "sticky", top: 100 }}>

              {/* Nesta página */}
              <div className="mb-8" style={{ paddingRight: 8 }}>
                <h4 className="text-[11px] font-semibold text-muted uppercase tracking-[0.5px] mb-4">Nesta página</h4>
                <div className="flex flex-col">
                  {artigo.conteudo.filter(b => b.tipo !== "veja-tambem").map((bloco) => {
                    const active = activeId === bloco.id;
                    return (
                      <button
                        key={bloco.id}
                        onClick={() => scrollTo(bloco.id)}
                        className="flex items-center gap-3 text-left py-2 px-3 -mx-3 rounded-[8px] transition-all duration-150 cursor-pointer bg-transparent border-none group"
                      >
                        <div
                          className="shrink-0 rounded-full transition-all duration-200"
                          style={{
                            width: active ? 3 : 2,
                            height: active ? 16 : 12,
                            background: active ? "#FF7A00" : "var(--bg-elevated)",
                          }}
                        />
                        <span
                          className="text-[13px] transition-colors leading-snug"
                          style={{ color: active ? "#FF7A00" : "var(--text-secondary)", fontWeight: active ? 600 : 400 }}
                        >
                          {bloco.titulo || ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ainda precisa de ajuda */}
              <div
                className="p-5 rounded-[14px] mb-8"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.12)" }}>
                    <HelpCircle size={14} strokeWidth={1.5} color="#FF7A00" />
                  </div>
                  <p className="text-[13px] font-semibold text-primary">Precisa de ajuda?</p>
                </div>
                <p className="text-[12px] text-muted mb-4 leading-relaxed">
                  Se não encontrou o que precisava, nossa equipe está pronta para te ajudar.
                </p>
                <button
                  onClick={() => setShowTicket(true)}
                  className="w-full h-9 rounded-[7px] bg-[#FF7A00] text-white text-[12px] font-semibold hover:bg-[#E06900] transition-all border-none cursor-pointer"
                >
                  Abrir ticket
                </button>
              </div>

              {/* Veja também */}
              {artigo.conteudo.some(b => b.tipo === "veja-tambem") && (
                <div style={{ paddingRight: 8 }}>
                  <h4 className="text-[11px] font-semibold text-muted uppercase tracking-[0.5px] mb-4">Veja também</h4>
                  <div className="flex flex-col">
                    {artigo.conteudo.find(b => b.tipo === "veja-tambem")?.links?.map((link, j) => (
                      <button
                        key={j}
                        onClick={() => router.push(`/dashboard/ajuda/${slug}/${link.slug}`)}
                        className="flex items-center gap-2 text-left py-2 px-3 -mx-3 rounded-[8px] text-[13px] text-secondary hover:text-[#FF7A00] hover:bg-subtle transition-all duration-150 cursor-pointer bg-transparent border-none group"
                      >
                        <ChevronRight size={13} strokeWidth={2} className="shrink-0 text-muted group-hover:text-[#FF7A00] transition-colors" />
                        <span>{link.titulo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <TicketModal open={showTicket} onClose={() => setShowTicket(false)} />
      </div>
    </DashboardLayout>
  );
}
