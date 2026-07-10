"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        paddingTop: "140px",
        paddingBottom: "120px",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(180deg, #0D1425 0%, #0F1729 50%, #0D1425 100%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
        className="max-lg:grid-cols-1"
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid rgba(255,122,0,0.15)",
              background: "rgba(255,122,0,0.05)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF7A00", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#FF7A00", letterSpacing: "0.3px" }}>
              Plataforma de certidões imobiliárias
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(44px, 5.5vw, 68px)",
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#FFFFFF",
              letterSpacing: "-0.5px",
              marginBottom: 24,
            }}
          >
            Emissão{" "}
            <span style={{ color: "#FF7A00" }}>inteligente</span>
            <br />
            de certidões
            <br />
            imobiliárias
          </h1>

          <div
            style={{
              width: 48,
              height: 4,
              background: "linear-gradient(90deg, #FF7A00, rgba(255,122,0,0.2))",
              borderRadius: 999,
              marginBottom: 28,
            }}
          />

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: "#8899B0",
              maxWidth: 480,
              marginBottom: 36,
            }}
          >
            Automatize consultas em órgãos oficiais, acompanhe emissões em tempo real e gere dossiês completos em minutos — sem burocracia.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/cadastro"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 24px",
                borderRadius: 8,
                border: "none",
                background: "#FF7A00",
                color: "#FFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E06900";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,122,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FF7A00";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Criar conta gratuitamente
              <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="#como-funciona"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 24px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                e.currentTarget.style.color = "#FFF";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Ver demonstração
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          className="max-lg:hidden"
        >
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4), 0 0 60px rgba(255,122,0,0.05)",
            }}
          >
            <Image
              src="/images/lading-page.png"
              alt="Dashboard A.CERT"
              width={600}
              height={400}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
              }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
