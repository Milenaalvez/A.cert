import UsuarioDetalheRedirectClient from "./UsuarioDetalheRedirectClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function UsuarioDetalheRedirect() {
  return <UsuarioDetalheRedirectClient />;
}
