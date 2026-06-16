"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export default function LoginTransition() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"entering" | "ready">("entering");

  useEffect(() => {
    const p = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        return next >= 100 ? 100 : next;
      });
    }, 200);

    const t1 = setTimeout(() => setPhase("ready"), 1200);
    const t2 = setTimeout(() => router.replace("/dashboard"), 1800);

    return () => {
      clearInterval(p);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,122,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div
        className="flex flex-col items-center gap-4 animate-fade-in"
        style={{ animationDuration: "0.6s" }}
      >
        <div
          className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center"
          style={{
            background: "#FF7A00",
            boxShadow: "0 0 40px rgba(255,122,0,0.25)",
            animation: "logoPulse 1.5s ease-in-out infinite",
          }}
        >
          <FileText size={36} className="text-white" strokeWidth={2} />
        </div>

        <div className="text-center mt-2">
          <h1
            className="text-white text-[28px] font-bold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            A.CERT
          </h1>
          <p
            className="text-white/40 text-[13px] font-medium mt-1"
            style={{ letterSpacing: "0.02em" }}
          >
            {phase === "entering" ? "Entrando..." : "Bem-vindo!"}
          </p>
        </div>

        <div
          className="w-[200px] h-[2px] rounded-full mt-4 overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{
              width: `${progress}%`,
              background: "#FF7A00",
              boxShadow: "0 0 8px rgba(255,122,0,0.4)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(255,122,0,0.25); }
          50% { transform: scale(1.03); box-shadow: 0 0 60px rgba(255,122,0,0.35); }
        }
      `}</style>
    </div>
  );
}
