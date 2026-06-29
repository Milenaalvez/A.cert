"use client";

import { CheckCircle2, FileText, Search } from "lucide-react";

interface Props {
  identifier: string;
  dossierId?: string;
  onClose: () => void;
  onViewDossier?: () => void;
  onEmitirCertidoes?: () => void;
}

export default function SuccessModal({ identifier, onClose, onViewDossier, onEmitirCertidoes }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: 440, width: "100%", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", padding: "32px 28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <CheckCircle2 size={28} strokeWidth={2} color="#059669" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Dossiê criado com sucesso!</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>O que deseja fazer agora?</p>
          <div style={{ background: "var(--bg-subtle)", borderRadius: 6, padding: "8px 16px", marginBottom: 24, marginTop: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{identifier}</span>
          </div>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            {onViewDossier && (
              <button onClick={onViewDossier}
                style={{ flex: 1, height: 48, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <FileText size={18} strokeWidth={1.5} />
                Ver Dossiê
              </button>
            )}
            {onEmitirCertidoes && (
              <button onClick={onEmitirCertidoes}
                style={{ flex: 1, height: 48, borderRadius: 8, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Search size={18} strokeWidth={1.5} />
                Emitir Certidões
              </button>
            )}
          </div>
          <button onClick={onClose}
            style={{ marginTop: 16, background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
