"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ShieldAlert, AlertTriangle, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ConfirmarEmailClient() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "ja_confirmado" | "invalido" | "erro">("loading");
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const t = parts[parts.length - 1];
    if (t && t !== "_") setToken(t);
  }, []);

  async function handleReenviar() {
    if (!email || reenviando) return;
    setReenviando(true);
    try {
      const r = await fetch("/api/auth/reenviar-confirmacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.ok) setReenviado(true);
    } catch {} finally {
      setReenviando(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/confirmar-status/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") setStatus("ok");
        else if (data.status === "ja_confirmado") setStatus("ja_confirmado");
        else setStatus("invalido");
        if (data.status === "ok" || data.status === "ja_confirmado") {
          setTimeout(() => { window.location.href = "/login"; }, 3000);
        }
      })
      .catch(() => setStatus("erro"));
  }, [token]);

  const isSuccess = status === "ok" || status === "ja_confirmado";

  return (
    <AuthLayout
      title={isSuccess ? "Email|confirmado!" : status === "invalido" ? "Link|inválido" : status === "erro" ? "Erro" : "Confirmando|seu email"}
      highlightWord={isSuccess ? "confirmado" : status === "invalido" ? "inválido" : "Confirmando"}
      description={isSuccess ? "Sua conta foi ativada com sucesso." : status === "invalido" ? "O link de confirmação é inválido ou já expirou." : status === "erro" ? "Não foi possível confirmar seu email." : "Estamos verificando seu link de confirmação."}
      badge={status === "loading" ? "VERIFICANDO" : isSuccess ? "ATIVADO" : "FALHA"}
    >
      <div style={{ textAlign: "center" }}>
        {status === "loading" && (
          <>
            <Loader2 size={44} style={{ color: "#F97316", animation: "spin 1s linear infinite", margin: "8px 0 24px 0" }} />
            <p style={{ color: "#E5E7EB", fontSize: 15, lineHeight: 1.6 }}>Aguarde um momento enquanto confirmamos seu email...</p>
          </>
        )}

        {status === "ok" && (
          <>
            <CheckCircle2 size={44} style={{ color: "#10B981", margin: "8px 0 24px 0" }} />
            <p style={{ color: "#E5E7EB", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Seu email foi confirmado. Você já pode acessar a plataforma.
            </p>
            <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.5, marginBottom: 28 }}>
              Redirecionando para o login em instantes...
            </p>
            <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 32px", background: "#F97316", color: "#FFF", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Ir para o login
            </a>
          </>
        )}

        {status === "ja_confirmado" && (
          <>
            <AlertTriangle size={44} style={{ color: "#F59E0B", margin: "8px 0 24px 0" }} />
            <p style={{ color: "#E5E7EB", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Este email já foi confirmado anteriormente.
            </p>
            <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 32px", background: "#F97316", color: "#FFF", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Ir para o login
            </a>
          </>
        )}

        {status === "invalido" && (
          <>
            <ShieldAlert size={44} style={{ color: "#EF4444", margin: "8px 0 24px 0" }} />
            <p style={{ color: "#E5E7EB", fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}>
              O link de confirmação é inválido ou já foi utilizado.
            </p>
            {email && (
              <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>
                {email}
              </p>
            )}
            {reenviado ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <CheckCircle2 size={28} style={{ color: "#10B981" }} />
                <p style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>Novo link enviado!</p>
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.5 }}>Verifique sua caixa de entrada.</p>
              </div>
            ) : (
              <button
                onClick={handleReenviar}
                disabled={!email || reenviando}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 32px", background: "#F97316", color: "#FFF", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: reenviando ? "not-allowed" : "pointer", border: "none", opacity: reenviando ? 0.7 : 1 }}
              >
                {reenviando ? (
                  <><Loader2 size={16} className="animate-spin" /> Reenviando...</>
                ) : (
                  <><Mail size={16} /> Solicitar novo link</>
                )}
              </button>
            )}
          </>
        )}

        {status === "erro" && (
          <>
            <ShieldAlert size={44} style={{ color: "#EF4444", margin: "8px 0 24px 0" }} />
            <p style={{ color: "#E5E7EB", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              Ocorreu um erro ao verificar seu email.
            </p>
            <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 32px", background: "#F97316", color: "#FFF", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Voltar ao login
            </a>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AuthLayout>
  );
}
