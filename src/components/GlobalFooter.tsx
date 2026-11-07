"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Briefcase } from "lucide-react";

export default function GlobalFooter() {
  const { lang } = useLanguage();

  return (
    <footer className="w-full bg-stone-900 text-stone-300 font-sans border-t border-stone-800 pt-16 pb-12 mt-20 block clear-both">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
        {/* IDENTIDADE */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-stone-900 flex items-center justify-center font-black text-sm">
              E
            </div>
            <span className="font-black text-lg tracking-tight text-white">Ericeira Hub</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            {lang === "pt"
              ? "Plataforma comunitária curada para bem-estar, artes manuais, desporto e workshops na Ericeira."
              : "Curated community hub for wellness, crafts, surf and workshops in Ericeira."}
          </p>
          <div className="text-[11px] text-stone-400">
            📍 Ericeira & São Pedro da Cadeira, Mafra
          </div>
        </div>

        {/* COMUNIDADE */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
            {lang === "pt" ? "Comunidade" : "Community"}
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <Link href="/" className="hover:text-white transition">
                {lang === "pt" ? "Calendário de Aulas" : "Class Schedule"}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white transition">
                {lang === "pt" ? "Minhas Reservas" : "My Bookings"}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition">
                {lang === "pt" ? "Termos & Cancelamentos" : "Terms & Cancellations"}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition">
                {lang === "pt" ? "Política de Privacidade" : "Privacy Policy"}
              </Link>
            </li>
          </ul>
        </div>

        {/* PARCEIROS */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-orange-500">
            {lang === "pt" ? "Prestadores & Estúdios" : "Partners & Studios"}
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <Link
                href="/become-a-partner"
                className="text-white font-bold hover:text-orange-400 transition flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                <span>{lang === "pt" ? "Torne-se Parceiro do Hub" : "Become a Partner"}</span>
              </Link>
            </li>
            <li>
              <Link href="/provider/portal" className="hover:text-white transition">
                {lang === "pt" ? "Portal do Instrutor" : "Host Portal"}
              </Link>
            </li>
          </ul>
        </div>

        {/* APOIO AO CONSUMIDOR */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
            {lang === "pt" ? "Apoio ao Consumidor" : "Consumer Support"}
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <a
                href="https://www.livroreclamacoes.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                {lang === "pt" ? "Livro de Reclamações Eletrónico ↗" : "Electronic Complaints Book ↗"}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
        <p>© 2026 Ericeira Hub. Todos os direitos reservados.</p>
        <p className="text-[11px]">Next.js • Supabase • Stripe</p>
      </div>
    </footer>
  );
}

