"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  FolderOpen,
  Clock,
  CheckCircle2,
  Files,
  ArrowUpRight,
  Plus,
  UserPlus,
  Building2,
  BarChart3,
  FileText,
  ScrollText,
  ExternalLink,
  Home,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const summaryCards = [
  {
    label: "Dossiês em andamento",
    value: "12",
    change: "+2 desde ontem",
    icon: FolderOpen,
    color: "#FF7A00",
    bg: "rgba(255, 122, 0, 0.07)",
  },
  {
    label: "Aguardando pendências",
    value: "4",
    change: "+1 desde ontem",
    icon: Clock,
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.07)",
  },
  {
    label: "Concluídos",
    value: "28",
    change: "+5 desde ontem",
    icon: CheckCircle2,
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.07)",
  },
  {
    label: "Total de dossiês",
    value: "44",
    change: "este mês",
    icon: Files,
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.07)",
  },
];

const tabs = ["Todos", "Em andamento", "Aguardando pendências", "Concluídos"];

const dossies = [
  {
    id: "#2024-0001",
    pessoa: "Carlos Almeida",
    imovel: "Rua das Flores, 123 — Centro",
    certidoes: 4,
    status: "Em andamento",
    atualizado: "16/06/2026",
  },
  {
    id: "#2024-0002",
    pessoa: "Maria Fernandes",
    imovel: "Av. Paulista, 1500 — Bela Vista",
    certidoes: 6,
    status: "Concluído",
    atualizado: "15/06/2026",
  },
  {
    id: "#2024-0003",
    pessoa: "João Oliveira",
    imovel: "Rua Augusta, 789 — Consolação",
    certidoes: 3,
    status: "Pendente",
    atualizado: "14/06/2026",
  },
  {
    id: "#2024-0004",
    pessoa: "Ana Santos",
    imovel: "Alameda Santos, 456 — Jardins",
    certidoes: 5,
    status: "Em andamento",
    atualizado: "14/06/2026",
  },
  {
    id: "#2024-0005",
    pessoa: "Pedro Rocha",
    imovel: "Rua Oscar Freire, 900 — Pinheiros",
    certidoes: 2,
    status: "Concluído",
    atualizado: "13/06/2026",
  },
  {
    id: "#2024-0006",
    pessoa: "Lucia Mendes",
    imovel: "Rua da Consolação, 2000 — Centro",
    certidoes: 4,
    status: "Em andamento",
    atualizado: "13/06/2026",
  },
  {
    id: "#2024-0007",
    pessoa: "Roberto Lima",
    imovel: "Av. Brasil, 500 — Jardim América",
    certidoes: 3,
    status: "Pendente",
    atualizado: "12/06/2026",
  },
];

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
  "Em andamento": { bg: "rgba(255, 122, 0, 0.08)", color: "#C2410C", dot: "#FF7A00" },
  Concluído: { bg: "rgba(5, 150, 105, 0.08)", color: "#065F46", dot: "#059669" },
  Pendente: { bg: "rgba(220, 38, 38, 0.08)", color: "#991B1B", dot: "#DC2626" },
};

const certidoesList = [
  {
    nome: "Certidão de Ônus Reais",
    orgao: "Cartório de Registro",
    status: "Obtida",
  },
  {
    nome: "Certidão de Propriedade",
    orgao: "Cartório de Imóveis",
    status: "Obtida",
  },
  {
    nome: "Certidão Negativa Municipal",
    orgao: "Prefeitura",
    status: "Pendente",
  },
  {
    nome: "Certidão de Débitos",
    orgao: "Procuradoria",
    status: "Pendente",
  },
  {
    nome: "Certidão de Ônus Fiscais",
    orgao: "Receita Federal",
    status: "Pendente",
  },
];

