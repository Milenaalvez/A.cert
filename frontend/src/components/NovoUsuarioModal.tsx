"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, UserPlus, Pencil, Loader2, Camera } from "lucide-react";
import * as teamApi from "@/services/teamApi";
import ConfirmModal from "./ConfirmModal";

interface EnrichedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  positionId?: string;
  contractType?: string;
  registrationNumber?: string;
  phone?: string;
  weeklyHours?: number;
  hireDate?: string;
  isActive?: boolean;
  avatar?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  editUser?: EnrichedUser | null;
}

export default function NovoUsuarioModal({ open, onClose, onCreated, editUser }: Props) {
  const isEditing = !!editUser;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [contractType, setContractType] = useState("CLT");
  const [isActive, setIsActive] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Store initial values for change detection
  const initialRef = useRef({ name: "", email: "", cpf: "", phone: "" });

  const hasChanges = useMemo(() => {
    const init = initialRef.current;
    return name !== init.name || email !== init.email || cpf !== init.cpf || phone !== init.phone;
  }, [name, email, cpf, phone]);

  function handleClose() {
    if (hasChanges && !showConfirmCancel) { setShowConfirmCancel(true); return; }
    onClose();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (open) {
      teamApi.departments().then(setDepartments).catch(() => {});
      if (editUser) {
        setName(editUser.name);
        setEmail(editUser.email);
        setCpf(editUser.registrationNumber || "");
        setPhone(editUser.phone || "");
        setRole(editUser.role);
        setDepartmentId(editUser.departmentId || "");
        setPositionId(editUser.positionId || "");
        setWeeklyHours(editUser.weeklyHours || 40);
        setContractType(editUser.contractType || "CLT");
        setIsActive(editUser.isActive !== false);
        initialRef.current = { name: editUser.name, email: editUser.email, cpf: editUser.registrationNumber || "", phone: editUser.phone || "" };
      } else {
        initialRef.current = { name: "", email: "", cpf: "", phone: "" };
        setName(""); setEmail(""); setCpf(""); setPhone("");
        setRole("EMPLOYEE"); setDepartmentId(""); setPositionId("");
        setWeeklyHours(40); setContractType("CLT"); setIsActive(true);
        setError(""); setPositions([]);
      }
    }
  }, [open, editUser]);

  useEffect(() => {
    if (departmentId && open) {
      teamApi.positions(departmentId).then(setPositions).catch(() => {});
    } else {
      setPositions([]);
      setPositionId("");
    }
  }, [departmentId, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setError("");
    setSending(true);
    try {
      if (isEditing && editUser) {
        if (avatarFile) {
          await teamApi.uploadAvatar(editUser.id, avatarFile);
        }
        await teamApi.update(editUser.id, {
          name, role,
          departmentId: departmentId || null,
          positionId: positionId || null,
          contractType, weeklyHours, phone,
        });
      } else {
        const result = await teamApi.create({
          name, email,
          registrationNumber: cpf, phone, role,
          departmentId: departmentId || null,
          positionId: positionId || null,
          weeklyHours, contractType,
          hireDate: new Date().toISOString().split("T")[0],
          isActive,
        });
        if (avatarFile && result?.user?.id) {
          await teamApi.uploadAvatar(result.user.id, avatarFile);
        }
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const labelStyle =
    "block text-[11px] font-semibold text-muted uppercase tracking-[0.4px] mb-1.5";
  const inputBase =
    "w-full h-10 rounded-[8px] text-[13px] text-primary outline-none transition-colors font-[inherit] box-border";
  const inputStyle =
    inputBase + " border border-default bg-app px-3 focus:border-[#FF7A00]";
  const selectStyle =
    inputBase +
    " border border-default bg-app px-3 appearance-none focus:border-[#FF7A00]";
  const selectBg =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
  const grid2 = "grid grid-cols-2 gap-3.5";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div
          className="w-full bg-surface flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            maxWidth: "620px",
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
              <div className="relative shrink-0">
                <div
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--badge-orange-bg)" }}
                >
                  {avatarPreview || editUser?.avatar ? (
                    <img src={avatarPreview || editUser?.avatar || ""} alt="" className="w-full h-full object-cover" />
                  ) : isEditing ? (
                    <Pencil size={20} strokeWidth={1.5} color="#FF7A00" />
                  ) : (
                    <UserPlus size={20} strokeWidth={1.5} color="#FF7A00" />
                  )}
                </div>
                <label style={{ position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#FF7A00", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Camera size={10} strokeWidth={2.5} color="#FFF" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <h2
                  className="text-[17px] font-bold tracking-tight"
                  style={{ color: "var(--text-primary)", lineHeight: 1.2 }}
                >
                    {isEditing ? "Editar Usuário" : "Novo Usuário"}
                  </h2>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                    {isEditing ? "Edite as informações do vendedor" : "Cadastre um novo vendedor no sistema"}
                  </p>
              </div>
            </div>
            <button
              onClick={handleClose}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
            <div className="flex flex-col gap-4">
              {/* Nome + Email */}
              <div className={grid2}>
                <div>
                  <label className={labelStyle} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                    Nome completo *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do colaborador"
                    className={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  />
                </div>
                <div>
                  <label className={labelStyle} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  />
                </div>
              </div>

              {/* CPF + Telefone */}
              <div className={grid2}>
                <div>
                  <label className={labelStyle}>CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(61) 99999-0000"
                    className={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  />
                </div>
              </div>

              {/* Cargo + Departamento */}
              <div className={grid2}>
                <div>
                  <label className={labelStyle}>Cargo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={selectStyle}
                    style={{
                      cursor: "pointer",
                      backgroundImage: selectBg,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <option value="EMPLOYEE">Colaborador</option>
                    <option value="VENDOR">Vendedor</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="RH">RH</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="DEVELOPER">Desenvolvedor</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Departamento</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className={selectStyle}
                    style={{
                      cursor: "pointer",
                      backgroundImage: selectBg,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <option value="">Selecionar...</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cargo/Posição + Carga horária */}
              <div className={grid2}>
                <div>
                  <label className={labelStyle}>Cargo/Posição</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className={selectStyle}
                    style={{
                      cursor: "pointer",
                      backgroundImage: selectBg,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <option value="">Selecionar...</option>
                    {positions.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Carga horária semanal</label>
                  <select
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className={selectStyle}
                    style={{
                      cursor: "pointer",
                      backgroundImage: selectBg,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <option value={40}>40h semanais</option>
                    <option value={44}>44h semanais</option>
                    <option value={30}>30h semanais</option>
                    <option value={20}>20h semanais</option>
                  </select>
                </div>
              </div>

              {/* Tipo de contrato + Status */}
              <div className={grid2}>
                <div>
                  <label className={labelStyle}>Tipo de contrato</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className={selectStyle}
                    style={{
                      cursor: "pointer",
                      backgroundImage: selectBg,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ</option>
                    <option value="ESTAGIO">Estágio</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Status inicial</label>
                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(e) => setIsActive(e.target.value === "active")}
                    className={selectStyle}
                    style={{
                      cursor: "pointer",
                      backgroundImage: selectBg,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "36px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#FF7A00"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {error && (
                <div
                  className="text-[13px] p-3 rounded-[8px]"
                  style={{ background: "var(--badge-red-bg)", color: "var(--error)" }}
                >
                  {error}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}
          >
            <span className="text-[11px] text-muted">
              <span style={{ color: "#DC2626" }}>*</span> Campos obrigatórios
            </span>
            <div className="flex gap-2.5">
              <button onClick={handleClose}
                style={{ height: "38px", padding: "0 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                  color: "var(--text-secondary)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={sending}
                style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px",
                  fontWeight: 600, color: "#FFF", cursor: sending ? "not-allowed" : "pointer",
                  background: sending ? "var(--text-muted)" : "#FF7A00", display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.15s ease", opacity: sending ? 0.8 : 1 }}
                onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "#E06900"; }}
                onMouseLeave={(e) => { if (!sending) e.currentTarget.style.background = "#FF7A00"; }}>
                {sending && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
                {sending ? "Salvando..." : "Salvar"}
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
