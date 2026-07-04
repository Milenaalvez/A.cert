import ConfirmarEmailClient from "./ConfirmarEmailClient";

export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function ConfirmarEmailPage() {
  return <ConfirmarEmailClient />;
}
