"use client";

import { useState, useMemo } from "react";
import { X, Plus, Loader2, Building2, User } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { useT } from "@/i18n/useT";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}
function maskCEP(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length > 5) return d.slice(0, 5) + "-" + d.slice(5);
  return d;
}
function validarCPF(d: string): boolean {
  const c = d.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let r = (s * 10) % 11; if (r === 10) r = 0;
  if (r !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  r = (s * 10) % 11; if (r === 10) r = 0;
  return r === parseInt(c[10]);
}
function validarCNPJ(d: string): boolean {
  const c = d.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += parseInt(c[i]) * w1[i];
  let r = s % 11; r = r < 2 ? 0 : 11 - r;
  if (r !== parseInt(c[12])) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += parseInt(c[i]) * w2[i];
  r = s % 11; r = r < 2 ? 0 : 11 - r;
  return r === parseInt(c[13]);
}

const masks: Record<string, (v: string) => string> = {
  cpf: maskCPF, cnpj: maskCNPJ, phone: maskPhone, cellPhone: maskPhone, zipCode: maskCEP,
};

const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#FF7A00", textTransform: "uppercase",
  letterSpacing: "0.8px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px",
};

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" };

export function NovaPessoaModal({ onClose, onCreated }: Props) {
  const { t } = useT();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [personType, setPersonType] = useState<"fisica" | "empresarial">("fisica");

  const [form, setForm] = useState({
    name: "", cpf: "", cnpj: "", email: "", phone: "", cellPhone: "",
    rg: "", birthDate: "", maritalStatus: "", nationality: "",
    zipCode: "", city: "", state: "", address: "", observation: "",
  });

  const hasData = useMemo(() => Object.values(form).some((v) => v.trim().length > 0), [form]);

  function handleClose() {
    if (hasData && !showConfirmCancel) { setShowConfirmCancel(true); return; }
    onClose();
  }

  function set(field: string, raw: string) {
    const maskFn = masks[field];
    setForm((p) => ({ ...p, [field]: maskFn ? maskFn(raw) : raw }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";

    if (personType === "fisica") {
      const cpfD = form.cpf.replace(/\D/g, "");
      if (!cpfD) errs.cpf = "CPF é obrigatório";
      else if (cpfD.length !== 11) errs.cpf = "CPF deve ter 11 dígitos";
      else if (!validarCPF(form.cpf)) errs.cpf = "CPF inválido";
    } else {
      const cnpjD = form.cnpj.replace(/\D/g, "");
      if (!cnpjD) errs.cnpj = "CNPJ é obrigatório";
      else if (cnpjD.length < 8) errs.cnpj = "CNPJ deve ter no mínimo 8 caracteres";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email inválido";
    const ph = form.phone.replace(/\D/g, "");
    if (form.phone && (ph.length < 10 || ph.length > 11)) errs.phone = "Telefone inválido";
    const cl = form.cellPhone.replace(/\D/g, "");
    if (form.cellPhone && (cl.length < 10 || cl.length > 11)) errs.cellPhone = "Celular inválido";
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

      const body: Record<string, any> = {
        ...form,
        cnpj: personType === "empresarial" ? form.cnpj : null,
        cpf: personType === "fisica" ? form.cpf : null,
        isPreCadastro: false,
        motherName: (form as any).motherName || "",
        fatherName: (form as any).fatherName || "",
      };

      const r = await fetch("/api/people", {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao criar pessoa");

      onCreated();
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Erro inesperado" });
    } finally { setSaving(false); }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#FF7A00";
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, field: string) {
    e.currentTarget.style.borderColor = errors[field] ? "#DC2626" : "var(--border-default)";
  }

  const toggleSwitchStyle: React.CSSProperties = {
    display: "flex", background: "var(--bg-muted)", borderRadius: "12px", padding: "4px",
    width: "100%", position: "relative",
  };
  const toggleBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
    background: active ? "linear-gradient(135deg, #FF7A00, #E06900)" : "transparent",
    color: active ? "#FFF" : "var(--text-muted)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: active ? "0 2px 8px rgba(255,122,0,0.3)" : "none",
    position: "relative", zIndex: active ? 1 : 0,
  });

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

  const initials = form.name ? form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const avatarBg = personType === "empresarial" ? "#7C3AED" : "#FF7A00";

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
              <div className="flex items-center justify-center shrink-0 transition-all duration-300"
                style={{ width: "44px", height: "44px", borderRadius: "12px", background: avatarBg, color: "#FFF", fontSize: "15px", fontWeight: 700 }}>
                {initials}
              </div>
              <div>
                <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Nova Pessoa</h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  {personType === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
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

            {/* Tipo toggle */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ ...fieldLabel, marginBottom: "10px" }}>Tipo de Pessoa</label>
              <div style={toggleSwitchStyle}>
                <button style={toggleBtn(personType === "fisica")} onClick={() => { setPersonType("fisica"); setErrors(e => { const { cnpj, ...r } = e; return r; }); }}>
                  <User size={15} strokeWidth={2} /> Pessoa Física
                </button>
                <button style={toggleBtn(personType === "empresarial")} onClick={() => { setPersonType("empresarial"); setErrors(e => { const { cpf, ...r } = e; return r; }); }}>
                  <Building2 size={15} strokeWidth={2} /> Pessoa Jurídica
                </button>
              </div>
            </div>

            {/* Section: Informações Pessoais */}
            <div style={{ marginBottom: "24px" }}>
              <div style={sectionLabel}>📋 Informações Pessoais</div>
              <div style={grid2}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ ...fieldLabel, color: "var(--text-primary)", fontWeight: 700 }}>Nome completo *</label>
                  <input type="text" style={inputStyle("name")} value={form.name} onChange={(e) => set("name", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "name")} placeholder="Nome completo da pessoa" />
                  {errors.name && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.name}</span>}
                </div>

                {personType === "fisica" ? (
                  <div>
                    <label style={{ ...fieldLabel, color: "var(--text-primary)", fontWeight: 700 }}>CPF *</label>
                    <input type="text" style={inputStyle("cpf")} value={form.cpf} onChange={(e) => set("cpf", e.target.value)}
                      onFocus={handleFocus} onBlur={(e) => handleBlur(e, "cpf")} placeholder="000.000.000-00" />
                    {errors.cpf && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.cpf}</span>}
                  </div>
                ) : (
                  <div>
                    <label style={{ ...fieldLabel, color: "var(--text-primary)", fontWeight: 700 }}>CNPJ *</label>
                    <input type="text" style={inputStyle("cnpj")} value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)}
                      onFocus={handleFocus} onBlur={(e) => handleBlur(e, "cnpj")} placeholder="00.000.000/0001-00" />
                    {errors.cnpj && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.cnpj}</span>}
                  </div>
                )}

                <div>
                  <label style={fieldLabel}>RG</label>
                  <input type="text" style={inputStyle("rg")} value={form.rg} onChange={(e) => set("rg", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "rg")} placeholder="RG" />
                </div>
                <div>
                  <label style={fieldLabel}>Data de Nascimento</label>
                  <input type="date" style={inputStyle("birthDate")} value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "birthDate")} />
                </div>
                <div>
                  <label style={fieldLabel}>Nome da Mãe</label>
                  <input type="text" style={inputStyle("motherName")} value={(form as any).motherName || ""}
                    onChange={(e) => setForm(p => ({ ...p, motherName: e.target.value }))}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "motherName")} placeholder={t("people.fields.motherName")} />
                </div>
                <div>
                  <label style={fieldLabel}>Nome do Pai</label>
                  <input type="text" style={inputStyle("fatherName")} value={(form as any).fatherName || ""}
                    onChange={(e) => setForm(p => ({ ...p, fatherName: e.target.value }))}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "fatherName")} placeholder={t("people.fields.fatherName")} />
                </div>
                <div>
                  <label style={fieldLabel}>Estado Civil</label>
                  <select style={{ ...inputStyle("maritalStatus"), cursor: "pointer", appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
                    value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "maritalStatus")}>
                    <option value="">Selecione</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                </div>
                <div>
                  <label style={fieldLabel}>Nacionalidade</label>
                  <input type="text" style={inputStyle("nationality")} value={form.nationality} onChange={(e) => set("nationality", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "nationality")} placeholder="Brasileiro(a)" />
                </div>
              </div>
            </div>

            {/* Section: Contato */}
            <div style={{ marginBottom: "24px" }}>
              <div style={sectionLabel}>📞 Contato</div>
              <div style={grid2}>
                <div>
                  <label style={fieldLabel}>E-mail</label>
                  <input type="text" style={inputStyle("email")} value={form.email} onChange={(e) => set("email", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "email")} placeholder="email@exemplo.com" />
                  {errors.email && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.email}</span>}
                </div>
                <div>
                  <label style={fieldLabel}>Telefone</label>
                  <input type="text" style={inputStyle("phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "phone")} placeholder="(61) 99999-9999" />
                  {errors.phone && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.phone}</span>}
                </div>
                <div>
                  <label style={fieldLabel}>Celular</label>
                  <input type="text" style={inputStyle("cellPhone")} value={form.cellPhone} onChange={(e) => set("cellPhone", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "cellPhone")} placeholder="(61) 99999-9999" />
                  {errors.cellPhone && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.cellPhone}</span>}
                </div>
              </div>
            </div>

            {/* Section: Endereço */}
            <div style={{ marginBottom: "24px" }}>
              <div style={sectionLabel}>📍 Endereço</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={fieldLabel}>Logradouro</label>
                  <input type="text" style={inputStyle("address")} value={form.address} onChange={(e) => set("address", e.target.value)}
                    onFocus={handleFocus} onBlur={(e) => handleBlur(e, "address")} placeholder="Rua, número, bairro" />
                </div>
                <div style={grid3}>
                  <div>
                    <label style={fieldLabel}>Cidade</label>
                    <input type="text" style={inputStyle("city")} value={form.city} onChange={(e) => set("city", e.target.value)}
                      onFocus={handleFocus} onBlur={(e) => handleBlur(e, "city")} placeholder={t("people.fields.city")} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Estado</label>
                    <input type="text" style={inputStyle("state")} value={form.state} onChange={(e) => set("state", e.target.value)}
                      onFocus={handleFocus} onBlur={(e) => handleBlur(e, "state")} placeholder="UF" />
                  </div>
                  <div>
                    <label style={fieldLabel}>CEP</label>
                    <input type="text" style={inputStyle("zipCode")} value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)}
                      onFocus={handleFocus} onBlur={(e) => handleBlur(e, "zipCode")} placeholder="00000-000" />
                    {errors.zipCode && <span style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "block" }}>{errors.zipCode}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Observação */}
            <div>
              <div style={sectionLabel}>📝 Observação</div>
              <textarea rows={3}
                style={{ ...inputStyle("observation"), height: "80px", resize: "vertical", paddingTop: "10px", fontFamily: "inherit" }}
                value={form.observation} onChange={(e) => set("observation", e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}
                placeholder="Observações adicionais sobre esta pessoa..." />
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
                  color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px",
                  fontWeight: 600, color: "#FFF", cursor: saving ? "not-allowed" : "pointer",
                  background: saving ? "var(--text-muted)" : "#FF7A00", display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.15s ease", opacity: saving ? 0.8 : 1 }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#E06900"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#FF7A00"; }}>
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
