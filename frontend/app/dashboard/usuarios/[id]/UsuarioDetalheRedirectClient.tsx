"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsuarioDetalheRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/usuarios");
  }, [router]);

  return null;
}
