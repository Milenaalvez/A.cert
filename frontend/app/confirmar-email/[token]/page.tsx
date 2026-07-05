import { Suspense } from "react";
import ConfirmarEmailClient from "./ConfirmarEmailClient";

export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarEmailClient />
    </Suspense>
  );
}
