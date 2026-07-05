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
              <span key={j} className="text-accent">
                {part}
              </span>
            ) : (
              part
            )
          );
        })()}
        {i < parts.length - 1 && <br />}
      </span>
    ));
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Image
        src="/images/login-bg.png"
        alt="Background"
        fill
        className="object-cover object-[center_30%]"
        priority
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* LEFT SIDE — Branding — visible from tablet (sm) up */}
      <div className="hidden sm:block absolute left-0 top-0 sm:w-[45%] lg:w-[55%] h-screen">
        {/* Logo */}
        <div className="absolute top-[60px] sm:top-[80px] lg:top-[120px] left-[32px] lg:left-[80px]">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image src="/images/logo.png" alt="A.CERT" width={48} height={48} className="sm:w-[56px] sm:h-[56px] lg:w-[72px] lg:h-[72px] object-contain" priority />
            <div className="flex flex-col">
              <span className="text-white text-[28px] sm:text-[36px] lg:text-[48px] font-bold tracking-tight block leading-none">A.CERT</span>
              <span className="text-white/80 text-[11px] sm:text-[13px] lg:text-[14px] mt-1 sm:mt-1.5 block whitespace-nowrap">Central de Certidões</span>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="absolute top-[46%] left-[32px] lg:left-[80px] -translate-y-1/2">
          <div className="animate-slide-up">
            {badge && (
              <div style={{ display: "inline-flex", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", padding: "6px 14px", borderRadius: "999px", marginBottom: "40px" }} className="sm:p-[8px_16px] lg:p-[10px_18px] lg:mb-[53px]">
                <span className="text-accent text-xs sm:text-sm font-medium">{badge}</span>
              </div>
            )}
            <div className="text-white font-extrabold leading-[1.05] mb-4 sm:mb-6 text-[24px] sm:text-[40px] lg:text-[72px]" style={{ maxWidth: "650px" }}>
              {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
            </div>
            <div style={{ width: "36px", height: "3px", background: "#F97316", borderRadius: "999px", marginBottom: "24px" }} className="sm:w-[48px] sm:h-[4px] sm:mb-[32px]" />
            <p className="text-white/75 text-[15px] sm:text-[18px] lg:text-[24px] leading-[1.7] max-w-[520px] mb-[24px] sm:mb-[32px]">
              {description}
            </p>
          </div>
        </div>
        {tagline && (
          <div className="absolute bottom-[60px] sm:bottom-[80px] lg:bottom-[100px] left-[32px] lg:left-[80px]">{tagline}</div>
        )}
      </div>

      {/* Mobile-only logo */}
      <div className="sm:hidden absolute top-6 left-5 z-10 flex items-center gap-3">
        <Image src="/images/logo.png" alt="A.CERT" width={36} height={36} className="object-contain" priority />
        <span className="text-white text-[22px] font-bold tracking-tight">A.CERT</span>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="absolute right-0 top-0 w-full sm:w-[55%] lg:w-[45%] h-screen">
        <div className="auth-form-wrap flex items-center justify-center h-full px-4 sm:px-8 lg:block lg:absolute lg:right-[120px] lg:top-1/2 lg:-translate-y-1/2 lg:max-w-[520px] lg:w-[calc(100%-180px)] lg:px-0 lg:h-auto">
          <div className="animate-fade-in w-full lg:w-auto" style={{ padding: "28px 24px", borderRadius: "24px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
