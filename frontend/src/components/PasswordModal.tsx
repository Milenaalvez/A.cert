"use client";

import { useState, useRef, useEffect } from "react";
import { Lock, AlertTriangle, X, Eye, EyeOff } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PasswordModal({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
      setTimeout(() => currentRef.current?.focus(), 100);
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

  const handleSubmit = async () => {
    setError("");
    if (!currentPassword) { setError("Informe a senha atual."); return; }
    if (newPassword.length < 6) { setError("A nova senha deve ter no mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setError("As senhas não conferem."); return; }

    setSaving(true);
    const token = localStorage.getItem("acert_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const r = await fetch("/api/auth/me/password", {
        method: "PUT",
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await r.json();
      if (data.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Erro ao alterar senha.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-10 rounded-[8px] text-[13px] text-primary outline-none border bg-surface px-3 pr-10 focus:border-[#FF7A00] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: "420px", borderRadius: "10px", background: "var(--bg-surface)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "28px 28px 0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,122,0,0.12)" }}>
                <Lock size={18} strokeWidth={2} color="#FF7A00" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Alterar Senha</h3>
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

          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,150,105,0.12)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Senha alterada com sucesso!</span>
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                borderRadius: 8, marginBottom: 20, fontSize: 12, lineHeight: 1.6,
                background: "rgba(217,119,6,0.08)", color: "#B45309",
                border: "1px solid rgba(217,119,6,0.15)",
              }}>
                <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Para sua segurança, é necessário informar a senha atual.</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Senha atual</label>
                  <div style={{ position: "relative" }}>
                    <input
                      ref={currentRef}
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                      style={{ borderColor: error && !currentPassword ? "#DC2626" : "var(--border-default)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Nova senha</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Mínimo 6 caracteres"
                      style={{ borderColor: error && newPassword.length > 0 && newPassword.length < 6 ? "#DC2626" : "var(--border-default)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Confirmar nova senha</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Repita a nova senha"
                      style={{ borderColor: error && confirmPassword && newPassword !== confirmPassword ? "#DC2626" : "var(--border-default)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12, color: "#DC2626" }}>
                  <AlertTriangle size={14} strokeWidth={2} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <div style={{ display: "flex", gap: 10, padding: "20px 28px 28px 28px", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8, border: "1px solid var(--border-light)",
                fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8, border: "none",
                fontSize: 13, fontWeight: 600, color: "#FFFFFF",
                background: "#FF7A00", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (saving) return;
                e.currentTarget.style.background = "#E06900";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,122,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FF7A00";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {saving ? "Salvando..." : "Alterar Senha"}
            </button>
          </div>
        )}

        {success && (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 28px 28px 28px" }}>
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
        )}
      </div>
    </div>
  );
}
