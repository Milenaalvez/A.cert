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
      {/* Background */}
      <Image src="/images/login-bg.png" alt="" fill className="object-cover object-center fixed inset-0" priority />
      <div className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      {/* Main grid */}
      <div className="relative z-10 flex min-h-screen">
        {/* LEFT — Branding — hidden on mobile, simplified on tablet */}
        <div className="hidden md:flex flex-1 flex-col justify-center px-8 lg:px-14 xl:px-20">
          <div className="max-w-[600px]">
            {/* Logo */}
            <div className="flex items-center gap-3 md:gap-4 mb-12 lg:mb-16">
              <Image src="/images/logo.png" alt="A.CERT" width={48} height={48} className="md:w-[56px] md:h-[56px] lg:w-[72px] lg:h-[72px] object-contain" />
              <div>
                <span className="text-white font-bold tracking-tight block leading-none" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>A.CERT</span>
                <span className="text-white/60 block mt-1" style={{ fontSize: "clamp(10px, 1.2vw, 14px)" }}>Central de Certidões</span>
              </div>
            </div>

            <div className="animate-slide-up">
              {badge && (
                <span className="inline-block px-4 py-2 rounded-full border border-accent/25 bg-accent/10 text-accent font-medium mb-8 lg:mb-12" style={{ fontSize: "clamp(10px, 1.2vw, 14px)" }}>
                  {badge}
                </span>
              )}

              <h1 className="text-white font-extrabold leading-[1.05] mb-6" style={{ fontSize: "clamp(24px, 4.5vw, 64px)", maxWidth: "650px" }}>
                {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
              </h1>

              <div className="w-10 h-1 bg-accent rounded-full mb-6 lg:mb-8" />

              <p className="text-white/70 leading-relaxed max-w-[480px]" style={{ fontSize: "clamp(13px, 1.6vw, 22px)" }}>
                {description}
              </p>
            </div>

            {tagline && <div className="mt-10">{tagline}</div>}
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="w-full md:w-[420px] lg:w-[460px] xl:w-[500px] flex-shrink-0 flex flex-col justify-center px-5 sm:px-8 md:px-6 lg:px-8">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <Image src="/images/logo.png" alt="A.CERT" width={36} height={36} className="object-contain" />
            <span className="text-white font-bold tracking-tight" style={{ fontSize: "clamp(18px, 5vw, 24px)" }}>A.CERT</span>
          </div>

          <div className="animate-fade-in w-full rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10"
            style={{ background: "rgba(18,18,18,0.45)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
