"use client";

import { Construction } from "lucide-react";
import DashboardLayout from "./DashboardLayout";

interface Props {
  titulo: string;
}

export default function EmDesenvolvimento({ titulo }: Props) {
  return (
    <DashboardLayout>
      <div
        className="min-h-full flex flex-col items-center justify-center gap-5"
        style={{ background: "#FAFAFA" }}
      >
        <div
          className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center"
          style={{ background: "rgba(255, 122, 0, 0.1)" }}
        >
          <Construction
            size={32}
            strokeWidth={1.5}
            style={{ color: "#FF7A00" }}
          />
        </div>
        <div className="text-center">
          <h2
            className="text-[22px] font-bold tracking-tight"
            style={{ color: "#111827" }}
          >
            {titulo}
          </h2>
          <p className="text-[14px] mt-1.5" style={{ color: "#9CA3AF" }}>
            Em desenvolvimento
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
