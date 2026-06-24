"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Users, AlertCircle, BadgeCheck, TrendingUp,
  Eye, MoreVertical, Edit3, FolderOpen, ScrollText, Archive, Trash2, Link2,
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import { PersonDetailModal } from "@/components/PersonDetailModal";
import { NovaPessoaModal } from "@/components/NovaPessoaModal";
import VinculoParentalModal from "@/components/VinculoParentalModal";
import ConfirmModal from "@/components/ConfirmModal";

interface PersonRow {
  id: string; name: string; cpf: string | null; cnpj: string | null;
  email: string | null; phone: string | null; cellPhone: string | null;
  city: string | null; state: string | null; createdAt: string;
  isPreCadastro: boolean; archivedAt: string | null; type: string;
  dossierCount: number; propertyCount: number;
  documentationStatus: string; totalCerts: number;
  certsObtidas: number; certsPendentes: number;
  relationshipCount: number; updatedAt: string;
}
interface ApiResponse {
  people: PersonRow[];
  stats: { total: number; vinculadas: number; documentacaoCompleta: number; pendenciasDocumentais: number };
}

const PAGE_SIZE = 15;
const TABS = [
  { key: "todas", label: "Todas" },
  { key: "fisica", label: "Pessoa Física" },
  { key: "empresarial", label: "Pessoa Empresarial" },
] as const;

function formatDoc(cpf: string | null, cnpj: string | null): string {
  const raw = (cpf || cnpj || "").replace(/\D/g, "");
  if (!raw) return "—";
  if (raw.length === 11) return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (raw.length === 14) return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return raw;
}

