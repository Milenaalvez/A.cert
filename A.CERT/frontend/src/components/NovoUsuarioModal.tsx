"use client";

import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
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
      await teamApi.create({ name, email, registrationNumber: cpf, phone, role, departmentId: departmentId || null, positionId: positionId || null, weeklyHours, contractType, hireDate: new Date().toISOString().split("T")[0], isActive });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-app)", padding: "0 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", width: 560, maxHeight: "90vh", overflow: "auto", background: "var(--bg-app)", borderRadius: 16, border: "1px solid var(--border-default)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border-default)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,122,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserPlus size={18} color="#FF7A00" /></div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Novo Usuário</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Nome completo *</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nome do colaborador" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>CPF</label>
              <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(61) 99999-0000" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Cargo</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
                <option value="EMPLOYEE">Colaborador</option>
                <option value="RH">RH</option>
                <option value="ADMIN">Administrador</option>
                <option value="DEVELOPER">Desenvolvedor</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Departamento</label>
              <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} style={inputStyle}>
                <option value="">Selecionar...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Cargo/Posição</label>
              <select value={positionId} onChange={e => setPositionId(e.target.value)} style={inputStyle}>
                <option value="">Selecionar...</option>
                {positions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Carga horária semanal</label>
              <select value={weeklyHours} onChange={e => setWeeklyHours(Number(e.target.value))} style={inputStyle}>
                <option value={40}>40h semanais</option>
                <option value={44}>44h semanais</option>
                <option value={30}>30h semanais</option>
                <option value={20}>20h semanais</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Tipo de contrato</label>
              <select value={contractType} onChange={e => setContractType(e.target.value)} style={inputStyle}>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="ESTAGIO">Estágio</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status inicial</label>
              <select value={isActive ? "active" : "inactive"} onChange={e => setIsActive(e.target.value === "active")} style={inputStyle}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={sending} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: sending ? "rgba(255,122,0,0.5)" : "#FF7A00", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>{sending ? "Criando..." : "Criar Usuário"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 };
