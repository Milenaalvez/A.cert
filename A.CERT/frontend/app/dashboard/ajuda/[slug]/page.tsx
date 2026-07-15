import { categorias } from "@/data/ajuda";
import AjudaDetailClient from "./AjudaDetailClient";

export function generateStaticParams() {
  return categorias.map(c => ({ slug: c.slug }));
}

export default function AjudaDetailPage() {
  return <AjudaDetailClient />;
}
