"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import { Waves, Wind, Sparkles, LogOut, User } from "lucide-react";

interface SpotWeather {
  name: string;
  temp: number;
  swell: string;
  wind: string;
  tide: string;
}

const ERICEIRA_SPOTS: SpotWeather[] = [
  {
    name: "Ribeira d'Ilhas",
    temp: 18,
    swell: "1.5m - 1.8m NO",
    wind: "9 kts N",
    tide: "Vazia 14:20",
  },
  {
    name: "Foz do Lizandro",
    temp: 18,
    swell: "1.2m - 1.5m O",
    wind: "8 kts NNO",
    tide: "Vazia 14:22",
  },
  {
    name: "Praia dos Pescadores",
    temp: 19,
    swell: "0.8m - 1.0m",
    wind: "6 kts N",
    tide: "Vazia 14:18",
  },
  {
    name: "Coxos",
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
  const [spotIdx, setSpotIdx] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("credits_balance")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setProfile(data));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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
        {/* BARRA METEOROLÓGICA MULTI-SPOT */}
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
                  {s.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BARRA PRINCIPAL */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
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

            {/* Saldo de Créditos */}
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

            {/* Link para o Formulário de Tornar-se Parceiro */}
            <Link
              href="/become-a-partner"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition"
            >
              {lang === "pt" ? "Ser Parceiro" : "Become a Partner"}
            </Link>

            {/* Portal do Parceiro */}
            <Link
              href="/provider/portal"
              className="hidden md:inline-block px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-900 transition"
            >
              {lang === "pt" ? "Área Parceiro" : "Host Portal"}
            </Link>

            {/* Autenticação com o AuthModal Original */}
            {user ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
                  title="Dashboard"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title={lang === "pt" ? "Terminar sessão" : "Sign out"}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {lang === "pt" ? "Entrar" : "Sign In"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MODAL DE LOGIN ORIGINAL */}
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-[#FDFBF7] antialiased">
        <LanguageProvider>
          <HeaderNav />
          <main>{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}