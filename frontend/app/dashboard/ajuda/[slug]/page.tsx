import { guias } from "@/data/ajuda";
import AjudaDetailClient from "./AjudaDetailClient";

export function generateStaticParams() {
  return guias.map(g => ({ slug: g.slug }));
}

export default function AjudaDetailPage() {
  return <AjudaDetailClient />;
}
