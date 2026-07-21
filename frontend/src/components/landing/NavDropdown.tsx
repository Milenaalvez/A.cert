"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface DropdownItem {
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
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-1 text-[14px] text-[#8899B0] hover:text-white transition-colors duration-300 font-medium py-1 group"
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-gradient-to-r from-[#FF7A00] to-[#FF7A00]/40 rounded-full transition-all duration-300 group-hover:w-full" />
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div
            style={{
              background: "#0F1729",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
              padding: 8,
              animation: "dropdownIn 0.2s ease-out",
              minWidth: items[0]?.desc ? 280 : 200,
            }}
          >
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 10,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.4,
                  }}
                >
                  {item.label}
                </span>
                {item.desc && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#8899B0",
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.desc}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
