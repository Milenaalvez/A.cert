"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatDoc(raw: string | null): string {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d;
}
import {
  FolderOpen,
  X,
  Plus,
  Search,
  User,
  Building2,
  AlertTriangle,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import { useT } from "@/i18n/useT";

const inputBase: React.CSSProperties = {
  height: "42px", borderRadius: "6px", border: "1px solid var(--border-default)",
  fontSize: "14px", color: "var(--text-primary)", background: "var(--bg-app)",
  padding: "0 12px", outline: "none", width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const labelBase: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.5px", marginBottom: "6px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "14px", fontWeight: 700, color: "var(--text-primary)",
  display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
};

function focusIn(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "#FF7A00";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,122,0,0.12)";
}

function focusOut(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "var(--border-default)";
  e.currentTarget.style.boxShadow = "none";
}

function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label style={labelBase}>{label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}</label>
      {children}
      {error && <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "#DC2626" }}><AlertTriangle size={12} strokeWidth={2} />{error}</span>}
    </div>
  );
}

const STEPS = [
  { key: 1, label: "Dados Principais", icon: FileText },
  { key: 2, label: "Imóvel", icon: Building2 },
  { key: 3, label: "Partes Envolvidas", icon: User },
  { key: 4, label: "Revisão", icon: CheckCircle2 },
];

