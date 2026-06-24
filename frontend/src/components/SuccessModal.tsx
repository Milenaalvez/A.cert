"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface Props {
  identifier: string;
  onClose: () => void;
}

export default function SuccessModal({ identifier, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: 400, width: "100%", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", padding: "32px 28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <CheckCircle2 size={28} strokeWidth={2} color="#059669" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Dossiê criado com sucesso!</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>O dossiê foi registrado no sistema.</p>
          <div style={{ background: "var(--bg-subtle)", borderRadius: 6, padding: "8px 16px", marginTop: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{identifier}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>Redirecionando...</p>
        </div>
      </div>
    </div>
  );
}
