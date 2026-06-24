"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Check, Loader2 } from "lucide-react";

interface Props {
  onSolved: (verifiedToken: string) => void;
}

export default function Captcha({ onSolved }: Props) {
  const [svg, setSvg] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "verifying" | "solved" | "error">("loading");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const generate = useCallback(async () => {
    setStatus("loading");
    setAnswer("");
    setError("");
    try {
      const r = await fetch("/api/captcha/generate", { method: "POST" });
      const data = await r.json();
      setSvg(data.svg);
      setToken(data.token);
      setStatus("ready");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setError("Erro ao carregar CAPTCHA");
      setStatus("error");
    }
  }, []);

  useEffect(() => { generate(); }, [generate]);

  async function handleVerify() {
    if (!answer.trim()) return;
    setStatus("verifying");
    setError("");
    try {
      const r = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answer: answer.trim() }),
      });
      const data = await r.json();
      if (data.valid) {
        setStatus("solved");
        onSolved(data.verifiedToken);
      } else {
        setError(data.error || "Resposta incorreta");
        setStatus("error");
        generate();
      }
    } catch {
      setError("Erro ao verificar");
      setStatus("error");
      generate();
    }
  }

  return (
    <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: status === "solved" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-semibold text-white/80" style={{ letterSpacing: "0.3px" }}>
          {status === "solved" ? "✅ CAPTCHA resolvido" : "🧩 Não sou robô"}
        </span>
        {status !== "solved" && (
          <button
            type="button"
            onClick={generate}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 text-[12px] font-medium text-white/50 hover:text-white/80 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
            Recarregar
          </button>
        )}
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center" style={{ height: "60px" }}>
          <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-white/40" />
        </div>
      )}

      {status === "ready" && svg && (
        <>
          <div
            className="flex items-center justify-center select-none"
            style={{ padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", minHeight: "60px" }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="flex items-center gap-2 mt-2.5">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Digite o resultado"
              className="flex-1 h-[40px] bg-white/10 rounded-[10px] border border-white/15 text-white text-[14px] outline-none placeholder:text-white/40 transition-all px-4"
              style={{ fontSize: "16px" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={!answer.trim()}
              className="flex items-center justify-center w-[40px] h-[40px] rounded-[10px] bg-accent hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={18} strokeWidth={2} className="text-white" />
            </button>
          </div>
        </>
      )}

      {status === "verifying" && (
        <div className="flex items-center justify-center" style={{ height: "60px" }}>
          <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-accent" />
        </div>
      )}

      {status === "solved" && (
        <div className="flex items-center gap-2" style={{ padding: "8px 0" }}>
          <Check size={18} strokeWidth={2} className="text-green-400" />
          <span className="text-[13px] text-green-400 font-medium">Verificação concluída</span>
        </div>
      )}

      {error && <p className="text-[12px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
