"use client";

import { useTheme } from "@/contexts/ThemeContext";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  complement: string;
  iconBg: string;
  iconColor: string;
  growth?: string;
  growthPositive?: boolean;
}

export function StatsCard({ icon: Icon, title, value, complement, iconBg, iconColor, growth, growthPositive }: StatsCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="stat-card flex flex-col" style={{ gap: "24px" }}>
      <span className="text-[14px] font-medium text-secondary leading-tight block">{title}</span>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: isDark ? `${iconColor}1A` : iconBg }}>
          <Icon size={20} strokeWidth={1.5} style={{ color: iconColor }} />
        </div>
        <span className="text-[32px] font-bold text-primary tabular-nums leading-none">{value}</span>
        {growth && (
          <span className={`text-[13px] font-semibold px-2 py-0.5 rounded-full ${growthPositive ? "text-[#059669]" : "text-[#DC2626]"} ${isDark ? (growthPositive ? "bg-[rgba(5,150,105,0.15)]" : "bg-[rgba(220,38,38,0.15)]") : (growthPositive ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]")}`}>
            {growth}
          </span>
        )}
      </div>
      <div className="text-[12px] text-muted leading-relaxed">{complement}</div>
    </div>
  );
}
