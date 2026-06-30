"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Search,
  FileText,
  Shield,
  MailCheck,
  X,
} from "lucide-react";
import AuthLayout from "./AuthLayout";
import LoginTransition from "./LoginTransition";
import Link from "next/link";
import { register } from "@/lib/api";
import Captcha from "./Captcha";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] font-semibold text-white/90">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-[#EF4444] mt-0.5">{error}</span>}
    </div>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [confirmationLink, setConfirmationLink] = useState("");
  const [timer, setTimer] = useState(60);
  const [reenviando, setReenviando] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [privacyViewed, setPrivacyViewed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState("");

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isValid =
    nome.trim().length >= 2 &&
    email.includes("@") &&
    passwordChecks.length &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.symbol &&
    confirm === password &&
    acceptTerms &&
    !!captchaToken;

  useEffect(() => {
    if (!registered) return;
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [registered, timer]);

  useEffect(() => {
    const existing = document.querySelector("script[src*='turnstile']");
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nome || nome.trim().length < 2) errs.nome = "Informe seu nome completo";
    if (!email || !email.includes("@")) errs.email = "Informe um email válido";
    if (!password || !passwordChecks.length || !passwordChecks.upper || !passwordChecks.lower || !passwordChecks.symbol) errs.password = "Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 símbolo";
    if (password !== confirm) errs.confirm = "Senhas não conferem";
    if (!acceptTerms) errs.terms = "Aceite os termos para continuar";
    if (!captchaToken) errs.captcha = "Resolva o CAPTCHA";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const res = await register(nome.trim(), email.trim(), password, captchaToken);
      setRegisteredEmail(email.trim());
      if ((res as Record<string, unknown>).confirmationLink) {
        setConfirmationLink((res as Record<string, unknown>).confirmationLink as string);
      }
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
        setRegistered(true);
      }, 1800);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Erro inesperado' });
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviar() {
    setReenviando(true);
    try {
      const { reenviarConfirmacao } = await import('@/lib/api');
      await reenviarConfirmacao(registeredEmail);
      setTimer(60);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Erro ao reenviar' });
    } finally {
      setReenviando(false);
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

  if (showTransition) {
    return <LoginTransition />;
  }

  if (registered) {
    return (
      <AuthLayout
        title={
          <div className="flex flex-col">
            <span className="whitespace-nowrap">Quase lá!</span>
            <span className="whitespace-nowrap"><span className="text-accent">Confirme</span> seu email</span>
          </div>
        }
        highlightWord="Confirme"
        description="Enviamos um link de confirmação para seu email."
        titleSize="text-[48px]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-accent/20 flex items-center justify-center mb-6">
            <MailCheck size={36} strokeWidth={1.5} className="text-accent" />
          </div>

          <h2 className="text-[24px] font-bold text-white tracking-tight mb-2">
            Verifique seu email
          </h2>
          <p className="text-white/70 text-[15px] mb-1">
            Enviamos um link para
          </p>
          <p className="text-white font-semibold text-[15px] mb-8">
            {registeredEmail}
          </p>

          {confirmationLink && (
            <a
              href={confirmationLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all mb-6 shadow-[0_8px_24px_rgba(249,115,22,0.30)]"
            >
              <MailCheck size={18} strokeWidth={1.5} />
              Confirmar email (modo dev)
            </a>
          )}

          <div className="flex items-center gap-2 text-white/50 text-sm mb-8">
            <Loader2 size={16} className="animate-spin" />
            <span>Aguardando confirmação... {timer > 0 ? `(${timer}s)` : ""}</span>
          </div>

          {timer <= 0 && (
            <button
              onClick={handleReenviar}
              disabled={reenviando}
              className="text-accent hover:text-accent-hover font-semibold text-sm transition-colors underline underline-offset-2 disabled:opacity-50"
            >
              {reenviando ? "Reenviando..." : "Não chegou? Reenviar email"}
            </button>
          )}

          {errors.form && (
            <span className="text-sm text-[#EF4444] text-center mt-4">
              {errors.form}
            </span>
          )}

          <p className="text-sm text-center text-white/65 mt-8">
            Já confirmou?{" "}
            <Link href="/" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Fazer login
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
          <span className="whitespace-nowrap">Crie sua conta e</span>
          <span className="whitespace-nowrap"><span className="text-accent">simplifique</span> seu processo</span>
        </div>
      }
      highlightWord="simplifique"
      description="Emita certidões, reúna documentos e gere dossiês completos sem trabalho manual."
      titleSize="text-[48px]"
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
            Criar conta
          </h1>
          <p className="text-white/75 text-[15px] mt-2">
            Preencha os dados para começar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Nome completo" error={errors.nome}>
            <div className={`${wrapperBase} ${errors.nome ? wrapperError : wrapperNormal}`}>
              <User size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type="text" value={nome}
                onChange={(e) => { setNome(e.target.value); setErrors((p) => ({ ...p, nome: "" })); }}
                placeholder="Seu nome completo" className={inputBase} autoComplete="name"
              />
            </div>
          </Field>

          <Field label="Email" error={errors.email}>
            <div className={`${wrapperBase} ${errors.email ? wrapperError : wrapperNormal}`}>
              <Mail size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                placeholder="seu@email.com" className={inputBase} autoComplete="email"
              />
            </div>
          </Field>

          <Field label="Senha" error={errors.password}>
            <div className={`${wrapperBase} ${errors.password ? wrapperError : wrapperNormal}`}>
              <Lock size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                placeholder="Crie uma senha" className={inputBase} autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/60 hover:text-white/80 transition-colors shrink-0">
                {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {[
                  { ok: passwordChecks.length, label: "8+ caracteres" },
                  { ok: passwordChecks.upper, label: "Maiúscula" },
                  { ok: passwordChecks.lower, label: "Minúscula" },
                  { ok: passwordChecks.symbol, label: "Símbolo" },
                ].map((item) => (
                  <span key={item.label} className={`flex items-center gap-1 text-[12px] transition-colors ${item.ok ? "text-green-400" : "text-white/40"}`}>
                    {item.ok ? <Check size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2} />}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Confirmar senha" error={errors.confirm}>
            <div className={`${wrapperBase} ${errors.confirm ? wrapperError : wrapperNormal}`}>
              <Lock size={20} strokeWidth={1.5} className="text-white/60 shrink-0" />
              <input
                type={showConfirm ? "text" : "password"} value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }}
                placeholder="Repita a senha" className={inputBase} autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-white/60 hover:text-white/80 transition-colors shrink-0">
                {showConfirm ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </Field>

          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => {
                  if (!termsViewed) { setShowTermsModal(true); return; }
                  if (!privacyViewed) { setShowPrivacyModal(true); return; }
                  setAcceptTerms(!acceptTerms);
                  setErrors((p) => ({ ...p, terms: "" }));
                }}
                className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-all duration-200 shrink-0 ${acceptTerms ? "bg-accent border-accent" : "border-white/20 bg-white/5 group-hover:border-white/40"} ${errors.terms ? "border-[#EF4444]" : ""}`}
              >
                {acceptTerms && <Check size={12} strokeWidth={3} className="text-white" />}
              </button>
              <span className="text-[14px] text-white/70 leading-relaxed select-none">
                Li e concordo com os{" "}
                <button type="button" onClick={() => setShowTermsModal(true)} className="font-semibold text-accent hover:text-accent-hover transition-colors underline underline-offset-2">Termos de Uso</button>{" "}e{" "}
                <button type="button" onClick={() => setShowPrivacyModal(true)} className="font-semibold text-accent hover:text-accent-hover transition-colors underline underline-offset-2">Política de Privacidade</button>
              </span>
            </label>
            {errors.terms && <span className="text-xs text-[#EF4444] mt-1.5 block">{errors.terms}</span>}

            {showTermsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                <div className="relative max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: "520px", width: "100%", padding: "40px", borderRadius: "32px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
                  <h2 className="text-2xl font-bold text-white mb-1">Termos de Uso</h2>
                  <p className="text-white/50 text-sm mb-6">Leia atentamente antes de aceitar</p>
                  <div className="space-y-5 text-white/80 text-[14px] leading-relaxed mb-8">
                    <section><h3 className="text-white font-semibold text-base mb-1">1. Aceitação dos Termos</h3><p>Ao acessar e utilizar a plataforma A.CERT, você declara estar de acordo com estes Termos de Uso.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">2. Serviços</h3><p>A A.CERT permite consulta, emissão e gestão de certidões imobiliárias e geração de dossiês documentais.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">3. Cadastro</h3><p>Você é responsável pela veracidade dos dados fornecidos e pela confidencialidade de suas credenciais.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">4. Uso Permitido</h3><p>A plataforma deve ser utilizada apenas para fins legais. É proibido compartilhar credenciais ou usar o serviço para atividades ilícitas.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">5. Privacidade</h3><p>O tratamento de dados segue nossa Política de Privacidade. Consulte o documento específico.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">6. Propriedade Intelectual</h3><p>Todos os direitos da plataforma pertencem à A.CERT.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">7. Limitação de Responsabilidade</h3><p>A A.CERT não se responsabiliza por interrupções temporárias ou informações de fontes terceiras.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">8. Alterações</h3><p>Os Termos podem ser alterados; mudanças serão comunicadas aos usuários cadastrados.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">9. Contato</h3><p>Dúvidas podem ser encaminhadas ao suporte da plataforma.</p></section>
                  </div>
                  <button type="button" onClick={() => { setTermsViewed(true); setShowTermsModal(false); setErrors((p) => ({ ...p, terms: "" })); if (!privacyViewed) { setTimeout(() => setShowPrivacyModal(true), 300); } else { setAcceptTerms(true); } }} className="w-full h-[52px] rounded-[14px] bg-accent font-semibold text-white hover:bg-accent-hover transition-all">Li e Aceito os Termos de Uso</button>
                </div>
              </div>
            )}

            {showPrivacyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacyModal(false)}>
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                <div className="relative max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: "520px", width: "100%", padding: "40px", borderRadius: "32px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
                  <h2 className="text-2xl font-bold text-white mb-1">Política de Privacidade</h2>
                  <p className="text-white/50 text-sm mb-6">Leia atentamente antes de aceitar</p>
                  <div className="space-y-5 text-white/80 text-[14px] leading-relaxed mb-8">
                    <section><h3 className="text-white font-semibold text-base mb-1">1. Introdução</h3><p>A A.CERT valoriza sua privacidade. Esta política descreve como tratamos seus dados.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">2. Dados Coletados</h3><p>Coletamos nome, e-mail, CPF, dados de acesso e informações sobre certidões emitidas.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">3. Finalidade</h3><p>Seus dados são usados para fornecer os serviços, processar emissões, cumprir obrigações legais e garantir a segurança.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">4. Compartilhamento</h3><p>Compartilhamos dados apenas quando necessário para o serviço (inscrição do imóvel, órgãos públicos) ou por obrigação legal.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">5. Segurança</h3><p>Adotamos criptografia e medidas técnicas para proteger seus dados contra acesso não autorizado.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">6. Seus Direitos (LGPD)</h3><p>Você pode acessar, corrigir, excluir ou solicitar portabilidade dos seus dados a qualquer momento.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">7. Retenção</h3><p>Mantemos seus dados enquanto sua conta estiver ativa ou conforme exigido por lei.</p></section>
                    <section><h3 className="text-white font-semibold text-base mb-1">8. Contato</h3><p>Para exercer seus direitos, entre em contato pelo suporte da plataforma.</p></section>
                  </div>
                  <button type="button" onClick={() => { setPrivacyViewed(true); setShowPrivacyModal(false); setErrors((p) => ({ ...p, terms: "" })); setAcceptTerms(true); }} className="w-full h-[52px] rounded-[14px] bg-accent font-semibold text-white hover:bg-accent-hover transition-all">Li e Aceito a Política de Privacidade</button>
                </div>
              </div>
            )}
          </div>

          {acceptTerms && (
            <>
              <Captcha onSolved={(t) => { setCaptchaToken(t); setErrors((p) => ({ ...p, captcha: "" })); }} />
              {errors.captcha && <span className="text-xs text-[#EF4444]">{errors.captcha}</span>}
            </>
          )}

          {errors.form && (
            <span className="text-sm text-[#EF4444] text-center">{errors.form}</span>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="flex items-center justify-center gap-2 w-full h-[52px] rounded-[14px] bg-accent text-sm font-semibold text-white hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] shadow-[0_8px_24px_rgba(249,115,22,0.30)]"
          >
            {loading ? (
              <span className="flex items-center gap-2.5"><Loader2 size={18} strokeWidth={2} className="animate-spin" /> Criando conta...</span>
            ) : "Criar conta"}
          </button>
        </form>

        <p className="text-sm text-center text-white/65 mt-5">
          Já tem uma conta?{" "}
          <Link href="/" className="font-semibold text-accent hover:text-accent-hover transition-colors">Fazer login</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
