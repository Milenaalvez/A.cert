"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  LayoutDashboard,
  FolderOpen,
  ScrollText,
  BarChart3,
  Shield,
  Building2,
  Home,
  Scale,
  Building,
  Factory,
  Users,
  FileText,
  MessageSquare,
} from "lucide-react";
import NavDropdown, { type DropdownItem } from "./NavDropdown";

const PRODUTO: DropdownItem[] = [
  { icon: LayoutDashboard, label: "Dashboard Inteligente", desc: "Visão geral, métricas e prioridades", href: "/dashboard" },
  { icon: FolderOpen, label: "Gerenciamento de Dossiês", desc: "Crie, organize e acompanhe dossiês", href: "/dashboard/dossies" },
  { icon: ScrollText, label: "Emissão de Certidões", desc: "Consulte 7+ órgãos oficiais automaticamente", href: "/dashboard/certidoes" },
  { icon: BarChart3, label: "Relatórios", desc: "Exporte dados em Excel e PDF", href: "/dashboard/relatorios" },
  { icon: Shield, label: "Segurança e LGPD", desc: "Dados criptografados, totalmente compliant", href: "#" },
];

const SOLUCOES: DropdownItem[] = [
  { icon: Building2, label: "Para Imobiliárias", href: "/cadastro" },
  { icon: Home, label: "Para Corretores", href: "/cadastro" },
  { icon: Scale, label: "Para Escritórios Jurídicos", href: "/cadastro" },
  { icon: Building, label: "Para Incorporadoras", href: "/cadastro" },
  { icon: Factory, label: "Para Empresas", href: "/cadastro" },
];

const CLIENTES: DropdownItem[] = [
  { icon: Users, label: "Empresas que utilizam", href: "#clientes" },
  { icon: FileText, label: "Cases de sucesso", href: "#cases" },
  { icon: MessageSquare, label: "Depoimentos", href: "#depoimentos" },
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
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navBg = scrolled ? "rgba(255,255,255,0.85)" : "transparent";
  const navBorder = scrolled ? "1px solid rgba(0,0,0,0.06)" : "none";

  return (
    <nav
      className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{ background: navBg, backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: navBorder }}
    >
      <div
        className="flex items-center relative"
        style={{ padding: "0 24px", height: "88px" }}
      >
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/images/logo.png" alt="A.CERT" width={42} height={42} className="object-contain" />
          <span className="text-[#111827] text-[22px] font-bold tracking-tight">A.CERT</span>
        </Link>

        <div
          className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2 text-light"
        >
          <NavDropdown label="Produto" items={PRODUTO} />
          <NavDropdown label="Soluções" items={SOLUCOES} />
          <Link
            href="#planos"
            onClick={(e) => { e.preventDefault(); scrollTo("#planos"); }}
            className="relative text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors duration-300 font-medium py-1 px-3 group"
          >
            Preços
            <span className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/40 rounded-full transition-all duration-300 scale-x-0 group-hover:scale-x-100" />
          </Link>
          <NavDropdown label="Clientes" items={CLIENTES} />
          <Link
            href="/dashboard/ajuda/primeiros-passos"
            className="relative text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors duration-300 font-medium py-1 px-3 group"
          >
            Contato
            <span className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/40 rounded-full transition-all duration-300 scale-x-0 group-hover:scale-x-100" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-2" style={{ marginLeft: "auto" }}>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 42,
              padding: "0 20px",
              borderRadius: 6,
              border: "1px solid #E5E7EB",
              background: "transparent",
              color: "#374151",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#FF7A00";
              e.currentTarget.style.background = "rgba(255,122,0,0.04)";
              e.currentTarget.style.color = "#FF7A00";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#374151";
            }}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 42,
              padding: "0 20px",
              borderRadius: 6,
              border: "none",
              background: "#FF7A00",
              color: "#FFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E06900";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FF7A00";
            }}
          >
            Criar conta
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#111827] p-2 ml-auto">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden backdrop-blur-xl bg-white/95 border-t border-gray-100">
          <div className="px-6 py-8 flex flex-col gap-1">
            <MobileSection label="Produto" items={PRODUTO} onClick={() => setMobileOpen(false)} />
            <MobileSection label="Soluções" items={SOLUCOES} onClick={() => setMobileOpen(false)} />
            <Link
              href="#planos"
              onClick={() => { setMobileOpen(false); scrollTo("#planos"); }}
              className="text-[15px] text-[#6B7280] hover:text-[#111827] transition-colors font-medium py-3 border-b border-gray-100"
            >
              Preços
            </Link>
            <MobileSection label="Clientes" items={CLIENTES} onClick={() => setMobileOpen(false)} />
            <Link
              href="/dashboard/ajuda/primeiros-passos"
              onClick={() => setMobileOpen(false)}
              className="text-[15px] text-[#6B7280] hover:text-[#111827] transition-colors font-medium py-3 border-b border-gray-100"
            >
              Contato
            </Link>
            <div className="flex gap-2 pt-4 border-t border-gray-100 mt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 42,
                  borderRadius: 6,
                  border: "1px solid #E5E7EB",
                  background: "transparent",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 42,
                  borderRadius: 6,
                  border: "none",
                  background: "#FF7A00",
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
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

function MobileSection({ label, items, onClick }: { label: string; items: DropdownItem[]; onClick: () => void }) {
  return (
    <details className="group border-b border-gray-100">
      <summary className="text-[15px] text-[#6B7280] hover:text-[#111827] transition-colors font-medium py-3 cursor-pointer list-none flex items-center justify-between">
        {label}
        <svg className="w-3 h-3 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="pb-3 flex flex-col gap-1 pl-3">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            onClick={onClick}
            className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors py-1.5 flex items-center gap-2"
          >
            {item.icon && <item.icon size={14} strokeWidth={1.5} style={{ color: "#FF7A00" }} />}
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
