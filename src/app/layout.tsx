"use client";

import "./globals.css";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import {
  Waves,
  Wind,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  Compass,
} from "lucide-react";

interface SpotWeather {
  name: string;
  shortLabel: string;
  temp: number;
  swell: string;
  wind: string;
  tide: string;
}

const ERICEIRA_SPOTS: SpotWeather[] = [
  {
    name: "Ribeira d'Ilhas",
    shortLabel: "Ribeira d'ilhas",
    temp: 18,
    swell: "1.5m - 1.8m NO",
    wind: "9 kts N",
    tide: "Vazia 14:20",
  },
  {
    name: "Foz do Lizandro",
    shortLabel: "Foz",
    temp: 18,
    swell: "1.2m - 1.5m O",
    wind: "8 kts NNO",
    tide: "Vazia 14:22",
  },
  {
    name: "Praia dos Pescadores",
    shortLabel: "Pescadores",
    temp: 19,
    swell: "0.8m - 1.0m",
    wind: "6 kts N",
    tide: "Vazia 14:18",
  },
  {
    name: "Coxos",
    shortLabel: "Coxos",
    temp: 18,
    swell: "1.8m - 2.2m NO",
    wind: "11 kts N",
    tide: "Vazia 14:25",
  },
];

function HeaderNav() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [spotIdx, setSpotIdx] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUserData(userId: string) {
      const [{ data: prof }, { data: prov }] = await Promise.all([
        supabase.from("profiles").select("credits_balance, is_admin").eq("id", userId).maybeSingle(),
        supabase.from("providers").select("id").eq("user_id", userId).maybeSingle(),
      ]);
      setProfile(prof || null);
      setIsProvider(!!prov);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setIsProvider(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpotIdx((prev) => (prev + 1) % ERICEIRA_SPOTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const spot = ERICEIRA_SPOTS[spotIdx];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200/70">
        {/* BARRA METEOROLÓGICA */}
        <div className="bg-stone-900 text-stone-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-stone-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="font-black text-amber-400 uppercase tracking-widest text-[9px] shrink-0">
                🌊 Live Conditions
              </span>

              <div className="flex items-center gap-2.5 truncate">
                <span className="font-extrabold text-white">{spot.name}:</span>
                <span className="flex items-center gap-1">
                  <Waves className="w-3 h-3 text-cyan-400" />
                  {spot.swell}
                </span>
                <span className="hidden sm:inline text-stone-500">•</span>
                <span className="hidden sm:flex items-center gap-1">
                  <Wind className="w-3 h-3 text-emerald-400" />
                  {spot.wind}
                </span>
                <span className="hidden md:inline text-stone-500">•</span>
                <span className="hidden md:inline text-stone-400">{spot.tide}</span>
                <span className="text-stone-300 font-bold ml-1">{spot.temp}ºC</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5">
              {ERICEIRA_SPOTS.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setSpotIdx(i)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                    spotIdx === i
                      ? "bg-white/20 text-white font-black"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {s.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BARRA PRINCIPAL DE NAVEGAÇÃO */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-sm group-hover:bg-orange-600 transition">
              E
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-stone-900 block leading-tight">
                Ericeira Hub
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block -mt-0.5">
                Community Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seletor PT / EN */}
            <div className="flex items-center bg-stone-100 rounded-full p-1 border border-stone-200 text-xs font-bold">
              <button
                onClick={() => setLang("pt")}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  lang === "pt"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                PT
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  lang === "en"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                EN
              </button>
            </div>

            {/* Saldo de Créditos para utilizadores autenticados */}
            {user && profile && (
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-950 text-xs font-extrabold hover:bg-orange-100 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {profile.credits_balance || 0} {lang === "pt" ? "créditos" : "credits"}
                </span>
              </Link>
            )}

            {/* Link Permanente: Torne-se Parceiro */}
            <Link
              href="/become-a-partner"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-orange-600 hover:bg-orange-50 transition border border-stone-200 hover:border-orange-200"
            >
              <Briefcase className="w-3.5 h-3.5 text-orange-600" />
              <span>{lang === "pt" ? "Torne-se Parceiro" : "Become a Partner"}</span>
            </Link>

            {/* Link Permanente: Área Parceiro */}
            <Link
              href="/provider/portal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            >
              <Compass className="w-3.5 h-3.5 text-stone-500" />
              <span>{lang === "pt" ? "Área Parceiro" : "Host Portal"}</span>
            </Link>

            {/* Link Direto: Painel de Administrador (visível se is_admin for true) */}
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-extrabold hover:bg-purple-100 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin</span>
              </Link>
            )}

            {/* Bloco de Utilizador com Dropdown */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center">
                    {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs font-semibold text-stone-700 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider">Conta</p>
                      <p className="truncate text-stone-900 font-bold">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 hover:text-stone-900 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-stone-400" />
                      <span>{lang === "pt" ? "A Minha Área / Reservas" : "My Dashboard"}</span>
                    </Link>

                    <Link
                      href="/provider/portal"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 hover:text-stone-900 transition"
                    >
                      <Compass className="w-4 h-4 text-orange-600" />
                      <span>{lang === "pt" ? "Portal do Instrutor / Anfitrião" : "Host & Studio Portal"}</span>
                    </Link>

                    {profile?.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-purple-50 text-purple-900 font-bold transition border-t border-b border-stone-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>{lang === "pt" ? "Painel de Administração" : "Admin Dashboard"}</span>
                      </Link>
                    )}

                    <Link
                      href="/become-a-partner"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 hover:text-stone-900 transition"
                    >
                      <Briefcase className="w-4 h-4 text-stone-400" />
                      <span>{lang === "pt" ? "Candidatar Novo Estúdio" : "Apply as New Partner"}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition border-t border-stone-100 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{lang === "pt" ? "Terminar Sessão" : "Sign Out"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition shadow-xs cursor-pointer"
              >
                {lang === "pt" ? "Entrar" : "Sign In"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MODAL DE LOGIN */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}

function GlobalFooter() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 font-sans border-t border-stone-800 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
        {/* COLUNA 1: IDENTIDADE */}
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

        {/* COLUNA 2: COMUNIDADE */}
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
              <Link href="/guides/health" className="hover:text-white transition">
                {lang === "pt" ? "Guia Local & Família" : "Local Family Guide"}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition">
                {lang === "pt" ? "Termos & Regras de Cancelamento" : "Terms & Cancellations"}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition">
                {lang === "pt" ? "Política de Privacidade" : "Privacy Policy"}
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUNA 3: PARA PARCEIROS & ESTÚDIOS */}
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
                <span>{lang === "pt" ? "Torne-se Parceiro do Hub" : "Become a Hub Partner"}</span>
              </Link>
            </li>
            <li>
              <Link href="/provider/portal" className="hover:text-white transition">
                {lang === "pt" ? "Portal do Instrutor (Sessões & Vagas)" : "Host Portal (Sessions & Spots)"}
              </Link>
            </li>
            <li>
              <span className="text-[11px] text-stone-400 block pt-1">
                {lang === "pt"
                  ? "Cobrança integrada com liquidações automáticas e alertas Telegram."
                  : "Automated payouts and real-time Telegram booking notifications."}
              </span>
            </li>
          </ul>
        </div>

        {/* COLUNA 4: GESTÃO & ADMIN */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
            {lang === "pt" ? "Acesso Interno" : "Operations"}
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <Link
                href="/admin"
                className="hover:text-purple-400 transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>{lang === "pt" ? "Painel de Administração" : "Admin Operations"}</span>
              </Link>
            </li>
            <li className="pt-2 text-[10px] text-stone-400 leading-tight">
              {lang === "pt"
                ? "Acesso restrito a administradores para aprovação de parceiros e relatórios financeiros."
                : "Restricted access for partner approvals and payout reconciliations."}
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-[#FDFBF7] antialiased flex flex-col min-h-screen">
        <LanguageProvider>
          <HeaderNav />
          <main className="flex-1">{children}</main>
          <GlobalFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}