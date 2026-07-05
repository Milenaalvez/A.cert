"use client";

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
import { useT } from "@/i18n/useT";

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

const apiBase = "";
function getInitials(n: string) { return n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function diffPct(curr: number, prev: number): string { if (prev === 0) return curr > 0 ? "+100%" : "0%"; const d = Math.round((curr - prev) / prev * 100); return (d >= 0 ? "+" : "") + d + "%"; }

const STATUS_COLORS: Record<string, string> = {
  "Concluído": "#059669", "Em andamento": "#FF7A00", "Pendente": "#D97706",
  "Cancelado": "#DC2626", "Arquivado": "#6B7280",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface px-5 py-3 rounded-xl shadow-lg border border-default text-center min-w-[130px]">
      <p className="text-[11px] text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[18px] font-bold" style={{ color: "#FF7A00" }}>{payload[0].value}</p>
      <p className="text-[11px] text-secondary">certidões</p>
    </div>
  );
}

export default function RelatoriosPage() {
  const { t } = useT();
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

  useEffect(() => { fetchData(); }, [fetchData]);

  function buildPDF(completo: boolean) {
    setExportOpen(false);
    const logoUrl = window.location.origin + "/images/logo.png";
    const dataPT = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const horaPT = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const titulo = completo ? "Relatório Operacional Completo" : "Relatório Executivo";
    const empresa = "DONNOS Docs";

    // SVG charts
    const lineData = d.monthlyEmission;
    const maxLine = Math.max(...lineData.map(l => l.total), 1);
    const bt = '\x60';
    const lineSvg = lineData.length > 0 ? '<svg width="100%" viewBox="0 0 700 220" style="max-width:600px"><rect width="700" height="220" fill="#FAFAFA" rx="4"/><line x1="60" y1="180" x2="680" y2="180" stroke="#D1D5DB" stroke-width="1"/>' + [0,0.25,0.5,0.75,1].map(r => bt + '<line x1="60" y1="' + (20 + 160*(1-r)) + '" x2="680" y2="' + (20 + 160*(1-r)) + '" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4,4"/>' + bt).join("") + lineData.map((pt,i)=>{const x=60+i/Math.max(lineData.length-1,1)*620;const y=20+160*(1-pt.total/maxLine);return bt + '<circle cx="' + Math.round(x) + '" cy="' + Math.round(y) + '" r="5" fill="#FF7A00" stroke="#fff" stroke-width="2"/>' + bt;}).join("") + lineData.map((pt,i,arr)=>{if(i===arr.length-1)return"";const x1=60+i/Math.max(arr.length-1,1)*620;const y1=20+160*(1-pt.total/maxLine);const x2=60+(i+1)/Math.max(arr.length-1,1)*620;const y2=20+160*(1-arr[i+1].total/maxLine);return bt + '<line x1="' + Math.round(x1) + '" y1="' + Math.round(y1) + '" x2="' + Math.round(x2) + '" y2="' + Math.round(y2) + '" stroke="#FF7A00" stroke-width="2.5"/>'  + bt;}).join("") + lineData.map((pt,i)=>bt + '<text x="' + Math.round(60+i/Math.max(lineData.length-1,1)*620) + '" y="202" text-anchor="middle" font-size="10" fill="#6B7280">' + pt.label + '</text>' + bt).join("") + '</svg>' : '';

    const barData = [...d.certByOrgan].sort((a,b)=>b.total-a.total).slice(0,7);
    const maxBar = Math.max(...barData.map(b=>b.total),1);
    const barSvg = barData.length > 0 ? '<svg width="100%" viewBox="0 0 400 ' + (barData.length*22+8) + '" style="max-width:400px"><rect width="400" height="' + (barData.length*22+8) + '" fill="#FAFAFA" rx="4"/>' + barData.map((b,i)=>{const y=i*22+2;const w=Math.max((b.total/maxBar)*250,3);return bt + '<text x="90" y="' + (y+13) + '" text-anchor="end" font-size="9" fill="#6B7280">' + (b.name.length>13?b.name.slice(0,13)+'…':b.name) + '</text><rect x="94" y="' + (y+3) + '" width="' + Math.round(w) + '" height="16" rx="3" fill="#FF7A00" opacity="0.85"/><text x="' + Math.round(94+w+5) + '" y="' + (y+14) + '" font-size="9" fill="#374151" font-weight="600">' + b.total + '</text>' + bt;}).join("") + '</svg>' : '';

    // Section helpers
    const sec = (num: string, title: string) => `<div style="margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid #D1D5DB"><span style="font-weight:700;color:#FF7A00;font-size:13px">${num}</span> <span style="font-weight:700;color:#374151;font-size:13px">${title}</span></div>`;
    const tbl = (headers: string[], rows: string[][]) => `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

    // KPI cards
    const kpis = [
      ["Dossiês concluídos", String(d.dossierBreakdown.concluidos)],
      ["Certidões emitidas", String(d.totalCertificates)],
      ["Pendências abertas", String(d.dossierBreakdown.pendentes)],
      ["Taxa de sucesso global", String(d.totalCertificates > 0 ? Math.round(d.certByOrgan.reduce((a,c)=>a+c.success,0)/d.totalCertificates*100) : 0) + "%"],
    ];
    const kpiHtml = kpis.map(([k,v]) => `<div style="text-align:center;padding:14px 10px;background:#FFF7ED;border-radius:8px"><div style="font-size:22px;font-weight:800;color:#FF7A00;line-height:1">${v}</div><div style="font-size:10px;color:#6B7280;margin-top:4px">${k}</div></div>`).join("");

    // Body
    let body = "";
    if (completo) {
      body += sec("2", "ANÁLISE OPERACIONAL");
      body += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">${insights.map(ins => `<div style="display:flex;align-items:flex-start;gap:8px;font-size:11px;color:#374151;padding:8px;background:#F9FAFB;border-radius:6px;border-left:3px solid ${ins.color}"><div style="min-width:6px;height:6px;border-radius:3px;background:${ins.color};margin-top:4px"></div><div><strong>${ins.title}:</strong> ${ins.desc}</div></div>`).join("")}</div>`;

      body += sec("3", "EMISSÕES DE CERTIDÕES");
      if (lineSvg) body += `<div style="text-align:center;margin:12px 0 20px">${lineSvg}</div>`;
      body += sec("3.1", "Certidões por Órgão");
      if (barSvg) body += `<div style="text-align:center;margin:8px 0 16px">${barSvg}</div>`;

      body += sec("3.2", "Performance Detalhada");
      body += tbl(["Órgão","Emitidas","Sucesso","Falhas","Taxa de sucesso","Tempo médio"], d.certByOrgan.map(c => [c.name, String(c.total), String(c.success), String(c.failed), `${c.successRate}%`, c.avgMinutes > 0 ? `${c.avgMinutes} min` : "—"]));

      body += sec("4", "DESEMPENHO DOS DOSSIÊS");
      body += tbl(["Status","Quantidade","Percentual","Tempo médio","Tendência"], d.dossierDetails.map(s => [s.label, String(s.total), `${s.pct}%`, s.avgHours > 0 ? `${s.avgHours}h` : "—", s.trend === "up" ? "↑ Alta" : s.trend === "down" ? "↓ Baixa" : "Estável"]));

      body += sec("5", "MOVIMENTAÇÃO IMOBILIÁRIA");
      body += tbl(["Tipo de imóvel","Quantidade","Dossiês gerados","Certidões emitidas","Taxa de conclusão"], d.propertiesByType.map(p => [p.type, String(p.total), String(p.dossiers_generated || "—"), String(p.certs_emitted || "—"), `${p.completion_rate}%`]));

      body += sec("6", "AQUISIÇÃO DE CLIENTES");
      body += tbl(["Período","Novos clientes"], [["Hoje",String(d.clientGrowth.today)],["Esta semana",String(d.clientGrowth.week)],["Este mês",String(d.clientGrowth.month)],["Este ano",String(d.clientGrowth.year)]]);

      if (d.productivityRanking.length > 0) {
        body += sec("7", "PRODUTIVIDADE DA EQUIPE");
        body += tbl(["Usuário","Dossiês","Certidões","Conclusões","Taxa de sucesso"], d.productivityRanking.map(p => [p.name, String(p.total_dossiers), String(p.total_certs), String(p.success_certs), `${p.success_rate}%`]));
      }
    } else {
      body += sec("2", "INDICADORES PRINCIPAIS");
      body += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">${kpiHtml}</div>`;

      body += sec("3", "DESEMPENHO DOS DOSSIÊS");
      body += tbl(["Status","Quantidade","%","Tempo médio"], d.dossierDetails.map(s => [s.label, String(s.total), `${s.pct}%`, s.avgHours > 0 ? `${s.avgHours}h` : "—"]));

      body += sec("4", "CERTIDÕES POR ÓRGÃO");
      body += tbl(["Órgão","Emitidas","Sucesso","Taxa"], d.certByOrgan.map(c => [c.name, String(c.total), String(c.success), `${c.successRate}%`]));
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo} — ${empresa}</title><style>
      @page{size:A4 landscape;margin:2.5cm 2.5cm 3cm 2.5cm;@top-center{content:element(header)};@bottom-center{content:element(footer)}}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1F2937;font-size:11.5px;line-height:1.7;margin:0;padding:0 8px}
      .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
      .cover img{width:80px;margin-bottom:24px}
      .cover h1{font-size:32px;font-weight:800;margin:0;color:#111827;letter-spacing:-0.5px}
      .cover h1 span{color:#FF7A00}
      .cover .sub{font-size:16px;color:#6B7280;margin:12px 0 4px;font-weight:400}
      .cover .meta{font-size:11px;color:#9CA3AF;margin-top:8px}
      .cover .info{font-size:12px;color:#6B7280;margin-top:40px;line-height:2}
      .cover .info strong{color:#374151}
      .header{position:running(header);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #D1D5DB;padding-bottom:6px;font-size:9px;color:#6B7280}
      .header .hl{display:flex;align-items:center;gap:6px}.header .hl img{width:20px;height:20px}
      .header .hr{text-align:right}
      .footer{position:running(footer);display:flex;align-items:center;justify-content:space-between;border-top:1px solid #D1D5DB;padding-top:4px;font-size:8px;color:#9CA3AF}
      table{width:100%;border-collapse:collapse;font-size:10px;margin:8px 0 16px}
      th{background:#F3F4F6;padding:8px 12px;border:1px solid #D1D5DB;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:#374151;text-align:left}
      td{padding:8px 12px;border:1px solid #E5E7EB;vertical-align:top}
      tr:nth-child(even) td{background:#FAFAFA}
      .fonte{font-size:9px;color:#9CA3AF;text-align:right;margin-top:2px}
      .kpi{text-align:center;padding:16px 12px;background:#FFF7ED;border-radius:8px;border:1px solid #FFEDD5}
      .kpi .val{font-size:24px;font-weight:800;color:#FF7A00;line-height:1}
      .kpi .lbl{font-size:10px;color:#6B7280;margin-top:6px;text-transform:uppercase;letter-spacing:.3px}
    </style></head><body>
      <div class="header"><div class="hl"><img src="${logoUrl}"><strong>${empresa}</strong></div><div class="hr">${titulo}</div></div>
      <div class="footer"><div>${empresa} — Central de Certidões</div><div>${dataPT} às ${horaPT}</div></div>
      <div class="cover">
        <img src="${logoUrl}">
        <h1>A<span>CERT</span></h1>
        <p class="sub">${titulo}</p>
        <p class="meta">${dataPT} às ${horaPT}</p>
        <div class="info">
          <strong>Empresa:</strong> ${empresa}<br>
          <strong>Período analisado:</strong> ${dataPT}<br>
          <strong>Total de registros:</strong> ${d.metadata.totalRecords}<br>
          <strong>Fonte:</strong> ${d.metadata.dataSource}
        </div>
      </div>
      ${sec("1", "RESUMO EXECUTIVO")}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">${kpiHtml}</div>
      ${body}
      <div class="fonte">Fonte: ${d.metadata.dataSource} • Gerado em ${dataPT} às ${horaPT} • ${d.metadata.totalRecords} registros processados</div>
    </body></html>`;
    const w = window.open("", "_blank")!;
    w.document.write(html);w.document.close();
    setTimeout(() => w.print(), 600);
  }

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh] w-full"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh] text-[14px] text-muted">Erro ao carregar relatórios.</div></DashboardLayout>;

  const d = data;
  const now = new Date();
  const chartData = period === "hoje" || period === "ontem" ? d.dailyEmission : d.monthlyEmission;

  const trends = d.trends || { certGrowthPct: 0, cancelGrowthPct: 0 };
  const insights: { title: string; desc: string; icon: typeof TrendingUp; color: string }[] = [];
  if (trends.certGrowthPct > 5) insights.push({ title: "Crescimento detectado", desc: `Certidões emitidas cresceram ${trends.certGrowthPct}% em relação ao mês anterior.`, icon: TrendingUp, color: "#059669" });
  else if (trends.certGrowthPct < -5) insights.push({ title: "Queda nas emissões", desc: `Emissões caíram ${Math.abs(trends.certGrowthPct)}% comparado ao mês passado.`, icon: TrendingDown, color: "#DC2626" });
  if (trends.cancelGrowthPct > 10) insights.push({ title: "Cancelamentos em alta", desc: `Cancelamentos de dossiês subiram ${trends.cancelGrowthPct}% este mês.`, icon: AlertTriangle, color: "#D97706" });
  const slowOrgans = (d.certByOrgan || []).filter(c => c.avgMinutes > 60).sort((a, b) => b.avgMinutes - a.avgMinutes);
  if (slowOrgans.length > 0) insights.push({ title: "Gargalo operacional", desc: `${slowOrgans[0].name} possui o maior tempo médio de emissão (${slowOrgans[0].avgMinutes} min).`, icon: Clock, color: "#3B82F6" });
  const topType = [...(d.propertiesByType || [])].sort((a, b) => b.dossiers_generated - a.dossiers_generated)[0];
  if (topType?.dossiers_generated) insights.push({ title: "Categoria principal", desc: `Imóveis do tipo "${topType.type}" lideram com ${topType.dossiers_generated} dossiês gerados.`, icon: Building2, color: "#FF7A00" });
  if ((d.productivityRanking || [])[0]) insights.push({ title: "Liderança da equipe", desc: `${d.productivityRanking[0].name} lidera em produtividade com ${d.productivityRanking[0].total_dossiers} dossiês.`, icon: Target, color: "#7C3AED" });
  if (insights.length < 3) insights.push({ title: "Operação estável", desc: "Sistema operando dentro dos parâmetros normais nos últimos 30 dias.", icon: CheckCircle2, color: "#059669" });

  return (
    <DashboardLayout>
      <div className="flex flex-col px-4 sm:px-8 lg:px-16 pt-6 sm:pt-12 pb-24 w-full" style={{ gap: 32 }}>
        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <PageHeader
            title={t("reports.title")}
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
                  <button onClick={() => buildPDF(false)} style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
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
                  <button onClick={() => buildPDF(true)} style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-app)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
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
              <thead><tr>{["Período", "Novos clientes", "Crescimento"].map(h => <th key={h} className={`text-[10px] font-semibold text-muted uppercase pb-2 ${h === "Período" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { p: "Hoje", v: d.clientGrowth.today, prev: d.clientGrowth.yesterday },
                  { p: "Esta semana", v: d.clientGrowth.week, prev: d.clientGrowth.lastWeek },
                  { p: "Este mês", v: d.clientGrowth.month, prev: d.clientGrowth.lastMonth },
                  { p: "Este ano", v: d.clientGrowth.year, prev: 0 },
                  { p: "Ano anterior", v: 0, prev: 0, ph: true },
                ].map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-subtle)" }}>
                    <td className="py-2.5 pl-2 text-[13px] font-medium text-primary">{r.p}</td>
                    <td className="py-2.5 text-[13px] font-semibold text-primary text-center">{r.ph ? "—" : r.v}</td>
                    <td className="py-2.5 text-center">{!r.ph && r.v > 0 ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#059669]"><TrendingUp size={12} />{diffPct(r.v, r.prev)}</span> : !r.ph ? <span className="text-[12px] text-muted">—</span> : null}</td>
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
          <table className="w-full">
            <thead><tr>{["Status", "Quantidade", "Percentual", "Tempo médio", "Tendência"].map(h => <th key={h} className={`text-[10px] font-semibold text-muted uppercase pb-2 ${h === "Status" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead>
            <tbody>
              {d.dossierDetails.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-subtle)" }}>
                  <td className="py-2.5 pl-2 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLORS[s.label] || "var(--text-secondary)" }} /><span className="text-[13px] font-medium text-primary">{s.label}</span></td>
                  <td className="py-2.5 text-[13px] font-semibold text-primary text-center">{s.total}</td>
                  <td className="py-2.5 text-center">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="text-[12px] font-semibold text-secondary">{s.pct}%</span>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-light)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: "#FF7A00", width: `${Math.min(s.pct, 100)}%` }} />
                      </div>
                    </span>
                  </td>
                  <td className="py-2.5 text-[12px] text-muted text-center">{s.avgHours > 0 ? `${s.avgHours}h` : "—"}</td>
                  <td className="py-2.5 text-center">
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
          <table className="w-full">
            <thead><tr>{["Órgão", "Emitidas", "Sucesso", "Falhas", "Taxa de sucesso", "Tempo médio"].map(h => <th key={h} className={`text-[10px] font-semibold text-muted uppercase pb-2 ${h === "Órgão" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead>
            <tbody>
              {d.certByOrgan.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-subtle)", borderRadius: 8 }}>
                  <td className="py-2.5 pl-2 text-[13px] font-medium text-primary">{c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name}</td>
                  <td className="py-2.5 text-[13px] font-semibold text-primary text-center">{c.total}</td>
                  <td className="py-2.5 text-[13px] font-medium text-[#059669] text-center">{c.success}</td>
                  <td className="py-2.5 text-[13px] font-medium text-center" style={{ color: c.failed > 0 ? "#DC2626" : "var(--text-muted)" }}>{c.failed || "—"}</td>
                  <td className="py-2.5 text-center">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="text-[12px] font-semibold" style={{ color: c.successRate >= 95 ? "#059669" : c.successRate >= 70 ? "#D97706" : "#DC2626" }}>{c.successRate}%</span>
                      <div style={{ width: 48, height: 4, borderRadius: 2, background: "var(--border-light)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: c.successRate >= 95 ? "#059669" : c.successRate >= 70 ? "#D97706" : "#DC2626", width: `${c.successRate}%` }} />
                      </div>
                    </span>
                  </td>
                  <td className="py-2.5 text-[12px] text-muted text-center">{c.avgMinutes > 0 ? `${c.avgMinutes}min` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Movimentação Imobiliária */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Building2 size={14} strokeWidth={1.5} color="#FF7A00" /> Movimentação Imobiliária</div>
          <table className="w-full">
            <thead><tr>{["Tipo de imóvel", "Quantidade", "Dossiês gerados", "Certidões emitidas", "Taxa de conclusão"].map(h => <th key={h} className={`text-[10px] font-semibold text-muted uppercase pb-2 ${h === "Tipo de imóvel" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead>
            <tbody>
              {d.propertiesByType.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-subtle)" }}>
                  <td className="py-2.5 pl-2 text-[13px] font-medium text-primary">{p.type}</td>
                  <td className="py-2.5 text-[13px] font-semibold text-primary text-center">{p.total}</td>
                  <td className="py-2.5 text-[13px] text-secondary text-center">{p.dossiers_generated || "—"}</td>
                  <td className="py-2.5 text-[13px] text-secondary text-center">{p.certs_emitted || "—"}</td>
                  <td className="py-2.5 text-center">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="text-[12px] font-semibold" style={{ color: p.completion_rate >= 70 ? "#059669" : p.completion_rate >= 30 ? "#D97706" : "#DC2626" }}>{p.completion_rate}%</span>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-light)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: p.completion_rate >= 70 ? "#059669" : p.completion_rate >= 30 ? "#D97706" : "#DC2626", width: `${Math.min(p.completion_rate, 100)}%` }} />
                      </div>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Produtividade */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Users size={14} strokeWidth={1.5} color="#FF7A00" /> Produtividade dos Corretores</div>
          <table className="w-full">
            <thead><tr>{["Usuário", "Dossiês", "Certidões", "Conclusões", "Taxa de sucesso"].map(h => <th key={h} className={`text-[10px] font-semibold text-muted uppercase pb-2 ${h === "Usuário" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead>
            <tbody>
              {d.productivityRanking.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[13px] text-muted">Nenhum dado de produtividade disponível.</td></tr>
              ) : d.productivityRanking.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-subtle)" }}>
                  <td className="py-2.5 pl-2 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold text-primary">{getInitials(p.name)}</div><span className="text-[13px] font-medium text-primary">{p.name}</span></td>
                  <td className="py-2.5 text-[13px] font-semibold text-primary text-center">{p.total_dossiers}</td>
                  <td className="py-2.5 text-[13px] text-secondary text-center">{p.total_certs}</td>
                  <td className="py-2.5 text-[13px] text-secondary text-center">{p.success_certs}</td>
                  <td className="py-2.5 text-center">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="text-[12px] font-semibold" style={{ color: p.success_rate >= 80 ? "#059669" : p.success_rate >= 50 ? "#D97706" : "#DC2626" }}>{p.success_rate}%</span>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-light)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: p.success_rate >= 80 ? "#059669" : p.success_rate >= 50 ? "#D97706" : "#DC2626", width: `${Math.min(p.success_rate, 100)}%` }} />
                      </div>
                    </span>
                  </td>
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
