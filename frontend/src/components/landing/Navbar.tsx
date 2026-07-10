"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[#030205]/90 border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div
        className="mx-auto flex items-center relative"
        style={{ maxWidth: "1280px", padding: "0 24px", height: "88px" }}
      >
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/images/logo.png" alt="A.CERT" width={42} height={42} className="object-contain" />
          <span className="text-white text-[22px] font-bold tracking-tight">A.CERT</span>
        </Link>

        <div
          className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2"
        >
          {LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="relative text-[13px] text-[#8899B0] hover:text-white transition-colors duration-300 font-medium py-1 group"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/40 rounded-full transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <Link
            href="/login"
            className="text-[13px] font-medium text-white/70 hover:text-white px-6 py-3 rounded-[10px] border border-white/[0.10] hover:border-white/20 transition-all duration-300"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="text-[13px] font-semibold text-white bg-[#FF7A00] hover:bg-[#E06900] px-6 py-3 rounded-[10px] transition-all duration-300 shadow-[0_4px_20px_rgba(255,122,0,0.2)] hover:shadow-[0_6px_30px_rgba(255,122,0,0.35)]"
          >
            Criar conta
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white p-2">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden backdrop-blur-xl bg-[#030205]/95 border-t border-white/[0.06]">
          <div className="px-6 py-8 flex flex-col gap-5">
            {LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-[15px] text-[#8899B0] hover:text-white transition-colors text-left font-medium"
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-[14px] font-medium text-white/70 py-3 rounded-[10px] border border-white/[0.10]">
                Entrar
              </Link>
              <Link href="/cadastro" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-[14px] font-semibold text-white bg-[#FF7A00] py-3 rounded-[10px]">
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
