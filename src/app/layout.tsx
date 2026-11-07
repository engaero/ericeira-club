import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import HeaderNav from "@/components/HeaderNav";
import GlobalFooter from "@/components/GlobalFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ericeira-club.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ericeira Hub — Aulas, workshops e comunidade na Ericeira",
    template: "%s · Ericeira Hub",
  },
  description:
    "Plataforma comunitária para reservar yoga, treino de surf, cerâmica, vinho, português e workshops na Ericeira e em Mafra. Ericeira Pass com créditos.",
  openGraph: {
    type: "website",
    siteName: "Ericeira Hub",
    title: "Ericeira Hub — Aulas, workshops e comunidade na Ericeira",
    description: "Reserva sessões de bem-estar, artes, sabor e línguas na Ericeira com o Ericeira Pass.",
    locale: "pt_PT",
    alternateLocale: ["en_GB"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FDFBF7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // O atributo lang é atualizado no cliente pelo LanguageProvider quando o idioma muda.
    <html lang="pt" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#FDFBF7] text-stone-900 antialiased flex flex-col min-h-screen">
        <LanguageProvider>
          <HeaderNav />
          <main className="flex-grow">{children}</main>
          <GlobalFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
