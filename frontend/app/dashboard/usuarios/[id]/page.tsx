"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export function generateStaticParams() {
  return [];
}

export default function UsuarioDetalheRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/usuarios");
  }, [router]);

  return null;
}
