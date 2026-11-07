"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import type { User } from "@supabase/supabase-js";
import {
  Waves,
  Wind,
  Sparkles,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  Compass,
} from "lucide-react";

/**
 * NOTA: estes valores são ESTÁTICOS e meramente indicativos (não são dados em tempo real).
 * Para dados reais por praia é preciso escolher um fornecedor de previsão marítima.
 */
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

export default function HeaderNav() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [spotIdx, setSpotIdx] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUserData(userId: string) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("credits_balance, is_admin")
        .eq("id", userId)
        .maybeSingle();
      setProfile(prof || null);
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
                {lang === "pt" ? "Condições típicas · indicativo" : "Typical conditions · indicative"}
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

        {/* BARRA PRINCIPAL */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-sm group-hover:bg-orange-600 transition">
              E
            </div>
            <div>
              <span className="font-black text-sm sm:text-base tracking-tight text-stone-900 block leading-tight">
                Ericeira Hub
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-400 block -mt-0.5">
                Community
              </span>
            </div>
          </Link>

          {/* MENUS E BOTÕES (SEMPRE VISÍVEIS) */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
            {/* Seletor PT / EN */}
            <div className="flex items-center bg-stone-100 rounded-full p-0.5 sm:p-1 border border-stone-200 text-xs font-bold">
              <button
                onClick={() => setLang("pt")}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition cursor-pointer ${
                  lang === "pt"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                PT
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition cursor-pointer ${
                  lang === "en"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                EN
              </button>
            </div>

            {/* Créditos (se autenticado) */}
            {user && profile && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-950 text-xs font-extrabold hover:bg-orange-100 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{profile.credits_balance || 0} cr.</span>
              </Link>
            )}

            {/* Torne-se Parceiro (SEMPRE VISÍVEL) */}
            <Link
              href="/become-a-partner"
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-orange-600 hover:bg-orange-50 transition border border-stone-200"
            >
              <Briefcase className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="whitespace-nowrap">
                {lang === "pt" ? "Ser Parceiro" : "Partner"}
              </span>
            </Link>

            {/* Área Parceiro (SEMPRE VISÍVEL) */}
            <Link
              href="/provider/portal"
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition border border-stone-200"
            >
              <Compass className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              <span className="whitespace-nowrap">
                {lang === "pt" ? "Área Parceiro" : "Host Area"}
              </span>
            </Link>

            {/* Botão Admin Direto (se is_admin for true) */}
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 text-xs font-black hover:bg-purple-200 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>Admin</span>
              </Link>
            )}

            {/* Perfil / Login */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center">
                    {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 text-xs font-semibold text-stone-700">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-[10px] text-stone-400 uppercase font-black">Conta</p>
                      <p className="truncate text-stone-900 font-bold">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-700 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-stone-400" />
                      <span>{lang === "pt" ? "A Minha Área / Reservas" : "My Dashboard"}</span>
                    </Link>

                    <Link
                      href="/provider/portal"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-700 transition"
                    >
                      <Compass className="w-4 h-4 text-orange-600" />
                      <span>{lang === "pt" ? "Portal do Instrutor" : "Host Portal"}</span>
                    </Link>

                    {profile?.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 text-purple-900 font-bold transition border-t border-b border-stone-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>{lang === "pt" ? "Painel de Administração" : "Admin Dashboard"}</span>
                      </Link>
                    )}

                    <Link
                      href="/become-a-partner"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-700 transition"
                    >
                      <Briefcase className="w-4 h-4 text-stone-400" />
                      <span>{lang === "pt" ? "Candidatar Novo Estúdio" : "Apply as Partner"}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition border-t border-stone-100 cursor-pointer"
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
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-stone-900 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition shadow-xs cursor-pointer"
              >
                {lang === "pt" ? "Entrar" : "Sign In"}
              </button>
            )}
          </div>
        </div>
      </header>

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

