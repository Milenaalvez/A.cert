"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, FileText, Download, BarChart3, FileSpreadsheet,
  AlertTriangle, CheckCircle2, Clock, Users, Building2, Target, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";

/* ── Types ─────────────────────────────────────────── */
interface DossierDetail { label: string; total: number; pct: number; avgHours: number; trend: string; }
interface CertOrgan { name: string; total: number; success: number; failed: number; successRate: number; avgMinutes: number; }
interface ChartPoint { label: string; total: number; }
interface ClientGrowth { today: number; yesterday: number; week: number; lastWeek: number; month: number; lastMonth: number; year: number; }
interface PropertyTypeRow { type: string; total: number; dossiers_generated: number; certs_emitted: number; completion_rate: number; }
interface ProductivityRow { id: string; name: string; avatar: string | null; total_dossiers: number; total_certs: number; success_certs: number; success_rate: number; }
interface ReportData {
  dossierBreakdown: { total: number; concluidos: number; andamento: number; pendentes: number; cancelados: number; arquivados: number };
  dossierDetails: DossierDetail[];
  certByOrgan: CertOrgan[];
  totalCertificates: number;
  monthlyEmission: ChartPoint[];
  dailyEmission: ChartPoint[];
  clientGrowth: ClientGrowth;
  propertiesByType: PropertyTypeRow[];
  productivityRanking: ProductivityRow[];
  organStatuses: { id: string; name: string; status: string }[];
  trends: { certThisMonth: number; certLastMonth: number; certGrowthPct: number; dossierCancelledThisMonth: number; dossierCancelledLastMonth: number; cancelGrowthPct: number };
  metadata: { generatedAt: string; totalRecords: number; dataSource: string };
}

const apiBase = "http://localhost:3001";
function getInitials(n: string) { return n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function diffPct(curr: number, prev: number): string { if (prev === 0) return curr > 0 ? "+100%" : "0%"; const d = Math.round((curr - prev) / prev * 100); return (d >= 0 ? "+" : "") + d + "%"; }

const STATUS_COLORS: Record<string, string> = {
  "Concluído": "#059669", "Em andamento": "#FF7A00", "Pendente": "#D97706",
  "Cancelado": "#DC2626", "Arquivado": "#6B7280",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface px-4 py-3 rounded-lg shadow-lg border border-default">
      <p className="text-[12px] text-secondary mb-1">{label}</p>
      <p className="text-[16px] font-bold text-primary">{payload[0].value} certidões</p>
    </div>
  );
}

