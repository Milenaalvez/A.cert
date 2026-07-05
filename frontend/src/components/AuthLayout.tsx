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
      <div className="hidden sm:flex absolute left-0 top-0 w-[42%] lg:w-[50%] xl:w-[55%] h-screen flex-col justify-center">
        {/* Logo */}
        <div className="absolute top-[50px] sm:top-[70px] lg:top-[120px] left-[28px] lg:left-[80px]">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image src="/images/logo.png" alt="A.CERT" width={44} height={44} className="sm:w-[52px] sm:h-[52px] lg:w-[72px] lg:h-[72px] object-contain" priority />
            <div className="flex flex-col">
              <span className="text-white text-[26px] sm:text-[34px] lg:text-[48px] font-bold tracking-tight block leading-none">A.CERT</span>
              <span className="text-white/80 text-[10px] sm:text-[12px] lg:text-[14px] mt-0.5 sm:mt-1.5 block whitespace-nowrap">Central de Certidões</span>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="px-[28px] lg:px-[80px]">
          <div className="animate-slide-up">
            {badge && (
              <div style={{ display: "inline-flex", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", padding: "6px 14px", borderRadius: "999px", marginBottom: "32px" }} className="sm:mb-[40px] lg:mb-[53px]">
                <span className="text-accent text-xs sm:text-sm font-medium">{badge}</span>
              </div>
            )}
            <div className={`text-white font-extrabold leading-[1.05] mb-4 sm:mb-6 ${titleSize}`} style={{ maxWidth: "650px" }}>
              {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
            </div>
            <div style={{ width: "32px", height: "3px", background: "#F97316", borderRadius: "999px", marginBottom: "20px" }} className="sm:w-[40px] sm:h-[3px] sm:mb-[24px] lg:w-[48px] lg:h-[4px] lg:mb-[32px]" />
            <p className="text-white/75 text-[14px] sm:text-[16px] lg:text-[24px] leading-[1.7] max-w-[520px] mb-[20px] sm:mb-[32px]">
              {description}
            </p>
          </div>
          {tagline && <div className="mt-4">{tagline}</div>}
        </div>
      </div>

      {/* Mobile-only logo */}
      <div className="sm:hidden absolute top-5 left-4 z-10 flex items-center gap-2.5">
        <Image src="/images/logo.png" alt="A.CERT" width={32} height={32} className="object-contain" />
        <span className="text-white text-[20px] font-bold tracking-tight">A.CERT</span>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="absolute right-0 top-0 w-full sm:w-[58%] lg:w-[50%] xl:w-[45%] h-screen">
        <div className="auth-form-wrap flex items-center justify-center h-full px-3 sm:px-6 lg:px-8 xl:block xl:absolute xl:right-[120px] xl:top-1/2 xl:-translate-y-1/2 xl:max-w-[520px] xl:w-[calc(100%-180px)] xl:px-0 xl:h-auto">
          <div className="animate-fade-in w-full xl:w-auto" style={{ padding: "24px 20px", borderRadius: "20px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
