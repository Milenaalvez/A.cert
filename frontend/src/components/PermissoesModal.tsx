"use client";

import { useState, useEffect } from "react";
import { X, Shield } from "lucide-react";
import * as teamApi from "@/services/teamApi";

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
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && userId) {
      teamApi.getPermissions(userId).then((d: any) => {
        setGranted(new Set(d.permissions || []));
      }).catch(() => setGranted(new Set()));
    }
  }, [open, userId]);

  function toggle(perm: string) {
    setGranted(prev => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", width: 560, maxHeight: "90vh", overflow: "auto", background: "var(--bg-app)", borderRadius: 16, border: "1px solid var(--border-default)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border-default)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,122,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={18} color="#FF7A00" /></div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Permissões</h2>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "2px 0 0" }}>{userName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
              <div key={group}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px", paddingBottom: 8, borderBottom: "1px solid var(--border-default)" }}>{group}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {perms.map(p => (
                    <label key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
                      <input type="checkbox" checked={granted.has(p.key)} onChange={() => toggle(p.key)} style={{ accentColor: "#FF7A00", width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: "14px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: saving ? "rgba(255,122,0,0.5)" : "#FF7A00", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
