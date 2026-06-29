"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  AlertTriangle,
  ScrollText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Home,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Settings,
  Star,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { DonutChart } from "@/components/DonutChart";
import DossierEditModal from "@/components/DossierEditModal";
import ConfirmModal from "@/components/ConfirmModal";

interface DashboardData {
  dossiersAndamento: number;
  pendenciasCriticas: number;
  pendenciasSemanaPassada: number;
  certidoesEmitidas: number;
  certidoesEmitidasMes: number;
  certidoesEmitidasMesAnterior: number;
  taxaConclusao: number;
  taxaConclusaoAnterior: number;
  emissions: { mes: string; total: number }[];
  totalDossiers: number;
  distribution: { label: string; total: number }[];
  priorities: {
    identifier: string;
    tipo: string;
    diasSemAtualizar: number;
  }[];
  activities: {
    time: string;
    user: string;
    action: string;
    ref: string | null;
  }[];
}

interface Person {
  id: string;
  name: string;
  cpf: string | null;
}

interface Property {
  identifier: string;
  type: string;
  address: string;
}

interface Dossier {
  id: string;
  identifier: string;
  status: string;
  priority: string;
  responsible: string;
  createdAt: string;
  updatedAt: string;
  person: Person | null;
  property: Property | null;
  certificateCount: number;
  certificatesObtidas: number;
  certificatesPendentes: number;
  progress: number;
  commentsCount: number;
}

interface DossierPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DOSSIER_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Em andamento": { bg: "#FFF7ED", text: "#FF7A00", dot: "#FF7A00" },
  Concluído: { bg: "#ECFDF5", text: "#059669", dot: "#059669" },
  Pendente: { bg: "#FEF2F2", text: "#DC2626", dot: "#DC2626" },
  Cancelado: { bg: "#F3F0FF", text: "#7C3AED", dot: "#7C3AED" },
};

const DASHBOARD_TABS = [
  { key: "todas", label: "Todas" },
  { key: "Em andamento", label: "Em andamento" },
  { key: "Aguardando pendências", label: "Aguardando pendências" },
  { key: "Concluído", label: "Concluído" },
];

const TAB_TO_API_STATUS: Record<string, string> = {
  todas: "",
  "Em andamento": "Em andamento",
  "Aguardando pendências": "Pendente",
  Concluído: "Concluído",
};

const PERIOD_OPTIONS = [
  { key: "", label: "Tudo" },
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
];

