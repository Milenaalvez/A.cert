"use client";

import Link from "next/link";
import {
  ScrollText,
  Search,
  FileText,
  Shield,
  Building2,
  TrendingUp,
  Clock,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-[160px] pb-[120px] overflow-hidden bg-[#0D1425]" id="hero">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,122,0,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 80% 60%, rgba(255,122,0,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#FF7A00]/20 bg-[#FF7A00]/[0.06]"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse" />
              <span className="text-[13px] font-medium text-[#FF7A00]">
                Plataforma de certidões imobiliárias
              </span>
            </div>

            <h1 className="text-white font-extrabold leading-[1.05] mb-6" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
              Emissão{" "}
              <span className="text-[#FF7A00]">inteligente</span>
              <br />
              de certidões
              <br />
              imobiliárias
            </h1>

            <div
              style={{ width: "48px", height: "4px", background: "#FF7A00", borderRadius: "999px", marginBottom: "28px" }}
            />

            <p className="text-[18px] text-[#8899B0] leading-[1.7] max-w-[480px] mb-8">
              Automatize consultas em órgãos oficiais, acompanhe emissões em tempo real e gere dossiês completos em minutos — sem burocracia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white bg-[#FF7A00] hover:bg-[#E06900] px-8 py-4 rounded-[16px] transition-all duration-200 shadow-[0_8px_30px_rgba(255,122,0,0.3)] hover:shadow-[0_12px_40px_rgba(255,122,0,0.4)] hover:-translate-y-0.5"
              >
                Criar conta gratuitamente
                <ChevronRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white/80 hover:text-white px-8 py-4 rounded-[16px] border border-white/15 hover:border-white/30 transition-all duration-200 hover:bg-white/[0.04]"
              >
                Ver demonstração
              </Link>
            </div>

            <div className="flex items-center gap-6 text-[13px] text-[#8899B0]">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-[#059669]" />
                <span>LGPD compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-[#059669]" />
                <span>Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-[#059669]" />
                <span>+10.000 certidões emitidas</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-4 rounded-[24px] opacity-40 blur-2xl"
              style={{ background: "linear-gradient(135deg, rgba(255,122,0,0.15), rgba(59,130,246,0.08))" }}
            />
            <div
              className="relative rounded-[20px] overflow-hidden border border-[#1E2A44] shadow-[0_25px_80px_rgba(0,0,0,0.4)]"
              style={{ background: "#0F1729" }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E2A44] bg-[#182338]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/70" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/70" />
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]/70" />
                </div>
                <span className="text-[11px] text-[#8899B0] ml-2 font-medium">A.CERT — Dashboard</span>
              </div>

              <div className="flex" style={{ minHeight: "360px" }}>
                <div className="w-[56px] border-r border-[#1E2A44] bg-[#182338]/50 flex flex-col items-center py-4 gap-4">
                  {[Search, ScrollText, FileText, Building2, Bell].map((Icon, i) => (
                    <div key={i} className={`p-2 rounded-[10px] ${i === 1 ? "bg-[#FF7A00]/15 text-[#FF7A00]" : "text-[#8899B0]"}`}>
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                  ))}
                </div>

                <div className="flex-1 p-5 flex flex-col gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-[#8899B0] uppercase tracking-[0.5px]">Dossiês recentes</span>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 rounded-[14px] border border-[#1E2A44] bg-[#182338] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-[10px] bg-[#3B82F6]/15 flex items-center justify-center">
                          <FileText size={14} className="text-[#3B82F6]" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-white">23</div>
                          <div className="text-[10px] text-[#8899B0]">Emitidas</div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0D1425] overflow-hidden">
                        <div className="h-full w-[75%] rounded-full bg-[#FF7A00]" />
                      </div>
                    </div>

                    <div className="flex-1 rounded-[14px] border border-[#1E2A44] bg-[#182338] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-[10px] bg-[#059669]/15 flex items-center justify-center">
                          <TrendingUp size={14} className="text-[#059669]" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-white">98%</div>
                          <div className="text-[10px] text-[#8899B0]">Sucesso</div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0D1425] overflow-hidden">
                        <div className="h-full w-[98%] rounded-full bg-[#059669]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 rounded-[14px] border border-[#1E2A44] bg-[#182338] p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-white">Certidões em andamento</span>
                      <span className="text-[11px] text-[#FF7A00] font-medium">Ver todas</span>
                    </div>
                    {[
                      { orgao: "Receita Federal", status: "Concluída", color: "#059669" },
                      { orgao: "TJDFT", status: "Em andamento", color: "#FF7A00" },
                      { orgao: "TRF1", status: "Aguardando", color: "#8899B0" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#1E2A44]/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-[12px] text-white/80">{item.orgao}</span>
                        </div>
                        <span className="text-[11px] text-[#8899B0]">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-6 -right-6 w-[120px] h-[120px] rounded-[20px] border border-[#1E2A44] bg-[#182338] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-4 flex flex-col items-center justify-center gap-1"
            >
              <div className="text-[28px] font-extrabold text-[#FF7A00] leading-none">+10k</div>
              <div className="text-[11px] text-[#8899B0] text-center leading-tight">Certidões<br />emitidas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
