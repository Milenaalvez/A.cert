"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Link2, Unlink2, AlertTriangle, UserPlus, Loader2 } from "lucide-react";

interface Person {
  id: string; name: string; cpf: string | null; cnpj: string | null;
  isPreCadastro?: boolean; type?: string;
}
interface Relationship {
  id: string; relationship_type: string; created_at: string;
  other_id: string; name: string; cpf: string | null; cnpj: string | null;
  is_pre_cadastro: number;
}

function formatDoc(cpf: string | null, cnpj: string | null): string {
  const raw = (cpf || cnpj || "").replace(/\D/g, "");
  if (!raw) return "Sem documento";
  if (raw.length === 11) return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (raw.length === 14) return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return raw;
}

const inputBase = {
  height: "42px", borderRadius: "6px", border: "1px solid var(--border-default)",
  fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)",
  padding: "0 12px", outline: "none", width: "100%", boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

export default function VinculoParentalModal({ personId, personName, onClose }: {
  personId: string; personName: string; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchRelationships = useCallback(async () => {
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`http://localhost:3001/api/people/${personId}/relationships`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await r.json();
      setRelationships(d.relationships || []);
    } catch {} finally { setLoading(false); }
  }, [personId]);

  useEffect(() => { fetchRelationships(); }, [fetchRelationships]);

  const doSearch = useCallback(async () => {
    if (!search.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`http://localhost:3001/api/people?q=${encodeURIComponent(search.trim())}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await r.json();
      const people = (d.people || []).filter((p: Person) => p.id !== personId);
      setResults(people);
    } catch { setResults([]); } finally { setSearching(false); }
  }, [search, personId]);

  useEffect(() => {
    const t = setTimeout(() => { doSearch(); }, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const linkPerson = async (relatedId: string) => {
    setAdding(true); setError("");
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`http://localhost:3001/api/people/${personId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ related_person_id: relatedId, relationship_type: "parental" }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Erro ao vincular"); return; }
      setSearch(""); setResults([]);
      fetchRelationships();
    } catch { setError("Erro de conexão"); } finally { setAdding(false); }
  };

  const unlinkPerson = async (relId: string) => {
    try {
      const token = localStorage.getItem("acert_token");
      await fetch(`http://localhost:3001/api/people/${personId}/relationships/${relId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchRelationships();
    } catch {}
  };

  const isAlreadyLinked = (pid: string) => relationships.some(r => r.other_id === pid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full animate-in fade-in duration-200"
        style={{ maxWidth: "520px", borderRadius: "12px", background: "var(--bg-surface)",
          border: "1px solid var(--border-default)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
        onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px",
              background: "var(--badge-purple-bg)", display: "flex", alignItems: "center",
              justifyContent: "center" }}>
              <Link2 size={17} strokeWidth={1.5} color="#7C3AED" />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)",
                lineHeight: 1.2 }}>Vínculo Parental</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                {personName}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: "32px", height: "32px", borderRadius: "6px", border: "none",
              background: "transparent", cursor: "pointer", color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Search */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600,
              color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase",
              letterSpacing: "0.5px" }}>
              Buscar pessoa para vincular
            </label>
            <div style={{ position: "relative" }}>
              <Search size={16} strokeWidth={1.5}
                style={{ position: "absolute", left: "12px", top: "50%",
                  transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input type="text" placeholder="Nome, CPF ou CNPJ..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputBase, paddingLeft: "38px" }}
                onKeyDown={(e) => e.key === "Enter" && doSearch()} />
            </div>
            {error && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px",
                fontSize: "12px", color: "#DC2626" }}>
                <AlertTriangle size={12} />{error}
              </span>
            )}
          </div>

          {/* Search results */}
          {searching ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
              <Loader2 size={20} strokeWidth={2} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : results.length > 0 ? (
            <div style={{ borderRadius: "8px", border: "1px solid var(--border-light)",
              overflow: "hidden", maxHeight: "200px", overflowY: "auto" }}>
              {results.map((p) => {
                const linked = isAlreadyLinked(p.id);
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "10px 12px",
                    borderBottom: "1px solid var(--border-light)",
                    background: linked ? "var(--bg-subtle)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%",
                        background: p.cnpj ? "#7C3AED" : "#FF7A00", color: "#FFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                        {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500,
                            color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden",
                            textOverflow: "ellipsis", display: "block" }}>{p.name}</span>
                          {p.isPreCadastro && (
                            <span title="Pré-cadastro" style={{ fontSize: "11px", fontWeight: 600,
                              color: "var(--badge-amber-text)", background: "var(--badge-amber-bg)",
                              padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>⚠️</span>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {formatDoc(p.cpf, p.cnpj)}
                        </span>
                      </div>
                    </div>
                    {linked ? (
                      <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>Vinculado</span>
                    ) : (
                      <button onClick={() => linkPerson(p.id)} disabled={adding}
                        style={{ height: "30px", padding: "0 12px", borderRadius: "6px", border: "none",
                          background: "#7C3AED", color: "#FFF", fontSize: "11px", fontWeight: 600,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                          opacity: adding ? 0.5 : 1, flexShrink: 0 }}>
                        <UserPlus size={13} strokeWidth={2} />Vincular
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : search.trim() && !searching ? (
            <div style={{ textAlign: "center", padding: "16px", fontSize: "13px",
              color: "var(--text-muted)" }}>Nenhuma pessoa encontrada.</div>
          ) : null}

          {/* Existing relationships */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600,
              color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase",
              letterSpacing: "0.5px" }}>
              Pessoas vinculadas ({relationships.length})
            </label>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                <Loader2 size={20} strokeWidth={2} className="animate-spin" style={{ color: "var(--text-muted)" }} />
              </div>
            ) : relationships.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", fontSize: "13px",
                color: "var(--text-muted)", background: "var(--bg-subtle)",
                borderRadius: "8px" }}>
                Nenhum vínculo parental. Busque uma pessoa acima para vincular.
              </div>
            ) : (
              <div style={{ borderRadius: "8px", border: "1px solid var(--border-light)",
                overflow: "hidden" }}>
                {relationships.map((rel) => (
                  <div key={rel.id} style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "10px 12px",
                    borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%",
                        background: rel.cnpj ? "#7C3AED" : "#FF7A00", color: "#FFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                        {rel.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                            {rel.name}
                          </span>
                          {rel.is_pre_cadastro === 1 && (
                            <span title="Pré-cadastro" style={{ fontSize: "11px", fontWeight: 600,
                              color: "var(--badge-amber-text)", background: "var(--badge-amber-bg)",
                              padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>⚠️</span>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {formatDoc(rel.cpf, rel.cnpj)}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => unlinkPerson(rel.id)}
                      title="Desvincular"
                      style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none",
                        background: "transparent", cursor: "pointer", color: "var(--text-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--badge-red-bg)"; e.currentTarget.style.color = "#DC2626"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                      <Unlink2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px",
          borderTop: "1px solid var(--border-light)" }}>
          <button onClick={onClose}
            style={{ height: "36px", padding: "0 20px", borderRadius: "6px",
              border: "1px solid var(--border-default)", fontSize: "13px", fontWeight: 500,
              color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
