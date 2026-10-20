"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import PackagesModal from "@/components/PackagesModal";
import WellnessSection from "@/components/WellnessSection";
import CommunitySection from "@/components/CommunitySection";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";
import { Sun, Wind, Waves, User, LogOut, Sparkles, ArrowUpRight } from "lucide-react";

export default function EriceiraHub() {
  const { lang, t } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetchInitialData();
    checkUserSession();

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        setActionMessage({ text: "Good vibes! Pagamento confirmado e créditos ativos." });
      } else if (urlParams.get("payment") === "cancelled") {
        setActionMessage({ text: "Checkout cancelado.", error: true });
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      fetchUserProfile(session.user.id);
    }
  }

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    } else if (error && error.code === "PGRST116") {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ id: userId, credits_balance: 5 })
        .select()
        .single();
      if (newProfile) setUserProfile(newProfile);
    }
  }

  async function fetchInitialData() {
    setLoading(true);
    const { data: eventsData } = await supabase
      .from("events")
      .select("*, providers(name, slug)")
      .order("start_time", { ascending: true });

    const { data: guidesData } = await supabase.from("concierge_guides").select("*");
    const { data: b2bData } = await supabase.from("providers").select("*").in("type", ["freelancer", "both"]);

    if (eventsData) setEvents(eventsData);
    if (guidesData) setGuides(guidesData);
    if (b2bData) setFreelancers(b2bData);
    setLoading(false);
  }

  async function handleBuyCreditPackage(packageId: string) {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          itemType: "credit_package",
          packageId,
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setActionMessage({ text: data.error || "Erro ao iniciar compra.", error: true });
    } catch {
      setActionMessage({ text: "Erro ao ligar ao Stripe.", error: true });
    }
  }

  async function handleBuySingleTicket(event: any) {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          itemType: "single_ticket",
          eventId: event.id,
          eventTitle: event.title_en,
          priceEur: event.price_eur,
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setActionMessage({ text: data.error || "Erro ao iniciar compra.", error: true });
    } catch {
      setActionMessage({ text: "Erro ao ligar ao Stripe.", error: true });
    }
  }

  async function handleBookWithCredits(event: any) {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    const neededCredits = event.credits_cost || Math.round(event.price_eur / 5);

    if (!userProfile || userProfile.credits_balance < neededCredits) {
      setActionMessage({
        text: lang === "pt"
          ? `Precisas de ${neededCredits} créditos (tens ${userProfile?.credits_balance ?? 0}). Recarrega o teu Ericeira Pass ou compra bilhete avulso.`
          : `You need ${neededCredits} credits (balance: ${userProfile?.credits_balance ?? 0}). Top up your Pass or grab a drop-in ticket.`,
        error: true,
      });
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, userId: currentUser.id }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Erro ao processar a reserva.");
      }

      setActionMessage({ text: `You're in! Vaga confirmada em ${event.title_en}.` });
      fetchUserProfile(currentUser.id);
      fetchInitialData();
    } catch (err: any) {
      setActionMessage({ text: err.message, error: true });
    }
  }

  async function handleSubscribeConcierge() {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          itemType: "concierge_subscription",
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setActionMessage({ text: data.error || "Erro ao iniciar subscrição.", error: true });
    } catch {
      setActionMessage({ text: "Erro ao ligar ao Stripe.", error: true });
    }
  }

  const isConciergeActive = Boolean(userProfile?.concierge_tier && userProfile.concierge_tier !== "free");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans selection:bg-orange-200">
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />

      <PackagesModal
        isOpen={isPackagesOpen}
        onClose={() => setIsPackagesOpen(false)}
        onSelectPackage={handleBuyCreditPackage}
      />

      {/* TOP SURF & VIBE TICKER BAR */}
      <div className="bg-stone-900 text-[#FAF8F5] text-[11px] font-medium py-2 px-4 border-b border-stone-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between overflow-x-auto whitespace-nowrap gap-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
              <Waves className="w-3.5 h-3.5" /> Ribeira d&apos;Ilhas: 1.4m • 14s
            </span>
            <span className="inline-flex items-center gap-1 text-stone-300">
              <Wind className="w-3 h-3 text-teal-400" /> Offshore E 8kt
            </span>
            <span className="inline-flex items-center gap-1 text-stone-300">
              <Sun className="w-3 h-3 text-orange-400" /> 21°C Sunset 19:45
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-stone-400">
            <span>🏄‍♂️ Surf</span> • <span>🧘‍♀️ Yoga</span> • <span>🛹 Skate</span> • <span>☕ Specialty Coffee</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`sticky top-0 z-40 p-3 text-center text-xs font-bold tracking-wide ${
          actionMessage.error ? "bg-rose-600 text-white" : "bg-stone-900 text-amber-300"
        }`}>
          {actionMessage.text}
          <button onClick={() => setActionMessage(null)} className="ml-4 underline cursor-pointer text-white">
            ✕
          </button>
        </div>
      )}

      {/* NAVBAR MINIMALISTA & LEVE */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 flex items-center justify-center text-[#FAF8F5] font-black text-xl tracking-tighter shadow-xs">
              e.
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-stone-900">
                ericeira<span className="text-orange-600 font-light italic">club</span>
              </span>
              <span className="block text-[9px] font-bold tracking-widest uppercase text-stone-400">
                Surf • Mind • Community
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-stone-500">
            <a href="#wellness" className="hover:text-stone-900 transition">Lineup & Sessions</a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector />

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { window.location.href = "/dashboard"; }}
                  className="text-xs bg-white text-stone-900 border border-stone-300 hover:border-stone-900 px-4 py-2 rounded-full font-bold transition cursor-pointer shadow-2xs"
                >
                  ⚡ {userProfile?.credits_balance ?? 0} {t("credits")}
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="p-2 text-stone-400 hover:text-stone-900 cursor-pointer"
                  title={t("btn_logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-stone-900 text-[#FAF8F5] hover:bg-orange-600 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" /> {t("btn_login")}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO EDITORIAL SOLAR & DESCONTRAÍDO */}
      <section className="pt-8 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Coluna Esquerda: Editorial Copy + Imagem Surf/Skate */}
            <div className="lg:col-span-7 bg-white rounded-[32px] p-8 sm:p-12 border border-stone-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
                  <Sparkles className="w-3.5 h-3.5" /> Ericeira Local Collective
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 leading-[1.08]">
                  {lang === "pt" ? (
                    <>
                      Sal no cabelo, <span className="italic font-serif font-normal text-orange-600">yoga ao pôr do sol</span> & vida em comunidade.
                    </>
                  ) : (
                    <>
                      Saltwater sessions, <span className="italic font-serif font-normal text-orange-600">sunset flows</span> & village life.
                    </>
                  )}
                </h1>

                <p className="text-stone-500 text-sm sm:text-base max-w-xl leading-relaxed">
                  {lang === "pt"
                    ? "O ponto de encontro digital da Ericeira. Junta-te a sessões de surf, skate bowls, breathwork e café de especialidade com os melhores locais — e instala a tua família sem stress."
                    : "Ericeira's curated digital hangout. Drop into surf coaching, skate bowls, breathwork, and specialty coffee with local legends — plus seamless family relocation."}
                </p>
              </div>

              {/* Mini Galeria Lifestyle */}
              <div className="grid grid-cols-3 gap-3 pt-8 mt-8 border-t border-stone-100">
                <div className="relative h-24 rounded-2xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=500&q=80"
                    alt="Surf Ericeira"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    Surf Coaching
                  </span>
                </div>
                <div className="relative h-24 rounded-2xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80"
                    alt="Yoga Santa Marta"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    Mind & Flow
                  </span>
                </div>
                <div className="relative h-24 rounded-2xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?auto=format&fit=crop&w=500&q=80"
                    alt="Skate & Coffee"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    Skate & Culture
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Cartão Ericeira Pass Estilo "All-Access Club Pass" */}
            <div className="lg:col-span-5 bg-[#1C1917] text-[#FAF8F5] rounded-[32px] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80"
                alt="Beach Vibe"
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
              />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest bg-amber-300 text-stone-900 px-3 py-1 rounded-full">
                    Club Pass • 1 Créd = 5€
                  </span>
                  <span className="text-xs text-stone-400 font-mono">EST. 2625 ERICEIRA</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight">The Ericeira Pass</h2>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {lang === "pt"
                      ? "Um único passe para toda a vila. Faz surf de manhã na Foz, skate em Santa Marta à tarde e yoga ou prova de vinhos ao pôr do sol."
                      : "One pass for the whole village. Surf Foz in the morning, skate Santa Marta at noon, and drop into sunset yoga or wine tasting."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-300 font-bold block">
                      35 Créditos (7-9 Sessões)
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black">165€</span>
                      <span className="text-xs text-stone-400 line-through">210€ avulso</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-stone-300 space-y-1">
                    <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold block">
                      Poupa 45€
                    </span>
                    <span className="block text-stone-400">Válido 6 meses</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6 space-y-3">
                <button
                  onClick={() => setIsPackagesOpen(true)}
                  className="w-full py-4 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  {lang === "pt" ? "Escolher Pacote (Desde 59€)" : "Get Your Club Pass (From 59€)"}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-stone-400">
                  {lang === "pt" ? "Ou reserva qualquer sessão avulso diretamente abaixo ↓" : "Or book any session as a single drop-in below ↓"}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-20">
        <WellnessSection
          events={events}
          loading={loading}
          onBookWithCredits={handleBookWithCredits}
          onBuySingleTicket={handleBuySingleTicket}
        />
        {/* Secções de Concierge e B2B ocultadas temporariamente */}
      </main>
    </div>
  );
}