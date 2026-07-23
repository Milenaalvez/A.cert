import { Suspense } from "react";
import { categorias } from "@/data/ajuda";
import AjudaDetailClient from "./AjudaDetailClient";

export function generateStaticParams() {
  return categorias.map(c => ({ slug: c.slug }));
}

export default function AjudaDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#8899B0" }}>Carregando...</div>}>
      <AjudaDetailClient />
    </Suspense>
  );
}
