"use client";

import Image from "next/image";

interface AuthLayoutProps {
  title: React.ReactNode;
  highlightWord?: string;
  description: string;
  badge?: string;
  titleSize?: string;
  tagline?: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthLayout({
  title,
  highlightWord,
  description,
  badge,
  tagline,
  children,
}: AuthLayoutProps) {
  function highlightTitle(text: string, word?: string) {
    const parts = text.split("|");
    return parts.map((line, i) => (
      <span key={i}>
        {(() => {
          if (!word) return line;
          const wordParts = line.split(new RegExp(`(${word})`, "gi"));
          return wordParts.map((part, j) =>
            part.toLowerCase() === word.toLowerCase() ? (
              <span key={j} className="text-accent">{part}</span>
            ) : (part)
          );
        })()}
        {i < parts.length - 1 && <br />}
      </span>
    ));
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Image src="/images/login-bg.png" alt="Background" fill className="object-cover object-[center_30%]" priority />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.25) 100%)" }} />

      <div className="relative z-10 flex h-full overflow-y-auto">
        {/* LEFT SIDE — Branding — collapses on narrow screens */}
        <div className="hidden sm:flex flex-1 flex-col justify-center" style={{ padding: `0 clamp(20px, 5vw, 80px)` }}>
          {/* Logo */}
          <div style={{ position: "absolute", top: `clamp(32px, 6vh, 120px)`, left: `clamp(20px, 5vw, 80px)` }}>
            <div className="flex items-center" style={{ gap: `clamp(8px, 1.5vw, 16px)` }}>
              <div style={{ width: `clamp(36px, 5vw, 72px)`, height: `clamp(36px, 5vw, 72px)`, position: "relative" }}>
                <Image src="/images/logo.png" alt="A.CERT" fill className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold tracking-tight block leading-none" style={{ fontSize: `clamp(22px, 4vw, 48px)` }}>A.CERT</span>
                <span className="text-white/80 block whitespace-nowrap" style={{ fontSize: `clamp(9px, 1.2vw, 14px)`, marginTop: `clamp(2px, 0.3vw, 6px)` }}>Central de Certidões</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="animate-slide-up" style={{ maxWidth: `clamp(300px, 50vw, 700px)` }}>
            {badge && (
              <div style={{ display: "inline-flex", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", padding: `${clamp(5, 0.8vw, 10)}px ${clamp(10, 1.5vw, 18)}px`, borderRadius: "999px", marginBottom: `clamp(20px, 3vh, 53px)` }}>
                <span className="text-accent font-medium" style={{ fontSize: `clamp(10px, 1.3vw, 14px)` }}>{badge}</span>
              </div>
            )}
            <div className="text-white font-extrabold leading-[1.05]" style={{ fontSize: `clamp(22px, 5vw, 72px)`, marginBottom: `clamp(12px, 1.5vw, 24px)` }}>
              {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
            </div>
            <div style={{ width: `clamp(28px, 3vw, 48px)`, height: `clamp(2px, 0.3vw, 4px)`, background: "#F97316", borderRadius: "999px", marginBottom: `clamp(14px, 2vw, 32px)` }} />
            <p className="text-white/75 leading-[1.7]"
              style={{ fontSize: `clamp(13px, 1.8vw, 24px)`, maxWidth: `clamp(260px, 45vw, 520px)`, marginBottom: `clamp(12px, 2vw, 32px)` }}>
              {description}
            </p>
          </div>
          {tagline && <div style={{ marginTop: `clamp(12px, 2vw, 32px)` }}>{tagline}</div>}
        </div>

        {/* RIGHT SIDE — Form */}
        <div className="w-full sm:w-auto sm:flex-shrink-0 flex items-center justify-center px-4"
          style={{ width: `clamp(300px, 100vw, 520px)`, paddingRight: `clamp(16px, 4vw, 120px)`, paddingLeft: `clamp(16px, 2vw, 24px)` }}>
          {/* Mobile logo */}
          <div className="sm:hidden absolute flex items-center gap-2" style={{ top: `clamp(12px, 2.5vh, 20px)`, left: `clamp(10px, 3vw, 20px)` }}>
            <div style={{ width: `clamp(28px, 8vw, 36px)`, height: `clamp(28px, 8vw, 36px)`, position: "relative" }}>
              <Image src="/images/logo.png" alt="A.CERT" fill className="object-contain" />
            </div>
            <span className="text-white font-bold tracking-tight" style={{ fontSize: `clamp(16px, 5vw, 24px)` }}>A.CERT</span>
          </div>
          <div className="animate-fade-in w-full" style={{ padding: `clamp(18px, 3vw, 40px)`, borderRadius: `clamp(16px, 2vw, 32px)`, background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
}
