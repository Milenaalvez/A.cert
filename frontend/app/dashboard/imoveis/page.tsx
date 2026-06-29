"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Search, Plus, MapPin, Home, Store, Trees, Warehouse, Castle, Mountain,
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText,
  Eye, MoreVertical, Edit3, FolderOpen, ScrollText, Archive, Trash2,
  TrendingUp, BadgeCheck, AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import { PropertyQuickView } from "@/components/PropertyQuickView";
import { NovoImovelModal } from "@/components/NovoImovelModal";
import ConfirmModal from "@/components/ConfirmModal";

interface PropertyRow {
  id: string; identifier: string; registration: string; type: string;
  address: string; status: string; neighborhood: string; createdAt: string; updatedAt: string;
  ownerName: string | null; dossierCount: number; certCount: number; certObtidas: number; progress: number;
}
interface Category { type: string; icon: string; total: number; novos: number; dossierCount: number; ownerCount: number; }
interface ApiResponse { categories: Category[]; total: number; allProperties: PropertyRow[]; }

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Apartamento: { bg: "var(--badge-orange-bg)", color: "#FF7A00" },
  Casa: { bg: "var(--badge-green-bg)", color: "#059669" },
  "Sala Comercial": { bg: "var(--badge-blue-bg)", color: "#2563EB" },
  Terreno: { bg: "var(--badge-green-bg)", color: "#16A34A" },
  Galpão: { bg: "var(--badge-purple-bg)", color: "#7C3AED" },
  Condomínio: { bg: "var(--badge-red-bg)", color: "#E11D48" },
  Chácara: { bg: "var(--badge-amber-bg)", color: "#CA8A04" },
  Outros: { bg: "var(--bg-muted)", color: "var(--text-secondary)" },
};

const ALL_PROPERTY_TYPES = ["Apartamento", "Casa", "Sala Comercial", "Terreno", "Galpão", "Condomínio", "Chácara", "Outros"];

const CATEGORY_ICONS: Record<string, typeof Building2> = {
  Apartamento: Building2,
  Casa: Home,
  "Sala Comercial": Store,
  Terreno: Mountain,
  Galpão: Warehouse,
  Condomínio: Castle,
  Chácara: Trees,
  Outros: Home,
};

const PAGE_SIZE = 15;

