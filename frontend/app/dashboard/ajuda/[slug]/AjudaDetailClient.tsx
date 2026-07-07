"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, BookOpen, Play } from "lucide-react";
import { guias } from "@/data/ajuda";
import DashboardLayout from "@/components/DashboardLayout";

const sectionBox = "bg-surface border border-default animate-in fade-in zoom-in-95 duration-200";
const cardStyle: React.CSSProperties = {
  borderRadius: "16px",
  boxShadow: "0 25px 80px rgba(0,0,0,0.18)",
  padding: "18px 36px 24px",
};

export default function AjudaDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const guia = guias.find(g => g.slug === slug);

  if (!guia) {
    return (
      <DashboardLayout>
        <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>
          <div style={{ marginTop: 24 }}>
            <button onClick={() => router.push("/dashboard/suporte")} className="flex items-center gap-2 text-[13px] text-secondary hover:text-[#FF7A00] transition-colors mb-8">
              <ChevronLeft size={16} strokeWidth={1.5} />
              Central de Ajuda
            </button>
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[14px] text-muted">Guia não encontrado.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full" style={{ minHeight: "100vh" }}>

        {/* Breadcrumb */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <button
            onClick={() => router.push("/dashboard/suporte")}
            className="flex items-center gap-1.5 text-[13px] text-secondary hover:text-[#FF7A00] transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            Central de Ajuda
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32, marginTop: 16 }}>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,122,0,0.12)" }}>
              <BookOpen size={24} strokeWidth={1.5} color="#FF7A00" />
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">{guia.titulo}</h1>
              <p className="text-[14px] text-secondary mt-2 leading-relaxed">{guia.descricao}</p>
            </div>
          </div>
        </div>

        {/* Video (if available) */}
        {guia.videoUrl && (
          <div className={`${sectionBox} mb-8`} style={cardStyle}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-default">
              <Play size={16} strokeWidth={2} color="#FF7A00" />
              <h3 className="text-[15px] font-bold text-primary">Vídeo tutorial</h3>
            </div>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 12 }}>
              <iframe
                src={guia.videoUrl}
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 12 }}
              />
            </div>
          </div>
        )}

        {/* Guia passo a passo */}
        <div className={sectionBox} style={{ ...cardStyle, padding: "28px 36px 32px" }}>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-default">
            <BookOpen size={16} strokeWidth={2} color="#FF7A00" />
            <h3 className="text-[15px] font-bold text-primary">Guia passo a passo</h3>
          </div>
          <div className="flex flex-col gap-4">
            {guia.passos.map((passo, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 text-[13px] font-bold"
                  style={{ background: "rgba(255,122,0,0.12)", color: "#FF7A00", marginTop: 1 }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[14px] font-semibold text-primary">{passo.titulo}</h4>
                  <p className="text-[13px] text-secondary mt-1 leading-relaxed">{passo.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
