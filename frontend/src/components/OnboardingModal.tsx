"use client";

import { useState } from "react";
import { FolderOpen, ScrollText, FileText, CheckCircle2 } from "lucide-react";

const CARDS = [
  {
    icon: FolderOpen,
    titulo: "Bem-vinda à A.CERT",
    descricao: "Centralize e automatize a emissão de certidões imobiliárias em poucos minutos.",
  },
  {
    icon: FolderOpen,
    titulo: "Crie dossiês",
    descricao: "Organize transações de venda ou locação com múltiplos participantes e imóveis.",
  },
  {
    icon: ScrollText,
    titulo: "Emita certidões",
    descricao: "Consulte 7 órgãos públicos simultaneamente e acompanhe em tempo real.",
  },
  {
    icon: FileText,
    titulo: "Gere PDFs",
    descricao: "Compile todas as certidões em um dossiê profissional pronto pra compartilhar.",
  },
  {
    icon: CheckCircle2,
    titulo: "Tudo pronto",
    descricao: "Agora é só começar. A Central de Ajuda está sempre disponível se precisar.",
  },
];

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === CARDS.length - 1;

  function next() {
    if (last) { onClose(); return; }
    setStep(s => s + 1);
  }

  function skip() { onClose(); }

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
          padding: "40px 44px 36px",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 mb-6"
          style={{ background: "rgba(255,122,0,0.12)" }}
        >
          <Icon size={32} strokeWidth={1.5} color="#FF7A00" />
        </div>

        <h2 className="text-[20px] font-bold text-primary mb-2">{card.titulo}</h2>
        <p className="text-[14px] text-secondary leading-relaxed mb-8 max-w-[380px]">{card.descricao}</p>

        <div className="flex items-center gap-2 mb-8">
          {CARDS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: 8,
                height: 8,
                background: i === step ? "#FF7A00" : "var(--bg-elevated)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between w-full">
          {!last ? (
            <>
              <button
                onClick={skip}
                className="text-[13px] font-medium text-muted hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
              >
                Pular
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
              Começar a usar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
