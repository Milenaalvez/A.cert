"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff, CheckCircle, Check, X } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { verificarTokenRedefinir, redefinirSenha } from "@/lib/api";
import { useT } from "@/i18n/useT";

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useT();
  const token = searchParams.get("token") || "";

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isValid = pwChecks.length && pwChecks.upper && pwChecks.lower && pwChecks.symbol && confirm === password;

  const inputBase =
    "flex-1 h-full bg-transparent text-white text-[16px] outline-none placeholder:text-white/50 caret-accent";
  const wrapperBase =
    "flex items-center w-full h-[58px] rounded-[16px] border transition-all duration-200 px-5 gap-3";
  const wrapperNormal =
    "border-white/15 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.15)] hover:border-white/30 bg-white/[0.07]";
  const wrapperError =
    "border-[#EF4444] focus-within:border-[#EF4444] focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.15)] bg-white/[0.07]";

  useEffect(() => {
    if (!token) {
      setTokenError("Link inválido. Solicite uma nova redefinição.");
      setValidating(false);
      return;
    }
    verificarTokenRedefinir(token)
      .then(() => setValidating(false))
      .catch((err) => {
        setTokenError(err instanceof Error ? err.message : "Link inválido ou expirado.");
        setValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwChecks.length || !pwChecks.upper || !pwChecks.lower || !pwChecks.symbol) errs.password = "Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 símbolo";
    if (password !== confirm) errs.confirm = "Senhas não coincidem";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await redefinirSenha(token, password);
      setDone(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <AuthLayout description="Validando seu link..." title={<span>Aguarde...</span>}>
        <div className="flex justify-center py-16">
          <Loader2 size={40} strokeWidth={2} className="animate-spin text-accent" />
        </div>
      </AuthLayout>
    );
  }

  if (tokenError) {
    return (
      <AuthLayout
        title={<span className="text-accent">Link inválido</span>}
        description={tokenError}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          <button
            onClick={() => router.push("/recuperar-senha")}
            className="px-6 py-3 rounded-[14px] bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all"
          >
            Solicitar novo link
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        <div className="flex flex-col">
          <span className="whitespace-nowrap">Redefina sua</span>
          <span className="whitespace-nowrap"><span className="text-accent">Senha</span></span>
        </div>
      }
      highlightWord="Senha"
      description="Escolha uma nova senha para sua conta."
      titleSize="text-[48px]"
    >
      <div>
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-white tracking-tight">
            Nova senha
          </h1>
          <p className="text-white/75 text-[15px] mt-2">
            Mínimo 8 caracteres, maiúscula, minúscula e símbolo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-white/90">Nova senha</label>
            <div className={`${wrapperBase} ${errors.password ? wrapperError : wrapperNormal}`}>
              <Lock size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                placeholder={t("config.nova_senha")}
                className={inputBase}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/40 hover:text-white/70 transition-colors">
                {showPw ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-[#EF4444]">{errors.password}</span>}
            {password.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {[
                  { ok: pwChecks.length, label: "8+ caracteres" },
                  { ok: pwChecks.upper, label: "Maiúscula" },
                  { ok: pwChecks.lower, label: "Minúscula" },
                  { ok: pwChecks.symbol, label: "Símbolo" },
                ].map((item) => (
                  <span key={item.label} className={`flex items-center gap-1 text-[12px] transition-colors ${item.ok ? "text-green-400" : "text-white/40"}`}>
                    {item.ok ? <Check size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2} />}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-white/90">Confirmar senha</label>
            <div className={`${wrapperBase} ${errors.confirm ? wrapperError : wrapperNormal}`}>
              <Lock size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }}
                placeholder="Repita a senha"
                className={inputBase}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/40 hover:text-white/70 transition-colors">
                {showPw ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
            {errors.confirm && <span className="text-xs text-[#EF4444]">{errors.confirm}</span>}
          </div>

          {errors.form && <span className="text-sm text-[#EF4444] text-center">{errors.form}</span>}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="flex items-center justify-center gap-2 w-full h-[60px] rounded-[16px] bg-accent text-sm font-semibold text-white hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] shadow-[0_8px_30px_rgba(249,115,22,0.35)]"
          >
            {loading ? (
              <span className="flex items-center gap-2.5"><Loader2 size={20} strokeWidth={2} className="animate-spin" /> Redefinindo...</span>
            ) : "Redefinir senha"}
          </button>
        </form>
      </div>

      {done && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full bg-surface animate-in fade-in zoom-in-95 duration-200"
              style={{ maxWidth: "460px", borderRadius: "16px", border: "1px solid var(--border-default)", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}>
              <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "rgba(5,150,105,0.12)" }}>
                    <CheckCircle size={20} strokeWidth={1.5} color="#059669" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>Senha atualizada!</h2>
                    <p className="text-[12px]" style={{ color: "var(--text-muted)", marginTop: "2px" }}>Sua senha foi redefinida com sucesso</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: "24px 28px" }}>
                <div className="flex items-center gap-3 p-4 rounded-[10px]" style={{ background: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
                  <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "#FF7A00" }} />
                  <span className="text-[13px] text-secondary">Redirecionando para o login em instantes...</span>
                </div>
              </div>
              <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 28px 20px", borderTop: "1px solid var(--border-light)" }}>
                <button onClick={() => router.push("/")}
                  style={{ height: "38px", padding: "0 28px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: "pointer", background: "#FF7A00" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#E06900"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FF7A00"; }}>
                  Ir para o login
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={
      <AuthLayout description="Carregando..." title={<span>Aguarde...</span>}>
        <div className="flex justify-center py-16">
          <Loader2 size={40} strokeWidth={2} className="animate-spin text-accent" />
        </div>
      </AuthLayout>
    }>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
