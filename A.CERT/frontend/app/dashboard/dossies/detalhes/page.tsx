"use client";

export const dynamic = "force-static";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/i18n/useT";

function DossierDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  return (
    <div className="bg-surface rounded-[14px] p-6 flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-[16px] bg-muted flex items-center justify-center">
        <FolderOpen size={28} strokeWidth={1.5} className="text-muted" />
      </div>
      <span className="text-[15px] font-semibold text-primary">Dossiê {id || "não encontrado"}</span>
      <p className="text-[13px] text-secondary text-center max-w-[400px]">
        O detalhamento completo estará disponível na próxima atualização.
      </p>
    </div>
  );
}

export default function DossierDetailPage() {
  const { t } = useT();
  return (
    <DashboardLayout>
      <div className="flex flex-col px-16 pt-12 pb-24 w-full gap-8">
        <Link href="/dashboard/dossies" className="flex items-center gap-1.5 text-[12px] text-muted hover:text-body transition-colors w-fit" style={{ marginTop: "6px" }}>
          <ArrowLeft size={13} strokeWidth={1.5} />
          Voltar para Dossiês
        </Link>
        <Suspense fallback={<div className="text-center py-20 text-muted">Carregando...</div>}>
          <DossierDetailContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
