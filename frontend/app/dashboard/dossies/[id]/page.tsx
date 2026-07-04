import DossierDetailClient from "./DossierDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function DossierDetailPage() {
  return <DossierDetailClient />;
}