export default function NovoDossieModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdDossierId, setCreatedDossierId] = useState("");

  const router = useRouter();

  // Step 1 — Dados Principais
  const [tipoOperacao, setTipoOperacao] = useState("venda");
  const [prioridade, setPrioridade] = useState("Regular");
  const [observacoes, setObservacoes] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [respSearch, setRespSearch] = useState("");
  const [respResults, setRespResults] = useState<any[]>([]);
  const [searchingResp, setSearchingResp] = useState(false);
  const [selectedResp, setSelectedResp] = useState<any>(null);

  // Step 2 — Imóvel
  const [temMatricula, setTemMatricula] = useState(false);
  const [matricula, setMatricula] = useState("");
  const [inscricao, setInscricao] = useState("");
  const [nomeImovel, setNomeImovel] = useState("");
  const [cartorio, setCartorio] = useState("");
  const [cartorioSearch, setCartorioSearch] = useState("");
  const [cartorioResults, setCartorioResults] = useState<{ name: string }[]>([]);
  const [searchingCartorio, setSearchingCartorio] = useState(false);
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  // Step 3 — Partes Envolvidas
  const [personSearch, setPersonSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const DEFAULT_ROLES = tipoOperacao === 'venda' ? ['proprietario', 'comprador', 'vendedor'] : ['proprietario', 'locador', 'locatario'];
  const [personRole, setPersonRole] = useState(DEFAULT_ROLES[0]);
  const [searchingPerson, setSearchingPerson] = useState(false);
  const [personResults, setPersonResults] = useState<any[]>([]);
  const [showPreCadastro, setShowPreCadastro] = useState(false);
  const [noResultsFound, setNoResultsFound] = useState(false);
  const [preNome, setPreNome] = useState("");
  const [preCpf, setPreCpf] = useState("");
  const [preCpfError, setPreCpfError] = useState("");
  const [cpfStatus, setCpfStatus] = useState<"idle" | "verifying" | "ok" | "notfound">("idle");
  const [preNasc, setPreNasc] = useState("");
  const [preMae, setPreMae] = useState("");
  const [prePai, setPrePai] = useState("");
  const [preEmail, setPreEmail] = useState("");

  // Step 4 — Revisão
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateStep(s: number) {
    const errs: Record<string, string> = {};
    if (s === 1 && !tipoOperacao) errs.tipo = "Obrigatório";
    if (s === 2 && !nomeImovel.trim()) errs.imovel = "Identificação do imóvel é obrigatória";
    if (s === 2 && temMatricula && !matricula.trim()) errs.matricula = "Informe a matrícula";
    if (s === 3 && selectedPeople.length === 0) errs.person = "Adicione pelo menos um proprietário";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    if (step < 4) setStep(step + 1);
  }

  function handlePrev() {
    if (step > 1) setStep(step - 1);
  }

  const handleSearchResp = async () => {
    if (!respSearch.trim()) return;
    setSearchingResp(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch("/api/team/enriched", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json();
      const q = respSearch.toLowerCase();
      setRespResults((data || []).filter((u: any) => u.name.toLowerCase().includes(q)).slice(0, 5));
    } catch { setRespResults([]); }
    finally { setSearchingResp(false); }
  };

  const handleSearchCartorio = async (q: string) => {
    if (q.length < 2 && q.length > 0) { setCartorioResults([]); return; }
    setSearchingCartorio(true);
    try {
      const r = await fetch(`/api/properties/cartorios?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setCartorioResults(data);
    } catch { setCartorioResults([]); }
    finally { setSearchingCartorio(false); }
  };

  const handleCepBlur = async () => {
    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await r.json();
      if (data.erro) {
        setCepError("CEP não encontrado");
      } else {
        setEndereco(data.logradouro || endereco);
        setBairro(data.bairro || bairro);
        setCidade(data.localidade || cidade);
        setEstado(data.uf || estado);
      }
    } catch {
      setCepError("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSearchPerson = async () => {
    if (!personSearch.trim()) return;
    setSearchingPerson(true);
    try {
      const token = localStorage.getItem("acert_token");
      const r = await fetch("/api/people", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json();
      const q = personSearch.toLowerCase();
      const apiResults = (data.people || []).filter(
        (p: any) => p.name.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q))
      ).slice(0, 5);
      // Also search pre-registered people
      const preResults = selectedPeople
        .filter((p: any) => p.preCadastro && (p.name.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q))))
        .map((p: any) => ({ ...p, isPreReg: true }));
      const combined = [...preResults, ...apiResults].slice(0, 5);
      setPersonResults(combined);
      setNoResultsFound(combined.length === 0);
    } catch { setPersonResults([]); setNoResultsFound(true); }
    finally { setSearchingPerson(false); }
  };

  const addPerson = (p: any) => {
    if (selectedPeople.some(x => x.id === p.id)) return;
    setSelectedPeople(prev => [...prev, { ...p, role: personRole }]);
    setPersonResults([]);
    setPersonSearch("");
    setNoResultsFound(false);
    setShowPreCadastro(false);
    setErrors(pr => ({ ...pr, person: "" }));
  };

  function validarCPF(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    if (rem !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    return rem === parseInt(digits[10]);
  }

  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.slice(0, 3) + "." + digits.slice(3);
    if (digits.length > 6) formatted = formatted.slice(0, 7) + "." + formatted.slice(7);
    if (digits.length > 9) formatted = formatted.slice(0, 11) + "-" + formatted.slice(11);
    setPreCpf(formatted);
    if (digits.length === 11) {
      const valid = validarCPF(digits);
      setPreCpfError(valid ? "" : "CPF inválido");
      if (valid) {
        setCpfStatus("verifying");
        fetch(`https://brasilapi.com.br/api/cpf/v1/${digits}`)
          .then(r => {
            if (!r.ok) throw new Error("API error");
            return r.json();
          })
          .then(data => {
            // Accept various response formats
            const nome = data.nome || data.name || data.nome_completo || "";
            const temNome = nome && nome.length > 2;
            const temStatus = (data.status || data.situacao || data.situacao_cadastral || "") === "regular";
            if (temNome || temStatus || data.situacao_cadastral === "REGULAR") {
              setCpfStatus("ok");
              if (temNome) setPreNome(nome);
            } else {
              setCpfStatus("notfound");
            }
          })
          .catch(() => {
            // API failed - CPF is mathematically valid, mark as ok with note
            setCpfStatus("ok");
          });
      } else {
        setCpfStatus("idle");
      }
    } else {
      setPreCpfError("");
      setCpfStatus("idle");
    }
  };

  const addPreCadastro = () => {
    if (!preNome.trim()) return;
    const digits = preCpf.replace(/\D/g, "");
    if (digits.length !== 11 || !validarCPF(digits)) {
      setPreCpfError("CPF inválido");
      return;
    }
    const newPerson = { id: `pre_${Date.now()}`, name: preNome.trim(), cpf: preCpf.trim(), preCadastro: true, role: personRole, birthDate: preNasc, motherName: preMae.trim() || undefined, fatherName: prePai.trim() || undefined, email: preEmail.trim() || undefined };
    setSelectedPeople(prev => [...prev, newPerson]);
    setPreNome("");
    setPreCpf("");
    setPreCpfError("");
    setCpfStatus("idle");
    setPreNasc("");
    setPreMae("");
    setPrePai("");
    setPreEmail("");
    setNoResultsFound(false);
    setShowPreCadastro(false);
    setPersonResults([]);
    setPersonSearch("");
    setErrors(pr => ({ ...pr, person: "" }));
  };

  const removePerson = (id: string) => {
    setSelectedPeople(prev => prev.filter(p => p.id !== id));
  };

  const handleCreate = async () => {
    if (!validateStep(step)) return;
    if (step < 4) { handleNext(); return; }
    setSaving(true);
    setFormError("");
    try {
      const token = localStorage.getItem("acert_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch("/api/dossiers", {
        method: "POST", headers,
        body: JSON.stringify({
          transaction_type: tipoOperacao,
          created_by: responsavel || selectedResp?.name || "Sistema",
          status: "Em andamento",
          priority: prioridade,
          observation: observacoes,
          property: {
            identifier: nomeImovel,
            registration: temMatricula ? matricula : "",
            cartorio: cartorio,
            address: endereco,
            neighborhood: bairro,
            city: cidade,
            state: estado,
            zipCode: cep.replace(/\D/g, ""),
            has_registration: temMatricula,
            inscricao_municipal: temMatricula ? inscricao : "",
          },
          participants: selectedPeople.map(p => ({
            id: p.preCadastro ? undefined : p.id,
            name: p.name,
            cpf: p.cpf || "",
            preCadastro: !!p.preCadastro,
            role: p.role || "proprietario",
            birthDate: p.birthDate,
            motherName: p.motherName,
            fatherName: p.fatherName,
            email: p.email,
          })),
        }),
      });
      const data = await r.json();

      if (!r.ok) throw new Error(data.error || "Erro ao criar dossiê");

      setCreatedDossierId(data.id);
      setCreatedId(data.identifier);
      setShowSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.message || "Erro de conexão com o servidor.");
      setShowError(true);
    } finally { setSaving(false); }
  };

  const operacoes = [
    { value: "venda", label: "Compra e Venda" },
    { value: "locacao", label: "Locação" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/65" style={{ backdropFilter: "blur(2px)" }} onClick={onClose} />
        <div
          className="relative w-full overflow-hidden animate-in fade-in duration-200"
          style={{ maxWidth: "900px", borderRadius: "10px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--badge-orange-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FolderOpen size={20} strokeWidth={1.5} color="#FF7A00" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>Novo Dossiê</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Preencha os dados para abrir um novo dossiê</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", transition: "all 0.15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Step Indicator */}
          <div style={{ padding: "20px 28px 0", display: "flex", alignItems: "center", gap: 0 }}>
            {STEPS.map((s, i) => {
              const active = step >= s.key;
              const current = step === s.key;
              const Icon = s.icon;
              return (
                <div key={s.key} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: active ? (current ? "#FF7A00" : "#FF7A00") : "var(--bg-muted)",
                      color: active ? "#FFF" : "var(--text-muted)",
                      fontSize: 13, fontWeight: 700,
                      border: current ? "3px solid rgba(255,122,0,0.3)" : "3px solid transparent",
                      transition: "all 0.3s ease",
                    }}>
                      {active && s.key < step ? <Check size={16} strokeWidth={2.5} /> : <Icon size={15} strokeWidth={2} />}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: current ? 600 : 500, color: current ? "#FF7A00" : active ? "var(--text-primary)" : "var(--text-muted)", textAlign: "center", maxWidth: 80 }}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, borderRadius: 1, background: step > s.key ? "#FF7A00" : "var(--border-default)", marginBottom: 20, transition: "background 0.3s ease" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div style={{ padding: "28px", maxHeight: "calc(90vh - 180px)", overflowY: "auto" }}>
            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 20, borderRadius: 6, fontSize: 13, fontWeight: 500, background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
                <AlertTriangle size={16} strokeWidth={1.5} /><span>{formError}</span>
              </div>
            )}

            {/* Step 1: Dados Principais */}
            {step === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Tipo de operação" required error={errors.tipo}>
                  <select value={tipoOperacao} onChange={(e) => { setTipoOperacao(e.target.value); setErrors(p => ({ ...p, tipo: "" })); }}
                    style={{ ...inputBase, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
                    onFocus={focusIn} onBlur={focusOut}>
                    {operacoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Prioridade">
                  <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}
                    style={{ ...inputBase, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
                    onFocus={focusIn} onBlur={focusOut}>
                    {["Baixa", "Normal", "Alta", "Urgente"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label={t("dossiers.columns.responsible")}>
                  {!selectedResp ? (
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                          <input type="text" placeholder="Buscar corretor responsável..." value={respSearch} onChange={(e) => setRespSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchResp()}
                            style={{ ...inputBase, paddingLeft: 36 }} onFocus={focusIn} onBlur={focusOut} />
                        </div>
                        <button onClick={handleSearchResp} disabled={searchingResp || !respSearch.trim()}
                          style={{ height: 42, padding: "0 16px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, opacity: searchingResp || !respSearch.trim() ? 0.5 : 1 }}>
                          {searchingResp ? "..." : "Buscar"}
                        </button>
                      </div>
                      {respResults.length > 0 && (
                        <div style={{ marginTop: 4, borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--bg-surface)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          {respResults.map((u: any) => (
                            <button key={u.id} type="button"
                              onClick={() => { setSelectedResp(u); setRespResults([]); setRespSearch(""); setResponsavel(u.name); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, textAlign: "left", borderBottom: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                  {u.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span>{u.name}</span>
                                  {u.department_name && <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>{u.department_name}</span>}
                                </div>
                              </div>
                              {u.registration_number && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.registration_number}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 42, padding: "0 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                          {selectedResp.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{selectedResp.name}</span>
                          {selectedResp.department_name && <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>{selectedResp.department_name}</span>}
                        </div>
                      </div>
                      <button onClick={() => { setSelectedResp(null); setResponsavel(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}>
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </Field>
                <div />
                <Field label="Observações" error="">
                  <textarea style={{ ...inputBase, height: "100px", paddingTop: "10px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} placeholder="Observações sobre o dossiê (opcional)" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={500} onFocus={focusIn} onBlur={focusOut} />
                </Field>
              </div>
            )}

            {/* Step 2: Imóvel */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={{ gridColumn: "span 3" }}>
                    <Field label="Identificação do Imóvel" required error={errors.imovel}>
                      <input type="text" style={inputBase} placeholder="Ex.: APT-101, Edifício Central" value={nomeImovel} onChange={(e) => { setNomeImovel(e.target.value); setErrors(p => ({ ...p, imovel: "" })); }} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: temMatricula ? 16 : 0, padding: "12px 16px", borderRadius: 8, border: `2px solid ${temMatricula ? "#059669" : "var(--border-default)"}`, background: temMatricula ? "rgba(5,150,105,0.06)" : "var(--bg-subtle)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
                        <button type="button" onClick={() => setTemMatricula(!temMatricula)}
                          style={{ width: 20, height: 20, borderRadius: 4, border: temMatricula ? "2px solid #059669" : "2px solid var(--border-default)", background: temMatricula ? "#059669" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
                          {temMatricula && <Check size={12} strokeWidth={3} color="#FFF" />}
                        </button>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>O imóvel possui matrícula?</span>
                          <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Se marcado, serão geradas as certidões de Ônus (ONR), Matrícula e Ficha Cadastral</span>
                        </div>
                      </label>
                    </div>
                    {temMatricula && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
                        <Field label="Nº da Matrícula" required error={errors.matricula}>
                          <input type="text" style={inputBase} placeholder="Nº da matrícula do imóvel" value={matricula} onChange={(e) => { setMatricula(e.target.value); setErrors(p => ({ ...p, matricula: "" })); }} onFocus={focusIn} onBlur={focusOut} />
                        </Field>
                        <Field label="Inscrição Municipal">
                          <input type="text" style={inputBase} placeholder="Inscrição IPTU" value={inscricao} onChange={(e) => setInscricao(e.target.value)} onFocus={focusIn} onBlur={focusOut} />
                        </Field>
                        <Field label="Cartório">
                          <div style={{ position: "relative" }}>
                            <input type="text" style={inputBase} placeholder="Digite para buscar cartório..." value={cartorioSearch || cartorio}
                              onChange={(e) => { setCartorioSearch(e.target.value); setCartorio(""); handleSearchCartorio(e.target.value); }}
                              onFocus={(e) => { focusIn(e); if (!cartorio) handleSearchCartorio(""); }}
                              onBlur={(e) => { setTimeout(() => setCartorioResults([]), 200); focusOut(e); }} />
                            {searchingCartorio && (
                              <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                                <div style={{ width: 14, height: 14, border: "2px solid var(--border-default)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                              </div>
                            )}
                            {cartorioResults.length > 0 && (
                              <div style={{ marginTop: 4, borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--bg-surface)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", position: "absolute", left: 0, right: 0, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                                {cartorioResults.map((c, i) => (
                                  <button key={i} type="button"
                                    onClick={() => { setCartorio(c.name); setCartorioSearch(""); setCartorioResults([]); }}
                                    style={{ width: "100%", padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, textAlign: "left", borderBottom: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                    {c.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="CEP">
                    <input type="text" style={{ ...inputBase, borderColor: cepError ? "#DC2626" : cepLoading ? "#FF7A00" : "var(--border-default)" }} placeholder="00000-000" value={cep}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); let f = v; if (v.length > 5) f = v.slice(0, 5) + "-" + v.slice(5); setCep(f); setCepError(""); }}
                      onBlur={handleCepBlur} onFocus={focusIn} />
                    {cepLoading && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#FF7A00" }}>Buscando CEP...</span>}
                    {cepError && <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: "#DC2626" }}><AlertTriangle size={11} strokeWidth={2} />{cepError}</span>}
                  </Field>
                  <Field label="Bairro"><input type="text" style={inputBase} placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} onFocus={focusIn} onBlur={focusOut} /></Field>
                  <Field label={t("people.fields.city")}><input type="text" style={inputBase} placeholder={t("people.fields.city")} value={cidade} onChange={(e) => setCidade(e.target.value)} onFocus={focusIn} onBlur={focusOut} /></Field>
                  <Field label={t("people.fields.state")}><input type="text" style={inputBase} placeholder="UF" value={estado} onChange={(e) => setEstado(e.target.value)} onFocus={focusIn} onBlur={focusOut} /></Field>
                  <div style={{ gridColumn: "span 2" }}>
                    <Field label={t("people.fields.address")}>
                      <input type="text" style={inputBase} placeholder="Endereço completo" value={endereco} onChange={(e) => setEndereco(e.target.value)} onFocus={focusIn} onBlur={focusOut} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Partes Envolvidas */}
            {step === 3 && (
               <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={sectionTitle}>
                    <User size={16} strokeWidth={2} color="#059669" />
                    Partes Envolvidas
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, marginTop: -6, lineHeight: 1.4 }}>
                    Adicione as pessoas envolvidas neste dossiê. Pelo menos um <strong>proprietário</strong> é obrigatório.
                  </p>
                </div>
                <Field label="Pessoas envolvidas" required error={errors.person}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Existing selected people */}
                    {selectedPeople.map((p) => {
                      const roleLabel: Record<string, string> = { proprietario: 'Proprietário', comprador: 'Comprador', vendedor: 'Vendedor', locador: 'Locador', locatario: 'Locatário' };
                      return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64, padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: p.preCadastro ? "#D97706" : "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}>{p.name}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                              {p.cpf && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{formatDoc(p.cpf)}</span>}
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#FF7A00", background: "rgba(255,122,0,0.1)", padding: "2px 8px", borderRadius: 4 }}>{roleLabel[p.role] || p.role}</span>
                              {p.preCadastro && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--badge-amber-text)", background: "var(--badge-amber-bg)", padding: "2px 8px", borderRadius: 4 }}>Cadastro pendente</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removePerson(p.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8, flexShrink: 0 }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}>
                          <X size={16} strokeWidth={2} />
                        </button>
                      </div>
                      );
                    })}

                    {/* Search/add more */}
                    {!showPreCadastro ? (
                      <div style={{ position: "relative" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <select value={personRole} onChange={(e) => setPersonRole(e.target.value)}
                            style={{ ...inputBase, height: 42, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px", width: 150, flexShrink: 0 }}>
                            {DEFAULT_ROLES.map(r => <option key={r} value={r}>{r === 'proprietario' ? 'Proprietário' : r === 'comprador' ? 'Comprador' : r === 'vendedor' ? 'Vendedor' : r === 'locador' ? 'Locador' : 'Locatário'}</option>)}
                          </select>
                          <div style={{ position: "relative", flex: 1 }}>
                            <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                            <input type="text" placeholder="Buscar pessoa por nome ou CPF..." value={personSearch}
                              onChange={(e) => { setPersonSearch(e.target.value); setNoResultsFound(false); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSearchPerson()}
                              style={{ ...inputBase, paddingLeft: 36 }} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <button onClick={handleSearchPerson} disabled={searchingPerson || !personSearch.trim()}
                            style={{ height: 42, padding: "0 16px", borderRadius: 6, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: searchingPerson || !personSearch.trim() ? 0.5 : 1, whiteSpace: "nowrap", flexShrink: 0 }}>
                            {searchingPerson ? "..." : "Buscar"}
                          </button>
                          <button onClick={() => { setShowPreCadastro(true); setNoResultsFound(false); }}
                            style={{ height: 42, padding: "0 14px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                            <Plus size={14} strokeWidth={2} />Pré-cadastro
                          </button>
                        </div>
                        {personResults.length > 0 && (
                          <div style={{ marginTop: 4, borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--bg-surface)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", position: "absolute", left: 0, right: 0, zIndex: 10 }}>
                            {personResults.map((p: any) => {
                              const alreadyAdded = selectedPeople.some(x => x.id === p.id);
                              const isPreReg = p.preCadastro || p.isPreReg;
                              return (
                                <button key={p.id} type="button"
                                  onClick={() => !alreadyAdded && addPerson(p)}
                                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", border: "none", background: alreadyAdded ? "var(--bg-subtle)" : isPreReg ? "var(--badge-amber-bg)" : "transparent", cursor: alreadyAdded ? "default" : "pointer", fontSize: 13, textAlign: "left", borderBottom: "1px solid var(--border-light)", color: "var(--text-primary)", opacity: alreadyAdded ? 0.5 : 1 }}
                                  onMouseEnter={(e) => { if (!alreadyAdded) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                                  onMouseLeave={(e) => { if (!alreadyAdded) e.currentTarget.style.background = isPreReg ? "var(--badge-amber-bg)" : "transparent"; }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isPreReg ? "#D97706" : "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                      {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <span>{p.name}</span>
                                      {p.cpf && <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>{formatDoc(p.cpf)}</span>}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {isPreReg && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--badge-amber-text)", background: "var(--badge-amber-bg)", padding: "1px 6px", borderRadius: 4 }}>Pré-cadastro</span>}
                                    {alreadyAdded && <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>Adicionado</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {noResultsFound && personResults.length === 0 && !searchingPerson && personSearch.trim() && (
                          <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 6, background: "var(--bg-subtle)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <AlertTriangle size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Usuário não encontrado.</span>
                            </div>
                            <button onClick={() => { setShowPreCadastro(true); setNoResultsFound(false); }}
                              style={{ height: 30, padding: "0 12px", borderRadius: 5, border: "none", background: "#FF7A00", color: "#FFF", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                              Realizar pré-cadastro →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, padding: "14px", borderRadius: 8, border: "1px solid rgba(217,119,6,0.25)", background: "var(--badge-amber-bg)" }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--badge-amber-text)" }}>Pré-cadastro rápido</span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <input type="text" placeholder="Nome completo *" value={preNome} onChange={(e) => setPreNome(e.target.value)}
                              style={{ ...inputBase, background: "var(--bg-surface)" }} />
                            <div>
                              <div style={{ position: "relative" }}>
                                <input type="text" placeholder="CPF *" value={preCpf} onChange={(e) => handleCpfChange(e.target.value)}
                                  style={{ ...inputBase, background: "var(--bg-surface)", borderColor: preCpfError ? "#DC2626" : cpfStatus === "ok" ? "#059669" : cpfStatus === "notfound" ? "#D97706" : "var(--border-default)", paddingRight: 32 }} />
                                {cpfStatus === "verifying" && (
                                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                                    <div style={{ width: 14, height: 14, border: "2px solid var(--border-default)", borderTopColor: "#FF7A00", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                                  </div>
                                )}
                                {cpfStatus === "ok" && (
                                  <Check size={14} strokeWidth={2.5} color="#059669" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
                                )}
                                {cpfStatus === "notfound" && (
                                  <AlertTriangle size={14} strokeWidth={2} color="#D97706" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
                                )}
                              </div>
                              {preCpfError && <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: "#DC2626" }}><AlertTriangle size={11} strokeWidth={2} />{preCpfError}</span>}
                              {cpfStatus === "notfound" && !preCpfError && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#D97706" }}>CPF não localizado</span>}
                            </div>
                            <input type="date" placeholder="Data de Nascimento" value={preNasc} onChange={(e) => setPreNasc(e.target.value)}
                              style={{ ...inputBase, background: "var(--bg-surface)", color: preNasc ? "var(--text-primary)" : "var(--text-muted)" }} />
                            <input type="email" placeholder={t("people.fields.email")} value={preEmail} onChange={(e) => setPreEmail(e.target.value)}
                              style={{ ...inputBase, background: "var(--bg-surface)" }} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <input type="text" placeholder="Nome da Mãe" value={preMae} onChange={(e) => setPreMae(e.target.value)}
                              style={{ ...inputBase, background: "var(--bg-surface)" }} />
                            <input type="text" placeholder="Nome do Pai (opcional)" value={prePai} onChange={(e) => setPrePai(e.target.value)}
                              style={{ ...inputBase, background: "var(--bg-surface)" }} />
                          </div>
                          <span style={{ fontSize: 10, color: "var(--badge-amber-text-secondary)" }}>A pessoa será marcada como cadastro pendente e precisará ser completada depois.</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={addPreCadastro} disabled={!preNome.trim() || !preCpf.trim() || !!preCpfError || cpfStatus === "verifying"}
                              style={{ height: 32, padding: "0 14px", borderRadius: 5, border: "none", background: "#D97706", color: "#FFF", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: !preNome.trim() || !preCpf.trim() || !!preCpfError || cpfStatus === "verifying" ? 0.5 : 1 }}>Adicionar</button>
                            <button onClick={() => { setShowPreCadastro(false); setPreNome(""); setPreCpf(""); setPreCpfError(""); setCpfStatus("idle"); }}
                              style={{ height: 32, padding: "0 14px", borderRadius: 5, border: "1px solid var(--border-default)", background: "transparent", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>Cancelar</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            )}

            {/* Step 4: Revisão */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={sectionTitle}>
                  <CheckCircle2 size={16} strokeWidth={2} color="#059669" />
                  Revisão do Dossiê
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 8 }}>
                  Confira os dados antes de criar o dossiê.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ padding: "14px", borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Operação</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{tipoOperacao === 'locacao' ? 'Locação' : 'Compra e Venda'}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Prioridade: {prioridade}</div>
                    {selectedResp && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Responsável: {selectedResp.name}</div>}
                  </div>
                  <div style={{ padding: "14px", borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Imóvel</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{nomeImovel || '—'}</div>
                    {temMatricula && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Matrícula: {matricula}</div>}
                    {endereco && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{endereco}</div>}
                  </div>
                </div>

                <div style={{ padding: "14px", borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Partes Envolvidas ({selectedPeople.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selectedPeople.map((p: any) => {
                      const roleLabel: Record<string, string> = { proprietario: 'Proprietário', comprador: 'Comprador', vendedor: 'Vendedor', locador: 'Locador', locatario: 'Locatário' };
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: p.preCadastro ? "#D97706" : "#FF7A00", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                            {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</span>
                          {p.cpf && <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatDoc(p.cpf)}</span>}
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#FF7A00", background: "rgba(255,122,0,0.1)", padding: "1px 7px", borderRadius: 4 }}>{roleLabel[p.role] || p.role}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {observacoes && (
                  <div style={{ padding: "14px", borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Observações</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{observacoes}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderTop: "1px solid var(--border-light)" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ color: "#DC2626" }}>*</span> Campos obrigatórios
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={onClose}
                style={{ height: 40, padding: "0 20px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", background: "transparent", cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                Cancelar
              </button>
              {step > 1 && (
                <button onClick={handlePrev}
                  style={{ height: 40, padding: "0 18px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  <ChevronLeft size={14} strokeWidth={2} />
                  Voltar
                </button>
              )}
              <button onClick={() => handleCreate()} disabled={saving}
                style={{ height: 40, padding: "0 24px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, color: "#FFFFFF", background: saving ? "#E06900" : "#FF7A00", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s ease", opacity: saving ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.background = "#E06900"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,122,0,0.3)"; } }}
                onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.background = "#FF7A00"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; } }}>
                {saving ? (
                  <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFFFFF", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />Salvando...</>
                ) : step === 4 ? (
                  <><Plus size={16} strokeWidth={2.5} />Criar Dossiê</>
                ) : (
                  <>Continuar <ChevronRight size={14} strokeWidth={2} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showSuccess && (
        <SuccessModal identifier={createdId} dossierId={createdDossierId}
          onViewDossier={() => { setShowSuccess(false); onCreated?.(); onClose(); router.push(`/dashboard/dossies/${createdDossierId}`); }}
          onEmitirCertidoes={() => { setShowSuccess(false); onCreated?.(); onClose(); router.push(`/dashboard/dossies/${createdDossierId}?emitir=true&tab=partes`); }}
          onClose={() => { setShowSuccess(false); onCreated?.(); onClose(); }} />
      )}
      {showError && (
        <ErrorModal
          message={errorMsg}
          onRetry={() => { setShowError(false); handleCreate(); }}
          onClose={() => setShowError(false)}
        />
      )}
    </>
  );
}
