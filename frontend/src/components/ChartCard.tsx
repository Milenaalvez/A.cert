"use client";

import { type ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  insight?: string;
}

export function ChartCard({ title, subtitle, children, insight }: ChartCardProps) {
  return (
    <div className="p-7 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-primary">{title}</h3>
        {subtitle && <span className="text-[13px] text-secondary">{subtitle}</span>}
      </div>
      <div className="flex-1">
        {children}
      </div>
      {insight && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-accent/10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] shrink-0" />
          <span className="text-[12px] text-secondary leading-relaxed">{insight}</span>
        </div>
      )}
    </div>
  );
}
