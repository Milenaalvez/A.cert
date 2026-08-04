import { Suspense } from "react";
import AjudaDetailClient from "./[slug]/AjudaDetailClient";

export default function AjudaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#8899B0" }}>Carregando...</div>}>
      <AjudaDetailClient />
    </Suspense>
  );
}
