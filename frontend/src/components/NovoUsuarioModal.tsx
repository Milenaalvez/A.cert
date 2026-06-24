"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import * as teamApi from "@/services/teamApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NovoUsuarioModal({ open, onClose, onCreated }: Props) {
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      teamApi.departments().then(setDepartments).catch(() => {});
    }
  }, [open]);

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
      await teamApi.create({
        name,
        email,
        registrationNumber: cpf,
        phone,
        role,
        departmentId: departmentId || null,
        positionId: positionId || null,
        weeklyHours,
        contractType,
        hireDate: new Date().toISOString().split("T")[0],
        isActive,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário");
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
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "var(--badge-orange-bg)" }}
              >
                <UserPlus size={20} strokeWidth={1.5} color="#FF7A00" />
              </div>
              <div>
                <h2
                  className="text-[17px] font-bold tracking-tight"
                  style={{ color: "var(--text-primary)", lineHeight: 1.2 }}
                >
                  Novo Usuário
                </h2>
                <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  Cadastre um novo colaborador no sistema
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
              <button
                type="button"
                onClick={onClose}
                className="h-[38px] px-5 rounded-[8px] text-[13px] font-medium text-secondary border border-default transition-colors"
                style={{ background: "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={sending}
                className="h-[38px] px-7 rounded-[8px] text-[13px] font-semibold text-white flex items-center gap-1.5 transition-colors"
                style={{
                  border: "none",
                  cursor: sending ? "not-allowed" : "pointer",
                  background: sending ? "var(--text-muted)" : "#FF7A00",
                  opacity: sending ? 0.8 : 1,
                }}
                onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "#E06900"; }}
                onMouseLeave={(e) => { if (!sending) e.currentTarget.style.background = "#FF7A00"; }}
              >
                {sending && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
                {sending ? "Criando..." : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