function formatDate(d: string) {
  const parts = d.split(/[-T :]/);
  if (parts.length < 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

function exportCSV(people: PersonRow[], completo: boolean, profileData?: Map<string, any>) {
  const baseHeaders = ["Nome", "Tipo", "CPF/CNPJ", "Email", "Telefone", "Dossiês", "Criado em"];
  const completeHeaders = ["Nome", "Tipo", "CPF/CNPJ", "RG", "Data Nasc.", "Nome Mãe", "Nome Pai",
    "Estado Civil", "Nacionalidade", "Email", "Telefone", "Celular", "Cidade", "UF",
    "Dossiês", "Certidões Pendentes", "Certidões Obtidas", "Criado em", "Atualizado em"];
  const headers = completo ? completeHeaders : baseHeaders;

  const rows = people.map(p => {
    const detail = profileData?.get(p.id);
    return completo ? [
      p.name, p.type, formatDoc(p.cpf, p.cnpj),
      detail?.rg || "—", detail?.birth_date || "—",
      detail?.mother_name || "—", detail?.father_name || "—",
      detail?.marital_status || "—", detail?.nationality || "—",
      p.email || "—", p.phone || "—", p.cellPhone || "—",
      p.city || "—", p.state || "—",
      String(p.dossierCount),
      String(p.certsPendentes || 0), String(p.certsObtidas || 0),
      formatDate(p.createdAt), formatDate(p.updatedAt),
    ] : [
      p.name, p.type, formatDoc(p.cpf, p.cnpj), p.email || "", p.phone || p.cellPhone || "",
      String(p.dossierCount), formatDate(p.createdAt),
    ];
  });

  const csv = [headers.join(";"), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pessoas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(people: PersonRow[], completo: boolean, profileData?: Map<string, any>) {
  const logoUrl = window.location.origin + "/images/logo.png";
  const dataPT = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const userName = (typeof window !== "undefined" && (window as any).__acertUser) ? (window as any).__acertUser : "Usuário";
  const title = completo ? "Relatório de Perfis Completos" : "Relatório de Pessoas";
  const subtitle = `Exportado por: ${userName} • ${dataPT} • ${people.length} ${people.length === 1 ? "pessoa" : "pessoas"}`;
  const cover = `<div class="cover"><img src="${logoUrl}" alt="A.CERT"><h1>A<span>CERT</span></h1><p class="sub">${title}</p><p class="meta">${subtitle}</p></div>`;

  if (!completo) {
    const rows = people.map(p => `
      <tr><td>${p.name}</td><td>${p.type}</td><td style="font-family:monospace">${formatDoc(p.cpf, p.cnpj)}</td>
      <td>${p.email || "—"}</td><td>${p.phone || p.cellPhone || "—"}</td>
      <td style="text-align:center">${p.dossierCount}</td><td>${formatDate(p.createdAt)}</td></tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pessoas - A.CERT</title><style>
      @page{size:A4 landscape;margin:1.2cm 1.5cm 3.2cm 1.5cm}
      body{font-family:Inter,sans-serif;color:#111827;padding:0}
      .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
      .cover img{width:72px;height:72px;margin-bottom:20px}.cover h1{font-size:34px;font-weight:800;margin:0}.cover h1 span{color:#FF7A00}
      .cover .sub{font-size:14px;color:#6B7280;margin-top:8px}.cover .meta{margin-top:16px;font-size:11px;color:#9CA3AF}
      .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:3px solid #FF7A00;padding-bottom:10px;padding-top:10px}
      .header-l{display:flex;align-items:center;gap:10px}
      .header-l img{width:38px;height:38px}.header-l h1{font-size:18px;margin:0;font-weight:800}.header-l h1 span{color:#FF7A00}
      .header-r{text-align:right;font-size:10px;color:#6B7280}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th{background:#FFF7ED;padding:8px 8px;border:1px solid #FFEDD5;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#FF7A00;text-align:left;font-weight:700}
      td{padding:6px 8px;border:1px solid #F0F0F0}
      tr:nth-child(even){background:#FAFAFA}
      .footer{position:fixed;bottom:0;left:0;right:0;height:22px;background:#FF7A00;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:9px;font-weight:600;letter-spacing:.8px}
      @media print{.footer{position:fixed;bottom:0}}
    </style></head><body>
      ${cover}
      <div class="header"><div class="header-l"><img src="${logoUrl}" alt="A.CERT"><h1>A<span>CERT</span></h1></div><div class="header-r">${dataPT}<br>${people.length} registros</div></div>
      <table><thead><tr><th>Nome</th><th>Tipo</th><th>CPF/CNPJ</th><th>Email</th><th>Telefone</th><th>Dossiês</th><th>Criado em</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">A.CERT — Central de Certidões Imobiliárias</div>
      <script>setTimeout(function(){window.print()},300)</script></body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const w = window.open(URL.createObjectURL(blob), "acert_print", "popup");
    if (w) w.onload = () => { try { w.print(); } catch {} };
    return;
  }

  // Completo — full profile cards
  const cards = people.map((p, idx) => {
    const d = profileData?.get(p.id) || {};
    return `<div class="card">
      <div class="card-h">
        <div class="av">${p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
        <div class="card-ti"><h2>${p.name}</h2><span class="b">${p.type}</span>${p.isPreCadastro ? '<span class="ba">⚠ Pré-cadastro</span>' : ''}</div>
        <div class="card-n">#${idx + 1}</div>
      </div>
      <div class="card-s"><h3>📋 Dados Pessoais</h3>
        <div class="g2"><div class="f"><label>Nome</label><span>${p.name}</span></div><div class="f"><label>Tipo</label><span class="t">${p.type}</span></div>
        <div class="f"><label>CPF/CNPJ</label><span class="m">${formatDoc(p.cpf, p.cnpj)}</span></div><div class="f"><label>RG</label><span>${d.rg || "—"}</span></div>
        <div class="f"><label>Data de Nascimento</label><span>${d.birth_date || "—"}</span></div><div class="f"><label>Nome da Mãe</label><span>${d.mother_name || "—"}</span></div>
        <div class="f"><label>Nome do Pai</label><span>${d.father_name || "—"}</span></div><div class="f"><label>Estado Civil</label><span>${d.marital_status || "—"}</span></div>
        <div class="f"><label>Nacionalidade</label><span>${d.nationality || "—"}</span></div></div>
      </div>
      <div class="card-s"><h3>📞 Contato e Endereço</h3>
        <div class="g2"><div class="f"><label>Email</label><span>${p.email || "—"}</span></div><div class="f"><label>Telefone</label><span>${p.phone || "—"}</span></div>
        <div class="f"><label>Celular</label><span>${p.cellPhone || "—"}</span></div><div class="f"><label>Cidade / UF</label><span>${[p.city, p.state].filter(Boolean).join(", ") || "—"}</span></div></div>
      </div>
      <div class="card-s"><h3>📂 Dossiês e Certidões</h3>
        <div class="g3"><div class="sm"><span class="sv">${p.dossierCount}</span><span class="sl">Dossiês</span></div>
        <div class="sm"><span class="sv">${p.certsObtidas || 0}</span><span class="sl">Obtidas</span></div>
        <div class="sm"><span class="sv">${p.certsPendentes || 0}</span><span class="sl">Pendentes</span></div></div>
      </div>
      <div class="card-s"><h3>📅 Datas</h3>
        <div class="g2"><div class="f"><label>Cadastrado em</label><span>${formatDate(p.createdAt)}</span></div><div class="f"><label>Última atualização</label><span>${formatDate(p.updatedAt)}</span></div></div>
      </div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Perfis Completos - A.CERT</title><style>
    @page{size:A4;margin:1cm 1.4cm 3cm 1.4cm}
    *{box-sizing:border-box}body{font-family:Inter,sans-serif;color:#111827;padding:0;margin:0}
    .cover{page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center}
    .cover img{width:72px;height:72px;margin-bottom:20px}
    .cover h1{font-size:34px;font-weight:800;margin:0}.cover h1 span{color:#FF7A00}
    .cover .sub{font-size:13px;color:#6B7280;margin-top:8px}
    .cover .meta{margin-top:28px;font-size:11px;color:#9CA3AF}
    .card{page-break-inside:avoid;page-break-after:always;border:1px solid #E5E7EB;border-radius:14px;margin-bottom:20px;overflow:hidden}
    .card:last-child{page-break-after:auto}
    .card-h{background:linear-gradient(135deg,#FFF7ED,#FFFFFF);padding:20px;display:flex;align-items:center;gap:14px;border-bottom:2px solid #FFEDD5}
    .av{width:46px;height:46px;border-radius:50%;background:#FF7A00;color:#FFF;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0}
    .card-ti{flex:1}.card-ti h2{font-size:18px;font-weight:700;margin:0 0 3px 0}
    .b{display:inline-block;font-size:9px;font-weight:600;padding:2px 7px;border-radius:3px;background:#FFF7ED;color:#FF7A00;margin-right:5px}
    .ba{display:inline-block;font-size:9px;font-weight:600;padding:2px 7px;border-radius:3px;background:#FFFBEB;color:#D97706}
    .card-n{font-size:10px;color:#9CA3AF;font-weight:600}
    .card-s{padding:16px 20px}.card-s+.card-s{border-top:1px solid #F0F0F0}
    .card-s h3{font-size:12px;font-weight:700;color:#FF7A00;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:.5px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}
    .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
    .f{display:flex;flex-direction:column;gap:1px}.f label{font-size:9px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px}.f span{font-size:12px;color:#111827}
    .m{font-family:monospace!important;font-size:12px}.t{color:#FF7A00!important;font-weight:600}
    .sm{background:#FAFAFA;border-radius:8px;padding:12px;text-align:center;border:1px solid #F0F0F0}
    .sv{display:block;font-size:20px;font-weight:800;color:#111827}.sl{display:block;font-size:9px;color:#9CA3AF;margin-top:1px;text-transform:uppercase;letter-spacing:.4px}
    .footer{position:fixed;bottom:0;left:0;right:0;height:20px;background:#FF7A00;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:9px;font-weight:600;letter-spacing:1px}
    @media print{.footer{position:fixed;bottom:0}.card{page-break-after:always}.card:last-child{page-break-after:auto}}
  </style></head><body>
    ${cover}
    ${cards}
    <div class="footer">A.CERT — Central de Certidões Imobiliárias</div>
    <script>setTimeout(function(){window.print()},400)</script></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const w = window.open(URL.createObjectURL(blob), "acert_print", "popup");
  if (w) w.onload = () => { try { w.print(); } catch {} };
}

async function fetchPersonDetails(ids: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const token = localStorage.getItem("acert_token");
  for (const id of ids) {
    try {
      const r = await fetch(`http://localhost:3001/api/people/${id}/detail`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) {
        const d = await r.json();
        map.set(id, d.person);
      }
    } catch {}
  }
  return map;
}

export default function PessoasPage() {
  const router = useRouter();
  const [allPeople, setAllPeople] = useState<PersonRow[]>([]);
  const [stats, setStats] = useState<ApiResponse["stats"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"todas" | "fisica" | "empresarial">("todas");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [vinculoId, setVinculoId] = useState<string | null>(null);
  const [vinculoName, setVinculoName] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: "archive" | "delete"; id: string; name: string } | null>(null);
  const [page, setPage] = useState(1);
  const [actionBadge, setActionBadge] = useState<{ tab: string; delta: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showNovaPessoa, setShowNovaPessoa] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch("http://localhost:3001/api/people", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d: ApiResponse = await r.json();
      setAllPeople(d.people);
      setStats(d.stats);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter client-side (no API refetch on tab switch)
  const filtered = allPeople.filter(p => {
    if (tab === "fisica") return !!p.cpf;
    if (tab === "empresarial") return !!p.cnpj;
    return true;
  });

  const searched = searchQuery.trim()
    ? filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchQuery)) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.phone && p.phone.includes(searchQuery)))
    : filtered;

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);
  const paginated = searched.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allSelected = paginated.length > 0 && selected.size === paginated.length && paginated.every(p => selected.has(p.id));
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); paginated.forEach(p => n.delete(p.id)); return n; });
    else setSelected(prev => { const n = new Set(prev); paginated.forEach(p => n.add(p.id)); return n; });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpenId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenId, exportOpen]);

  useEffect(() => {
    if (actionBadge) {
      const t = setTimeout(() => setActionBadge(null), 1500);
      return () => clearTimeout(t);
    }
  }, [actionBadge]);

  const handleTab = (t: typeof tab) => {
    setTab(t);
    setPage(1);
    setSelected(new Set());
    setSearchQuery("");
  };

  const handleArchive = async () => {
    if (!confirmAction) return;
    try {
      const token = localStorage.getItem("acert_token");
      await fetch(`http://localhost:3001/api/people/${confirmAction.id}/archive`, {
        method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const tabKey = allPeople.find(p => p.id === confirmAction.id)?.type === "Pessoa Empresarial" ? "empresarial" : "fisica";
      setConfirmAction(null);
      setActionBadge({ tab: tabKey, delta: -1 });
      fetchData();
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirmAction) return;
    try {
      const token = localStorage.getItem("acert_token");
      await fetch(`http://localhost:3001/api/people/${confirmAction.id}`, {
        method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const tabKey = allPeople.find(p => p.id === confirmAction.id)?.type === "Pessoa Empresarial" ? "empresarial" : "fisica";
      setConfirmAction(null);
      setActionBadge({ tab: tabKey, delta: -1 });
      fetchData();
    } catch {}
  };

  const handleExport = async (completo: boolean, format: "excel" | "pdf" | "ambos") => {
    setExportOpen(false);
    const targets = selected.size > 0 ? searched.filter(p => selected.has(p.id)) : searched;
    if (targets.length === 0) return;

    let profileData: Map<string, any> | undefined;
    if (completo) {
      setExportLoading(true);
      profileData = await fetchPersonDetails(targets.map(p => p.id));
      setExportLoading(false);
    }

    if (format === "excel" || format === "ambos") exportCSV(targets, completo, profileData);
    if (format === "pdf" || format === "ambos") exportPDF(targets, completo, profileData);
  };

  const tabCounts = {
    todas: allPeople.length,
    fisica: allPeople.filter(p => !!p.cpf).length,
    empresarial: allPeople.filter(p => !!p.cnpj).length,
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh] w-full"><div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full">

        {/* Header */}
        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">Pessoas</h1>
              <p className="text-[14px] text-secondary leading-relaxed">Cadastre e gerencie proprietários, compradores e demais envolvidos nos dossiês.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              <div className="relative">
                <Search size={17} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input type="text" placeholder="Buscar por nome, CPF, e-mail ou telefone..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} style={{ height: "44px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)", paddingLeft: "42px", paddingRight: "16px", width: "340px", outline: "none" }} />
              </div>
              <button onClick={() => setShowNovaPessoa(true)}
                className="flex items-center gap-2 h-10 px-7 rounded-[8px] bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#E06900] transition-colors"><Plus size={16} strokeWidth={2.5} />Nova Pessoa</button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats" style={{ marginBottom: "16px" }}>
          <StatsCard icon={Users} title="Pessoas cadastradas" value={String(stats?.total || 0)} complement={`${allPeople.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length} este mês`} iconBg="var(--badge-orange-bg)" iconColor="#FF7A00" />
          <StatsCard icon={AlertCircle} title="Pendências documentais" value={String(stats?.pendenciasDocumentais || 0)} complement={stats?.pendenciasDocumentais ? `${Math.round(stats.pendenciasDocumentais / Math.max(allPeople.length, 1) * 100)}% do total` : "Nenhuma pendência"} iconBg="var(--badge-red-bg)" iconColor="#DC2626" />
          <StatsCard icon={BadgeCheck} title="Documentação completa" value={String(stats?.documentacaoCompleta || 0)} complement={stats?.documentacaoCompleta ? `${Math.round(stats.documentacaoCompleta / Math.max(allPeople.length, 1) * 100)}% do total` : "—"} iconBg="var(--badge-green-bg)" iconColor="#059669" />
          <StatsCard icon={TrendingUp} title="Pessoas vinculadas" value={String(stats?.vinculadas || 0)} complement="a dossiês ativos" iconBg="var(--badge-blue-bg)" iconColor="#2563EB" />
        </div>

        {/* Filter Tabs (dashboard style — local only, no reload) */}
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0" }}>
            {TABS.map((t) => (
              <button key={t.key}
                onClick={() => handleTab(t.key)}
                style={{
                  padding: "10px 20px", fontSize: "13px", fontWeight: tab === t.key ? 600 : 500,
                  color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: tab === t.key ? "2px solid #FF7A00" : "2px solid transparent",
                  transition: "all 0.15s ease", position: "relative",
                }}
                onMouseEnter={(e) => { if (tab !== t.key) e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { if (tab !== t.key) e.currentTarget.style.color = "var(--text-muted)"; }}>
                {t.label}
                <span style={{
                  marginLeft: "6px", fontSize: "11px", fontWeight: 600,
                  padding: "1px 7px", borderRadius: "10px",
                  background: tab === t.key ? "var(--badge-orange-bg)" : "var(--bg-muted)",
                  color: tab === t.key ? "#FF7A00" : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}>
                  {actionBadge?.tab === t.key && actionBadge.delta > 0 ? (
                    <span style={{ color: "#059669", animation: "pulseGreen 0.5s ease" }}>+{actionBadge.delta}</span>
                  ) : actionBadge?.tab === t.key && actionBadge.delta < 0 ? (
                    <span style={{ color: "#DC2626", animation: "pulseRed 0.5s ease" }}>{actionBadge.delta}</span>
                  ) : tabCounts[t.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Export button */}
          {searched.length > 0 && (
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
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>Exportar Pessoas</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 300 }}>{searched.length} pessoas selecionadas</p>
                </div>
                <div style={{ width: "100%", marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".8px", textAlign: "left", marginBottom: 6 }}>Resumido (tabela)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setExportOpen(false); handleExport(false, "excel"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileSpreadsheet size={14} strokeWidth={1.5} /> Excel</button>
                    <button onClick={() => { setExportOpen(false); handleExport(false, "pdf"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileText size={14} strokeWidth={1.5} /> PDF</button>
                    <button onClick={() => { setExportOpen(false); handleExport(false, "ambos"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><Download size={14} strokeWidth={1.5} /> Ambos</button>
                  </div>
                  <div style={{ height: 1, background: "var(--border-light)", margin: "14px 0" }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".8px", textAlign: "left", marginBottom: 6 }}>Completo (perfil)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setExportOpen(false); handleExport(true, "excel"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileSpreadsheet size={14} strokeWidth={1.5} /> Excel</button>
                    <button onClick={() => { setExportOpen(false); handleExport(true, "pdf"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><FileText size={14} strokeWidth={1.5} /> PDF</button>
                    <button onClick={() => { setExportOpen(false); handleExport(true, "ambos"); }} style={exportOptStyle} onMouseEnter={exportHover} onMouseLeave={exportLeave}><Download size={14} strokeWidth={1.5} /> Ambos</button>
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
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#FF7A00" }} />
                </th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "220px" }}>Nome</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "130px" }}>CPF/CNPJ</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "180px" }}>Email</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "130px" }}>Telefone</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "140px" }}>Dossiês</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border-default)", minWidth: "90px" }}>Criado em</th>
                <th style={{ width: "44px", textAlign: "center", padding: "8px 4px", borderBottom: "1px solid var(--border-default)" }}></th>
                <th style={{ width: "44px", textAlign: "center", padding: "8px 12px 8px 4px", borderBottom: "1px solid var(--border-default)" }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id} className="group"
                  style={{ borderRadius: "8px", transition: "background 0.1s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "12px 0 12px 12px", borderRadius: "8px 0 0 8px" }}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                      style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#FF7A00" }} />
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%",
                        background: p.type === "Pessoa Empresarial" ? "#7C3AED" : "#FF7A00",
                        color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                        {p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{p.name}</span>
                          {p.isPreCadastro && (
                            <span title="Pré-cadastro" style={{ fontSize: "10px", fontWeight: 600, color: "var(--badge-amber-text)", background: "var(--badge-amber-bg)", padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>⚠️</span>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 500, color: "#FF7A00" }}>{p.type}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {formatDoc(p.cpf, p.cnpj)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "180px" }}>
                      {p.email || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {p.phone || p.cellPhone || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {p.dossierCount} {p.dossierCount === 1 ? "dossiê" : "dossiês"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {formatDate(p.createdAt)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 4px", textAlign: "center" }}>
                    <button onClick={(e) => { e.stopPropagation(); setDetailId(p.id); }}
                      style={{ width: "32px", height: "32px", borderRadius: "6px", border: "none",
                        background: "transparent", cursor: "pointer", color: "var(--text-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                      title="Visualizar perfil">
                      <Eye size={15} strokeWidth={1.5} />
                    </button>
                  </td>
                  <td style={{ padding: "12px 12px 12px 4px", textAlign: "center", borderRadius: "0 8px 8px 0", position: "relative" }}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === p.id ? null : p.id); }}
                      style={{ width: "32px", height: "32px", borderRadius: "6px", border: "none",
                        background: menuOpenId === p.id ? "var(--bg-muted)" : "transparent",
                        cursor: "pointer", color: "var(--text-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={(e) => { if (menuOpenId !== p.id) e.currentTarget.style.background = "var(--bg-muted)"; }}
                      onMouseLeave={(e) => { if (menuOpenId !== p.id) e.currentTarget.style.background = "transparent"; }}
                      title="Mais ações">
                      <MoreVertical size={15} strokeWidth={1.5} />
                    </button>
                    {menuOpenId === p.id && (
                      <div ref={menuRef} style={{
                        position: "absolute", top: "100%", right: "0", zIndex: 40, marginTop: "4px",
                        background: "var(--bg-surface)", borderRadius: "10px",
                        border: "1px solid var(--border-default)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                        minWidth: "200px", overflow: "hidden",
                      }}>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDetailId(p.id); }} style={menuItemStyle}><Edit3 size={14} strokeWidth={1.5} /> Edição rápida</button>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); router.push(`/dashboard/dossies?person=${p.id}`); }} style={menuItemStyle}><FolderOpen size={14} strokeWidth={1.5} /> Dossiês vinculados</button>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); router.push(`/dashboard/certidoes?person=${p.id}`); }} style={menuItemStyle}><ScrollText size={14} strokeWidth={1.5} /> Ver certidões</button>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setVinculoId(p.id); setVinculoName(p.name); }} style={menuItemStyle}><Link2 size={14} strokeWidth={1.5} /> Vínculo parental</button>
                        <div style={{ height: "1px", background: "var(--border-light)", margin: "4px 0" }} />
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setConfirmAction({ type: "archive", id: p.id, name: p.name }); }} style={{ ...menuItemStyle, color: "var(--text-secondary)" }}><Archive size={14} strokeWidth={1.5} /> Arquivar</button>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setConfirmAction({ type: "delete", id: p.id, name: p.name }); }} style={{ ...menuItemStyle, color: "#DC2626" }}                       onMouseEnter={(e) => { e.currentTarget.style.background = "var(--badge-red-bg)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><Trash2 size={14} strokeWidth={1.5} /> Deletar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 0", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Users size={32} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>Nenhuma pessoa encontrada</span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Ajuste os filtros ou cadastre uma nova pessoa.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-light)" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Mostrando {paginated.length} de {searched.length} pessoas
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-default)", background: "transparent", cursor: safePage <= 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safePage <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} strokeWidth={1.5} style={{ color: "var(--text-secondary)" }} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-default)", fontSize: "12px", fontWeight: n === safePage ? 700 : 500, cursor: "pointer", background: n === safePage ? "#FF7A00" : "transparent", color: n === safePage ? "#FFF" : "var(--text-secondary)", transition: "all 0.1s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-default)", background: "transparent", cursor: safePage >= totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safePage >= totalPages ? 0.4 : 1 }}>
                <ChevronRight size={14} strokeWidth={1.5} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseGreen { 0% { transform:scale(1);opacity:1 } 50% { transform:scale(1.4);opacity:0.8 } 100% { transform:scale(1);opacity:1 } }
        @keyframes pulseRed { 0% { transform:scale(1);opacity:1 } 50% { transform:scale(1.4);opacity:0.8 } 100% { transform:scale(1);opacity:1 } }
      `}} />

      {/* Person Detail Modal */}
      {detailId && <PersonDetailModal personId={detailId} onClose={() => { setDetailId(null); fetchData(); }} />}

      {/* Vinculo Parental Modal */}
      {vinculoId && <VinculoParentalModal personId={vinculoId} personName={vinculoName} onClose={() => { setVinculoId(null); fetchData(); }} />}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          open={true}
          title={confirmAction.type === "archive" ? "Arquivar pessoa" : "Deletar pessoa"}
          message={confirmAction.type === "archive"
            ? `Deseja arquivar "${confirmAction.name}"? Ela não aparecerá mais nas listagens.`
            : `Tem certeza que deseja deletar "${confirmAction.name}"? Esta ação remove todos os vínculos e não pode ser desfeita.`}
          confirmLabel={confirmAction.type === "archive" ? "Arquivar" : "Deletar"}
          variant={confirmAction.type === "delete" ? "danger" : "default"}
          onConfirm={confirmAction.type === "archive" ? handleArchive : handleDelete}
          onCancel={() => setConfirmAction(null)}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {/* Nova Pessoa Modal */}
      {showNovaPessoa && (
        <NovaPessoaModal
          onClose={() => setShowNovaPessoa(false)}
          onCreated={() => {
            setShowNovaPessoa(false);
            setActionBadge({ tab: "todas", delta: 1 });
            fetchData();
          }}
        />
      )}
    </DashboardLayout>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "10px",
  width: "100%", padding: "10px 16px", border: "none",
  background: "transparent", cursor: "pointer",
  fontSize: "13px", color: "var(--text-primary)", textAlign: "left",
  fontFamily: "inherit", transition: "background 0.1s",
};

const exportOptStyle: React.CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "12px 0", borderRadius: 8, border: "1px solid var(--border-light)",
  background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500,
  color: "var(--text-primary)", fontFamily: "inherit", transition: "all 0.15s ease",
};
function exportHover(e: React.MouseEvent<HTMLButtonElement>) { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.background = "rgba(255,122,0,0.04)"; }
function exportLeave(e: React.MouseEvent<HTMLButtonElement>) { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "transparent"; }
