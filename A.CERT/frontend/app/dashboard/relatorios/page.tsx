"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import {
  FileText, Download, TrendingUp, BarChart3,
  CheckCircle2, Clock, AlertTriangle, FileSpreadsheet, Building2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { useTheme } from "@/contexts/ThemeContext";

/* ── Types ─────────────────────────────────────────── */
interface ReportData {
  stats: { dossiersConcluidos: number; certidoesEmitidas: number; tempoMedio: number; pendenciasAbertas: number };
  dossierStatus: { label: string; total: number }[];
  monthlyEmission: { mes: string; total: number }[];
  certByOrgan: { name: string; total: number; success: number; failed: number }[];
  propertiesByType: { type: string; total: number }[];
  clientGrowth: { today: number; week: number; month: number; year: number };
  dossierBreakdown: { total: number; concluidos: number; andamento: number; cancelados: number; pendentes: number; arquivados: number };
  propertyStats: { total: number; withDossiers: number; withCerts: number; noMovement: number };
  certStats: { total: number; success: number; failed: number };
}

/* ── Helpers ───────────────────────────────────────── */
const apiBase = "http://localhost:3001";

function pct(val: number, total: number) { return total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "0%"; }
function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + "k" : String(n); }

const PERIOD_OPTIONS = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
  { key: "ano", label: "Este ano" },
];

