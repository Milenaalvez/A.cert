"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface Props {
  onSolved: (token: string) => void;
}

const SITE_KEY = "0x4AAAAAADtAu89ohLJSTfO-ZetilqIAM_k";

declare global {
  interface Window {
    turnstileCallback: (token: string) => void;
  }
}

export default function Captcha({ onSolved }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "solved">("loading");
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    (window as any).turnstileCallback = async (token: string) => {
      setStatus("loading");
      try {
        const r = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await r.json();
        if (data.valid) {
          setStatus("solved");
          onSolved(token);
        }
      } catch {}
    };

    const existingScript = document.querySelector("script[src*='turnstile']");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      delete (window as any).turnstileCallback;
    };
  }, []);

  return (
    <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: status === "solved" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-semibold text-white/80" style={{ letterSpacing: "0.3px" }}>
          {status === "solved" ? "✅ Verificação concluída" : "🧩 Verificação de segurança"}
        </span>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center" style={{ height: "65px" }}>
          <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-white/40" />
        </div>
      )}

      {status === "solved" ? (
        <div className="flex items-center gap-2" style={{ padding: "8px 0" }}>
          <Check size={18} strokeWidth={2} className="text-green-400" />
          <span className="text-[13px] text-green-400 font-medium">Verificação concluída</span>
        </div>
      ) : (
        <div
          className="cf-turnstile"
          data-sitekey={SITE_KEY}
          data-callback="turnstileCallback"
          data-theme="dark"
          style={{ minHeight: "65px" }}
        />
      )}

      <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
        Protegido por Cloudflare Turnstile. Seus dados estão seguros.
      </p>
    </div>
  );
}
