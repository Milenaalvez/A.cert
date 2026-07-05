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

      {/* Mobile gradient overlay */}
      <div className="absolute inset-0 lg:hidden" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)" }} />

      {/* LEFT SIDE — Branding (desktop only) */}
      <div className="hidden lg:block absolute left-0 top-0 w-[55%] h-screen">
        <div style={{ position: "absolute", top: "120px", left: "80px" }}>
          <div className="flex items-center gap-4">
            <Image src="/images/logo.png" alt="A.CERT" width={72} height={72} className="object-contain" priority />
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
            <p className="text-white/75" style={{ fontSize: "24px", lineHeight: "1.7", maxWidth: "520px", marginBottom: "32px" }}>
              {description}
            </p>
          </div>
        </div>
        {tagline && (
          <div style={{ position: "absolute", bottom: "100px", left: "80px" }}>{tagline}</div>
        )}
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden absolute top-8 left-6 z-10 flex items-center gap-3">
        <Image src="/images/logo.png" alt="A.CERT" width={40} height={40} className="object-contain" priority />
        <span className="text-white text-[24px] font-bold tracking-tight">A.CERT</span>
      </div>

      {/* Mobile title */}
      <div className="lg:hidden absolute top-28 left-6 right-6 z-10">
        {badge && (
          <div className="inline-flex mb-4" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", padding: "6px 14px", borderRadius: "999px" }}>
            <span className="text-accent text-xs font-medium">{badge}</span>
          </div>
        )}
        <div className="text-white font-extrabold leading-[1.1] text-[28px] max-w-[300px]">
          {typeof title === "string" ? highlightTitle(title, highlightWord) : title}
        </div>
      </div>

      {/* RIGHT SIDE / Form container */}
      <div className="absolute right-0 top-0 w-full lg:w-[45%] h-screen">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 sm:px-8 lg:right-[120px] lg:left-auto lg:w-[calc(100%-180px)] lg:max-w-[520px] lg:px-0">
          <div className="animate-fade-in" style={{ padding: "28px 24px", borderRadius: "24px", background: "rgba(20,20,20,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.35)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
