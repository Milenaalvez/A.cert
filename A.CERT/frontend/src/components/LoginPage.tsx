"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Search, FileText, Shield } from "lucide-react";
import AuthLayout from "./AuthLayout";
import LoginTransition from "./LoginTransition";
import Link from "next/link";
import { login, salvarToken } from "@/lib/api";
import { useT } from "@/i18n/useT";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transition, setTransition] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('acert_token') : null;
    if (token && window.location.pathname === '/') {
      router.replace('/dashboard');
    } else {
      setCheckingToken(false);
    }
  }, [router]);

  if (transition) {
    return <LoginTransition />;
  }

  if (checkingToken) {
    return null;
  }

  const isValid = email.length > 0 && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Informe seu email";
    if (!password) errs.password = "Informe sua senha";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const { token } = await login(email.trim(), password);
      salvarToken(token);
      setTransition(true);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Erro inesperado' });
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "flex-1 h-full bg-transparent text-white text-[16px] outline-none placeholder:text-white/50 caret-accent";

  const wrapperBase =
    "flex items-center w-full h-[58px] rounded-[16px] border transition-all duration-200 px-5 gap-3";
  const wrapperNormal =
    "border-white/15 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.15)] hover:border-white/30 bg-white/[0.07]";
  const wrapperError =
    "border-[#EF4444] focus-within:border-[#EF4444] focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.15)] bg-white/[0.07]";

  return (
    <AuthLayout
      title={
        <div className="flex flex-col">
          <span className="whitespace-nowrap">Emissão <span className="text-accent">inteligente</span></span>
          <span className="whitespace-nowrap">de certidões</span>
          <span className="whitespace-nowrap">imobiliárias</span>
        </div>
      }
      highlightWord="inteligente"
      titleSize="text-[48px]"
      description="Automatize consultas, acompanhe emissões e gere dossiês completos em poucos minutos."
      tagline={
        <div className="flex items-start gap-12">
          <div className="flex flex-col gap-3 group cursor-default">
            <Search size={32} strokeWidth={1.5} className="text-accent" />
            <div className="flex flex-col gap-1">
              <span className="text-white text-[15px] font-semibold">Consulta Automatizada</span>
              <span className="text-white/60 text-[13px] leading-relaxed max-w-[180px]">
                Consulte múltiplas fontes sem processos manuais.
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 group cursor-default">
            <FileText size={32} strokeWidth={1.5} className="text-accent" />
            <div className="flex flex-col gap-1">
              <span className="text-white text-[15px] font-semibold">Dossiê Completo</span>
              <span className="text-white/60 text-[13px] leading-relaxed max-w-[180px]">
                Reúna certidões e documentos em um único processo.
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 group cursor-default">
            <Shield size={32} strokeWidth={1.5} className="text-accent" />
            <div className="flex flex-col gap-1">
              <span className="text-white text-[15px] font-semibold">Segurança Jurídica</span>
              <span className="text-white/60 text-[13px] leading-relaxed max-w-[180px]">
                Mais confiança para análises e negociações imobiliárias.
              </span>
            </div>
          </div>
        </div>
      }
    >
      <div>
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-white tracking-tight">
            Bem-vindo de volta!
          </h1>
          <p className="text-white/75 text-[15px] mt-2">
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-white/90">
              Email
            </label>
            <div className={`${wrapperBase} ${errors.email ? wrapperError : wrapperNormal}`}>
              <Mail
                size={20}
                strokeWidth={1.5}
                className="text-white/60 shrink-0"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="seu@email.com"
                className={inputBase}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-[#EF4444] mt-1">
                {errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-white/90">
              Senha
            </label>
            <div className={`${wrapperBase} ${errors.password ? wrapperError : wrapperNormal}`}>
              <Lock
                size={20}
                strokeWidth={1.5}
                className="text-white/60 shrink-0"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="••••••••"
                className={inputBase}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/60 hover:text-white/80 transition-colors shrink-0"
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={1.5} />
                ) : (
                  <Eye size={20} strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-[#EF4444] mt-1">
                {errors.password}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center transition-all duration-200 ${
                  remember
                    ? "bg-accent border-accent"
                    : "border-white/20 bg-white/5 group-hover:border-white/40"
                }`}
              >
                {remember && (
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-2.5 h-2.5"
                  >
                    <path d="M2.5 6L5 8.5L9.5 3.5" />
                  </svg>
                )}
              </button>
              <span className="text-[14px] text-white/70 font-medium select-none">
                Lembrar acesso
              </span>
            </label>
            <Link
              href="/recuperar-senha"
              className="text-[14px] font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          {errors.form && (
            <span className="text-sm text-[#EF4444] text-center">
              {errors.form}
            </span>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="flex items-center justify-center gap-2 w-full h-[60px] rounded-[16px] bg-accent text-sm font-semibold text-white hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] shadow-[0_8px_30px_rgba(249,115,22,0.35)]"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <Loader2 size={20} strokeWidth={2} className="animate-spin" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-sm text-center text-white/65 mt-6">
          Ainda não tem uma conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
