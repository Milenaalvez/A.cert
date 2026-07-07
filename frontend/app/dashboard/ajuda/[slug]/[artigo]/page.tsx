import { artigosDetalhes } from "@/data/ajuda";
import ArtigoDetailClient from "./ArtigoDetailClient";

export function generateStaticParams() {
  const paths: { slug: string; artigo: string }[] = [];
  for (const [key, artigo] of Object.entries(artigosDetalhes)) {
    paths.push({ slug: artigo.categoria, artigo: artigo.slug });
  }
  return paths;
}

export default function ArtigoDetailPage() {
  return <ArtigoDetailClient />;
}
