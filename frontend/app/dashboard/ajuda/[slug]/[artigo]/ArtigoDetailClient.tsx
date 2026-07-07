"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { artigosDetalhes, categorias } from "@/data/ajuda";
import DashboardLayout from "@/components/DashboardLayout";

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

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.12)", fontSize: 32 }}>{artigo.icone}</div>
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

        {/* Content */}
        <div className="flex flex-col gap-6" style={{ maxWidth: 780 }}>
          {artigo.conteudo.map((bloco, i) => {
            if (bloco.tipo === "hero") return (
              <div key={i}>
                <h2 className="text-[18px] font-bold text-primary mb-3">{bloco.titulo}</h2>
                <p className="text-[14px] text-secondary leading-relaxed">{bloco.texto}</p>
              </div>
            );

            if (bloco.tipo === "azul") return (
              <div key={i} className="p-6 rounded-[14px]" style={CARD_BLUE}>
                <h3 className="text-[15px] font-bold text-primary mb-2">{bloco.titulo}</h3>
                <p className="text-[13px] text-secondary leading-relaxed">{bloco.texto}</p>
              </div>
            );

            if (bloco.tipo === "verde") return (
              <div key={i} className="p-6 rounded-[14px]" style={CARD_GREEN}>
                <h3 className="text-[15px] font-bold text-primary mb-2">{bloco.titulo}</h3>
                <p className="text-[13px] text-secondary leading-relaxed">{bloco.texto}</p>
              </div>
            );

            if (bloco.tipo === "amarelo") return (
              <div key={i} className="p-6 rounded-[14px]" style={CARD_AMBER}>
                <h3 className="text-[15px] font-bold text-primary mb-3">{bloco.titulo}</h3>
                <p className="text-[13px] text-secondary leading-relaxed whitespace-pre-line">{bloco.texto}</p>
              </div>
            );

            if (bloco.tipo === "timeline") return (
              <div key={i}>
                <h3 className="text-[15px] font-bold text-primary mb-4">{bloco.titulo}</h3>
                <div className="flex flex-col gap-4">
                  {bloco.passos?.map((passo, j) => (
                    <div key={j} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 text-[13px] font-bold" style={{ background: "rgba(255,122,0,0.12)", color: "#FF7A00" }}>
                        {j + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-semibold text-primary">{passo.titulo}</h4>
                        <p className="text-[13px] text-secondary mt-1 leading-relaxed">{passo.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

            if (bloco.tipo === "problemas") return (
              <div key={i} className="p-6 rounded-[14px] bg-surface border border-default" style={{ padding: "24px 28px" }}>
                <h3 className="text-[15px] font-bold text-primary mb-4">{bloco.titulo}</h3>
                <div className="flex flex-col gap-3">
                  {bloco.problemas?.map((p, j) => (
                    <div key={j}>
                      <p className="text-[13px] font-semibold text-primary">"{p.q}"</p>
                      <p className="text-[13px] text-secondary mt-1">{p.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            );

            if (bloco.tipo === "veja-tambem") return (
              <div key={i} className="p-6 rounded-[14px]" style={{ background: "rgba(255,122,0,0.04)", border: "1px solid rgba(255,122,0,0.08)" }}>
                <h3 className="text-[15px] font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">Veja também</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {bloco.links?.map((link, j) => (
                    <button
                      key={j}
                      onClick={() => router.push(`/dashboard/ajuda/${slug}/${link.slug}`)}
                      className="flex items-center gap-2 text-[13px] text-[#FF7A00] hover:text-[#E06900] transition-colors cursor-pointer bg-transparent border-none text-left py-1"
                    >
                      <ArrowRight size={14} />
                      {link.titulo}
                    </button>
                  ))}
                </div>
              </div>
            );

            return null;
          })}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-default" style={{ maxWidth: 780 }}>
          <button
            onClick={() => router.push(`/dashboard/ajuda/${slug}`)}
            className="flex items-center gap-2 text-[13px] text-secondary hover:text-[#FF7A00] transition-colors cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            Voltar para {categoria.titulo}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
