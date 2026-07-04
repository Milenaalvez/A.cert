"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UsuarioDetalheRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/usuarios");
  }, [router]);

  return null;
}
