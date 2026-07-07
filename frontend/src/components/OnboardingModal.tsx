"use client";

import { useState } from "react";
import { FolderOpen, ScrollText, FileText, CheckCircle2, X, HelpCircle } from "lucide-react";

const CARDS = [
  {
    icon: FolderOpen,
    titulo: "Bem-vinda à A.CERT",
    descricao: "Automatize a emissão de certidões imobiliárias, organize dossiês e acompanhe todo o processo em um único lugar.",
  },
  {
    icon: FolderOpen,
    titulo: "Crie dossiês completos",
    descricao: "Organize vendas e locações com múltiplos participantes, imóveis e documentos em poucos cliques.",
  },
  {
    icon: ScrollText,
    titulo: "Emita certidões automaticamente",
    descricao: "Consulte diversos órgãos públicos e acompanhe o andamento das emissões em tempo real.",
  },
  {
    icon: FileText,
    titulo: "Gere dossiês profissionais",
    descricao: "Reúna todas as certidões em um único PDF organizado e pronto para compartilhamento.",
  },
  {
    icon: CheckCircle2,
    titulo: "Tudo pronto!",
    descricao: "Agora você já pode começar a utilizar a A.CERT.",
  },
];

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"left" | "right">("left");
  const last = step === CARDS.length - 1;

  function next() {
    if (last) { onClose(); return; }
    setDir("left");
    setStep(s => s + 1);
  }

  function prev() {
    setDir("right");
    setStep(s => Math.max(0, s - 1));
  }

  const card = CARDS[step];
  const Icon = card.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full bg-surface border border-default animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center"
        style={{
          maxWidth: 480,
          borderRadius: 16,
          boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
          padding: "36px 44px 32px",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-[6px] flex items-center justify-center text-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer border-none bg-transparent"
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 mb-5"
          style={{ background: "rgba(255,122,0,0.12)" }}
        >
          <Icon size={32} strokeWidth={1.5} color="#FF7A00" />
        </div>

        {/* Content with slide animation */}
        <div style={{ overflow: "hidden", width: "100%" }}>
          <div
            key={step}
            className="flex flex-col items-center"
            style={{
              animation: `slide-${dir} 250ms ease-out`,
            }}
          >
            <h2 className="text-[20px] font-bold text-primary mb-2">{card.titulo}</h2>
            <p className="text-[14px] text-secondary leading-relaxed mb-6 max-w-[380px]">{card.descricao}</p>
          </div>
        </div>

        {/* Central de Ajuda highlight (last card only) */}
        {last && (
          <div
            className="flex items-start gap-3 w-full text-left mb-6 rounded-[10px]"
            style={{ background: "rgba(255,122,0,0.06)", border: "1px solid rgba(255,122,0,0.12)", padding: "14px 16px" }}
          >
            <HelpCircle size={18} strokeWidth={1.5} color="#FF7A00" className="shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-primary">Precisa de ajuda?</p>
              <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                Nossa Central de Ajuda reúne documentação completa, vídeos tutoriais e um canal de suporte para que você encontre respostas sempre que precisar.
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-3 w-full mb-6" style={{ maxWidth: 280 }}>
          <span className="text-[11px] text-muted shrink-0">{step + 1} de {CARDS.length}</span>
          <div className="flex-1 flex items-center gap-1.5">
            {CARDS.map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-300"
                style={{
                  height: 4,
                  background: i <= step ? "#FF7A00" : "var(--bg-elevated)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between w-full">
          {!last ? (
            <>
              <button
                onClick={step === 0 ? onClose : prev}
                className="text-[13px] font-medium text-muted hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
              >
                {step === 0 ? "Fechar" : "Voltar"}
              </button>
              <button
                onClick={next}
                className="flex items-center justify-center gap-2 h-[42px] px-6 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#E06900] transition-all duration-150 border-none cursor-pointer"
              >
                Próximo
              </button>
            </>
          ) : (
            <button
              onClick={next}
              className="flex items-center justify-center gap-2 w-full h-[42px] rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#E06900] transition-all duration-150 border-none cursor-pointer"
            >
              Acessar Dashboard
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-left {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
