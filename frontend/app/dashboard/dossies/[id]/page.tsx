import { Suspense } from "react";
import DossierDetailClient from "./DossierDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function DossierDetailPage() {
  return (
    <Suspense fallback={null}>
      <DossierDetailClient />
    </Suspense>
  );
}
