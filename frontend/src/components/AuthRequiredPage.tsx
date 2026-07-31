"use client";

import { useRouter } from "next/navigation";
import { Bot, LogIn, UserPlus } from "lucide-react";

export default function AuthRequiredPage() {
  const router = useRouter();

  const returnUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.pathname + window.location.search)
      : "/dashboard";

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-app)" }}
    >
      <div className="text-center max-w-md px-8">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-8"
          style={{ background: "rgba(255,122,0,0.10)" }}
        >
          <Bot size={48} strokeWidth={1.3} style={{ color: "#FF7A00" }} />
        </div>

        <h1
          className="text-[22px] font-bold mb-3"
          style={{ color: "var(--text-primary)", fontFamily: "'Inter', sans-serif" }}
        >
          Acesso restrito
        </h1>

        <p
          className="text-[15px] leading-relaxed mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          Você precisa estar logado para acessar esta área.
        </p>

        <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
          <button
            onClick={() => router.push(`/login?returnUrl=${returnUrl}`)}
            className="w-full h-11 rounded-[10px] text-[14px] font-semibold text-white transition-colors flex items-center justify-center gap-2"
            style={{ background: "#FF7A00" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E06900")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FF7A00")}
          >
            <LogIn size={16} />
            Fazer login
          </button>

          <button
            onClick={() => router.push("/cadastro")}
            className="w-full h-11 rounded-[10px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#FF7A00";
              e.currentTarget.style.color = "#FF7A00";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <UserPlus size={16} />
            Criar uma conta
          </button>
        </div>
      </div>
    </div>
  );
}