const PERIOD_LABELS: Record<string, string> = {
  "": "Tudo",
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora mesmo";
  if (mins < 60) return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Há ${days} dia${days > 1 ? "s" : ""}`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const donutColors: Record<string, string> = {
  Regular: "#3B82F6",
  Urgente: "#DC2626",
  Preferencial: "#8B5CF6",
  Pendente: "#D97706",
};

const priorityLabels: Record<string, string> = {
  Regular: "Comum",
  Urgente: "Urgente",
  Preferencial: "Prioritário",
  Pendente: "Pendente",
};

const quickActions = [
  { label: "Cadastrar Pessoa", icon: UserPlus },
  { label: "Cadastrar Imóvel", icon: Home },
  { label: "Solicitar Certidão", icon: FileText },
  { label: "Relatórios", icon: BarChart3 },
  { label: "Usuários", icon: Users },
  { label: "Configurações", icon: Settings },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [dossiersLoading, setDossiersLoading] = useState(true);
  const [dossierActiveTab, setDossierActiveTab] = useState("todas");
  const [dossierPage, setDossierPage] = useState(1);
  const [dossierPagination, setDossierPagination] = useState<DossierPagination | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dossierPeriod, setDossierPeriod] = useState("");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [editDossier, setEditDossier] = useState<Dossier | null>(null);
  const [confirmPriority, setConfirmPriority] = useState<Dossier | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const priorityStar = (p: string) => p === "Preferencial" || p === "Urgente";

  const togglePriority = async (dossier: Dossier) => {
    const newPriority = priorityStar(dossier.priority) ? "Regular" : "Preferencial";
    const token = localStorage.getItem("acert_token");
    try {
      const r = await fetch(`/api/dossiers/${dossier.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!r.ok) throw new Error();
      const updated = await r.json();
      setDossiers((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
    } catch {}
  };

  const getDossierColors = (status: string) => {
    const light = DOSSIER_STATUS_COLORS[status] || DOSSIER_STATUS_COLORS.Pendente;
    if (!isDark) return light;
    const dark: Record<string, { bg: string; text: string; dot: string }> = {
      "Em andamento": { bg: "rgba(255,122,0,0.15)", text: "#FF7A00", dot: "#FF7A00" },
      Concluído: { bg: "rgba(5,150,105,0.15)", text: "#059669", dot: "#059669" },
      Pendente: { bg: "rgba(220,38,38,0.15)", text: "#DC2626", dot: "#DC2626" },
      Cancelado: { bg: "rgba(220,38,38,0.15)", text: "#DC2626", dot: "#DC2626" },
    };
    return dark[status] || dark.Pendente;
  };

  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem("acert_token");
    try {
      const r = await fetch("/api/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error("Falha ao carregar dashboard");
      const d = await r.json();
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fetchDossiers = useCallback(async () => {
    setDossiersLoading(true);
    const token = localStorage.getItem("acert_token");
    const params = new URLSearchParams();
    const apiStatus = TAB_TO_API_STATUS[dossierActiveTab];
    if (apiStatus) params.set("status", apiStatus);
    if (dossierPeriod) params.set("period", dossierPeriod);
    params.set("page", String(dossierPage));
    params.set("limit", "15");
    try {
      const r = await fetch(`/api/dossiers?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error("Falha ao carregar dossiês");
      const d: { dossiers: Dossier[]; pagination: DossierPagination } = await r.json();
      setDossiers(d.dossiers);
      setDossierPagination(d.pagination);
    } catch {
      // silent
    } finally {
      setDossiersLoading(false);
    }
  }, [dossierActiveTab, dossierPage, dossierPeriod]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  const handleDossierTabChange = (tab: string) => {
    setDossierActiveTab(tab);
    setDossierPage(1);
  };

  const getPageNumbers = () => {
    if (!dossierPagination) return [];
    const { page, totalPages } = dossierPagination;
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-16 pt-44 pb-24 w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
            <span className="text-[14px] text-secondary">Carregando...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-16 pt-44 pb-24 w-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#DC2626]" />
            <span className="text-[15px] font-medium text-primary">Erro ao carregar dashboard</span>
            <span className="text-[13px] text-secondary">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="mt-1 px-5 h-9 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-medium hover:bg-[#E06900] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendenciasGrowth = data.pendenciasSemanaPassada > 0
    ? `-${Math.round((1 - data.pendenciasCriticas / data.pendenciasSemanaPassada) * 100)}%`
    : "0%";

  const pendenciasPositive = data.pendenciasCriticas < data.pendenciasSemanaPassada;

  const certGrowth = data.certidoesEmitidasMesAnterior > 0
    ? `+${Math.round((data.certidoesEmitidasMes / data.certidoesEmitidasMesAnterior) * 100)}%`
    : "+100%";

  const taxaDiff = data.taxaConclusao - data.taxaConclusaoAnterior;
  const taxaGrowth = `${taxaDiff >= 0 ? "+" : ""}${taxaDiff.toFixed(1)}%`;

  const donutTotal = data.distribution.reduce((a, s) => a + s.total, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">

        <div style={{ marginBottom: 32 }}>
          <div style={{ marginTop: 24 }}>
            <PageHeader
              title="Dashboard"
              subtitle="Gerencie todos os dossiês e acompanhe o andamento das solicitações."
            />
          </div>
        </div>

        <div className="dashboard-stats" style={{ marginBottom: 0, marginTop: -12 }}>
          <StatsCard
            icon={FolderOpen}
            title="Dossiês em andamento"
            value={String(data.dossiersAndamento)}
            growth="+12%"
            growthPositive={true}
            complement="Em relação ao mês anterior"
            iconBg="#FFF7ED"
            iconColor="#FF7A00"
          />
          <StatsCard
            icon={AlertTriangle}
            title="Pendências críticas"
            value={String(data.pendenciasCriticas)}
            growth={pendenciasGrowth}
            growthPositive={pendenciasPositive}
            complement="Em relação à semana passada"
            iconBg="#FEF2F2"
            iconColor="#DC2626"
          />
          <StatsCard
            icon={ScrollText}
            title="Certidões emitidas"
            value={String(data.certidoesEmitidas)}
            growth={certGrowth}
            growthPositive={true}
            complement="Este mês"
            iconBg="#ECFDF5"
            iconColor="#059669"
          />
          <StatsCard
            icon={CheckCircle2}
            title="Taxa de conclusão"
            value={`${data.taxaConclusao}%`}
            growth={taxaGrowth}
            growthPositive={taxaDiff >= 0}
            complement="Em relação ao período anterior"
            iconBg="#ECFDF5"
            iconColor="#059669"
          />
        </div>
        <div className="border-b border-[var(--border-default)]" style={{ marginTop: -48 }} />

        <div className="flex flex-col lg:flex-row gap-8" style={{ marginTop: 32 }}>
          <div className="w-full lg:w-[68%] min-w-0 flex flex-col">
            <div className="bg-surface px-8 pb-8 pt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="border-b border-default">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-14">
                    {DASHBOARD_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => handleDossierTabChange(tab.key)}
                        className={`h-9 px-4 text-[13px] font-medium transition-colors -mb-px border-b-[3px] ${
                          dossierActiveTab === tab.key
                            ? "border-[#FF7A00] text-primary"
                            : "border-transparent text-secondary hover:text-body"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                      className="flex items-center gap-1.5 h-8 px-3 -mb-px rounded-[6px] text-[12px] font-medium transition-colors border border-transparent hover:border-[var(--border-default)]"
                    >
                      <Calendar size={14} strokeWidth={1.5} className={isDark ? "text-primary" : "text-muted"} />
                      <span className={isDark ? "text-primary" : "text-body"}>{PERIOD_LABELS[dossierPeriod]}</span>
                    </button>
                    {showPeriodMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                        <div className="absolute right-0 top-full mt-1 w-[160px] bg-surface py-1 z-20 shadow-[0_4px_16px_rgba(0,0,0,0.1)]" style={{ border: "1px solid var(--border-light)" }}>
                          {PERIOD_OPTIONS.map((p) => (
                            <button
                              key={p.key}
                              onClick={() => { setDossierPeriod(p.key); setDossierPage(1); setShowPeriodMenu(false); }}
                              className={`flex items-center w-full h-9 px-4 text-[13px] transition-colors ${
                                dossierPeriod === p.key ? "text-[#FF7A00] font-semibold" : "text-body hover:bg-subtle"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-10" />

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-[1fr_1.2fr_1fr_100px_150px_120px_40px] items-center px-4">
                  <span className="text-[13px] font-medium text-muted pr-4">Dossiê</span>
                  <span className="text-[13px] font-medium text-muted pr-4">Pessoas</span>
                  <span className="text-[13px] font-medium text-muted pr-4">Imóvel</span>
                  <span className="text-[13px] font-medium text-muted" style={{ paddingRight: "8px" }}>Certidões</span>
                  <span className="text-[13px] font-medium text-muted pr-4">Status</span>
                  <span className="text-[13px] font-medium text-muted pr-4">Atualizado</span>
                  <span />
                </div>

                {dossiersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
                      <span className="text-[13px] text-secondary">Carregando dossiês...</span>
                    </div>
                  </div>
                ) : dossiers.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-[13px] text-muted">Nenhum dossiê encontrado.</span>
                  </div>
                ) : (
                  dossiers.map((dossier) => {
                    const sc = getDossierColors(dossier.status);
                    return (
                      <div
                        key={dossier.id}
                        className="grid grid-cols-[1fr_1.2fr_1fr_100px_150px_120px_40px] items-center px-4 py-3 rounded-[10px] hover-bg-subtle transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-4">
                          <FileText size={15} strokeWidth={1.5} className="text-muted shrink-0" />
                          <button
                            onClick={() => router.push(`/dashboard/dossies?search=${encodeURIComponent(dossier.identifier)}`)}
                            className="text-[14px] font-semibold text-primary truncate hover:text-[#FF7A00] transition-colors text-left"
                          >
                            {dossier.identifier}
                          </button>
                        </div>
                        <span className="text-[14px] text-body truncate block pr-4">
                          <span className="flex items-center gap-1.5">
                            <button onClick={() => setConfirmPriority(dossier)} className="flex items-center shrink-0 transition-colors">
                              <Star
                                size={13}
                                strokeWidth={1.5}
                                className="shrink-0"
                                style={{ color: priorityStar(dossier.priority) ? "#FFB800" : "var(--text-muted)" }}
                                fill={priorityStar(dossier.priority) ? "#FFB800" : "transparent"}
                              />
                            </button>
                            {dossier.person?.name || "—"}
                          </span>
                        </span>
                        <span className="text-[14px] text-body truncate block pr-4">{dossier.property?.identifier || "—"}</span>
                        <span className="text-[14px] tabular-nums text-body" style={{ paddingRight: "8px" }}>
                          {`${dossier.certificatesObtidas}/9`}
                        </span>
                        <div className="pr-4">
                          <div
                            className="inline-flex items-center h-8 rounded-[8px] text-[13px] font-semibold"
                            style={{ background: sc.bg, color: sc.text, paddingLeft: "15px", paddingRight: "15px" }}
                          >
                            {dossier.status}
                          </div>
                        </div>
                        <span className="text-[14px] text-secondary whitespace-nowrap pr-4">{timeAgo(dossier.updatedAt)}</span>
                        <div className="relative flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === dossier.id ? null : dossier.id);
                            }}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-secondary hover-bg-muted hover:text-primary transition-colors"
                          >
                            <MoreHorizontal size={15} strokeWidth={1.5} />
                          </button>
                          {openMenuId === dossier.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                <div
                                  className="absolute right-0 top-full mt-1 rounded-[10px] bg-surface py-1.5 z-20 shadow-[0_4px_16px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-top-1 duration-150" style={{ width: "220px", border: "1px solid var(--border-light)" }}
                                  onClick={(e) => e.stopPropagation()}
                              >
                                  <button
                                    onClick={() => { setEditDossier(dossier); setOpenMenuId(null); }}
                                    className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                    style={{ paddingLeft: "20px", paddingRight: "20px" }}
                                  >
                                    <span>✏️</span>
                                    <span>Edição rápida</span>
                                  </button>
                                  <button
                                    onClick={() => { setOpenMenuId(null); }}
                                    className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                    style={{ paddingLeft: "20px", paddingRight: "20px" }}
                                  >
                                    <span>👁️</span>
                                    <span>Abrir dossiê</span>
                                  </button>
                                  <button
                                    onClick={() => { setOpenMenuId(null); }}
                                    className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                    style={{ paddingLeft: "20px", paddingRight: "20px" }}
                                  >
                                    <span>📄</span>
                                    <span>Ver certidões</span>
                                  </button>
                                  <button
                                    onClick={() => { setConfirmPriority(dossier); setOpenMenuId(null); }}
                                    className="flex items-center gap-3 w-full h-9 text-[13px] text-body hover-bg-subtle transition-colors"
                                    style={{ paddingLeft: "20px", paddingRight: "20px" }}
                                  >
                                    <span>⭐</span>
                                    <span>Marcar prioridade</span>
                                  </button>
                                  <div className="h-px bg-light my-1.5" style={{ marginLeft: "20px", marginRight: "20px" }} />
                                  <button
                                    onClick={() => { setOpenMenuId(null); }}
                                    className="flex items-center gap-3 w-full h-9 text-[13px] text-[#DC2626] hover:bg-[rgba(220,38,38,0.1)] transition-colors"
                                    style={{ paddingLeft: "20px", paddingRight: "20px" }}
                                  >
                                    <span>📦</span>
                                    <span>Arquivar</span>
                                  </button>
                                  <button
                                    onClick={() => { setOpenMenuId(null); }}
                                    className="flex items-center gap-3 w-full h-9 text-[13px] text-[#DC2626] hover:bg-[rgba(220,38,38,0.1)] transition-colors"
                                    style={{ paddingLeft: "20px", paddingRight: "20px" }}
                                  >
                                    <span>🗑️</span>
                                    <span>Mover para a lixeira</span>
                                  </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

              {dossierPagination && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-light">
                  <span className="text-[13px] text-secondary">
                    Mostrando {dossiers.length} de {dossierPagination.total} dossiês
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDossierPage((p) => Math.max(1, p - 1))}
                      disabled={dossierPage <= 1}
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover-bg-muted text-secondary"
                    >
                      <ChevronLeft size={14} strokeWidth={1.5} />
                    </button>
                    {getPageNumbers().map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-muted">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setDossierPage(p)}
                          className={`w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors ${
                            p === dossierPage ? "bg-[#FF7A00] text-white" : "text-secondary hover-bg-muted"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setDossierPage((p) => p + 1)}
                      disabled={dossierPagination && dossierPage >= dossierPagination.totalPages}
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover-bg-muted text-secondary"
                    >
                      <ChevronRight size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[32%] min-w-0 flex flex-col gap-6" style={{ marginTop: 40 }}>
            <div className="bg-surface px-8 pb-6">
              <h3 className="text-[15px] font-semibold text-primary" style={{ marginBottom: 28 }}>Distribuição dos dossiês</h3>
              <DonutChart
                data={data.distribution.map((d) => ({
                  label: priorityLabels[d.label] || d.label,
                  value: d.total,
                  color: donutColors[d.label] || "var(--text-secondary)",
                }))}
                total={donutTotal}
              />
            </div>

            <div className="bg-surface px-8 py-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-[#DC2626]" />
                <h3 className="text-base font-bold text-primary tracking-[-0.01em]">Pendências Prioritárias</h3>
                {data.priorities.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                )}
              </div>
              <div style={{ marginTop: "25px" }}></div>
              <div className="flex flex-col gap-3">
                {data.priorities.length === 0 ? (
                  <div className="text-[13px] text-muted text-center py-8">Nenhuma pendência no momento.</div>
                ) : (
                  data.priorities.map((p, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 p-4 rounded-[10px] ${isDark ? "bg-[rgba(220,38,38,0.06)]" : "bg-[#FFFBFB]"}`}
                    >
                      <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${isDark ? "bg-[rgba(220,38,38,0.15)]" : "bg-[#FEE2E2]"}`}>
                        <AlertTriangle size={14} strokeWidth={1.5} className="text-[#DC2626]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-primary">{p.identifier}</span>
                          <span className="text-[11px] text-[#DC2626] font-medium">{p.tipo}</span>
                        </div>
                        <span className="text-[12px] text-secondary block mt-0.5">
                          Há {p.diasSemAtualizar}d sem atualização
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/dossies?search=${encodeURIComponent(p.identifier)}`)}
                        className="shrink-0 h-8 w-[88px] rounded-[6px] bg-[#DC2626] text-white text-[12px] font-semibold hover:bg-[#B91C1C] transition-colors"
                      >
                        Resolver
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "48px" }}></div>
        <div className="bg-surface p-6">
          <div className="flex flex-col gap-1" style={{ marginBottom: "15px" }}>
            <h3 className="text-[15px] font-semibold text-primary">Ações rápidas</h3>
            <span className="text-[13px] text-secondary">Atalhos para as operações mais frequentes.</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              const href = {
                "Cadastrar Pessoa": "/dashboard/pessoas",
                "Cadastrar Imóvel": "/dashboard/imoveis",
                "Solicitar Certidão": "/dashboard/certidoes",
                "Relatórios": "/dashboard/relatorios",
                "Usuários": "/dashboard/usuarios",
                "Configurações": "/dashboard/configuracoes",
              }[action.label] || "/dashboard";
              return (
                <button
                  key={i}
                  onClick={() => router.push(href)}
                  className="flex flex-col items-center gap-2 py-5 px-3 rounded-[10px] hover-bg-hover transition-colors"
                >
                  <Icon size={20} strokeWidth={1.5} className="text-[#FF7A00]" />
                  <span className="text-[12px] font-medium text-body">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {editDossier && (
        <DossierEditModal
          dossier={editDossier}
          onClose={() => setEditDossier(null)}
          onSave={(updated) => {
            setDossiers((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
            setEditDossier(null);
          }}
        />
      )}
      <ConfirmModal
        open={!!confirmPriority}
        title={confirmPriority ? `Marcar como ${priorityStar(confirmPriority.priority) ? "Regular" : "Preferencial"}` : ""}
        message={confirmPriority ? `Tem certeza que deseja alterar a prioridade do dossiê ${confirmPriority.identifier} para ${priorityStar(confirmPriority.priority) ? "Normal" : "Alta"}?` : ""}
        icon={confirmPriority ? (priorityStar(confirmPriority.priority) ? <AlertTriangle size={24} strokeWidth={2.5} /> : <Star size={24} strokeWidth={2.5} />) : undefined}
        confirmLabel={confirmPriority ? (priorityStar(confirmPriority.priority) ? "Sim, remover prioridade" : "Sim, marcar como prioritário") : ""}
        cancelLabel="Não, voltar"
        variant={confirmPriority && priorityStar(confirmPriority.priority) ? "warning" : "default"}
        onConfirm={() => { if (confirmPriority) { togglePriority(confirmPriority); setConfirmPriority(null); } }}
        onCancel={() => setConfirmPriority(null)}
        onClose={() => setConfirmPriority(null)}
      />
    </DashboardLayout>
  );
}
