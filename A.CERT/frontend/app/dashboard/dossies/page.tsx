"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FolderOpen, Search, Plus, ChevronLeft, ChevronRight, Clock, MessageSquare, FileText, AlertTriangle, XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import NovoDossieModal from "@/components/NovoDossieModal";
import { useT } from "@/i18n/useT";
import { useSettings } from "@/contexts/SettingsContext";

interface Dossier {
  id: string; identifier: string; status: string; priority: string; responsible: string;
  responsibleAvatar: string | null;
  createdAt: string; updatedAt: string;
  person: { id: string; name: string; cpf: string | null } | null;
  property: { identifier: string; type: string; address: string } | null;
  certificateCount: number; certificatesObtidas: number; certificatesPendentes: number;
  progress: number; commentsCount: number; observationsCount: number;
}
interface ApiResponse { dossiers: Dossier[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }

const STATUS_TABS = [
  { key: "todos", label: "Todos" }, { key: "Pendentes", label: "Pendentes" },
  { key: "Concluídos", label: "Concluídos" }, { key: "Cancelados", label: "Cancelados" },
];
const STATUS_MAP: Record<string, string> = { todos: "", Pendentes: "Pendente", Concluídos: "Concluído", Cancelados: "Cancelado" };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Concluído: { bg: "rgba(5,150,105,0.18)", text: "#059669" },
  Pendente: { bg: "rgba(220,38,38,0.18)", text: "#DC2626" },
  Cancelado: { bg: "rgba(220,38,38,0.18)", text: "#DC2626" },
};
function timeAgo(d: string) { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return "Agora"; if (m < 60) return `Há ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `Há ${h} h`; const dd = Math.floor(h / 24); if (dd < 30) return `Há ${dd} dia${dd > 1 ? "s" : ""}`; return new Date(d).toLocaleDateString("pt-BR"); }

function DossierCard({ dossier }: { dossier: Dossier }) {
  const sc = STATUS_COLORS[dossier.status] || STATUS_COLORS["Pendente"];
  const ini = dossier.responsible ? dossier.responsible.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "?";
  return (
    <Link href={`/dashboard/dossies/${dossier.id}`} className="block group h-full">
      <div className="bg-surface rounded-[14px] flex flex-col gap-4 transition-all duration-200 cursor-pointer h-full" style={{ padding: "24px 24px 20px", border: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={20} strokeWidth={1.5} className="shrink-0" style={{ color: sc.text }} />
            <span className="text-[15px] font-bold text-primary tracking-tight truncate">{dossier.identifier}</span>
          </div>
          <span className="text-[11px] font-semibold px-3 py-0.5 shrink-0 rounded-[4px]" style={{ background: sc.bg, color: sc.text }}>{dossier.status}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-body truncate">{dossier.person?.name || "Sem titular"}</div>
          {dossier.property && <div className="text-[12px] text-secondary truncate mt-1">{dossier.property.type}{dossier.property.address ? ` — ${dossier.property.address.split("—")[0]?.trim() || dossier.property.address}` : ""}</div>}
        </div>
        {dossier.certificateCount > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-secondary font-medium">{dossier.certificatesObtidas}/{dossier.certificateCount} certidões</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }}>{dossier.progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: "var(--border-default)" }}><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${dossier.progress}%`, background: dossier.progress >= 80 ? "#059669" : dossier.progress >= 50 ? "#D97706" : "#DC2626" }} /></div>
          </div>
        ) : <div className="text-[11px] text-muted italic">Nenhuma certidão vinculada</div>}
        <div className="flex items-center justify-between" style={{ paddingTop: 18, borderTop: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-3 min-w-0">
            {dossier.responsibleAvatar ? (
              <img src={dossier.responsibleAvatar} className="w-9 h-9 rounded-full object-cover border shrink-0" style={{ borderColor: "var(--border-light)" }} />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: sc.bg, color: sc.text }}>{ini}</div>
            )}
            <div className="min-w-0"><div className="text-[13px] font-medium text-body truncate">{dossier.responsible}</div></div>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <span className="flex items-center gap-1.5 text-[12px] text-muted font-medium"><MessageSquare size={14} strokeWidth={1.5} />{dossier.observationsCount > 0 ? dossier.observationsCount : dossier.commentsCount}</span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted font-medium"><Clock size={14} strokeWidth={1.5} />{timeAgo(dossier.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DossiesPage() {
  const { t } = useT();
  const { settings } = useSettings();
  const limit = settings.items_per_page || "12";
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNovoDossie, setShowNovoDossie] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); searchTimerRef.current = setTimeout(() => { setDebouncedSearch(searchQuery); setCurrentPage(1); }, 300); return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }; }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const token = localStorage.getItem("acert_token");
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeTab !== "todos") params.set("status", STATUS_MAP[activeTab]);
    params.set("page", String(currentPage)); params.set("limit", limit);
    try {
      const r = await fetch(`/api/dossiers?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!r.ok) throw new Error("Falha ao carregar");
      setData(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [debouncedSearch, activeTab, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pagination = data?.pagination;
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { page, totalPages } = pagination;
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); if (page > 3) pages.push("ellipsis"); for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i); if (page < totalPages - 2) pages.push("ellipsis"); pages.push(totalPages); }
    return pages;
  };

  const hasActiveFilters = debouncedSearch || activeTab !== "todos";

  if (loading && !data) {
    return (<DashboardLayout><div className="flex flex-col px-20 pt-36 pb-32 w-full"><div className="flex items-center justify-center py-32"><div className="w-7 h-7 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div></div></DashboardLayout>);
  }
  if (error && !data) {
    return (<DashboardLayout><div className="flex flex-col px-20 pt-36 pb-32 w-full items-center justify-center min-h-[60vh]"><AlertTriangle size={28} className="text-[#DC2626] mb-3" /><span className="text-[15px] font-medium text-primary">{error}</span><button onClick={fetchData} className="mt-3 px-5 h-9 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-medium">Tentar novamente</button></div></DashboardLayout>);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col px-20 pt-36 pb-32 w-full">
        {showNovoDossie && <NovoDossieModal onClose={() => setShowNovoDossie(false)} onCreated={() => { setShowNovoDossie(false); fetchData(); }} />}
        <div style={{ marginTop: 24 }} className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-1.5 min-w-0" data-tour="dossies-lista"><h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Dossiês</h1><p className="text-[14px] text-secondary leading-relaxed">Organize e acompanhe todos os dossiês.</p></div>
          <div className="flex items-center gap-3 shrink-0 pt-0.5">
            <div className="relative">
              <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input type="text" placeholder={t("dossiers.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-[360px] focus:outline-none placeholder:text-muted transition-colors" style={{ height: "44px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-surface)", paddingLeft: "42px", paddingRight: "16px" }} onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }} onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }} />
            </div>
          </div>
        </div>

        <div style={{ height: 40 }} />
        <div className="border-b border-default">
          <div className="flex items-center gap-14">
            {STATUS_TABS.map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }} className={`h-9 text-[13px] font-medium transition-colors -mb-px border-b-[3px] ${activeTab === tab.key ? "border-[#FF7A00] text-primary" : "border-transparent text-secondary hover:text-body"}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        <span className="text-[12px] text-muted mt-3 block">{data ? `${data.pagination.total} dossiê${data.pagination.total !== 1 ? "s" : ""}` : ""}</span>
        <div style={{ height: 16 }} />

        <div className={`${loading ? "opacity-60 pointer-events-none" : ""}`}>
          {data && data.dossiers.length === 0 ? (
            <div className="bg-surface rounded-[10px]"><div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-16 h-16 rounded-[16px] bg-muted flex items-center justify-center mb-4"><FolderOpen size={28} strokeWidth={1.5} className="text-muted" /></div>
              <span className="text-[16px] font-semibold text-primary mb-1">Nenhum dossiê encontrado</span>
              <span className="text-[13px] text-secondary text-center max-w-[300px] mb-5">{hasActiveFilters ? "Nenhum resultado com os filtros aplicados." : "Você ainda não possui nenhum dossiê."}</span>
              {!hasActiveFilters && <button onClick={() => setShowNovoDossie(true)} className="flex items-center gap-2 h-10 px-5 rounded-[10px] bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#E06900] transition-colors"><Plus size={16} strokeWidth={2.5} />Criar primeiro dossiê</button>}
            </div></div>
          ) : (
            <div className="grid grid-cols-3 gap-6">{data?.dossiers.map((d) => (<DossierCard key={d.id} dossier={d} />))}</div>
          )}
        </div>

        {pagination && (
          <div className="flex items-center justify-between mt-14 pt-5" style={{ borderTop: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted">{data ? `${data.pagination.total} dossiê${data.pagination.total !== 1 ? "s" : ""}` : ""}</span>
              <span className="text-[12px] text-muted">—</span>
              <span className="text-[12px] text-muted">Página {pagination.page} de {pagination.totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage <= 1} className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-secondary"><ChevronLeft size={14} strokeWidth={1.5} /></button>
              {getPageNumbers().map((p, i) => p === "ellipsis" ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-muted">...</span> : <button key={p} onClick={() => setCurrentPage(p as number)} className={`w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors ${p === currentPage ? "bg-[#FF7A00] text-white" : "text-secondary hover:bg-muted"}`}>{p}</button>)}
              <button onClick={() => pagination && currentPage < pagination.totalPages && setCurrentPage(currentPage + 1)} disabled={pagination && currentPage >= pagination.totalPages} className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-secondary"><ChevronRight size={14} strokeWidth={1.5} /></button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
