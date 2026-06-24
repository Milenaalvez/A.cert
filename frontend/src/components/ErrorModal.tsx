"use client";

import { XCircle } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
  onClose: () => void;
}

export default function ErrorModal({ message, onRetry, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: 400, width: "100%", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <XCircle size={22} strokeWidth={1.5} color="#DC2626" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Erro ao criar dossiê</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 36, padding: "0 16px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}>Fechar</button>
          {onRetry && (
            <button onClick={onRetry} style={{ height: 36, padding: "0 20px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, color: "#FFF", background: "#DC2626", cursor: "pointer" }}>Tentar novamente</button>
          )}
        </div>
      </div>
    </div>
  );
}
