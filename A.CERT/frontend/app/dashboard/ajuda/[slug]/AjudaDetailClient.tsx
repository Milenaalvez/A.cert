"use client";

import { useState } from "react";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Play, Search, LayoutGrid, List, ChevronRight, Rocket, FolderOpen, Users, ScrollText, Building2, FileText, BarChart3, UserCog, Settings, Trash2, BookOpen } from "lucide-react";
import { categorias, Guia } from "@/data/ajuda";
import DashboardLayout from "@/components/DashboardLayout";
const ICONE_MAP: Record<string, any> = {
  "primeiros-passos": Rocket,
  "dossies": FolderOpen,
  "pessoas": Users,
  "emissao-certidoes": ScrollText,
  "orgaos-integrados": Building2,
  "dossies-pdf": FileText,
  "relatorios": BarChart3,
  "usuarios-empresas": UserCog,
  "configuracoes": Settings,
  "lixeira-recuperacao": Trash2,
};

const NIVEL: Record<string, { cor: string; label: string }> = {
  "primeiros-passos": { cor: "#059669", label: "Iniciante" },
  "dossies": { cor: "#059669", label: "Iniciante" },
  "pessoas": { cor: "#059669", label: "Iniciante" },
  "emissao-certidoes": { cor: "#D97706", label: "Intermediário" },
  "orgaos-integrados": { cor: "#D97706", label: "Intermediário" },
  "dossies-pdf": { cor: "#D97706", label: "Intermediário" },
  "relatorios": { cor: "#D97706", label: "Intermediário" },
  "usuarios-empresas": { cor: "#DC2626", label: "Avançado" },
  "configuracoes": { cor: "#DC2626", label: "Avançado" },
  "lixeira-recuperacao": { cor: "#059669", label: "Iniciante" },
};

export default function AjudaDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("recentes");
  const [viewGrid, setViewGrid] = useState(false);

  const categoriasFiltradas = busca.trim()
    ? categorias.filter(c =>
        c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        c.artigos.some(a => a.titulo.toLowerCase().includes(busca.toLowerCase()))
      )
    : categorias;

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
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Documentação</h1>
            <p className="text-[14px] text-secondary leading-relaxed">Encontre guias para configurar sua conta, emitir certidões e utilizar todos os recursos da A.CERT.</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 h-10 rounded-[10px] bg-surface border border-default px-3.5 mb-6 focus-within:border-[#FF7A00] focus-within:shadow-[0_0_0_3px_rgba(255,122,0,0.12)] transition-all duration-150" style={{ maxWidth: 480 }}>
          <Search size={16} strokeWidth={2} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar na documentação..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 h-full bg-transparent text-[14px] text-primary outline-none placeholder:text-muted"
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-end gap-3 mb-8">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewGrid(false)}
              className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors ${!viewGrid ? "bg-subtle text-primary" : "text-muted hover:text-secondary"}`}
              style={{ border: "none", cursor: "pointer", background: !viewGrid ? "var(--bg-subtle)" : "transparent" }}
            >
              <List size={15} strokeWidth={2} />
            </button>
            <button
              onClick={() => setViewGrid(true)}
              className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors ${viewGrid ? "bg-subtle text-primary" : "text-muted hover:text-secondary"}`}
              style={{ border: "none", cursor: "pointer", background: viewGrid ? "var(--bg-subtle)" : "transparent" }}
            >
              <LayoutGrid size={15} strokeWidth={2} />
            </button>
          </div>
          <select
            value={ordem}
            onChange={e => setOrdem(e.target.value)}
            className="h-9 rounded-[8px] text-[12px] text-primary outline-none border border-default bg-surface px-3 appearance-none cursor-pointer focus:border-[#FF7A00]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30 }}
          >
            {[
              { v: "recentes", l: "Mais recentes" },
              { v: "acessados", l: "Mais acessados" },
              { v: "alfabetica", l: "Ordem alfabética" },
            ].map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-6">
          {categoriasFiltradas.map((cat) => {
            const nivel = NIVEL[cat.slug] || { cor: "#059669", label: "Iniciante" };
            return (
              <div
                key={cat.slug}
                className="bg-surface border border-default rounded-[14px] hover:border-[#FF7A00]/20 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                style={{ padding: "28px 32px 22px" }}
              >
                <div className="flex items-start gap-5" style={{ marginBottom: 18 }}>
                  {React.createElement(ICONE_MAP[cat.slug] || BookOpen, { size: 32, strokeWidth: 1.5, color: "#FF7A00", className: "shrink-0", style: { marginTop: 2 } })}
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-primary group-hover:text-[#FF7A00] transition-colors">{cat.titulo}</h3>
                    <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{cat.descricao}</p>
                  </div>
                </div>
                <div className="border-t border-default" style={{ marginBottom: 22 }} />
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2.5">Artigos</p>
                <div className="flex flex-col gap-1" style={{ marginBottom: 40 }}>
                  {cat.artigos.map((art, i) => (
                    <div
                      key={i}
                      onClick={() => art.slug && router.push(`/dashboard/ajuda/${cat.slug}/${art.slug}`)}
                      className={`flex items-center justify-between gap-2 py-1.5 px-1.5 -mx-1.5 rounded-[6px] transition-colors ${art.slug ? "cursor-pointer hover:bg-subtle group" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ChevronRight size={12} strokeWidth={2} className="text-muted shrink-0 group-hover:text-[#FF7A00] transition-colors" />
                        <span className="text-[12px] text-primary group-hover:text-[#FF7A00] transition-colors truncate">{art.titulo}</span>
                      </div>
                      {art.slug && (
                        <span className="text-[10px] text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">Ler artigo</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
                  <span className="text-[13px] text-secondary font-medium">{cat.artigos.length} artigos</span>
                  <span className="text-[13px] font-semibold" style={{ color: nivel.cor }}>⬤ {nivel.label}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
