"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchResult {
  id: string;
  label: string;
  type: "dossier" | "person" | "property" | "certificate" | "user";
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const token = localStorage.getItem("acert_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const r = await fetch(`http://localhost:3001/api/dossiers?search=${encodeURIComponent(query)}&limit=5`, { headers });
        if (r.ok) {
          const d = await r.json();
          const mapped: SearchResult[] = ((d.dossiers || []) as any[]).flatMap((item: any) => {
            const out: SearchResult[] = [];
            if (item.identifier?.toLowerCase().includes(query.toLowerCase())) {
              out.push({ id: item.id, label: `${item.identifier} — ${item.person?.name || "—"}`, type: "dossier" });
            }
            if (item.person?.name?.toLowerCase().includes(query.toLowerCase())) {
              out.push({ id: item.person.id, label: item.person.name, type: "person" });
            }
            if (item.property?.identifier?.toLowerCase().includes(query.toLowerCase())) {
              out.push({ id: item.property.id, label: item.property.identifier, type: "property" });
            }
            return out;
          }).slice(0, 8);
          setResults(mapped);
        }
      } catch {} finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    setQuery("");
    setResults([]);
    setFocused(false);
    const paths: Record<string, string> = {
      dossier: "/dashboard/dossies",
      person: "/dashboard/pessoas",
      property: "/dashboard/imoveis",
      certificate: "/dashboard/certidoes",
      user: "/dashboard/usuarios",
    };
    const p = paths[r.type] || "/dashboard";
    router.push(r.type === "dossier" ? `${p}?search=${encodeURIComponent(r.label.split(" — ")[0])}` : p);
  };

  const typeLabel: Record<string, string> = {
    dossier: "Dossiê",
    person: "Pessoa",
    property: "Imóvel",
    certificate: "Certidão",
    user: "Usuário",
  };

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex flex-col gap-1.5 shrink-0">
        <h1 className="text-[26px] font-bold text-primary tracking-tight leading-none">{title}</h1>
        <p className="text-[14px] text-secondary leading-relaxed">{subtitle}</p>
      </div>
      <div className="relative w-[420px]">
        <div className={`flex items-center h-11 px-4 rounded-[10px] border transition-colors ${focused ? "border-[#FF7A00] bg-surface" : "border-[var(--border-default)] bg-surface"}`}>
          <Search size={17} strokeWidth={2} className={`shrink-0 transition-colors ${focused ? "text-[#FF7A00]" : "text-muted"}`} />
          <input
            type="text"
            placeholder="Buscar dossiê, pessoa ou imóvel..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            className="flex-1 h-full bg-transparent ml-5 text-[14px] text-primary outline-none placeholder:text-muted"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin shrink-0" />
          )}
        </div>
        {focused && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-[var(--border-default)] rounded-[10px] py-2 shadow-lg z-20">
            <div className="px-4 py-1.5 text-[12px] text-muted">Resultados</div>
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 text-[13px] text-body hover:bg-[var(--bg-muted)] cursor-pointer"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              >
                <span className="text-[11px] font-medium text-muted uppercase shrink-0">{typeLabel[r.type]}</span>
                <span className="truncate">{r.label}</span>
              </div>
            ))}
          </div>
        )}
        {focused && !loading && query.trim() && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-[var(--border-default)] rounded-[10px] py-2 shadow-lg z-20">
            <div className="px-4 py-1.5 text-[13px] text-muted">Nenhum resultado encontrado</div>
          </div>
        )}
      </div>
    </div>
  );
}