"use client";

import { useEffect, useState } from "react";
import { X, User, Building2, BadgeCheck, AlertTriangle, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ConfirmModal from "./ConfirmModal";

const STATUS_OPTIONS = [
  { value: "Em andamento", label: "Em andamento" },
  { value: "Pendente", label: "Aguardando pendências" },
  { value: "Concluído", label: "Concluído" },
  { value: "Cancelado", label: "Cancelado" },
];

const PRIORITY_OPTIONS = [
  { value: "Regular", label: "Normal" },
  { value: "Preferencial", label: "Alta" },
  { value: "Urgente", label: "Urgente" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  "Em andamento": { bg: "#FFF7ED", text: "#FF7A00" },
  Pendente: { bg: "#FEF2F2", text: "#DC2626" },
  "Concluído": { bg: "#ECFDF5", text: "#059669" },
  Cancelado: { bg: "#F3F0FF", text: "#7C3AED" },
};

interface UserOption {
  id: string;
  name: string;
}

interface DossierData {
  id: string;
  identifier: string;
  status: string;
  priority: string;
  responsible: string;
  observation?: string;
  createdAt: string;
  updatedAt: string;
  person: { id: string; name: string; cpf: string | null } | null;
  property: { identifier: string; type: string; address: string } | null;
  certificateCount: number;
  certificatesObtidas: number;
  certificatesPendentes: number;
  progress: number;
}

interface Props {
  dossier: DossierData;
  onClose: () => void;
  onSave: (updated: DossierData) => void;
}

export default function DossierEditModal({ dossier, onClose, onSave }: Props) {
  const [status, setStatus] = useState(dossier.status);
  const [priority, setPriority] = useState(dossier.priority);
  const [responsible, setResponsible] = useState(dossier.responsible);
  const [observation, setObservation] = useState(dossier.observation || "");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isDirty = status !== dossier.status || priority !== dossier.priority || responsible !== dossier.responsible || observation !== (dossier.observation || "");

  useEffect(() => {
    const token = localStorage.getItem("acert_token");
    fetch("/api/team/enriched", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: any[]) => setUsers(data.map((u: any) => ({ id: u.id, name: u.name }))))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/dossiers/${dossier.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, priority, responsible, observation }),
      });
      if (!r.ok) throw new Error("Erro ao salvar");
      const updated = await r.json();
      onSave(updated);
    } catch {
      alert("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const sc = STATUS_BADGE[status] || STATUS_BADGE["Em andamento"];
  const certPct = dossier.certificateCount > 0
    ? Math.round((dossier.certificatesObtidas / dossier.certificateCount) * 100)
    : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
        <div
          className="w-full bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          style={{ maxWidth: "900px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0" style={{ padding: "32px 40px 24px 40px", borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <div className="flex items-center" style={{ gap: "12px" }}>
                <h2 className="text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>{dossier.identifier}</h2>
                <div
                  className="flex items-center text-[12px] font-semibold"
                  style={{ background: sc.bg, color: sc.text, height: "24px", borderRadius: "6px", paddingLeft: "10px", paddingRight: "10px" }}
                >
                  {STATUS_OPTIONS.find((o) => o.value === status)?.label || status}
                </div>
              </div>
              <div className="flex items-center text-[13px]" style={{ gap: "16px", color: "var(--text-secondary)" }}>
                <span className="flex items-center" style={{ gap: "6px" }}>
                  <User size={13} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                  {dossier.person?.name || "—"}
                </span>
                <span className="flex items-center" style={{ gap: "6px" }}>
                  <Building2 size={13} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                  {dossier.property?.identifier || "—"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center shrink-0 transition-colors"
              style={{ width: "32px", height: "32px", borderRadius: "8px", color: "var(--text-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "40px" }}>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              {/* Left column - Editable */}
              <div className="flex flex-col" style={{ gap: "24px" }}>
                <div>
                  <label className="block text-[12px] font-semibold text-muted uppercase tracking-wide" style={{ marginBottom: "6px" }}>Status do dossiê</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full text-[14px] appearance-none cursor-pointer transition-colors"
                      style={{ height: "40px", borderRadius: "10px", color: "var(--text-primary)", border: "1px solid var(--border-light)", paddingLeft: "12px", paddingRight: "32px", background: "var(--bg-surface)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.outline = "none"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="absolute pointer-events-none text-muted" style={{ right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px" }}>▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted uppercase tracking-wide" style={{ marginBottom: "6px" }}>Responsável</label>
                  <div className="relative">
                    <select
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                      className="w-full text-[14px] appearance-none cursor-pointer transition-colors"
                      style={{ height: "40px", borderRadius: "10px", color: "var(--text-primary)", border: "1px solid var(--border-light)", paddingLeft: "12px", paddingRight: "32px", background: "var(--bg-surface)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
                    >
                      {users.length === 0 && <option value={responsible}>{responsible}</option>}
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                    <div className="absolute pointer-events-none text-muted" style={{ right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px" }}>▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted uppercase tracking-wide" style={{ marginBottom: "6px" }}>Prioridade</label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full text-[14px] appearance-none cursor-pointer transition-colors"
                      style={{ height: "40px", borderRadius: "10px", color: "var(--text-primary)", border: "1px solid var(--border-light)", paddingLeft: "12px", paddingRight: "32px", background: "var(--bg-surface)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
                    >
                      {PRIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="absolute pointer-events-none text-muted" style={{ right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px" }}>▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted uppercase tracking-wide" style={{ marginBottom: "6px" }}>Observação</label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={4}
                    placeholder="Adicione uma observação sobre este dossiê..."
                    className="w-full resize-none placeholder:text-muted/60 transition-colors"
                    style={{ borderRadius: "10px", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border-light)", padding: "10px 12px" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.outline = "none"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
                  />
                </div>
              </div>

              {/* Right column - Read-only */}
              <div className="flex flex-col" style={{ gap: "24px" }}>
                <div>
                  <label className="block text-[12px] font-semibold text-muted uppercase tracking-wide" style={{ marginBottom: "12px" }}>Progresso das certidões</label>
                  <div className="flex flex-col" style={{ gap: "8px" }}>
                    <div className="w-full overflow-hidden" style={{ height: "8px", borderRadius: "999px", background: isDark ? "#1E2A44" : "#E5E7EB" }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${certPct}%`,
                          borderRadius: "999px",
                          background: certPct === 100
                            ? "#059669"
                            : "linear-gradient(90deg, #FF7A00, #FF9A44)",
                        }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{certPct}%</span>
                  </div>
                </div>

                <div className="flex flex-col" style={{ gap: "12px" }}>
                  <div className="flex items-center justify-between" style={{ padding: "10px 16px", borderRadius: "10px", background: isDark ? "rgba(5,150,105,0.15)" : "#ECFDF5" }}>
                    <div className="flex items-center" style={{ gap: "8px" }}>
                      <BadgeCheck size={15} strokeWidth={1.5} style={{ color: "#059669" }} />
                      <span className="text-[13px] font-medium" style={{ color: "#059669" }}>Concluídas</span>
                    </div>
                    <span className="text-[15px] font-bold" style={{ color: "#059669" }}>{dossier.certificatesObtidas}</span>
                  </div>
                  <div className="flex items-center justify-between" style={{ padding: "10px 16px", borderRadius: "10px", background: isDark ? "rgba(220,38,38,0.15)" : "#FEF2F2" }}>
                    <div className="flex items-center" style={{ gap: "8px" }}>
                      <AlertTriangle size={15} strokeWidth={1.5} style={{ color: "#DC2626" }} />
                      <span className="text-[13px] font-medium" style={{ color: "#DC2626" }}>Pendências</span>
                    </div>
                    <span className="text-[15px] font-bold" style={{ color: "#DC2626" }}>{dossier.certificatesPendentes}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
                  <div className="flex flex-col" style={{ gap: "8px" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Total de certidões</span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{dossier.certificateCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Última atualização</span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {new Date(dossier.updatedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Criação</span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {new Date(dossier.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between shrink-0" style={{ padding: "24px 40px", borderTop: "1px solid var(--border-light)" }}>
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Alterações registradas no histórico do dossiê</span>
            <div className="flex items-center" style={{ gap: "12px" }}>
              <button
                onClick={() => { if (isDirty) setConfirmCancel(true); else onClose(); }}
                className="text-[13px] font-medium transition-colors"
                style={{ height: "36px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "10px", color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmSave(true)}
                disabled={saving}
                className="text-[13px] font-semibold text-white transition-colors flex items-center"
                style={{ height: "36px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "10px", background: saving ? "#FF7A00" : "#FF7A00", opacity: saving ? 0.5 : 1, gap: "8px", cursor: saving ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#E06900"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#FF7A00"; }}
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmSave}
        title="Confirmar alterações"
        message="Tem certeza que deseja salvar as alterações neste dossiê?"
        icon={<BadgeCheck size={24} strokeWidth={2.5} />}
        confirmLabel="Sim, salvar"
        cancelLabel="Não, voltar"
        onConfirm={() => { setConfirmSave(false); handleSave(); }}
        onCancel={() => setConfirmSave(false)}
        onClose={() => setConfirmSave(false)}
      />
      <ConfirmModal
        open={confirmCancel}
        title="Descartar alterações"
        message="Deseja mesmo cancelar e perder tudo que editou?"
        confirmLabel="Sim, cancelar"
        cancelLabel="Não, voltar"
        variant="danger"
        onConfirm={() => { setConfirmCancel(false); onClose(); }}
        onCancel={() => setConfirmCancel(false)}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
}