/* ── Component ─────────────────────────────────────── */
export default function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ano");

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`${apiBase}/api/reports`);
      const d = await r.json();
      setData(d);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

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

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-16 pt-44 pb-24 w-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#DC2626]" />
            <span className="text-[15px] font-medium text-primary">Erro ao carregar relatórios</span>
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

  const d = data;
  const successRate = d.certStats.total > 0 ? pct(d.certStats.success, d.certStats.total) : "0%";
  const failRate = d.certStats.total > 0 ? pct(d.certStats.failed, d.certStats.total) : "0%";
  const dossierPct = d.dossierBreakdown.total > 0 ? pct(d.dossierBreakdown.concluidos, d.dossierBreakdown.total) : "0%";
  const cancelPct = d.dossierBreakdown.total > 0 ? pct(d.dossierBreakdown.cancelados, d.dossierBreakdown.total) : "0%";

  /* ── Análise Operacional (determinística) ────── */
  const insights: string[] = [];
  const pendRate = d.dossierBreakdown.total > 0 ? (d.dossierBreakdown.pendentes / d.dossierBreakdown.total * 100) : 0;
  if (pendRate > 20) insights.push(`Foi identificado aumento de ${pendRate.toFixed(0)}% nos dossiês pendentes, considerando o total de ${d.dossierBreakdown.total} dossiês.`);
  const worstOrgan = [...d.certByOrgan].sort((a, b) => (b.failed / (b.total || 1)) - (a.failed / (a.total || 1)))[0];
  if (worstOrgan && worstOrgan.failed > 0 && worstOrgan.total > 0) {
    const rate = ((worstOrgan.failed / worstOrgan.total) * 100).toFixed(0);
    insights.push(`O órgão ${worstOrgan.name} apresenta a maior taxa de falhas do sistema, concentrando ${rate}% dos erros de emissão.`);
  }
  const topProp = [...d.propertiesByType].sort((a, b) => b.total - a.total)[0];
  if (topProp) insights.push(`Os imóveis do tipo "${topProp.type}" representam ${pct(topProp.total, d.propertyStats.total)} dos imóveis cadastrados.`);
  if (d.stats.tempoMedio > 48) insights.push(`A equipe possui tempo médio de conclusão de ${d.stats.tempoMedio}h, acima da meta recomendada de 48h.`);
  if (insights.length === 0) insights.push("Sistema operando dentro dos parâmetros normais. Nenhuma anomalia detectada no período analisado.");

  /* ── Chart data ─────────────────────────────── */
  const chartData = d.monthlyEmission;
  const maxVal = Math.max(...chartData.map(c => c.total), 1);

  const barData = [...d.certByOrgan].sort((a, b) => b.total - a.total).slice(0, 7);
  const maxBar = Math.max(...barData.map(b => b.total), 1);

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">

        <div style={{ marginBottom: 32 }}>
          <div style={{ marginTop: 24 }}>
            <PageHeader
              title="Relatório Operacional Completo"
              subtitle={`Período: 01/01/2026 até 31/12/2026 · Emitido por: Milena de Oliveira Alves · Data de geração: ${dateStr} às ${timeStr}`}
            />
          </div>
        </div>

        {/* Filter Pills + Export Buttons */}
        <div className="flex items-center justify-between mb-8" style={{ marginTop: -8 }}>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => setPeriod(f.key)}
                className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors border ${
                  period === f.key
                    ? "border-[#FF7A00] bg-[rgba(255,122,0,0.08)] text-[#FF7A00]"
                    : "border-[var(--border-default)] bg-surface text-secondary hover:text-body"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] border border-[var(--border-default)] bg-transparent text-[12px] font-semibold text-secondary hover:bg-[var(--bg-muted)] transition-colors">
              <FileSpreadsheet size={13} />
              Exportar Resumido (PDF)
            </button>
            <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-[#FF7A00] text-white text-[12px] font-semibold hover:bg-[#E06900] transition-colors">
              <Download size={13} />
              Exportar Completo (PDF)
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="dashboard-stats" style={{ marginBottom: 0 }}>
          <StatsCard
            icon={CheckCircle2}
            title="Dossiês Concluídos"
            value={fmt(d.stats.dossiersConcluidos)}
            complement={`${dossierPct} do total`}
            iconBg="#ECFDF5"
            iconColor="#10B981"
          />
          <StatsCard
            icon={FileText}
            title="Certidões Emitidas"
            value={fmt(d.stats.certidoesEmitidas)}
            complement={`${successRate} de sucesso`}
            iconBg="#FFF7ED"
            iconColor="#FF7A00"
          />
          <StatsCard
            icon={Clock}
            title="Tempo Médio"
            value={`${d.stats.tempoMedio}h`}
            complement="por conclusão"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
          />
          <StatsCard
            icon={AlertTriangle}
            title="Pendências"
            value={fmt(d.stats.pendenciasAbertas)}
            complement="dossiês abertos"
            iconBg="#FEF3C7"
            iconColor="#F59E0B"
          />
        </div>

        <div className="border-b border-default" style={{ marginTop: -48 }} />

        {/* Crescimento de Clientes */}
        <div className="bg-surface rounded-[10px] p-6 mb-[18px]" style={{ marginTop: 32 }}>
          <h3 className="text-[14px] font-bold text-primary pb-[10px] mb-4 border-b border-default flex items-center gap-2">
            <TrendingUp size={16} style={{ color: "var(--accent-primary)" }} />
            Crescimento de Clientes
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-default">
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Período</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Novos Clientes</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Crescimento</th>
              </tr>
            </thead>
            <tbody>
              {[
                { period: "Hoje", val: d.clientGrowth.today },
                { period: "Esta semana", val: d.clientGrowth.week },
                { period: "Este mês", val: d.clientGrowth.month },
                { period: "Este ano", val: d.clientGrowth.year },
              ].map((r, i) => (
                <tr key={i} className={i < 3 ? "border-b border-default" : ""}>
                  <td className="py-3 px-4 text-[13px] font-medium text-primary">{r.period}</td>
                  <td className="py-3 px-4 text-[13px] font-semibold text-primary">{r.val}</td>
                  <td className="py-3 px-4">
                    {r.val > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#10B981]">
                        <TrendingUp size={12} />
                        +{r.val}
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desempenho dos Dossiês */}
        <div className="bg-surface rounded-[10px] p-6 mb-[18px]">
          <h3 className="text-[14px] font-bold text-primary pb-[10px] mb-4 border-b border-default flex items-center gap-2">
            <BarChart3 size={16} style={{ color: "var(--accent-primary)" }} />
            Desempenho dos Dossiês
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-default">
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Status</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Quantidade</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">%</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Concluídos", val: d.dossierBreakdown.concluidos, color: "#10B981" },
                { label: "Em andamento", val: d.dossierBreakdown.andamento, color: "#3B82F6" },
                { label: "Cancelados", val: d.dossierBreakdown.cancelados, color: "#EF4444" },
                { label: "Pendentes", val: d.dossierBreakdown.pendentes, color: "#F59E0B" },
                { label: "Arquivados", val: d.dossierBreakdown.arquivados, color: "#6B7280" },
              ].map((r, i) => (
                <tr key={i} className={i < 4 ? "border-b border-default" : ""}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: r.color }} />
                      <span className="text-[13px] font-medium text-primary">{r.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[13px] font-semibold text-primary">{r.val}</td>
                  <td className="py-3 px-4 text-[12px] text-secondary">{pct(r.val, d.dossierBreakdown.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-6 mt-[14px] text-[12px] text-secondary">
            <span>Taxa de conclusão: <strong className="text-[#10B981]">{dossierPct}</strong></span>
            <span>Taxa de cancelamento: <strong className="text-[#EF4444]">{cancelPct}</strong></span>
            <span>Tempo médio: <strong>{d.stats.tempoMedio}h</strong></span>
          </div>
        </div>

        {/* Relatório de Certidões */}
        <div className="bg-surface rounded-[10px] p-6 mb-[18px]">
          <h3 className="text-[14px] font-bold text-primary pb-[10px] mb-4 border-b border-default flex items-center gap-2">
            <FileText size={16} style={{ color: "var(--accent-primary)" }} />
            Relatório de Certidões
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-default">
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Certidão</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Emitidas</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Sucesso</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Falhas</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {d.certByOrgan.map((c, i) => (
                <tr key={i} className={i < d.certByOrgan.length - 1 ? "border-b border-default" : ""}>
                  <td className="py-3 px-4 text-[13px] font-medium text-primary">{c.name}</td>
                  <td className="py-3 px-4 text-[13px] font-semibold text-primary">{c.total}</td>
                  <td className="py-3 px-4 text-[13px] text-[#10B981]">{c.success}</td>
                  <td className="py-3 px-4 text-[13px]" style={{ color: c.failed > 0 ? "#EF4444" : "var(--text-muted)" }}>{c.failed}</td>
                  <td className="py-3 px-4 text-[12px] font-medium" style={{ color: c.total > 0 ? ((c.success / c.total * 100) > 70 ? "#10B981" : "#F59E0B") : "var(--text-muted)" }}>
                    {c.total > 0 ? pct(c.success, c.total) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Relatório de Imóveis */}
        <div className="bg-surface rounded-[10px] p-6 mb-[18px]">
          <h3 className="text-[14px] font-bold text-primary pb-[10px] mb-4 border-b border-default flex items-center gap-2">
            <Building2 size={16} style={{ color: "var(--accent-primary)" }} />
            Relatório de Imóveis
          </h3>
          <table className="w-full border-collapse mb-[14px]">
            <thead>
              <tr className="border-b border-default">
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Tipo de Imóvel</th>
                <th className="py-[10px] px-4 text-[11px] font-bold text-muted uppercase text-left">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {d.propertiesByType.map((p, i) => (
                <tr key={i} className={i < d.propertiesByType.length - 1 ? "border-b border-default" : ""}>
                  <td className="py-3 px-4 text-[13px] font-medium text-primary">{p.type}</td>
                  <td className="py-3 px-4 text-[13px] font-semibold text-primary">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-6 text-[12px] text-secondary border-t border-default pt-[14px]">
            <span>Com dossiês: <strong>{d.propertyStats.withDossiers}</strong></span>
            <span>Com certidões emitidas: <strong>{d.propertyStats.withCerts}</strong></span>
            <span>Concluídos com sucesso: <strong>{d.propertyStats.withCerts}</strong></span>
            <span>Sem movimentação: <strong className="text-[#F59E0B]">{d.propertyStats.noMovement}</strong></span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-[18px] mb-[18px]">
          {/* Line Chart */}
          <div className="bg-surface rounded-[10px] p-6">
            <h3 className="text-[14px] font-bold text-primary pb-[10px] mb-4 border-b border-default">
              Emissões de Certidões por Mês
            </h3>
            {chartData.length > 0 ? (
              <svg viewBox="0 0 400 200" className="w-full h-[200px]">
                {chartData.map((c, i) => {
                  const x = (i / Math.max(chartData.length - 1, 1)) * 370 + 15;
                  const y = 180 - (c.total / maxVal) * 150;
                  return <circle key={i} cx={x} cy={y} r={3} fill="var(--accent-primary)" />;
                })}
                {chartData.map((c, i, arr) => {
                  if (i === arr.length - 1) return null;
                  const x1 = (i / Math.max(arr.length - 1, 1)) * 370 + 15;
                  const y1 = 180 - (c.total / maxVal) * 150;
                  const x2 = ((i + 1) / Math.max(arr.length - 1, 1)) * 370 + 15;
                  const y2 = 180 - (arr[i + 1].total / maxVal) * 150;
                  return <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent-primary)" strokeWidth={2} opacity={0.5} />;
                })}
                {chartData.map((c, i) => (
                  <text key={`t${i}`} x={(i / Math.max(chartData.length - 1, 1)) * 370 + 15} y={195} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{c.mes}</text>
                ))}
              </svg>
            ) : (
              <p className="text-[12px] text-muted text-center py-5">Sem dados de emissão.</p>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-surface rounded-[10px] p-6">
            <h3 className="text-[14px] font-bold text-primary pb-[10px] mb-4 border-b border-default">
              Certidões por Órgão
            </h3>
            {barData.length > 0 ? (
              <div className="flex flex-col gap-[10px] pt-2">
                {barData.map((b, i) => (
                  <div key={i} className="flex items-center gap-[10px]">
                    <span className="w-[100px] text-[12px] text-secondary text-right shrink-0">{b.name.split(" ").slice(0, 2).join(" ")}</span>
                    <div className="flex-1 h-6 rounded-[6px] overflow-hidden relative" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "var(--bg-muted)" }}>
                      <div className="h-full rounded-[6px] transition-[width] duration-500" style={{ background: "var(--accent-primary)", width: `${(b.total / maxBar) * 100}%`, opacity: 0.8 }} />
                    </div>
                    <span className="w-[30px] text-[12px] font-semibold text-primary shrink-0">{b.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted text-center py-5">Sem dados.</p>
            )}
          </div>
        </div>

        {/* Análise Operacional */}
        <div className="bg-surface rounded-[10px] p-6 mb-[18px]" style={{ borderLeft: "3px solid var(--accent-primary)" }}>
          <h3 className="text-[14px] font-bold text-primary mb-[14px]">
            Análise Operacional
          </h3>
          <div className="flex flex-col gap-[10px]">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-[10px]">
                <div className="w-[6px] h-[6px] rounded-[3px] mt-[6px] shrink-0" style={{ background: "var(--accent-primary)" }} />
                <p className="text-[13px] text-secondary m-0 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