function formatDoc(raw: string | null): string {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "—";
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d;
}
function formatDate(d: string) {
  const parts = d.split(/[-T :]/);
  if (parts.length < 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

function exportCSV(props: PropertyRow[]) {
  const headers = ["Identificador", "Tipo", "Matrícula", "Endereço", "Bairro", "Proprietário", "Status", "Dossiês", "Certidões Obtidas", "Cadastrado em"];
  const rows = props.map(p => [
    p.identifier, p.type, p.registration || "", p.address, p.neighborhood || "",
    p.ownerName || "Sem proprietário", p.status, String(p.dossierCount),
    String(p.certObtidas || 0), formatDate(p.createdAt),
  ]);
  const csv = [headers.join(";"), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `imoveis_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function exportPDF(props: PropertyRow[]) {
  const logoUrl = window.location.origin + "/images/logo.png";
  const dataPT = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const userName = (typeof window !== "undefined" && (window as any).__acertUser) ? (window as any).__acertUser : "Usuário";

  const cover = `<div class="cover"><img src="${logoUrl}" alt="A.CERT"><h1>A<span>CERT</span></h1><p class="sub">Relatório de Imóveis</p><p class="meta">Exportado por: ${userName} • ${dataPT} • ${props.length} ${props.length === 1 ? "imóvel" : "imóveis"}</p></div>`;

  const rows = props.map(p => `
    <tr><td>${p.identifier}</td><td>${p.type}</td><td style="font-family:monospace">${p.registration || "—"}</td>
    <td>${p.address}</td><td>${p.ownerName || "—"}</td>
    <td>${p.status}</td><td style="text-align:center">${p.dossierCount}</td>
    <td>${p.certObtidas || 0}/${p.certCount}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Imóveis - A.CERT</title><style>
    @page{size:A4 landscape;margin:1.2cm 1.5cm 3.2cm 1.5cm}
    body{font-family:Inter,sans-serif;color:#111827;padding:0}
    .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
    .cover img{width:72px;height:72px;margin-bottom:20px}.cover h1{font-size:34px;font-weight:800;margin:0}.cover h1 span{color:#FF7A00}
    .cover .sub{font-size:14px;color:#6B7280;margin-top:8px}.cover .meta{margin-top:16px;font-size:11px;color:#9CA3AF}
    .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:3px solid #FF7A00;padding-bottom:10px;padding-top:10px}
    .hl{display:flex;align-items:center;gap:10px}.hl img{width:38px;height:38px}.hl h1{font-size:18px;margin:0;font-weight:800}.hl h1 span{color:#FF7A00}
    .hr{text-align:right;font-size:10px;color:#6B7280}
    table{width:100%;border-collapse:collapse;font-size:9px}
    th{background:#FFF7ED;padding:7px 6px;border:1px solid #FFEDD5;font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#FF7A00;text-align:left;font-weight:700}
    td{padding:5px 6px;border:1px solid #F0F0F0}
    tr:nth-child(even){background:#FAFAFA}
    .f{position:fixed;bottom:0;left:0;right:0;height:22px;background:#FF7A00;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:9px;font-weight:600;letter-spacing:.8px}
    @media print{.f{position:fixed;bottom:0}}
  </style></head><body>
    ${cover}
    <div class="h"><div class="hl"><img src="${logoUrl}" alt="A.CERT"><h1>A<span>CERT</span></h1></div><div class="hr">${dataPT}<br>${props.length} imóveis</div></div>
    <table><thead><tr><th>Identificador</th><th>Tipo</th><th>Matrícula</th><th>Endereço</th><th>Proprietário</th><th>Status</th><th>Dossiês</th><th>Certidões</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="f">A.CERT — Central de Certidões Imobiliárias</div>
    <script>setTimeout(function(){window.print()},300)</script></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const w = window.open(URL.createObjectURL(blob), "acert_print", "popup");
  if (w) w.onload = () => { try { w.print(); } catch {} };
}

function exportPDFCompleto(props: PropertyRow[], details: Map<string, any>) {
  const logoUrl = window.location.origin + "/images/logo.png";
  const dataPT = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const userName = (typeof window !== "undefined" && (window as any).__acertUser) ? (window as any).__acertUser : "Usuário";

  const cover = `<div class="cover"><img src="${logoUrl}" alt="A.CERT"><h1>A<span>CERT</span></h1><p class="sub">Relatório de Imóveis — Completo</p><p class="meta">Exportado por: ${userName} • ${dataPT} • ${props.length} ${props.length === 1 ? "imóvel" : "imóveis"}</p></div>`;

  const cards = props.map((p, idx) => {
    const d = details.get(p.id) || {};
    return `<div class="card">
      <div class="ch"><div class="av">${p.identifier.slice(0, 2).toUpperCase()}</div><div class="ct"><h2>${p.identifier}</h2><span class="b">${p.type}</span></div><div class="cn">#${idx + 1}</div></div>
      <div class="cs"><h3>📋 Identificação</h3><div class="g2"><div class="fi"><label>Identificador</label><span>${p.identifier}</span></div><div class="fi"><label>Tipo</label><span class="t">${p.type}</span></div><div class="fi"><label>Matrícula</label><span class="m">${p.registration || "—"}</span></div><div class="fi"><label>Status</label><span>${p.status}</span></div></div></div>
      <div class="cs"><h3>📍 Endereço</h3><div class="g2"><div class="fi"><label>Endereço</label><span>${p.address}</span></div><div class="fi"><label>Bairro</label><span>${p.neighborhood || "—"}</span></div><div class="fi"><label>Cidade / UF</label><span>${[d.city, d.state].filter(Boolean).join(", ") || "—"}</span></div><div class="fi"><label>CEP</label><span>${d.zipCode || "—"}</span></div></div></div>
      <div class="cs"><h3>🏗️ Detalhes</h3><div class="g2"><div class="fi"><label>Cartório</label><span>${d.notary_office || d.notaryOffice || "—"}</span></div><div class="fi"><label>Área Construída</label><span>${d.area || "—"}</span></div><div class="fi"><label>Área do Terreno</label><span>${d.landArea || d.land_area || "—"}</span></div><div class="fi"><label>Proprietário</label><span>${p.ownerName || "Sem proprietário"}</span></div></div></div>
      <div class="cs"><h3>📂 Dossiês e Certidões</h3><div class="g3"><div class="sm"><span class="sv">${p.dossierCount}</span><span class="sl">Dossiês</span></div><div class="sm"><span class="sv">${p.certObtidas || 0}</span><span class="sl">Obtidas</span></div><div class="sm"><span class="sv">${p.certCount - (p.certObtidas || 0)}</span><span class="sl">Pendentes</span></div></div></div>
      ${d.description ? `<div class="cs"><h3>📝 Descrição</h3><p style="font-size:12px;line-height:1.5;margin:0">${d.description}</p></div>` : ""}
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Imóveis Completos - A.CERT</title><style>
    @page{size:A4;margin:1cm 1.4cm 3cm 1.4cm}
    *{box-sizing:border-box}body{font-family:Inter,sans-serif;color:#111827;padding:0;margin:0}
    .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
    .cover img{width:72px;height:72px;margin-bottom:20px}.cover h1{font-size:34px;font-weight:800;margin:0}.cover h1 span{color:#FF7A00}
    .cover .sub{font-size:14px;color:#6B7280;margin-top:8px}.cover .meta{margin-top:16px;font-size:11px;color:#9CA3AF}
    .card{page-break-inside:avoid;page-break-after:always;border:1px solid #E5E7EB;border-radius:14px;margin-bottom:20px;overflow:hidden}.card:last-child{page-break-after:auto}
    .ch{background:linear-gradient(135deg,#FFF7ED,#FFFFFF);padding:20px;display:flex;align-items:center;gap:14px;border-bottom:2px solid #FFEDD5}
    .av{width:46px;height:46px;border-radius:12px;background:#FF7A00;color:#FFF;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0}
    .ct{flex:1}.ct h2{font-size:18px;font-weight:700;margin:0 0 3px 0}
    .b{display:inline-block;font-size:9px;font-weight:600;padding:2px 7px;border-radius:3px;background:#FFF7ED;color:#FF7A00}
    .cn{font-size:10px;color:#9CA3AF;font-weight:600}
    .cs{padding:16px 20px}.cs+.cs{border-top:1px solid #F0F0F0}
    .cs h3{font-size:12px;font-weight:700;color:#FF7A00;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:.5px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
    .fi{display:flex;flex-direction:column;gap:1px}.fi label{font-size:9px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px}.fi span{font-size:12px;color:#111827}
    .m{font-family:monospace!important;font-size:12px}.t{color:#FF7A00!important;font-weight:600}
    .sm{background:#FAFAFA;border-radius:8px;padding:12px;text-align:center;border:1px solid #F0F0F0}
    .sv{display:block;font-size:20px;font-weight:800;color:#111827}.sl{display:block;font-size:9px;color:#9CA3AF;margin-top:1px;text-transform:uppercase;letter-spacing:.4px}
    .f{position:fixed;bottom:0;left:0;right:0;height:20px;background:#FF7A00;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:9px;font-weight:600;letter-spacing:1px}
    @media print{.f{position:fixed;bottom:0}.card{page-break-after:always}.card:last-child{page-break-after:auto}}
  </style></head><body>
    ${cover}
    ${cards}
    <div class="f">A.CERT — Central de Certidões Imobiliárias</div>
    <script>setTimeout(function(){window.print()},400)</script></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const w = window.open(URL.createObjectURL(blob), "acert_print", "popup");
  if (w) w.onload = () => { try { w.print(); } catch {} };
}

async function fetchPropertyDetails(ids: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const token = localStorage.getItem("acert_token");
  for (const id of ids) {
    try {
      const r = await fetch(`/api/properties/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) { const d = await r.json(); map.set(id, d.property || d); }
    } catch {}
  }
  return map;
}

export default function ImoveisPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<string>("todas");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "archive" | "delete"; id: string; name: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [showNovoImovel, setShowNovoImovel] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async (completo: boolean, format: "excel" | "pdf" | "ambos") => {
    setExportOpen(false);
    setExportLoading(true);
    let details: Map<string, any> | undefined;
    if (completo) {
      details = await fetchPropertyDetails(filtered.map(p => p.id));
    }
    setExportLoading(false);
    if (format === "excel" || format === "ambos") exportCSV(filtered);
    if (format === "pdf" || format === "ambos") {
      if (completo && details) exportPDFCompleto(filtered, details);
      else exportPDF(filtered);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/properties");
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const apiCategories = data?.categories || [];
  const categories = ALL_PROPERTY_TYPES.map(type => {
    const api = apiCategories.find(c => c.type === type);
    return api || { type, icon: "🏠", total: 0, novos: 0, dossierCount: 0, ownerCount: 0 };
  });
  const allProps = data?.allProperties || [];

  const tabOptions = [
    { key: "todas", label: "Todas", count: allProps.length },
    ...categories.map(c => ({ key: c.type, label: c.type, count: c.total })),
  ];

  const filtered = useMemo(() => {
    let list = allProps;
    if (tab !== "todas") list = list.filter(p => p.type === tab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.address.toLowerCase().includes(q) ||
        p.identifier.toLowerCase().includes(q) ||
        p.registration.toLowerCase().includes(q) ||
        (p.ownerName && p.ownerName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allProps, tab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected = paginated.length > 0 && selected.size >= paginated.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(paginated.map(p => p.id)));
  };

  const handleArchive = async () => {
    if (!confirmAction) return;
    await fetch(`/api/properties/${confirmAction.id}/archive`, { method: "POST" });
    setConfirmAction(null);
    fetchData();
  };
  const handleDelete = async () => {
    if (!confirmAction) return;
    await fetch(`/api/properties/${confirmAction.id}`, { method: "DELETE" });
    setConfirmAction(null);
    fetchData();
  };

  // Stats
  const comDossies = allProps.filter(p => p.dossierCount > 0).length;
  const totalCertsObtidas = allProps.reduce((a, p) => a + (p.certObtidas || 0), 0);
  const semProprietario = allProps.filter(p => !p.ownerName).length;

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh] w-full"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">

        {/* Header */}
        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Imóveis</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Gerencie todos os imóveis vinculados aos processos e certidões.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              <div className="relative">
                <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input type="text" placeholder="Buscar por matrícula, endereço ou proprietário..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} style={{ height: "44px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", paddingLeft: "42px", paddingRight: "16px", width: "360px", outline: "none" }} />
              </div>
              <button onClick={() => setShowNovoImovel(true)} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}><Plus size={16} strokeWidth={2.5} />Novo Imóvel</button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats" style={{ marginBottom: "16px" }}>
          <StatsCard icon={Building2} title="Imóveis cadastrados" value={String(data?.total || 0)} complement={`${allProps.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length} este mês`} iconBg="var(--badge-orange-bg)" iconColor="#FF7A00" />
          <StatsCard icon={TrendingUp} title="Com dossiês ativos" value={String(comDossies)} complement={comDossies > 0 ? `${Math.round(comDossies / Math.max(allProps.length, 1) * 100)}% do total` : "—"} iconBg="var(--badge-blue-bg)" iconColor="#2563EB" />
          <StatsCard icon={BadgeCheck} title="Certidões obtidas" value={String(totalCertsObtidas)} complement={`${allProps.reduce((a, p) => a + p.certCount, 0)} disponíveis`} iconBg="var(--badge-green-bg)" iconColor="#059669" />
          <StatsCard icon={AlertCircle} title="Sem proprietário" value={String(semProprietario)} complement="Imóveis não vinculados" iconBg="var(--badge-red-bg)" iconColor="#DC2626" />
        </div>

        {/* Category Cards */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Building2 size={14} strokeWidth={1.5} style={{ color: "#FF7A00" }} /> Categorias de Imóveis
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            {categories.map((cat) => {
              const c = CATEGORY_COLORS[cat.type] || CATEGORY_COLORS["Outros"];
              const Icon = CATEGORY_ICONS[cat.type] || Home;
              const active = tab === cat.type;
              return (
                <button key={cat.type} onClick={() => { setTab(active ? "todas" : cat.type); setPage(1); setSelected(new Set()); }}
                  style={{
                    background: "var(--bg-surface)", borderRadius: "14px", padding: "18px 20px",
                    border: active ? `2px solid ${c.color}` : "1px solid var(--border-light)",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s ease",
                    position: "relative", display: "flex", flexDirection: "column", gap: "14px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = active ? c.color : "var(--border-light)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>

                  {/* Top row: icon + name + count */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} strokeWidth={1.5} style={{ color: c.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}>{cat.type}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginTop: "1px" }}>{cat.total} imóveis</span>
                    </div>
                  </div>

                  {/* Bottom row: 3 stat blocks */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{cat.dossierCount}</span>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: "3px" }}>Dossiês</span>
                    </div>
                    <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{cat.ownerCount}</span>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: "3px" }}>Donos</span>
                    </div>
                    <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "18px", fontWeight: 800, color: "#059669", lineHeight: 1 }}>{cat.novos}</span>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: "3px" }}>Novos</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs + Export */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0", overflowX: "auto", flex: 1 }}>
            {tabOptions.slice(0, 8).map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSelected(new Set()); }}
                style={{
                  padding: "10px 16px", fontSize: "13px", fontWeight: tab === t.key ? 600 : 500,
                  color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: tab === t.key ? "2px solid #FF7A00" : "2px solid transparent",
                  transition: "all 0.15s ease", whiteSpace: "nowrap",
                }}>
                {t.label} <span style={{ marginLeft: "4px", fontSize: "11px", fontWeight: 600, padding: "1px 6px", borderRadius: "8px", background: tab === t.key ? "var(--badge-orange-bg)" : "var(--bg-muted)", color: tab === t.key ? "#FF7A00" : "var(--text-muted)" }}>{t.count}</span>
              </button>
            ))}
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => !exportLoading && setExportOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-[38px] px-5 min-w-[120px] rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer"
              style={{ background: "#FF7A00", opacity: exportLoading ? 0.7 : 1 }}
            ><Download size={14} /> {exportLoading ? "Carregando..." : "Exportar"}</button>
          )}
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
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>Exportar Imóveis</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 300 }}>{filtered.length} imóveis selecionados</p>
                </div>
                <div style={{ width: "100%", marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".8px", textAlign: "left", marginBottom: 6 }}>Resumido (tabela)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setExportOpen(false); handleExport(false, "excel"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileSpreadsheet size={14} strokeWidth={1.5} /> Excel</button>
                    <button onClick={() => { setExportOpen(false); handleExport(false, "pdf"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileText size={14} strokeWidth={1.5} /> PDF</button>
                  </div>
                  <div style={{ height: 1, background: "var(--border-light)", margin: "14px 0" }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".8px", textAlign: "left", marginBottom: 6 }}>Completo (perfil)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setExportOpen(false); handleExport(true, "excel"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileSpreadsheet size={14} strokeWidth={1.5} /> Excel</button>
                    <button onClick={() => { setExportOpen(false); handleExport(true, "pdf"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileText size={14} strokeWidth={1.5} /> PDF</button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "0 32px 32px 32px", justifyContent: "center" }}>
                <button onClick={() => setExportOpen(false)} style={{ height: 42, padding: "0 24px", borderRadius: 8, border: "1px solid var(--border-light)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
            <thead>
              <tr className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                <th style={{ width: "36px", padding: "8px 0 8px 12px", borderBottom: "1px solid var(--border-default)" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#FF7A00" }} />
                </th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "200px" }}>Imóvel</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "130px" }}>Matrícula</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "220px" }}>Endereço</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "140px" }}>Proprietário</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", width: "90px" }}>Status</th>
                <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", width: "70px" }}>Dossiês</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", width: "100px" }}>Certidões</th>
                <th style={{ width: "44px", textAlign: "center", padding: "8px 4px", borderBottom: "1px solid var(--border-default)" }}></th>
                <th style={{ width: "44px", textAlign: "center", padding: "8px 12px 8px 4px", borderBottom: "1px solid var(--border-default)" }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const c = CATEGORY_COLORS[p.type] || CATEGORY_COLORS["Outros"];
                const RowIcon = CATEGORY_ICONS[p.type] || Home;
                const statusColor = p.status === "Regular" ? "#059669" : p.status === "Arquivado" ? "#9CA3AF" : "#D97706";
                return (
                  <tr key={p.id} className="group"
                    style={{ borderRadius: "8px", transition: "background 0.1s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "12px 0 12px 12px", borderRadius: "8px 0 0 8px" }}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => setSelected(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })} style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#FF7A00" }} />
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <RowIcon size={16} strokeWidth={1.5} style={{ color: c.color }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.identifier}</span>
                          <span style={{ fontSize: "11px", fontWeight: 500, color: c.color }}>{p.type}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "nowrap" }}>{p.registration || "—"}</span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={12} strokeWidth={1.5} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "220px" }}>{p.address}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      {p.ownerName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700 }}>
                            {p.ownerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{p.ownerName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: p.status === "Regular" ? "var(--badge-green-bg)" : p.status === "Arquivado" ? "var(--bg-muted)" : "var(--badge-amber-bg)", color: statusColor }}>{p.status}</span>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{p.dossierCount}</span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{p.certObtidas || 0}/{p.certCount}</span>
                        <div style={{ marginTop: "4px", height: "3px", borderRadius: "2px", background: "var(--border-default)", overflow: "hidden", width: "60px" }}>
                          <div style={{ height: "3px", borderRadius: "2px", width: `${p.progress || 0}%`, background: (p.progress || 0) >= 80 ? "#059669" : (p.progress || 0) >= 40 ? "#D97706" : "#DC2626" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 4px", textAlign: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); setQuickViewId(p.id); }}
                        style={{ width: "32px", height: "32px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        <Eye size={15} strokeWidth={1.5} />
                      </button>
                    </td>
                    <td style={{ padding: "12px 12px 12px 4px", textAlign: "center", borderRadius: "0 8px 8px 0", position: "relative" }}>
                      <button onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuPos({ top: rect.bottom + 4, left: rect.right - 190 }); setMenuOpenId(menuOpenId === p.id ? null : p.id); }}
                        style={{ width: "32px", height: "32px", borderRadius: "6px", border: "none", background: menuOpenId === p.id ? "var(--bg-muted)" : "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MoreVertical size={15} strokeWidth={1.5} />
                      </button>
                      {menuOpenId === p.id && (
                        <div style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 40, background: "var(--bg-surface)", borderRadius: "10px", border: "1px solid var(--border-default)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)", minWidth: "190px", overflow: "hidden" }}>
                          <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setQuickViewId(p.id); }} style={menuItemStyle}><Edit3 size={14} strokeWidth={1.5} /> Editar imóvel</button>
                          <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); router.push(`/dashboard/dossies?property=${p.id}`); }} style={menuItemStyle}><FolderOpen size={14} strokeWidth={1.5} /> Dossiês vinculados</button>
                          <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); router.push(`/dashboard/certidoes?property=${p.id}`); }} style={menuItemStyle}><ScrollText size={14} strokeWidth={1.5} /> Ver certidões</button>
                          <div style={{ height: "1px", background: "var(--border-light)", margin: "4px 0" }} />
                          <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setConfirmAction({ type: "archive", id: p.id, name: p.identifier }); }} style={{ ...menuItemStyle, color: "var(--text-secondary)" }}><Archive size={14} strokeWidth={1.5} /> Arquivar</button>
                          <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setConfirmAction({ type: "delete", id: p.id, name: p.identifier }); }} style={{ ...menuItemStyle, color: "var(--text-secondary)" }}><Trash2 size={14} strokeWidth={1.5} /> Mover p/ lixeira</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={10} style={{ padding: "48px 0", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <Building2 size={32} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>Nenhum imóvel encontrado</span>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Ajuste os filtros ou cadastre um novo imóvel.</span>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-light)" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Mostrando {paginated.length} de {filtered.length} imóveis</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={pageBtnStyle(page <= 1)}><ChevronLeft size={14} strokeWidth={1.5} /></button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={pageNumStyle(n === page)}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pageBtnStyle(page >= totalPages)}><ChevronRight size={14} strokeWidth={1.5} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View */}
      {quickViewId && <PropertyQuickView propertyId={quickViewId} onClose={() => setQuickViewId(null)} />}

      {/* Novo Imóvel Modal */}
      {showNovoImovel && (
        <NovoImovelModal
          onClose={() => setShowNovoImovel(false)}
          onCreated={() => { setShowNovoImovel(false); fetchData(); }}
        />
      )}

      {/* Confirm */}
      {confirmAction && (
        <ConfirmModal open={true} title={confirmAction.type === "archive" ? "Arquivar imóvel" : "Mover para lixeira"}
          message={confirmAction.type === "archive" ? `Deseja arquivar "${confirmAction.name}"? Ele ficará disponível na Lixeira para restauração.` : `Deseja mover "${confirmAction.name}" para a Lixeira? Você poderá restaurar ou excluir permanentemente depois.`}
          confirmLabel={confirmAction.type === "archive" ? "Arquivar" : "Mover para lixeira"}
          variant={confirmAction.type === "delete" ? "warning" : "default"}
          onConfirm={confirmAction.type === "archive" ? handleArchive : handleDelete}
          onCancel={() => setConfirmAction(null)} onClose={() => setConfirmAction(null)} />
      )}
    </DashboardLayout>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px",
  border: "none", background: "transparent", cursor: "pointer", fontSize: "13px",
  color: "var(--text-primary)", textAlign: "left", fontFamily: "inherit", transition: "background 0.1s",
};

const exportOptStyle: React.CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "12px 0", borderRadius: 8, border: "1px solid var(--border-light)",
  background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500,
  color: "var(--text-primary)", fontFamily: "inherit", transition: "all 0.15s ease",
};
function exportHover(e: React.MouseEvent<HTMLButtonElement>) { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.background = "rgba(255,122,0,0.04)"; }
function exportLeave(e: React.MouseEvent<HTMLButtonElement>) { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "transparent"; }
const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-default)",
  background: "transparent", cursor: disabled ? "default" : "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1,
});
const pageNumStyle = (active: boolean): React.CSSProperties => ({
  width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-default)",
  fontSize: "12px", fontWeight: active ? 700 : 500, cursor: "pointer",
  background: active ? "#FF7A00" : "transparent", color: active ? "#FFF" : "var(--text-secondary)",
  display: "flex", alignItems: "center", justifyContent: "center",
});
