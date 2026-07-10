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
          ? "backdrop-blur-xl bg-[#0D1425]/90 border-b border-[#1E2A44]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/images/logo.png" alt="A.CERT" width={40} height={40} className="object-contain" />
          <span className="text-white text-[22px] font-bold tracking-tight">A.CERT</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-[14px] text-[#8899B0] hover:text-white transition-colors duration-200 font-medium"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[14px] font-semibold text-white/80 hover:text-white px-5 py-2.5 rounded-[12px] border border-white/15 hover:border-white/25 transition-all duration-200"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="text-[14px] font-semibold text-white bg-[#FF7A00] hover:bg-[#E06900] px-5 py-2.5 rounded-[12px] transition-all duration-200 shadow-[0_4px_20px_rgba(255,122,0,0.25)]"
          >
            Criar conta
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#1E2A44] bg-[#0D1425]/95 backdrop-blur-xl">
          <div className="px-6 py-6 flex flex-col gap-4">
            {LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-[15px] text-[#8899B0] hover:text-white transition-colors text-left font-medium"
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 mt-2 pt-4 border-t border-[#1E2A44]">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-[14px] font-semibold text-white/80 py-2.5 rounded-[12px] border border-white/15"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-[14px] font-semibold text-white bg-[#FF7A00] py-2.5 rounded-[12px]"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
