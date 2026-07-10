import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/i18n/LocaleContext";
import IntlWrapper from "./IntlWrapper";

export const metadata: Metadata = {
  title: "A.CERT — Central de Certidões Imobiliárias",
  description:
    "Centralize documentos, acompanhe emissões e gere dossiês completos em poucos minutos.",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <IntlWrapper>
            <ThemeProvider initialTheme="light">{children}</ThemeProvider>
          </IntlWrapper>
        </LocaleProvider>
      </body>
    </html>
  );
}
