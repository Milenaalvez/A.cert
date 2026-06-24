"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const VARIANT_STYLE = {
  default: {
    bg: "#FFF7ED",
    iconBg: "rgba(255,122,0,0.12)",
    iconColor: "#FF7A00",
    btnBg: "#FF7A00",
    btnHover: "#E06900",
    btnShadow: "rgba(255,122,0,0.3)",
  },
  danger: {
    bg: "#FEF2F2",
    iconBg: "rgba(220,38,38,0.12)",
    iconColor: "#DC2626",
    btnBg: "#DC2626",
    btnHover: "#B91C1C",
    btnShadow: "rgba(220,38,38,0.3)",
  },
  warning: {
    bg: "#FFFBEB",
    iconBg: "rgba(217,119,6,0.12)",
    iconColor: "#D97706",
    btnBg: "#D97706",
    btnHover: "#B45309",
    btnShadow: "rgba(217,119,6,0.3)",
  },
};

function DefaultIcon({ variant }: { variant: "default" | "danger" | "warning" }) {
  const style = VARIANT_STYLE[variant];
  if (variant === "default") return <Check size={24} strokeWidth={2.5} color={style.iconColor} />;
  return <AlertTriangle size={24} strokeWidth={2.5} color={style.iconColor} />;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Sim",
  cancelLabel = "Não",
  icon,
  variant = "default",
  onConfirm,
  onCancel,
  onClose,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const vs = VARIANT_STYLE[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: "400px", borderRadius: "10px", background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "36px 32px 20px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: vs.iconBg,
            }}
          >
            {icon || <DefaultIcon variant={variant} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
              {title}
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 300 }}>
              {message}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 32px 32px 32px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              height: 42, padding: "0 24px", borderRadius: 8, border: "1px solid var(--border-light)",
              fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <X size={14} strokeWidth={2.5} />
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              height: 42, padding: "0 24px", borderRadius: 8, border: "none",
              fontSize: 13, fontWeight: 600, color: "#FFFFFF",
              background: vs.btnBg, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = vs.btnHover;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${vs.btnShadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = vs.btnBg;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {icon || <Check size={14} strokeWidth={3} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
