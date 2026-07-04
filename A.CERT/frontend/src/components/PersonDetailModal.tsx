"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, FolderOpen, BadgeCheck, AlertTriangle, Star, Building2, Home, Store, Trees, Warehouse, Castle, Mountain } from "lucide-react";
import { useT } from "@/i18n/useT";
import { useTheme } from "@/contexts/ThemeContext";

function formatDoc(cpf: string | null, cnpj?: string | null): string {
  const raw = (cpf || cnpj || "").replace(/\D/g, "");
  if (!raw) return "—";
  if (raw.length === 11) return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (raw.length === 14) return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return raw;
}
import ConfirmModal from "./ConfirmModal";

interface Certificate {
  id: string;
  name: string;
  organ: string;
  status: string;
  protocol: string | null;
  obtained_at: string | null;
  document_path: string | null;
}

interface Dossier {
  id: string;
  identifier: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  property_identifier: string | null;
  property_type: string | null;
  property_address: string | null;
  certificates: Certificate[];
}

interface DetailData {
  person: {
    id: string;
    name: string;
    cpf: string | null;
    email: string | null;
    phone: string | null;
    cellPhone: string | null;
    rg: string | null;
    birthDate: string | null;
    motherName: string | null;
    fatherName: string | null;
    maritalStatus: string | null;
    nationality: string | null;
    zipCode: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    observation: string | null;
    createdAt: string;
  };
  dossiers: Dossier[];
  stats: {
    totalDossiers: number;
    totalCertificates: number;
    obtidas: number;
    pendentes: number;
  };
}

interface Props {
  personId: string;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, { icon: any; bg: string; color: string }> = {
  Apartamento: { icon: Building2, bg: "var(--badge-orange-bg)", color: "#FF7A00" },
  Casa: { icon: Home, bg: "var(--badge-green-bg)", color: "#059669" },
  "Sala Comercial": { icon: Store, bg: "var(--badge-blue-bg)", color: "#2563EB" },
  Terreno: { icon: Mountain, bg: "var(--badge-green-bg)", color: "#16A34A" },
  Galpão: { icon: Warehouse, bg: "var(--badge-purple-bg)", color: "#7C3AED" },
  Condomínio: { icon: Castle, bg: "var(--badge-red-bg)", color: "#E11D48" },
  Chácara: { icon: Trees, bg: "var(--badge-amber-bg)", color: "#CA8A04" },
  Outros: { icon: Home, bg: "var(--bg-muted)", color: "var(--text-secondary)" },
};

const DOSSIER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Em andamento": { bg: "var(--badge-orange-bg)", text: "#FF7A00" },
  "Pendente": { bg: "var(--badge-red-bg)", text: "#DC2626" },
  "Concluído": { bg: "var(--badge-green-bg)", text: "#059669" },
  "Cancelado": { bg: "var(--badge-purple-bg)", text: "#7C3AED" },
};

