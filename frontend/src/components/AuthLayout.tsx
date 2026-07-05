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
  titleSize = "text-[72px]",
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

      {/* LEFT SIDE — 55% — hidden on mobile */}
      <div className="hidden sm:block absolute left-0 top-0 w-[55%] h-screen">
        <div style={{ position: "absolute", top: "120px", left: "80px" }}>
          <div className="flex items-center gap-4">
            <Image src="/images/logo.png" alt="A.CERT" width={72} height={72} className="object-contain" />
            <div className="flex flex-col">
              <span className="text-white text-[48px] font-bold tracking-tight block leading-none">A.CERT</span>
              <span className="text-white/80 text-[14px] mt-1.5 block whitespace-nowrap">Central de Certidões</span>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: "46%", left: "80px", transform: "translateY(-50%)" }}>
          <div className="animate-slide-up">
            {badge && (
              <div style={{ display: "inline-flex", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", padding: "10px 18px", borderRadius: "999px", marginBottom: "53px" }}>
                <span className="text-accent text-sm font-medium">{badge}</span>
              </div>
            )}
            <div className={`text-white font-extrabold leading-[1.05] mb-6 ${titleSize}`} style={{ maxWidth: "650px" }}>
              {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
            </div>
            <div style={{ width: "48px", height: "4px", background: "#F97316", borderRadius: "999px", marginBottom: "32px" }} />
            <p className="text-white/75" style={{ fontSize: "24px", lineHeight: "1.7", maxWidth: "520px", marginBottom: "32px" }}>{description}</p>
          </div>
        </div>
        {tagline && <div style={{ position: "absolute", bottom: "100px", left: "80px" }}>{tagline}</div>}
      </div>

      {/* Mobile-only logo */}
      <div className="sm:hidden absolute top-6 left-5 z-10 flex items-center gap-3">
        <Image src="/images/logo.png" alt="A.CERT" width={36} height={36} className="object-contain" />
        <span className="text-white text-[22px] font-bold tracking-tight">A.CERT</span>
      </div>

      {/* RIGHT SIDE — 45% — full width on mobile */}
      <div className="absolute right-0 top-0 w-full sm:w-[45%] h-screen">
        <div className="flex items-center justify-center h-full px-4 sm:block sm:absolute sm:right-[120px] sm:top-1/2 sm:-translate-y-1/2 sm:max-w-[520px] sm:w-[calc(100%-180px)] sm:px-0 sm:h-auto">
          <div className="animate-fade-in w-full sm:w-auto" style={{ padding: "40px", borderRadius: "32px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
}
