"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface DropdownItem {
  icon?: React.ElementType;
  label: string;
  desc?: string;
  href: string;
}

interface Props {
  label: string;
  items: DropdownItem[];
}

export default function NavDropdown({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-1 text-[13px] text-[#8899B0] hover:text-white transition-colors duration-300 font-medium py-1 group"
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/40 rounded-full transition-all duration-300 group-hover:w-full" />
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div
            className="backdrop-blur-xl rounded-[14px] overflow-hidden"
            style={{
              background: "rgba(3,2,5,0.95)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
              animation: "dropdownIn 0.2s ease-out",
              minWidth: items[0]?.desc ? 320 : 220,
            }}
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors duration-150 ${
                    i < items.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  {Icon && (
                    <div
                      className="flex items-center justify-center shrink-0 mt-0.5"
                      style={{ width: 32, height: 32, borderRadius: 8 }}
                    >
                      <Icon size={16} strokeWidth={1.5} style={{ color: "rgba(255,122,0,0.8)" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white/90 leading-tight">
                      {item.label}
                    </div>
                    {item.desc && (
                      <div className="text-[11px] text-[#8899B0] mt-0.5 leading-tight">
                        {item.desc}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
