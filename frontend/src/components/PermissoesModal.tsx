"use client";

import { useState, useEffect } from "react";
import { X, Shield, Loader2 } from "lucide-react";
import * as teamApi from "@/services/teamApi";
import { useT } from "@/i18n/useT";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const PERMISSION_GROUPS: Record<string, { key: string; label: string }[]> = {
  "Dossiês": [
    { key: "create_dossiers", label: "Criar dossiês" },
    { key: "edit_dossiers", label: "Editar dossiês" },
    { key: "delete_dossiers", label: "Excluir dossiês" },
  ],
  "Pessoas": [
    { key: "create_people", label: "Criar pessoas" },
    { key: "edit_people", label: "Editar pessoas" },
    { key: "delete_people", label: "Excluir pessoas" },
  ],
  "Imóveis": [
    { key: "create_properties", label: "Criar imóveis" },
    { key: "edit_properties", label: "Editar imóveis" },
    { key: "delete_properties", label: "Excluir imóveis" },
  ],
  "Certidões": [
    { key: "emit_certificates", label: "Emitir certidões" },
    { key: "download_certificates", label: "Baixar certidões" },
    { key: "export_certificates", label: "Exportar certidões" },
  ],
  "Relatórios": [
    { key: "view_reports", label: "Visualizar relatórios" },
    { key: "export_reports", label: "Exportar relatórios" },
  ],
  "Sistema": [
    { key: "manage_users", label: "Gerenciar usuários" },
    { key: "manage_settings", label: "Configurações do sistema" },
    { key: "view_logs", label: "Visualizar logs" },
  ],
};

export default function PermissoesModal({ open, onClose, userId, userName }: Props) {
  const { t } = useT();
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && userId) {
      teamApi
        .getPermissions(userId)
        .then((d: any) => {
          setGranted(new Set(d.permissions || []));
        })
        .catch(() => setGranted(new Set()));
    }
  }, [open, userId]);

  function toggle(perm: string) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await teamApi.updatePermissions(userId, Array.from(granted));
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar permissões");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            maxWidth: "560px",
            borderRadius: "16px",
            border: "1px solid var(--border-default)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "var(--badge-orange-bg)" }}
              >
                <Shield size={20} strokeWidth={1.5} color="#FF7A00" />
              </div>
              <div>
                <h2
                  className="text-[17px] font-bold tracking-tight"
                  style={{ color: "var(--text-primary)", lineHeight: 1.2 }}
                >
                  Permissões
                </h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  {userName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted transition-colors"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-subtle)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
            <div className="flex flex-col gap-5">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                <div key={group}>
                  <h4
                    className="text-[13px] font-bold text-primary pb-2 mb-2.5 border-b border-default"
                  >
                    {group}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {perms.map((p) => (
                      <label
                        key={p.key}
                        className="flex items-center gap-2.5 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={granted.has(p.key)}
                          onChange={() => toggle(p.key)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "#FF7A00", cursor: "pointer" }}
                        />
                        <span className="text-[13px] text-primary">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div
                className="text-[13px] p-3 rounded-[8px] mt-4"
                style={{ background: "var(--badge-red-bg)", color: "var(--error)" }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end shrink-0 gap-2.5"
            style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}
          >
            <button
              onClick={onClose}
              className="h-[38px] px-5 rounded-[8px] text-[13px] font-medium text-secondary border border-default transition-colors"
              style={{ background: "transparent", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-[38px] px-7 rounded-[8px] text-[13px] font-semibold text-white flex items-center gap-1.5 transition-colors"
              style={{
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                background: saving ? "var(--text-muted)" : "#FF7A00",
                opacity: saving ? 0.8 : 1,
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#E06900"; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#FF7A00"; }}
            >
              {saving && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