function getInitials(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr: string) {
  // Parse manually to avoid timezone shift
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

export function PersonDetailModal({ personId, onClose }: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dados");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { t } = useT();
  const [properties, setProperties] = useState<any[]>([]);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === "imoveis" && !propertiesLoaded) {
      const token = localStorage.getItem("acert_token");
      fetch(`/api/people/${personId}/properties`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((d) => { setProperties(d.properties || []); setPropertiesLoaded(true); })
        .catch(() => {});
    }
  }, [activeTab, personId, propertiesLoaded]);

  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", cellPhone: "", rg: "", birthDate: "",
    motherName: "", fatherName: "",
    maritalStatus: "", nationality: "", zipCode: "", city: "", state: "", address: "", observation: "",
  });

  useEffect(() => {
    if (data) {
      const p = data.person;
      setEditForm({
        name: p.name,
        email: p.email || "",
        phone: p.phone || "",
        cellPhone: p.cellPhone || "",
        rg: p.rg || "",
        birthDate: p.birthDate || "",
        motherName: p.motherName || "",
        fatherName: p.fatherName || "",
        maritalStatus: p.maritalStatus || "",
        nationality: p.nationality || "",
        zipCode: p.zipCode || "",
        city: p.city || "",
        state: p.state || "",
        address: p.address || "",
        observation: p.observation || "",
      });
    }
  }, [data]);

  useEffect(() => {
    const token = localStorage.getItem("acert_token");
    fetch(`/api/people/${personId}/detail`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d: DetailData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [personId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/people/${personId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editForm),
      });
      if (!r.ok) throw new Error("Erro ao salvar");
      setEditing(false);
      const detail = await fetch(`/api/people/${personId}/detail`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((res) => res.json());
      setData(detail);
    } catch {
      alert("Erro ao salvar dados da pessoa");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch(`/api/people/${personId}/archive`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error("Erro ao arquivar");
      onClose();
    } catch {
      alert("Erro ao arquivar pessoa");
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="w-full bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-h-[90vh] flex items-center justify-center" style={{ maxWidth: "900px", minHeight: "400px" }}>
            <div className="w-8 h-8 border-2 border-default border-t-[#FF7A00] rounded-full animate-spin" />
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="w-full bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-h-[90vh] flex items-center justify-center" style={{ maxWidth: "900px", minHeight: "400px" }}>
            <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>Erro ao carregar dados</span>
          </div>
        </div>
      </>
    );
  }

  const { person, dossiers, stats } = data;
  const docPct = stats.totalCertificates > 0 ? Math.round((stats.obtidas / stats.totalCertificates) * 100) : 0;

  const TABS = [
    { key: "dados", label: "Dados" },
    { key: "imoveis", label: "Imóveis" },
    { key: "dossies", label: `Dossiês (${stats.totalDossiers})` },
    { key: "documentos", label: "Documentos" },
    { key: "historico", label: "Histórico" },
  ];

  function getDocumentationStatus(): { label: string; bg: string; text: string } {
    if (stats.totalCertificates === 0) return { label: "Sem análise", bg: "#F3F4F6", text: "var(--text-secondary)" };
    if (stats.pendentes === 0) return { label: "Completa", bg: "#ECFDF5", text: "#059669" };
    if (stats.obtidas > 0) return { label: "Parcial", bg: "#FFFBEB", text: "#D97706" };
    return { label: "Pendente", bg: "#FEF2F2", text: "#DC2626" };
  }

  const docStatus = getDocumentationStatus();

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
            <div className="flex items-center" style={{ gap: "16px" }}>
              <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 text-[16px] font-bold text-white" style={{ background: "#FF7A00" }}>
                {getInitials(person.name)}
              </div>
              <div className="flex flex-col" style={{ gap: "4px" }}>
                <div className="flex items-center" style={{ gap: "12px" }}>
                  <h2 className="text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>{person.name}</h2>
                  <div className="flex items-center text-[12px] font-semibold" style={{ background: docStatus.bg, color: docStatus.text, height: "24px", borderRadius: "6px", paddingLeft: "10px", paddingRight: "10px" }}>
                    {docStatus.label}
                  </div>
                </div>
                <div className="flex items-center text-[13px]" style={{ gap: "16px", color: "var(--text-secondary)" }}>
                  {person.cpf && <span>{formatDoc(person.cpf, null)}</span>}
                  {person.email && (
                    <span className="flex items-center" style={{ gap: "6px" }}>
                      <Mail size={13} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                      {person.email}
                    </span>
                  )}
                </div>
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

          {/* Tabs */}
          <div className="flex shrink-0" style={{ padding: "0 40px", borderBottom: "1px solid var(--border-light)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="text-[13px] font-medium transition-colors relative"
                style={{
                  padding: "14px 0",
                  marginRight: "28px",
                  color: activeTab === tab.key ? "#FF7A00" : "var(--text-muted)",
                  borderBottom: activeTab === tab.key ? "2px solid #FF7A00" : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "32px 40px" }}>
            {activeTab === "dados" && (
              <div>
                {editing ? (
                  <div className="flex flex-col" style={{ gap: "24px" }}>
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                      <div className="flex flex-col" style={{ gap: "16px" }}>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]">Informações pessoais</label>
                        <EditField label={t("people.table.name")} value={editForm.name} onChange={(v) => setEditForm(f => ({ ...f, name: v }))} />
                        <EditField label={t("people.table.cpf")} value={editForm.rg.startsWith("CNPJ") ? editForm.rg : editForm.rg} onChange={(v) => setEditForm(f => ({ ...f, rg: v }))} />
                        <EditField label="RG" value={editForm.rg} onChange={(v) => setEditForm(f => ({ ...f, rg: v }))} />
                        <EditField label="Nascimento" value={editForm.birthDate} onChange={(v) => setEditForm(f => ({ ...f, birthDate: v }))} type="date" />
                        <EditField label={t("people.fields.motherName")} value={editForm.motherName} onChange={(v) => setEditForm(f => ({ ...f, motherName: v }))} />
                        <EditField label={t("people.fields.fatherName")} value={editForm.fatherName} onChange={(v) => setEditForm(f => ({ ...f, fatherName: v }))} />
                        <EditField label={t("people.fields.maritalStatus")} value={editForm.maritalStatus} onChange={(v) => setEditForm(f => ({ ...f, maritalStatus: v }))} />
                        <EditField label={t("people.fields.nationality")} value={editForm.nationality} onChange={(v) => setEditForm(f => ({ ...f, nationality: v }))} />
                      </div>
                      <div className="flex flex-col" style={{ gap: "16px" }}>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]">Contato</label>
                        <EditField label={t("people.fields.email")} value={editForm.email} onChange={(v) => setEditForm(f => ({ ...f, email: v }))} />
                        <EditField label={t("people.fields.phone")} value={editForm.phone} onChange={(v) => setEditForm(f => ({ ...f, phone: v }))} />
                        <EditField label={t("people.fields.cellPhone")} value={editForm.cellPhone} onChange={(v) => setEditForm(f => ({ ...f, cellPhone: v }))} />
                        <div style={{ marginTop: "8px" }}>
                          <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "8px" }}>Endereço</label>
                          <div className="flex flex-col" style={{ gap: "8px" }}>
                            <EditField label="Logradouro" value={editForm.address} onChange={(v) => setEditForm(f => ({ ...f, address: v }))} />
                            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 60px", gap: "8px" }}>
                              <EditField label={t("people.fields.city")} value={editForm.city} onChange={(v) => setEditForm(f => ({ ...f, city: v }))} />
                              <EditField label={t("people.fields.state")} value={editForm.state} onChange={(v) => setEditForm(f => ({ ...f, state: v }))} />
                              <EditField label="CEP" value={editForm.zipCode} onChange={(v) => setEditForm(f => ({ ...f, zipCode: v }))} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "8px" }}>Observação</label>
                      <textarea
                        value={editForm.observation}
                        onChange={(e) => setEditForm(f => ({ ...f, observation: e.target.value }))}
                        rows={3}
                        className="w-full resize-none transition-colors"
                        style={{ borderRadius: "10px", fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border-light)", padding: "10px 12px" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.outline = "none"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
                      />
                    </div>
                    <div className="flex items-center justify-end" style={{ gap: "10px" }}>
                      <button
                        onClick={() => setConfirmCancel(true)}
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
                        style={{ height: "36px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "10px", background: saving ? "#E06900" : "#FF7A00", gap: "8px", opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
                        onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#E06900"; }}
                        onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#FF7A00"; }}
                      >
                        {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {saving ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                    <div className="flex flex-col" style={{ gap: "24px" }}>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Informações pessoais</label>
                        <div className="flex flex-col" style={{ gap: "8px" }}>
                          <InfoRow label={t("people.table.name")} value={person.name} />
                          <InfoRow label={t("people.table.cpf")} value={formatDoc(person.cpf, null)} />
                          <InfoRow label="RG" value={person.rg || "—"} />
                          <InfoRow label="Nascimento" value={person.birthDate ? formatDateShort(person.birthDate) : "—"} />
                          <InfoRow label={t("people.fields.motherName")} value={person.motherName || "—"} />
                          <InfoRow label={t("people.fields.fatherName")} value={person.fatherName || "—"} />
                          <InfoRow label={t("people.fields.maritalStatus")} value={person.maritalStatus || "—"} />
                          <InfoRow label={t("people.fields.nationality")} value={person.nationality || "—"} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Contato</label>
                        <div className="flex flex-col" style={{ gap: "8px" }}>
                          <InfoRow label={t("people.fields.email")} value={person.email || "—"} />
                          <InfoRow label={t("people.fields.phone")} value={person.phone || "—"} />
                          <InfoRow label={t("people.fields.cellPhone")} value={person.cellPhone || "—"} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col" style={{ gap: "24px" }}>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Endereço</label>
                        <div className="flex flex-col" style={{ gap: "8px" }}>
                          <InfoRow label="Logradouro" value={person.address || "—"} />
                          <InfoRow label={t("people.fields.city")} value={person.city || "—"} />
                          <InfoRow label={t("people.fields.state")} value={person.state || "—"} />
                          <InfoRow label="CEP" value={person.zipCode || "—"} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Observação</label>
                        <div className="text-[13px]" style={{ color: person.observation ? "var(--text-primary)" : "var(--text-muted)", padding: "12px 16px", borderRadius: "10px", background: "var(--bg-subtle)", minHeight: "60px" }}>
                          {person.observation || "Nenhuma observação registrada."}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Cadastro</label>
                        <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                          Criado em {formatDateShort(person.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "imoveis" && (
              <div className="flex flex-col" style={{ gap: "16px" }}>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]">Imóveis Vinculados</label>
                {properties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12" style={{ gap: "8px" }}>
                    <Home size={28} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Nenhum imóvel vinculado</span>
                  </div>
                ) : (
                  <div className="flex flex-col" style={{ gap: "8px" }}>
                    {properties.map((prop: any) => {
                      const iconMeta = CATEGORY_ICONS[prop.type] || { icon: Home, bg: "var(--bg-muted)", color: "var(--text-secondary)" };
                      const Icon = iconMeta.icon;
                      const statusStyle = DOSSIER_STATUS_COLORS[prop.status === "Regular" ? "Concluído" : prop.status === "Pendente" ? "Pendente" : "Em andamento"] || { bg: "#F3F4F6", text: "var(--text-secondary)" };
                      return (
                        <div
                          key={prop.id}
                          className="flex items-center justify-between cursor-pointer transition-colors"
                          style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--bg-subtle)" }}
                          onClick={() => { window.open(`/dashboard/imoveis?id=${prop.id}`, "_blank"); }}
                        >
                          <div className="flex items-center" style={{ gap: "12px" }}>
                            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ background: isDark ? `${iconMeta.color}1A` : iconMeta.bg }}>
                              <Icon size={18} strokeWidth={1.5} style={{ color: iconMeta.color }} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{prop.identifier}</span>
                              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{prop.type} · {prop.address}</span>
                            </div>
                          </div>
                          <div className="flex items-center" style={{ gap: "12px" }}>
                            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                              {prop.dossier_count} dossiê{prop.dossier_count !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[12px] font-semibold" style={{ background: statusStyle.bg, color: statusStyle.text, padding: "2px 8px", borderRadius: "4px" }}>
                              {prop.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "dossies" && (
              <div className="flex flex-col" style={{ gap: "16px" }}>
                {dossiers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12" style={{ gap: "8px" }}>
                    <FolderOpen size={28} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>Nenhum dossiê vinculado</span>
                  </div>
                ) : (
                  <div className="w-full overflow-hidden" style={{ borderRadius: "10px", border: "1px solid var(--border-light)" }}>
                    <table className="w-full" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-subtle)" }}>
                          <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ padding: "10px 16px" }}>Dossiê</th>
                          <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ padding: "10px 16px" }}>Imóvel</th>
                          <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ padding: "10px 16px" }}>Status</th>
                          <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ padding: "10px 16px" }}>Prioridade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dossiers.map((d) => {
                          const sc = DOSSIER_STATUS_COLORS[d.status] || { bg: "#F3F4F6", text: "var(--text-secondary)" };
                          return (
                            <tr key={d.id} style={{ borderTop: "1px solid var(--border-light)" }}>
                              <td className="text-[13px] font-medium" style={{ color: "var(--text-primary)", padding: "12px 16px" }}>{d.identifier}</td>
                              <td className="text-[13px]" style={{ color: "var(--text-secondary)", padding: "12px 16px" }}>
                                {d.property_identifier || "—"}
                                {d.property_type && <span className="text-muted"> ({d.property_type})</span>}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span className="text-[12px] font-semibold" style={{ background: sc.bg, color: sc.text, padding: "3px 10px", borderRadius: "6px" }}>{d.status}</span>
                              </td>
                              <td className="text-[13px]" style={{ color: "var(--text-secondary)", padding: "12px 16px" }}>
                                {d.priority === "Urgente" || d.priority === "Preferencial" ? (
                                  <span className="flex items-center" style={{ gap: "4px" }}>
                                    <Star size={12} fill="#FFB800" stroke="none" />
                                    {d.priority}
                                  </span>
                                ) : d.priority}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <button className="flex items-center justify-center text-[13px] font-semibold transition-colors" style={{ height: "40px", borderRadius: "10px", border: "1px dashed var(--border-default)", color: "#FF7A00", background: "transparent", gap: "8px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,122,0,0.08)" : "#FFF7ED"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span>+</span>
                  <span>Vincular novo dossiê</span>
                </button>
              </div>
            )}

            {activeTab === "documentos" && (
              <div className="flex flex-col" style={{ gap: "24px" }}>
                {/* Progress bar */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Progresso da documentação</label>
                  <div className="flex flex-col" style={{ gap: "8px" }}>
                    <div className="w-full overflow-hidden" style={{ height: "8px", borderRadius: "999px", background: isDark ? "#1E2A44" : "#E5E7EB" }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${docPct}%`,
                          borderRadius: "999px",
                          background: docPct === 100 ? "#059669" : "linear-gradient(90deg, #FF7A00, #FF9A44)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{docPct}%</span>
                      <div className="flex items-center" style={{ gap: "16px" }}>
                        <span className="flex items-center text-[12px]" style={{ gap: "4px", color: "#059669" }}>
                          <BadgeCheck size={13} strokeWidth={1.5} />
                          {stats.obtidas} obtida{stats.obtidas !== 1 ? "s" : ""}
                        </span>
                        {stats.pendentes > 0 && (
                          <span className="flex items-center text-[12px]" style={{ gap: "4px", color: "#DC2626" }}>
                            <AlertTriangle size={13} strokeWidth={1.5} />
                            {stats.pendentes} pendente{stats.pendentes !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document list */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]" style={{ marginBottom: "12px" }}>Documentos</label>
                  {dossiers.length === 0 ? (
                    <div className="flex items-center justify-center py-8" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      Nenhum documento encontrado
                    </div>
                  ) : (
                    <div className="flex flex-col" style={{ gap: "4px" }}>
                      {dossiers.flatMap((d) =>
                        d.certificates.map((c) => {
                          const isObtida = c.status === "Obtida";
                          return (
                            <div key={c.id} className="flex items-center justify-between" style={{ padding: "10px 16px", borderRadius: "8px" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <div className="flex items-center" style={{ gap: "12px" }}>
                                <span style={{ fontSize: "16px" }}>{isObtida ? "✅" : "⏳"}</span>
                                <div>
                                  <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                                  <span className="text-[11px] text-muted" style={{ marginLeft: "8px" }}>{c.organ}</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-semibold" style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: isObtida ? "#ECFDF5" : "#FEF2F2",
                                color: isObtida ? "#059669" : "#DC2626",
                              }}>
                                {c.status}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "historico" && (
              <div className="flex flex-col" style={{ gap: "20px" }}>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.06em]">Linha do tempo</label>
                {/* Person created */}
                <div className="flex" style={{ gap: "12px" }}>
                  <div className="flex flex-col items-center shrink-0" style={{ width: "20px" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: "#FF7A00", marginTop: "6px" }} />
                    <div className="w-px flex-1" style={{ background: "var(--border-light)", marginTop: "4px" }} />
                  </div>
                  <div className="pb-4">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>Pessoa criada</span>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>{formatDate(person.createdAt)}</div>
                  </div>
                </div>
                {/* Dossier creation timeline */}
                {dossiers.map((d, i) => (
                  <div key={d.id} className="flex" style={{ gap: "12px" }}>
                    <div className="flex flex-col items-center shrink-0" style={{ width: "20px" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)", marginTop: "6px" }} />
                      {i < dossiers.length - 1 && <div className="w-px flex-1" style={{ background: "var(--border-light)", marginTop: "4px" }} />}
                    </div>
                    <div className="pb-4">
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>Dossiê {d.identifier} criado</span>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                        {formatDate(d.created_at)} · Status: {d.status}
                      </div>
                    </div>
                  </div>
                ))}
                {dossiers.length === 0 && (
                  <div className="text-[13px]" style={{ color: "var(--text-muted)", paddingLeft: "32px" }}>Nenhum evento registrado</div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between shrink-0" style={{ padding: "20px 40px", borderTop: "1px solid var(--border-light)" }}>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <FooterButton icon="📝" label={editing ? "Editando..." : "Editar dados"} onClick={() => { if (editing) setConfirmCancel(true); else setEditing(true); }} />
              <FooterButton icon="📂" label="Abrir dossiês" onClick={() => { router.push(`/dashboard/dossies?search=${encodeURIComponent(person.name)}`); }} />
              <FooterButton icon="📄" label="Ver documentos" onClick={() => setActiveTab("documentos")} />
              <FooterButton icon="🗑️" label="Mover para lixeira" color="#DC2626" onClick={() => setConfirmArchive(true)} />
            </div>
            <button
              onClick={onClose}
              className="text-[13px] font-medium transition-colors"
              style={{ height: "36px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "10px", color: "var(--text-secondary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmSave}
        title="Confirmar alterações"
        message="Tem certeza que deseja salvar os dados desta pessoa?"
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
        onConfirm={() => { setConfirmCancel(false); setEditing(false); }}
        onCancel={() => setConfirmCancel(false)}
        onClose={() => setConfirmCancel(false)}
      />
      <ConfirmModal
          open={confirmArchive}
          title="Mover para lixeira"
          message="Deseja mover esta pessoa para a Lixeira? Você poderá restaurar ou excluir permanentemente depois."
          confirmLabel="Mover para lixeira"
          cancelLabel="Não, voltar"
          variant="warning"
          onConfirm={() => { setConfirmArchive(false); handleArchive(); }}
          onCancel={() => setConfirmArchive(false)}
          onClose={() => setConfirmArchive(false)}
        />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "8px 12px", borderRadius: "8px", background: "var(--bg-subtle)" }}>
      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col" style={{ gap: "4px" }}>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full transition-colors"
        style={{ height: "36px", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border-light)", padding: "0 10px" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; e.currentTarget.style.outline = "none"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
      />
    </div>
  );
}

function FooterButton({ icon, label, color, onClick }: { icon: string; label: string; color?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center text-[12px] font-medium transition-colors"
      style={{ gap: "6px", padding: "6px 12px", borderRadius: "8px", color: color || "var(--text-secondary)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
