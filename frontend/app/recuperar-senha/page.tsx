"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { esqueciSenha } from "@/lib/api";
import { useT } from "@/i18n/useT";

export default function RecuperarSenhaPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputBase =
    "flex-1 h-full bg-transparent text-white text-[16px] outline-none placeholder:text-white/50 caret-accent";

  const wrapperBase =
    "flex items-center w-full h-[58px] rounded-[16px] border transition-all duration-200 px-5 gap-3";
  const wrapperNormal =
    "border-white/15 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.15)] hover:border-white/30 bg-white/[0.07]";
  const wrapperError =
    "border-[#EF4444] focus-within:border-[#EF4444] focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.15)] bg-white/[0.07]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email || !email.includes("@")) errs.email = "Informe um email válido";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const res = await esqueciSenha(email.trim());
      if ((res as Record<string, unknown>).resetLink) {
        setResetLink((res as Record<string, unknown>).resetLink as string);
      }
      setSent(true);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title={
          <div className="flex flex-col">
            <span className="whitespace-nowrap">Não se preocupe!</span>
            <span className="whitespace-nowrap"><span className="text-accent">Vamos</span> resolver isso</span>
          </div>
        }
        highlightWord="Vamos"
        description="Enviamos um link para redefinir sua senha."
        titleSize="text-[48px]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-accent/20 flex items-center justify-center mb-6">
            <MailCheck size={36} strokeWidth={1.5} className="text-accent" />
          </div>

          <h2 className="text-[24px] font-bold text-white tracking-tight mb-2">
            Verifique seu email
          </h2>
          <p className="text-white/70 text-[15px] mb-6">
            Enviamos um link para <strong className="text-white">{email}</strong>
          </p>

          {resetLink && (
            <a
              href={resetLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all mb-6 shadow-[0_8px_24px_rgba(249,115,22,0.30)]"
            >
              <MailCheck size={18} strokeWidth={1.5} />
              Redefinir senha (modo dev)
            </a>
          )}

          <p className="text-sm text-white/65">
            <Link href="/" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Voltar para o login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        <div className="flex flex-col">
          <span className="whitespace-nowrap">Não se preocupe!</span>
          <span className="whitespace-nowrap"><span className="text-accent">Iremos</span> direcionar você</span>
        </div>
      }
      highlightWord="Iremos"
      description="Para redefinir sua senha, informe seu email cadastrado."
      titleSize="text-[48px]"
    >
      <div>
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-white tracking-tight">
            Recuperar senha
          </h1>
          <p className="text-white/75 text-[15px] mt-2">
            Digite seu email para receber o link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-white/90">Email</label>
            <div className={`${wrapperBase} ${errors.email ? wrapperError : wrapperNormal}`}>
              <Mail size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                placeholder="seu@email.com" className={inputBase} autoComplete="email"
              />
            </div>
            {errors.email && <span className="text-xs text-[#EF4444]">{errors.email}</span>}
          </div>

          {errors.form && <span className="text-sm text-[#EF4444] text-center">{errors.form}</span>}

          <button
            type="submit"
            disabled={!email || loading}
            className="flex items-center justify-center gap-2 w-full h-[60px] rounded-[16px] bg-accent text-sm font-semibold text-white hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] shadow-[0_8px_30px_rgba(249,115,22,0.35)]"
          >
            {loading ? (
              <span className="flex items-center gap-2.5"><Loader2 size={20} strokeWidth={2} className="animate-spin" /> Enviando...</span>
            ) : "Enviar link de recuperação"}
          </button>
        </form>

        <p className="text-sm text-center text-white/65 mt-5">
          <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-accent hover:text-accent-hover transition-colors">
            <ArrowLeft size={16} strokeWidth={2} /> Voltar para o login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
