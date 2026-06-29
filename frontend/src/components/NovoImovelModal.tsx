"use client";

import { useState, useMemo } from "react";
import { X, Plus, Loader2, Building2, Home, Store, Trees, Warehouse, Castle, Mountain, MapPin } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const PROPERTY_TYPES = [
  { value: "Apartamento", icon: Building2, color: "#FF7A00" },
  { value: "Casa", icon: Home, color: "#059669" },
  { value: "Sala Comercial", icon: Store, color: "#2563EB" },
  { value: "Terreno", icon: Mountain, color: "#16A34A" },
  { value: "Galpão", icon: Warehouse, color: "#7C3AED" },
  { value: "Condomínio", icon: Castle, color: "#E11D48" },
  { value: "Chácara", icon: Trees, color: "#CA8A04" },
  { value: "Outros", icon: Home, color: "var(--text-secondary)" },
];

function maskCEP(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length > 5) return d.slice(0, 5) + "-" + d.slice(5);
  return d;
}

const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#FF7A00", textTransform: "uppercase",
  letterSpacing: "0.8px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px",
};

export function NovoImovelModal({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [selectedType, setSelectedType] = useState("Apartamento");

  const [form, setForm] = useState({
    identifier: "", registration: "", type: "Apartamento", address: "",
    neighborhood: "", city: "", state: "", zipCode: "",
    area: "", landArea: "", description: "", notaryOffice: "",
  });

  const hasData = useMemo(() => {
    return form.identifier.trim() || form.address.trim() || form.registration.trim();
  }, [form]);

  function handleClose() {
    if (hasData && !showConfirmCancel) { setShowConfirmCancel(true); return; }
    onClose();
  }

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.identifier.trim()) errs.identifier = "Identificador é obrigatório";
    if (!form.address.trim()) errs.address = "Endereço é obrigatório";
    const ce = form.zipCode.replace(/\D/g, "");
    if (form.zipCode && ce.length !== 8) errs.zipCode = "CEP deve ter 8 dígitos";
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("acert_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body = {
        identifier: form.identifier.trim(),
        registration: form.registration.trim() || null,
        type: selectedType,
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zipCode: form.zipCode.replace(/\D/g, "") || null,
        area: form.area.trim() || null,
        landArea: form.landArea.trim() || null,
        description: form.description.trim() || null,
        notaryOffice: form.notaryOffice.trim() || null,
      };

      const r = await fetch("/api/properties", {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao criar imóvel");

      onCreated();
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Erro inesperado" });
    } finally { setSaving(false); }
  }

  function inputStyle(field: string): React.CSSProperties {
    return {
      height: "40px", borderRadius: "8px", fontSize: "13px",
      color: "var(--text-primary)", background: "var(--bg-app)",
      border: `1.5px solid ${errors[field] ? "#DC2626" : "var(--border-default)"}`,
      padding: "0 12px", width: "100%", outline: "none",
      fontFamily: "inherit", boxSizing: "border-box",
      transition: "border-color 0.15s ease",
    } as React.CSSProperties;
  }
  const fieldLabel: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 600,
    color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: "0.4px", marginBottom: "5px",
  };
  const fieldLabelReq: React.CSSProperties = { ...fieldLabel, color: "var(--text-primary)", fontWeight: 700 };

  const activeType = PROPERTY_TYPES.find(t => t.value === selectedType) || PROPERTY_TYPES[0];
  const TypeIcon = activeType.icon;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxWidth: "680px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between shrink-0"
            style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center shrink-0"
                style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--badge-orange-bg)" }}>
                <Building2 size={20} strokeWidth={1.5} color="#FF7A00" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Novo Imóvel</h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  Cadastre um imóvel para vincular a dossiês
                </p>
              </div>
            </div>
            <button onClick={handleClose}
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>

            {/* Type selector */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ ...fieldLabel, marginBottom: "10px" }}>Tipo de Imóvel</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {PROPERTY_TYPES.map((t) => {
                  const active = selectedType === t.value;
                  const Ico = t.icon;
                  return (
                    <button key={t.value} onClick={() => { setSelectedType(t.value); set("type", t.value); }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                        padding: "14px 8px", borderRadius: "12px", border: active ? `2px solid ${t.color}` : "1px solid var(--border-light)",
                        background: active ? `${t.color}10` : "transparent", cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = t.color; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--border-light)"; }}>
                      <Ico size={20} strokeWidth={1.5} style={{ color: t.color }} />
                      <span style={{ fontSize: "10px", fontWeight: active ? 600 : 500, color: active ? t.color : "var(--text-muted)", lineHeight: 1.2, textAlign: "center" }}>{t.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Identificação */}
            <div style={{ marginBottom: "24px" }}>
              <div style={sectionLabel}>🏷️ Identificação</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={fieldLabelReq}>Identificador *</label>
                  <input type="text" style={inputStyle("identifier")} value={form.identifier}
                    onChange={(e) => set("identifier", e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors["identifier"] ? "#DC2626" : "var(--border-default)" }}
                    placeholder="Ex: APT-101" />
                  {errors.identifier && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.identifier}</span>}
                </div>
                <div>
                  <label style={fieldLabel}>Matrícula</label>
                  <input type="text" style={inputStyle("registration")} value={form.registration}
                    onChange={(e) => set("registration", e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                    placeholder="Número da matrícula" />
                </div>
              </div>
            </div>

            {/* Section: Endereço */}
            <div style={{ marginBottom: "24px" }}>
              <div style={sectionLabel}>📍 Endereço</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={fieldLabelReq}>Endereço *</label>
                  <input type="text" style={inputStyle("address")} value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors["address"] ? "#DC2626" : "var(--border-default)" }}
                    placeholder="Logradouro, número" />
                  {errors.address && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.address}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={fieldLabel}>Bairro</label>
                    <input type="text" style={inputStyle("neighborhood")} value={form.neighborhood}
                      onChange={(e) => set("neighborhood", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                      placeholder="Bairro" />
                  </div>
                  <div>
                    <label style={fieldLabel}>Cartório</label>
                    <input type="text" style={inputStyle("notaryOffice")} value={form.notaryOffice}
                      onChange={(e) => set("notaryOffice", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                      placeholder="Cartório de registro" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={fieldLabel}>Cidade</label>
                    <input type="text" style={inputStyle("city")} value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                      placeholder="Cidade" />
                  </div>
                  <div>
                    <label style={fieldLabel}>Estado</label>
                    <input type="text" style={inputStyle("state")} value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                      placeholder="UF" />
                  </div>
                  <div>
                    <label style={fieldLabel}>CEP</label>
                    <input type="text" style={inputStyle("zipCode")} value={form.zipCode}
                      onChange={(e) => set("zipCode", maskCEP(e.target.value))}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = errors["zipCode"] ? "#DC2626" : "var(--border-default)" }}
                      placeholder="00000-000" />
                    {errors.zipCode && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.zipCode}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Área */}
            <div style={{ marginBottom: "24px" }}>
              <div style={sectionLabel}>📐 Área e Terreno</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={fieldLabel}>Área Construída</label>
                  <input type="text" style={inputStyle("area")} value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                    placeholder="Ex: 120m²" />
                </div>
                <div>
                  <label style={fieldLabel}>Área do Terreno</label>
                  <input type="text" style={inputStyle("landArea")} value={form.landArea}
                    onChange={(e) => set("landArea", e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                    placeholder="Ex: 300m²" />
                </div>
              </div>
            </div>

            {/* Section: Descrição */}
            <div>
              <div style={sectionLabel}>📝 Descrição</div>
              <textarea rows={3}
                style={{ ...inputStyle("description"), height: "80px", resize: "vertical", paddingTop: "10px", fontFamily: "inherit" }}
                value={form.description} onChange={(e) => set("description", e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                placeholder="Detalhes adicionais sobre o imóvel..." />
            </div>

            {errors.form && (
              <div style={{ padding: "12px", borderRadius: "8px", background: "var(--badge-red-bg)", color: "var(--error)", fontSize: "13px", marginTop: "16px" }}>{errors.form}</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between shrink-0"
            style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              <span style={{ color: "#DC2626" }}>*</span> Campos obrigatórios
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleClose}
                style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                  color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px",
                  fontWeight: 600, color: "#FFF", cursor: saving ? "not-allowed" : "pointer",
                  background: saving ? "var(--text-muted)" : "#FF7A00", display: "flex", alignItems: "center", gap: "6px" }}>
                {saving && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showConfirmCancel}
        title="Descartar alterações?"
        message="Você preencheu alguns campos. Tem certeza que deseja sair? As informações serão perdidas."
        variant="warning"
        confirmLabel="Sim, Descartar"
        cancelLabel="Continuar Editando"
        onConfirm={onClose}
        onCancel={() => setShowConfirmCancel(false)}
        onClose={() => setShowConfirmCancel(false)}
      />
    </>
  );
}