const quickActions = [
  { label: "Novo Dossiê", icon: Plus, color: "#FF7A00" },
  { label: "Cadastrar Pessoa", icon: UserPlus, color: "#2563EB" },
  { label: "Cadastrar Imóvel", icon: Building2, color: "#059669" },
  { label: "Relatórios", icon: BarChart3, color: "#7C3AED" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered =
    activeTab === "Todos"
      ? dossies
      : activeTab === "Em andamento"
        ? dossies.filter((d) => d.status === "Em andamento")
        : activeTab === "Concluídos"
          ? dossies.filter((d) => d.status === "Concluído")
          : dossies.filter((d) => d.status === "Pendente");

  return (
    <DashboardLayout>
      <div className="min-h-full flex flex-col" style={{ background: "#F6F7F9" }}>
        {/* Top bar */}
        <div
          className="flex items-center gap-2 px-10 py-3 border-b text-[12px]"
          style={{ borderColor: "#EBECEE", color: "#9CA3AF" }}
        >
          <Home size={13} strokeWidth={1.5} />
          <span style={{ color: "#D1D5DB" }}>/</span>
          <span style={{ color: "#1F2937" }}>Dashboard</span>
        </div>

        {/* Header */}
        <div className="px-10 pt-7 pb-6" style={{ background: "#F6F7F9" }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
                Dashboard
              </h1>
              <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
                Gerencie todos os dossiês e acompanhe o andamento das solicitações.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2.5 px-4 rounded-[8px] border transition-all duration-150"
                style={{
                  height: "38px",
                  width: "280px",
                  background: "#FFFFFF",
                  borderColor: "#E5E7EB",
                }}
              >
                <Search size={15} strokeWidth={1.5} style={{ color: "#9CA3AF" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar dossiê, pessoa ou imóvel..."
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:"
                  style={{ color: "#111827" }}
                />
              </div>
              <button
                className="flex items-center gap-2 px-3.5 rounded-[8px] border text-[12px] font-medium transition-all duration-150"
                style={{
                  height: "38px",
                  background: "#FFFFFF",
                  borderColor: "#E5E7EB",
                  color: "#374151",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
              >
                <SlidersHorizontal size="14" strokeWidth={1.5} />
                Filtros
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-5">
            {summaryCards.map((card, i) => (
              <div
                key={card.label}
                className="rounded-[10px] border p-5 transition-all duration-150"
                style={{
                  background: "#FFFFFF",
                  borderColor: "#EBECEE",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center" style={{ background: card.bg }}>
                    <card.icon size={16} strokeWidth={1.5} style={{ color: card.color }} />
                  </div>
                  <ArrowUpRight size={13} strokeWidth={1.5} style={{ color: "#9CA3AF" }} />
                </div>
                <p className="text-[22px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
                  {card.value}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>
                  {card.label}
                </p>
                <p className="text-[11px] mt-[3px] font-medium" style={{ color: "#059669" }}>
                  {card.change}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 px-10 pb-10" style={{ background: "#F6F7F9" }}>
          {/* Table + Quick Actions */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Table */}
            <div
              className="rounded-[10px] border overflow-hidden"
              style={{
                background: "#FFFFFF",
                borderColor: "#EBECEE",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b" style={{ borderColor: "#EBECEE" }}>
                {tabs.map((tab) => {
                  const active = tab === activeTab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="relative px-4 pb-3 text-[12px] font-medium transition-all duration-150"
                      style={{ color: active ? "#111827" : "#9CA3AF" }}
                    >
                      {tab}
                      {active && (
                        <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ background: "#FF7A00" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>
                      <th className="text-left px-6 py-4 font-medium">Dossiê</th>
                      <th className="text-left px-6 py-4 font-medium">Pessoa</th>
                      <th className="text-left px-6 py-4 font-medium">Imóvel</th>
                      <th className="text-left px-6 py-4 font-medium">Certidões</th>
                      <th className="text-left px-6 py-4 font-medium">Status</th>
                      <th className="text-left px-6 py-4 font-medium">Atualizado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((dossie) => {
                      const st = statusStyles[dossie.status] || { bg: "rgba(107, 114, 128, 0.08)", color: "#6B7280", dot: "#6B7280" };
                      return (
                        <tr
                          key={dossie.id}
                          className="border-t transition-all duration-100"
                          style={{ borderColor: "#F3F4F6" }}
                        >
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-semibold cursor-pointer hover:underline" style={{ color: "#FF7A00" }}>
                              {dossie.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium" style={{ color: "#111827" }}>
                            {dossie.pessoa}
                          </td>
                          <td className="px-6 py-4 text-[13px]" style={{ color: "#6B7280" }}>
                            {dossie.imovel}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium" style={{ color: "#111827" }}>
                            {dossie.certidoes}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[4px] text-[11px] font-medium"
                              style={{ background: st.bg, color: st.color }}
                            >
                              <span className="w-[5px] h-[5px] rounded-full" style={{ background: st.dot }} />
                              {dossie.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px]" style={{ color: "#9CA3AF" }}>
                            {dossie.atualizado}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-[14px] font-bold mb-3" style={{ color: "#111827" }}>
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="flex flex-col items-start gap-3 p-4 rounded-[10px] border transition-all duration-150 text-left"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "#EBECEE",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#EBECEE";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                    }}
                  >
                    <div className="w-[32px] h-[32px] rounded-[7px] flex items-center justify-center" style={{ background: `${action.color}0d` }}>
                      <action.icon size={15} strokeWidth={1.5} style={{ color: action.color }} />
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[300px] shrink-0">
            <div
              className="rounded-[10px] border overflow-hidden"
              style={{
                background: "#FFFFFF",
                borderColor: "#EBECEE",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "#EBECEE" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ScrollText size={15} strokeWidth={1.5} style={{ color: "#FF7A00" }} />
                    <h3 className="text-[13px] font-bold" style={{ color: "#111827" }}>
                      Certidões do Dossiê
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "#FF7A00" }}>
                    #2024-0001
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                  Dossiê de Carlos Almeida
                </p>
              </div>

              {/* List */}
              <div className="px-5 py-1">
                {certidoesList.map((cert, i) => {
                  const obtida = cert.status === "Obtida";
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-3 border-b last:border-b-0"
                      style={{ borderColor: "#F3F4F6" }}
                    >
                      <div
                        className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center shrink-0 mt-[1px]"
                        style={{
                          background: obtida ? "rgba(5, 150, 105, 0.08)" : "rgba(255, 122, 0, 0.08)",
                        }}
                      >
                        <FileText
                          size={13}
                          strokeWidth={1.5}
                          style={{ color: obtida ? "#059669" : "#FF7A00" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: "#111827" }}>
                          {cert.nome}
                        </p>
                        <p className="text-[11px] mt-[2px]" style={{ color: "#9CA3AF" }}>
                          {cert.orgao}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-flex items-center gap-1 px-[6px] py-[2px] rounded-[3px] text-[9px] font-semibold"
                          style={{
                            background: obtida ? "rgba(5, 150, 105, 0.08)" : "rgba(255, 122, 0, 0.08)",
                            color: obtida ? "#065F46" : "#C2410C",
                          }}
                        >
                          {cert.status}
                        </span>
                        <ExternalLink size={12} strokeWidth={1.5} style={{ color: "#D1D5DB" }} className="cursor-pointer hover:text-[#9CA3AF] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
