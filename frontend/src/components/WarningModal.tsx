"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  identifier: string;
  existingId: string;
  onView: () => void;
  onCreateDuplicate: () => void;
  onClose: () => void;
}

export default function WarningModal({ identifier, existingId, onView, onCreateDuplicate, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: 420, width: "100%", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={22} strokeWidth={1.5} color="#D97706" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Dossiê já existe</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Este cliente já possui um dossiê ativo ({existingId}). Deseja visualizá-lo ou criar um novo mesmo assim?
            </p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 36, padding: "0 16px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}>Cancelar</button>
          <button onClick={onCreateDuplicate} style={{ height: 36, padding: "0 18px", borderRadius: 6, border: "1px solid #D97706", fontSize: 13, fontWeight: 600, color: "#D97706", background: "transparent", cursor: "pointer" }}>Criar mesmo assim</button>
          <button onClick={onView} style={{ height: 36, padding: "0 20px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, color: "#FFF", background: "#D97706", cursor: "pointer" }}>Ver dossiê existente</button>
        </div>
      </div>
    </div>
  );
}
