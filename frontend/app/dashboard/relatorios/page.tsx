"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Download, TrendingUp, TrendingDown, BarChart3,
  CheckCircle2, Clock, XCircle, AlertTriangle, FileSpreadsheet,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

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
const SECTION: React.CSSProperties = { border: "1px solid var(--border-default)", borderRadius: 12, background: "var(--bg-app)", padding: "22px 24px", marginBottom: 18 };
const SECTION_TITLE: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", gap: 8 };
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.4px" };
const VALUE: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 };
const SUB: React.CSSProperties = { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 };

function pct(val: number, total: number) { return total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "0%"; }
function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + "k" : String(n); }

/* ── Component ─────────────────────────────────────── */
export default function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ano");

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

  if (loading) return <DashboardLayout><div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>Carregando...</div></DashboardLayout>;
  if (!data) return <DashboardLayout><div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>Erro ao carregar relatórios.</div></DashboardLayout>;

  const d = data;
  const successRate = d.certStats.total > 0 ? pct(d.certStats.success, d.certStats.total) : "0%";
  const failRate = d.certStats.total > 0 ? pct(d.certStats.failed, d.certStats.total) : "0%";
  const dossierPct = d.dossierBreakdown.total > 0 ? pct(d.dossierBreakdown.concluidos, d.dossierBreakdown.total) : "0%";
  const cancelPct = d.dossierBreakdown.total > 0 ? pct(d.dossierBreakdown.cancelados, d.dossierBreakdown.total) : "0%";

  // Análise IA (determinística)
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

  // Line chart data
  const chartData = d.monthlyEmission;
  const maxVal = Math.max(...chartData.map(c => c.total), 1);

  // Bar chart data
  const barData = [...d.certByOrgan].sort((a, b) => b.total - a.total).slice(0, 7);
  const maxBar = Math.max(...barData.map(b => b.total), 1);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 64px" }}>
        {/* Report Header */}
        <div style={{ ...SECTION, background: "linear-gradient(135deg, rgba(255,122,0,0.04), transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Relatório Operacional Completo</h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                Período: 01/01/2026 até 31/12/2026 · Emitido por: Milena de Oliveira Alves · Data de geração: {dateStr} às {timeStr}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <FileSpreadsheet size={13} /> Exportar Resumido (PDF)
              </button>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#FF7A00", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Download size={13} /> Exportar Completo (PDF)
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { key: "hoje", label: "Hoje" },
              { key: "semana", label: "Esta semana" },
              { key: "mes", label: "Este mês" },
              { key: "ano", label: "Este ano" },
            ].map(f => (
              <button key={f.key} onClick={() => setPeriod(f.key)} style={{
                padding: "6px 16px", borderRadius: 20, border: period === f.key ? "1px solid #FF7A00" : "1px solid var(--border-default)",
                background: period === f.key ? "rgba(255,122,0,0.08)" : "var(--bg-app)",
                color: period === f.key ? "#FF7A00" : "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Dossiês Concluídos", value: d.stats.dossiersConcluidos, icon: CheckCircle2, color: "#10B981", sub: `${dossierPct} do total` },
            { label: "Certidões Emitidas", value: d.stats.certidoesEmitidas, icon: FileText, color: "#FF7A00", sub: `${successRate} de sucesso` },
            { label: "Tempo Médio", value: `${d.stats.tempoMedio}h`, icon: Clock, color: "#3B82F6", sub: "por conclusão" },
            { label: "Pendências", value: d.stats.pendenciasAbertas, icon: AlertTriangle, color: "#F59E0B", sub: "dossiês abertos" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-app)", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={s.color} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={LABEL}>{s.label}</div>
                  <div style={VALUE}>{typeof s.value === "number" ? fmt(s.value) : s.value}</div>
                  <div style={SUB}>{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Crescimento de Clientes */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}><TrendingUp size={16} color="#FF7A00" /> Crescimento de Clientes</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["Período", "Novos Clientes", "Crescimento"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { period: "Hoje", val: d.clientGrowth.today },
                { period: "Esta semana", val: d.clientGrowth.week },
                { period: "Este mês", val: d.clientGrowth.month },
                { period: "Este ano", val: d.clientGrowth.year },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: i < 3 ? "1px solid var(--border-default)" : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.period}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.val}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: r.val > 0 ? "#10B981" : "var(--text-tertiary)" }}>
                      {r.val > 0 ? <><TrendingUp size={12} /> +{r.val}</> : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desempenho dos Dossiês */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}><BarChart3 size={16} color="#FF7A00" /> Desempenho dos Dossiês</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["Status", "Quantidade", "%"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                ))}
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
                <tr key={i} style={{ borderBottom: i < 4 ? "1px solid var(--border-default)" : "none" }}>
                  <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.label}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.val}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{pct(r.val, d.dossierBreakdown.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 14, display: "flex", gap: 24, fontSize: 12, color: "var(--text-secondary)" }}>
            <span>Taxa de conclusão: <strong style={{ color: "#10B981" }}>{dossierPct}</strong></span>
            <span>Taxa de cancelamento: <strong style={{ color: "#EF4444" }}>{cancelPct}</strong></span>
            <span>Tempo médio: <strong>{d.stats.tempoMedio}h</strong></span>
          </div>
        </div>

        {/* Relatório de Certidões */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}><FileText size={16} color="#FF7A00" /> Relatório de Certidões</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["Certidão", "Emitidas", "Sucesso", "Falhas", "Taxa"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.certByOrgan.map((c, i) => (
                <tr key={i} style={{ borderBottom: i < d.certByOrgan.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.total}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#10B981" }}>{c.success}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: c.failed > 0 ? "#EF4444" : "var(--text-tertiary)" }}>{c.failed}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 500, color: c.total > 0 ? ((c.success / c.total * 100) > 70 ? "#10B981" : "#F59E0B") : "var(--text-tertiary)" }}>
                    {c.total > 0 ? pct(c.success, c.total) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Relatório de Imóveis */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}><FileText size={16} color="#FF7A00" /> Relatório de Imóveis</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["Tipo de Imóvel", "Quantidade"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.propertiesByType.map((p, i) => (
                <tr key={i} style={{ borderBottom: i < d.propertiesByType.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.type}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--text-secondary)", borderTop: "1px solid var(--border-default)", paddingTop: 14 }}>
            <span>Com dossiês: <strong>{d.propertyStats.withDossiers}</strong></span>
            <span>Com certidões emitidas: <strong>{d.propertyStats.withCerts}</strong></span>
            <span>Concluídos com sucesso: <strong>{d.propertyStats.withCerts}</strong></span>
            <span>Sem movimentação: <strong style={{ color: "#F59E0B" }}>{d.propertyStats.noMovement}</strong></span>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* Line Chart */}
          <div style={SECTION}>
            <h3 style={SECTION_TITLE}>Emissões de Certidões por Mês</h3>
            {chartData.length > 0 ? (
              <svg viewBox="0 0 400 200" style={{ width: "100%", height: 200 }}>
                {chartData.map((c, i) => {
                  const x = (i / Math.max(chartData.length - 1, 1)) * 370 + 15;
                  const y = 180 - (c.total / maxVal) * 150;
                  return <circle key={i} cx={x} cy={y} r={3} fill="#FF7A00" />;
                })}
                {chartData.map((c, i, arr) => {
                  if (i === arr.length - 1) return null;
                  const x1 = (i / Math.max(arr.length - 1, 1)) * 370 + 15;
                  const y1 = 180 - (c.total / maxVal) * 150;
                  const x2 = ((i + 1) / Math.max(arr.length - 1, 1)) * 370 + 15;
                  const y2 = 180 - (arr[i + 1].total / maxVal) * 150;
                  return <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF7A00" strokeWidth={2} opacity={0.5} />;
                })}
                {chartData.map((c, i) => (
                  <text key={`t${i}`} x={(i / Math.max(chartData.length - 1, 1)) * 370 + 15} y={195} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">{c.mes}</text>
                ))}
              </svg>
            ) : <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", padding: 20 }}>Sem dados de emissão.</p>}
          </div>

          {/* Bar Chart */}
          <div style={SECTION}>
            <h3 style={SECTION_TITLE}>Certidões por Órgão</h3>
            {barData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                {barData.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 100, fontSize: 12, color: "var(--text-secondary)", textAlign: "right", flexShrink: 0 }}>{b.name.split(" ").slice(0, 2).join(" ")}</span>
                    <div style={{ flex: 1, height: 24, background: "var(--bg-secondary)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", borderRadius: 6, background: "#FF7A00", width: `${(b.total / maxBar) * 100}%`, opacity: 0.8, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ width: 30, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flexShrink: 0 }}>{b.total}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", padding: 20 }}>Sem dados.</p>}
          </div>
        </div>

        {/* Análise Inteligente */}
        <div style={{ ...SECTION, borderLeft: "3px solid #FF7A00" }}>
          <h3 style={{ ...SECTION_TITLE, borderBottom: "none", paddingBottom: 0, marginBottom: 14 }}>Análise Operacional</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.map((insight, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: "#FF7A00", marginTop: 6, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
