"use client";

import Link from "next/link";
import { Shield, Clock, TrendingUp, ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        minHeight: "100vh",
        paddingTop: "120px",
        paddingBottom: "120px",
        background: "linear-gradient(180deg, #030205 0%, #080312 50%, #05020A 100%)",
      }}
      id="hero"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,122,0,0.05) 0%, transparent 60%), radial-gradient(ellipse 30% 40% at 80% 70%, rgba(124,58,237,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[900px] mx-auto px-6 text-center">
        <div
          className="inline-flex items-center gap-2 mb-10 px-4 py-2 rounded-full"
          style={{
            border: "1px solid rgba(255,122,0,0.15)",
            background: "rgba(255,122,0,0.05)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse" />
          <span className="text-[12px] font-medium text-[#FF7A00] tracking-[0.5px]">
            Plataforma de certidões imobiliárias
          </span>
        </div>

        <h1
          className="text-white font-extrabold leading-[0.95] mb-8"
          style={{
            fontFamily: "'Hanken Grotesk', 'Inter', sans-serif",
            fontSize: "clamp(48px, 7vw, 86px)",
            letterSpacing: "-1px",
          }}
        >
          Emissão{" "}
          <span className="text-[#FF7A00]">inteligente</span>
          <br />
          de certidões
          <br />
          imobiliárias
        </h1>

        <div
          style={{
            width: "48px",
            height: "4px",
            background: "linear-gradient(90deg, #FF7A00, rgba(255,122,0,0.3))",
            borderRadius: "999px",
            margin: "0 auto 36px",
          }}
        />

        <p
          className="mx-auto mb-12"
          style={{
            maxWidth: "520px",
            fontSize: "16px",
            lineHeight: "1.8",
            color: "rgba(216,180,254,0.65)",
          }}
        >
          Automatize consultas em órgãos oficiais, acompanhe emissões em tempo real e gere dossiês completos em minutos — sem burocracia.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-[12px] transition-all duration-300"
            style={{
              fontSize: "14px",
              letterSpacing: "0.5px",
              background: "linear-gradient(135deg, rgba(255,122,0,0.9), rgba(255,122,0,0.7))",
              boxShadow: "0 8px 32px rgba(255,122,0,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,122,0,0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,122,0,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Criar conta gratuitamente
            <ChevronRight size={16} strokeWidth={2.5} />
          </Link>
          <Link
            href="#como-funciona"
            className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-[12px] transition-all duration-300"
            style={{
              fontSize: "14px",
              letterSpacing: "0.5px",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Ver demonstração
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {[
            { icon: Shield, text: "LGPD compliant" },
            { icon: Clock, text: "Setup em 2 minutos" },
            { icon: TrendingUp, text: "+10.000 certidões emitidas" },
          ].map(({ icon: Icon, text }, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5"
              style={{
                fontSize: "13px",
                color: "rgba(216,180,254,0.45)",
              }}
            >
              <Icon size={15} style={{ color: "rgba(5,150,105,0.7)" }} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
