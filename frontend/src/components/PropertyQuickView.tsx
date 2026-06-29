"use client";

import { useState, useEffect } from "react";
import { X, Building2, MapPin, Hash, FileText, Calendar, User, BadgeCheck, AlertTriangle } from "lucide-react";

interface PropertyDetail {
  id: string; identifier: string; registration: string; type: string;
  address: string; status: string; neighborhood: string;
  city: string; state: string; zipCode: string;
  notaryOffice: string; area: string; landArea: string; description: string;
  createdAt: string; updatedAt: string;
  ownerName: string | null; ownerCpf: string | null;
  dossierCount: number; certObtidas: number; certPendentes: number; progress: number;
}

export function PropertyQuickView({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const [data, setData] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("acert_token");
        const r = await fetch(`/api/properties/${propertyId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.ok) {
          const d = await r.json();
          setData(d.property || d);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [propertyId]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface rounded-[16px] p-8" onClick={e => e.stopPropagation()}>
        <div className="w-7 h-7 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!data) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}><div onClick={e => e.stopPropagation()}><X size={24} onClick={onClose} /></div></div>;

  const statusColor = data.status === "Regular" ? "#059669" : data.status === "Arquivado" ? "#9CA3AF" : "#D97706";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="relative w-full animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: "560px", borderRadius: "16px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--badge-orange-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={20} strokeWidth={1.5} color="#FF7A00" />
            </div>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{data.identifier}</h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{data.type}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "70vh", overflowY: "auto" }}>
          
          {/* Status + Registration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Status</label>
              <span style={{ fontSize: "13px", fontWeight: 600, color: statusColor, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                {data.status}
              </span>
            </div>
            <div>
              <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Matrícula</label>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "monospace" }}>{data.registration || "—"}</span>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Endereço</label>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <MapPin size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)", marginTop: "1px", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                {[data.address, data.neighborhood, [data.city, data.state].filter(Boolean).join(", "), data.zipCode].filter(Boolean).join(" — ")}
              </span>
            </div>
          </div>

          {/* Cartório + Área */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {data.notaryOffice && (
              <div>
                <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Cartório</label>
                <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{data.notaryOffice}</span>
              </div>
            )}
            {data.area && (
              <div>
                <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Área</label>
                <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{data.area}</span>
              </div>
            )}
          </div>

          {/* Proprietário */}
          <div>
            <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Proprietário</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: data.ownerName ? "#FF7A00" : "var(--bg-muted)", color: data.ownerName ? "#FFF" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>
                {data.ownerName ? data.ownerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "—"}
              </div>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{data.ownerName || "Sem proprietário"}</span>
            </div>
          </div>

          {/* Dossiês & Certidões */}
          <div>
            <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "10px" }}>Dossiês e Certidões</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>{data.dossierCount}</span>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: ".4px" }}>Dossiês</span>
              </div>
              <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#059669" }}>{data.certObtidas || 0}</span>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: ".4px" }}>Obtidas</span>
              </div>
              <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#DC2626" }}>{data.certPendentes || 0}</span>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: ".4px" }}>Pendentes</span>
              </div>
            </div>
            {data.progress > 0 && (
              <div style={{ marginTop: "10px", height: "4px", borderRadius: "2px", background: "var(--border-default)", overflow: "hidden" }}>
                <div style={{ height: "4px", borderRadius: "2px", width: `${data.progress}%`, background: data.progress >= 80 ? "#059669" : data.progress >= 40 ? "#D97706" : "#DC2626" }} />
              </div>
            )}
          </div>

          {/* Datas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Cadastrado em</label>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—"}</span>
            </div>
            <div>
              <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Atualizado em</label>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{data.updatedAt ? new Date(data.updatedAt).toLocaleDateString("pt-BR") : "—"}</span>
            </div>
          </div>

          {data.description && (
            <div>
              <label className="block" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Descrição</label>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{data.description}</p>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