export default function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("mes");
  const [exportOpen, setExportOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`${apiBase}/api/reports`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleExportResumido() {
    setExportOpen(false);
    const logoUrl = window.location.origin + "/images/logo.png";
    const dataPT = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const horaPT = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const rows = [
      ["Dossiês concluídos", String(d.dossierBreakdown.concluidos)],
      ["Certidões emitidas", String(d.totalCertificates)],
      ["Pendências abertas", String(d.dossierBreakdown.pendentes)],
      ["Taxa de sucesso", String(d.totalCertificates > 0 ? Math.round(d.certByOrgan.reduce((a, c) => a + c.success, 0) / d.totalCertificates * 100) : 0) + "%"],
      ["Tempo médio de conclusão", d.dossierDetails.find(s => s.label === "Concluído")?.avgHours ? `${d.dossierDetails.find(s => s.label === "Concluído")!.avgHours}h` : "—"],
    ];
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório A.CERT</title><style>
      @page{size:A4;margin:1.5cm 2cm 2cm 2cm}body{font-family:Inter,sans-serif;color:#111827}
      .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
      .cover img{width:64px;margin-bottom:16px}.cover h1{font-size:28px;font-weight:800;margin:0}.cover h1 span{color:#FF7A00}
      .cover .sub{font-size:14px;color:#6B7280;margin-top:8px}.cover .meta{font-size:11px;color:#9CA3AF;margin-top:12px}
      .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;border-bottom:2px solid #FF7A00;padding-bottom:8px}
      .h img{width:32px}.h h2{font-size:16px;margin:0}.h span{color:#FF7A00}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px}
      th{background:#FFF7ED;padding:8px 10px;border:1px solid #FFEDD5;font-size:10px;text-transform:uppercase;color:#FF7A00;text-align:left}
      td{padding:7px 10px;border:1px solid #F0F0F0}tr:nth-child(even){background:#FAFAFA}
      .section{margin-bottom:16px}.section h3{font-size:13px;color:#6B7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px}
      .footer{position:fixed;bottom:0;left:0;right:0;background:#FF7A00;height:20px;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:9px}
    </style></head><body>
      <div class="cover"><img src="${logoUrl}"><h1>A<span>CERT</span></h1><p class="sub">Relatório Resumido</p><p class="meta">${dataPT} • ${horaPT} • ${d.metadata.totalRecords} registros</p></div>
      <div class="h"><div><h2>A<span>CERT</span></h2></div><div style="font-size:10px;color:#6B7280">${dataPT} às ${horaPT}</div></div>
      <div class="section"><h3>Indicadores principais</h3>
      <table><tr><th>Métrica</th><th>Valor</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td style="font-weight:600">${r[1]}</td></tr>`).join("")}</table></div>
      <div class="section"><h3>Dossiês</h3>
      <table><tr><th>Status</th><th>Qtd</th><th>%</th></tr>${d.dossierDetails.map(s => `<tr><td>${s.label}</td><td>${s.total}</td><td>${s.pct}%</td></tr>`).join("")}</table></div>
      <div class="section"><h3>Certidões por Órgão</h3>
      <table><tr><th>Órgão</th><th>Emitidas</th><th>Sucesso</th><th>Taxa</th></tr>${d.certByOrgan.map(c => `<tr><td>${c.name}</td><td>${c.total}</td><td>${c.success}</td><td>${c.successRate}%</td></tr>`).join("")}</table></div>
      <div class="footer">A.CERT • Central de Certidões • ${dataPT}</div>
    </body></html>`;
    const w = window.open("", "_blank")!;
    w.document.write(html);w.document.close();
    setTimeout(() => w.print(), 500);
  }

  function handleExportCompleto() {
    setExportOpen(false);
    const logoUrl = window.location.origin + "/images/logo.png";
    const dataPT = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const horaPT = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Completo A.CERT</title><style>
      @page{size:A4;margin:1.2cm 1.5cm 2.2cm 1.5cm}body{font-family:Inter,sans-serif;color:#111827}
      .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
      .cover img{width:64px;margin-bottom:16px}.cover h1{font-size:28px;font-weight:800;margin:0}.cover h1 span{color:#FF7A00}
      .cover .sub{font-size:14px;color:#6B7280;margin-top:8px}.cover .meta{font-size:11px;color:#9CA3AF;margin-top:12px}
      .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;border-bottom:2px solid #FF7A00;padding-bottom:8px}
      .h h2{font-size:16px;margin:0}.h span{color:#FF7A00}
      .page-break{page-break-before:always}.section{margin-bottom:18px}.section h3{font-size:12px;color:#6B7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E5E7EB;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:12px}
      th{background:#FFF7ED;padding:7px 8px;border:1px solid #FFEDD5;font-size:9px;text-transform:uppercase;color:#FF7A00;text-align:left}
      td{padding:6px 8px;border:1px solid #F0F0F0}tr:nth-child(even){background:#FAFAFA}
      .insight{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:11px;color:#374151;padding:8px;background:#FFF7ED;border-radius:6px}
      .insight .dot{width:6px;height:6px;border-radius:3px;background:#FF7A00;margin-top:5px;flex-shrink:0}
      .footer{position:fixed;bottom:0;left:0;right:0;background:#FF7A00;height:20px;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:9px}
    </style></head><body>
      <div class="cover"><img src="${logoUrl}"><h1>A<span>CERT</span></h1><p class="sub">Relatório Operacional Completo</p><p class="meta">${dataPT} • ${horaPT} • ${d.metadata.totalRecords} registros analisados<br>${d.metadata.dataSource}</p></div>
      <div class="h"><div><h2>A<span>CERT</span></h2></div><div style="font-size:10px;color:#6B7280">${dataPT} às ${horaPT}</div></div>
      <div class="section"><h3>Análise Operacional</h3>${insights.map(ins => `<div class="insight"><div class="dot"></div><div><strong>${ins.title}</strong> — ${ins.desc}</div></div>`).join("")}</div>
      <div class="section"><h3>Desempenho dos Dossiês</h3>
      <table><tr><th>Status</th><th>Qtd</th><th>%</th><th>Tempo médio</th></tr>${d.dossierDetails.map(s => `<tr><td>${s.label}</td><td>${s.total}</td><td>${s.pct}%</td><td>${s.avgHours > 0 ? s.avgHours + 'h' : '—'}</td></tr>`).join("")}</table></div>
      <div class="section"><h3>Performance das Certidões</h3>
      <table><tr><th>Órgão</th><th>Emitidas</th><th>Sucesso</th><th>Falhas</th><th>Taxa</th><th>Tempo médio</th></tr>${d.certByOrgan.map(c => `<tr><td>${c.name}</td><td>${c.total}</td><td>${c.success}</td><td>${c.failed}</td><td>${c.successRate}%</td><td>${c.avgMinutes > 0 ? c.avgMinutes + ' min' : '—'}</td></tr>`).join("")}</table></div>
      <div class="page-break section"><h3>Movimentação Imobiliária</h3>
      <table><tr><th>Tipo</th><th>Qtd</th><th>Dossiês</th><th>Certidões</th><th>Taxa conclusão</th></tr>${d.propertiesByType.map(p => `<tr><td>${p.type}</td><td>${p.total}</td><td>${p.dossiers_generated || '—'}</td><td>${p.certs_emitted || '—'}</td><td>${p.completion_rate}%</td></tr>`).join("")}</table></div>
      <div class="section"><h3>Crescimento de Clientes</h3>
      <table><tr><th>Período</th><th>Novos clientes</th></tr><tr><td>Hoje</td><td>${d.clientGrowth.today}</td></tr><tr><td>Esta semana</td><td>${d.clientGrowth.week}</td></tr><tr><td>Este mês</td><td>${d.clientGrowth.month}</td></tr><tr><td>Este ano</td><td>${d.clientGrowth.year}</td></tr></table></div>
      ${d.productivityRanking.length > 0 ? `<div class="section"><h3>Produtividade dos Corretores</h3><table><tr><th>Usuário</th><th>Dossiês</th><th>Certidões</th><th>Conclusões</th><th>Taxa</th></tr>${d.productivityRanking.map(p => `<tr><td>${p.name}</td><td>${p.total_dossiers}</td><td>${p.total_certs}</td><td>${p.success_certs}</td><td>${p.success_rate}%</td></tr>`).join("")}</table></div>` : ""}
      <div class="section" style="margin-top:24px;padding-top:12px;border-top:1px solid #E5E7EB;font-size:10px;color:#9CA3AF">
        Relatório gerado em ${dataPT} às ${horaPT} • ${d.metadata.totalRecords} registros analisados • ${d.metadata.dataSource}
      </div>
      <div class="footer">A.CERT • Central de Certidões • ${dataPT}</div>
    </body></html>`;
    const w = window.open("", "_blank")!;
    w.document.write(html);w.document.close();
    setTimeout(() => w.print(), 500);
  }

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh] w-full"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh] text-[14px] text-muted">Erro ao carregar relatórios.</div></DashboardLayout>;

  const d = data;
  const now = new Date();
  const chartData = period === "hoje" || period === "ontem" ? d.dailyEmission : d.monthlyEmission;

  const insights: { title: string; desc: string; icon: typeof TrendingUp; color: string }[] = [];
  if (d.trends.certGrowthPct > 5) insights.push({ title: "Crescimento detectado", desc: `Certidões emitidas cresceram ${d.trends.certGrowthPct}% em relação ao mês anterior.`, icon: TrendingUp, color: "#059669" });
  else if (d.trends.certGrowthPct < -5) insights.push({ title: "Queda nas emissões", desc: `Emissões caíram ${Math.abs(d.trends.certGrowthPct)}% comparado ao mês passado.`, icon: TrendingDown, color: "#DC2626" });
  if (d.trends.cancelGrowthPct > 10) insights.push({ title: "Cancelamentos em alta", desc: `Cancelamentos de dossiês subiram ${d.trends.cancelGrowthPct}% este mês.`, icon: AlertTriangle, color: "#D97706" });
  const slowOrgans = d.certByOrgan.filter(c => c.avgMinutes > 60).sort((a, b) => b.avgMinutes - a.avgMinutes);
  if (slowOrgans.length > 0) insights.push({ title: "Gargalo operacional", desc: `${slowOrgans[0].name} possui o maior tempo médio de emissão (${slowOrgans[0].avgMinutes} min).`, icon: Clock, color: "#3B82F6" });
  const topType = [...d.propertiesByType].sort((a, b) => b.dossiers_generated - a.dossiers_generated)[0];
  if (topType?.dossiers_generated) insights.push({ title: "Categoria principal", desc: `Imóveis do tipo "${topType.type}" lideram com ${topType.dossiers_generated} dossiês gerados.`, icon: Building2, color: "#FF7A00" });
  if (d.productivityRanking[0]) insights.push({ title: "Liderança da equipe", desc: `${d.productivityRanking[0].name} lidera em produtividade com ${d.productivityRanking[0].total_dossiers} dossiês.`, icon: Target, color: "#7C3AED" });
  if (insights.length < 3) insights.push({ title: "Operação estável", desc: "Sistema operando dentro dos parâmetros normais nos últimos 30 dias.", icon: CheckCircle2, color: "#059669" });

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full" style={{ gap: 32 }}>
        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <PageHeader
            title="Relatórios"
            subtitle="Análises operacionais, produtividade e desempenho da plataforma."
          />
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <div className="flex gap-3">
            {[
              { k: "hoje", l: "Hoje" },
              { k: "ontem", l: "Ontem" },
              { k: "semana", l: "Esta semana" },
              { k: "mes", l: "Este mês" },
              { k: "ano", l: "Este ano" },
              { k: "personalizado", l: "Personalizado" },
            ].map(f => (
              <button key={f.k} onClick={() => setPeriod(f.k)}
                className={`h-[38px] px-5 rounded text-[13px] font-semibold transition-colors cursor-pointer text-center min-w-[100px] ${period === f.k ? "border-none text-white" : "border border-default bg-transparent text-secondary hover:border-hover"}`}
                style={period === f.k ? { background: "#FF7A00" } : undefined}
              >{f.l}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-[38px] px-5 min-w-[120px] rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer"
              style={{ background: "#FF7A00" }}
            ><Download size={14} /> Exportar</button>
          </div>
        </div>

        {/* Modal Exportar */}
        {exportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }} onClick={() => setExportOpen(false)} />
            <div className="relative w-full animate-in fade-in zoom-in-95 duration-200" style={{ maxWidth: 400, borderRadius: 10, background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "36px 32px 20px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,122,0,0.12)" }}>
                  <Download size={24} strokeWidth={2.5} color="#FF7A00" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>Exportar Relatório</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>Selecione o formato de exportação:</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginTop: 4 }}>
                  <button onClick={handleExportResumido} style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.background = "rgba(255,122,0,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-app)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <FileSpreadsheet size={18} strokeWidth={1.5} color="#FF7A00" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Resumido</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>PDF executivo com indicadores principais</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={handleExportCompleto} style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.background = "rgba(255,122,0,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-app)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Download size={18} strokeWidth={1.5} color="#FF7A00" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Completo</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>PDF corporativo com todas as tabelas e gráficos</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "0 32px 32px 32px", justifyContent: "center" }}>
                <button onClick={() => setExportOpen(false)} style={{ height: 42, padding: "0 24px", borderRadius: 8, border: "1px solid var(--border-light)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico principal + Card ao lado */}
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: "1 1 50%", background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={14} strokeWidth={1.5} color="#FF7A00" /> Emissões de Certidões por Período
            </div>
            {chartData.length === 0 ? (
              <div className="h-[360px] flex items-center justify-center text-[14px] text-muted">Sem dados de emissão no período.</div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF7A00" stopOpacity={0.2} /><stop offset="100%" stopColor="#FF7A00" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#FF7A00" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: "#FF7A00", r: 4, strokeWidth: 0 }} activeDot={{ fill: "#FF7A00", r: 6, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ flex: "1 1 50%", background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart3 size={14} strokeWidth={1.5} color="#FF7A00" /> Certidões por Órgão
            </div>
            <div style={{ flex: 1, minHeight: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.certByOrgan.map(c => ({ name: c.name.length > 10 ? c.name.slice(0, 10) : c.name, total: c.total }))} layout="vertical" margin={{ top: 0, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={80} />
                  <Bar dataKey="total" fill="#FF7A00" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Duas colunas: Clientes + Insights */}
        <div className="flex gap-6">
          <div className="flex-1" style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Users size={14} strokeWidth={1.5} color="#FF7A00" /> Aquisição de Clientes
            </div>
            <table className="w-full">
              <thead><tr>{["Período", "Novos clientes", "Crescimento"].map(h => <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-muted uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { p: "Hoje", v: d.clientGrowth.today, prev: d.clientGrowth.yesterday },
                  { p: "Esta semana", v: d.clientGrowth.week, prev: d.clientGrowth.lastWeek },
                  { p: "Este mês", v: d.clientGrowth.month, prev: d.clientGrowth.lastMonth },
                  { p: "Este ano", v: d.clientGrowth.year, prev: 0 },
                  { p: "Ano anterior", v: 0, prev: 0, ph: true },
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-primary">{r.p}</td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-primary">{r.ph ? "—" : r.v}</td>
                    <td className="px-4 py-2.5">{!r.ph && r.v > 0 ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#059669]"><TrendingUp size={12} />{diffPct(r.v, r.prev)}</span> : !r.ph ? <span className="text-[12px] text-muted">—</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="w-[35%]" style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Target size={14} strokeWidth={1.5} color="#FF7A00" /> Análise Operacional
            </div>
            <div className="flex flex-col gap-3">
              {insights.map((ins, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ins.color}15` }}><ins.icon size={15} color={ins.color} /></div>
                  <div><p className="text-[12px] font-semibold text-primary leading-tight">{ins.title}</p><p className="text-[11px] text-secondary mt-0.5 leading-relaxed">{ins.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desempenho dos Dossiês */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><BarChart3 size={14} strokeWidth={1.5} color="#FF7A00" /> Desempenho dos Dossiês</div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-default">{["Status", "Quantidade", "Percentual", "Tempo médio", "Tendência"].map(h => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {d.dossierDetails.map((s, i) => (
                <tr key={i} className={i < d.dossierDetails.length - 1 ? "border-b border-default" : ""}>
                  <td className="px-4 py-3.5 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLORS[s.label] || "#6B7280" }} /><span className="text-[13px] font-medium text-primary">{s.label}</span></td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-primary">{s.total}</td>
                  <td className="px-4 py-3.5 text-[13px] text-secondary">{s.pct}%</td>
                  <td className="px-4 py-3.5 text-[13px] text-secondary">{s.avgHours > 0 ? `${s.avgHours}h` : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${s.trend === "up" ? "text-[#DC2626]" : s.trend === "down" ? "text-[#059669]" : "text-muted"}`}>
                      {s.trend === "up" ? <TrendingUp size={12} /> : s.trend === "down" ? <TrendingDown size={12} /> : <span>—</span>}
                      {s.trend === "up" ? "Alta" : s.trend === "down" ? "Baixa" : "Estável"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certidões */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><FileText size={14} strokeWidth={1.5} color="#FF7A00" /> Performance das Certidões</div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-default">{["Órgão", "Emitidas", "Sucesso", "Falhas", "Taxa", "Tempo"].map(h => <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold text-muted uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {d.certByOrgan.map((c, i) => (
                <tr key={i} className={i < d.certByOrgan.length - 1 ? "border-b border-default" : ""}>
                  <td className="px-3 py-3 text-[13px] font-medium text-primary">{c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name}</td>
                  <td className="px-3 py-3 text-[13px] font-semibold text-primary">{c.total}</td>
                  <td className="px-3 py-3 text-[13px] text-[#059669]">{c.success}</td>
                  <td className="px-3 py-3 text-[13px] text-[#DC2626]">{c.failed}</td>
                  <td className="px-3 py-3"><span className={`text-[12px] font-semibold ${c.successRate >= 95 ? "text-[#059669]" : c.successRate < 80 ? "text-[#DC2626]" : "text-secondary"}`}>{c.successRate}%</span></td>
                  <td className="px-3 py-3 text-[12px] text-secondary">{c.avgMinutes > 0 ? `${c.avgMinutes} min` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Movimentação Imobiliária */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Building2 size={14} strokeWidth={1.5} color="#FF7A00" /> Movimentação Imobiliária</div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-default">{["Tipo de imóvel", "Quantidade", "Dossiês gerados", "Certidões emitidas", "Taxa de conclusão"].map(h => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {d.propertiesByType.map((p, i) => (
                <tr key={i} className={i < d.propertiesByType.length - 1 ? "border-b border-default" : ""}>
                  <td className="px-4 py-3.5 text-[13px] font-medium text-primary">{p.type}</td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-primary">{p.total}</td>
                  <td className="px-4 py-3.5 text-[13px] text-secondary">{p.dossiers_generated || "—"}</td>
                  <td className="px-4 py-3.5 text-[13px] text-secondary">{p.certs_emitted || "—"}</td>
                  <td className="px-4 py-3.5"><span className={`text-[12px] font-semibold ${p.completion_rate >= 70 ? "text-[#059669]" : p.completion_rate >= 30 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{p.completion_rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Produtividade */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Users size={14} strokeWidth={1.5} color="#FF7A00" /> Produtividade dos Corretores</div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-default">{["Usuário", "Dossiês", "Certidões", "Conclusões", "Taxa"].map(h => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-muted uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {d.productivityRanking.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-muted">Nenhum dado de produtividade disponível.</td></tr>
              ) : d.productivityRanking.map((p, i) => (
                <tr key={p.id} className={i < d.productivityRanking.length - 1 ? "border-b border-default" : ""}>
                  <td className="px-4 py-3.5 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold text-primary">{getInitials(p.name)}</div><span className="text-[13px] font-medium text-primary">{p.name}</span></td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-primary">{p.total_dossiers}</td>
                  <td className="px-4 py-3.5 text-[13px] text-secondary">{p.total_certs}</td>
                  <td className="px-4 py-3.5 text-[13px] text-secondary">{p.success_certs}</td>
                  <td className="px-4 py-3.5"><span className={`text-[12px] font-semibold ${p.success_rate >= 80 ? "text-[#059669]" : p.success_rate >= 50 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{p.success_rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className="text-center text-[12px] text-muted py-2">
          <p>Relatório gerado em {now.toLocaleString("pt-BR")} · {d.metadata.totalRecords} registros analisados · {d.metadata.dataSource}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
