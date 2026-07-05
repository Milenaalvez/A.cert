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

      <div className="relative z-10 flex h-full">
        {/* LEFT SIDE — Branding — fills available space */}
        <div className="hidden sm:flex flex-1 flex-col justify-center min-w-0 px-8 md:px-12 lg:px-20 xl:px-[80px]">
          {/* Logo */}
          <div className="absolute top-8 md:top-12 lg:top-[80px] xl:top-[120px] left-8 md:left-12 lg:left-20 xl:left-[80px]">
            <div className="flex items-center gap-3 md:gap-4">
              <Image src="/images/logo.png" alt="A.CERT" width={48} height={48} className="md:w-[60px] md:h-[60px] lg:w-[72px] lg:h-[72px] object-contain" priority />
              <div className="flex flex-col">
                <span className="text-white text-[28px] md:text-[36px] lg:text-[48px] font-bold tracking-tight block leading-none">A.CERT</span>
                <span className="text-white/80 text-[11px] md:text-[13px] lg:text-[14px] mt-0.5 md:mt-1.5 block whitespace-nowrap">Central de Certidões</span>
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="animate-slide-up max-w-[700px]">
            {badge && (
              <div style={{ display: "inline-flex", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", padding: "7px 16px", borderRadius: "999px", marginBottom: "36px" }} className="lg:mb-[48px]">
                <span className="text-accent text-xs lg:text-sm font-medium">{badge}</span>
              </div>
            )}
            <div className="text-white font-extrabold leading-[1.05] mb-5 lg:mb-6 text-[28px] md:text-[40px] lg:text-[56px] xl:text-[72px]">
              {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
            </div>
            <div style={{ width: "40px", height: "3px", background: "#F97316", borderRadius: "999px", marginBottom: "24px" }} className="lg:w-[48px] lg:h-[4px] lg:mb-[32px]" />
            <p className="text-white/75 text-[15px] md:text-[18px] lg:text-[24px] leading-[1.7] max-w-[520px]">
              {description}
            </p>
          </div>
          {tagline && <div className="mt-8">{tagline}</div>}
        </div>

        {/* RIGHT SIDE — Form — fixed max width */}
        <div className="w-full sm:w-[440px] md:w-[460px] lg:w-[480px] xl:w-[520px] flex-shrink-0 flex items-center justify-center px-4 sm:px-6 md:pr-12 lg:pr-16 xl:pr-[120px]">
          {/* Mobile logo (inside form area) */}
          <div className="sm:hidden absolute top-5 left-5 z-10 flex items-center gap-2.5">
            <Image src="/images/logo.png" alt="A.CERT" width={32} height={32} className="object-contain" />
            <span className="text-white text-[20px] font-bold tracking-tight">A.CERT</span>
          </div>
          <div className="animate-fade-in w-full" style={{ padding: "28px 24px", borderRadius: "20px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
