"use client";

import { useEffect, useState, useCallback } from "react";
import { Smartphone, X } from "lucide-react";

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  is_active: number;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SessionsModal({ open, onClose }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem("acert_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const r = await fetch("/api/auth/me/sessions", { headers });
      if (r.ok) setSessions(await r.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { setLoading(true); fetchSessions(); }
  }, [open, fetchSessions]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: "640px", maxHeight: "80vh", borderRadius: "10px", background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "24px 28px 0 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,122,0,0.12)" }}>
                <Smartphone size={18} strokeWidth={2} color="#FF7A00" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Histórico de Sessões</h3>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <div style={{ width: 20, height: 20, border: "2px solid var(--border-default)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 8 }}>
              <Smartphone size={32} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nenhuma sessão registrada.</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Data/Hora</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Dispositivo</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Navegador</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Localização</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>{formatDate(s.created_at)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-primary)" }}>{s.device || s.os || "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-primary)" }}>{s.browser || "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-secondary)" }}>{s.location || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 10px",
                        borderRadius: 6,
                        background: s.is_active ? "rgba(5,150,105,0.1)" : "var(--bg-muted)",
                        color: s.is_active ? "#059669" : "var(--text-muted)",
                      }}>
                        {s.is_active ? "Ativa" : "Encerrada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ height: 8 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 28px 24px 28px", flexShrink: 0, borderTop: "1px solid var(--border-light)" }}>
          <button
            onClick={onClose}
            style={{
              height: 40, padding: "0 24px", borderRadius: 8, border: "none",
              fontSize: 13, fontWeight: 600, color: "#FFFFFF",
              background: "#FF7A00", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E06900"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FF7A00"; }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
