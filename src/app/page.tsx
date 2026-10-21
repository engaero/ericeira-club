"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import EventDetailModal from "@/components/EventDetailModal";
import {
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Compass,
} from "lucide-react";

// Categorias organizadas pelos 4 eixos estratégicos do Hub
const CATEGORY_TABS = [
  { id: "all", label_pt: "Tudo", label_en: "All" },
  { id: "corpo_mente", label_pt: "🧘 Corpo & Mente", label_en: "🧘 Body & Mind" },
  { id: "artes_oficinas", label_pt: "🎨 Artes & Oficinas", label_en: "🎨 Arts & Crafts" },
  { id: "sabor_tradicao", label_pt: "🍷 Sabor & Tradição", label_en: "🍷 Taste & Wine" },
  { id: "comunidade_linguas", label_pt: "💬 Línguas & Social", label_en: "💬 Languages & Social" },
];

const CATEGORY_MAPPING: Record<string, string[]> = {
  corpo_mente: ["wellness", "surf", "breathwork", "yoga"],
  artes_oficinas: ["crafts", "ceramics"],
  sabor_tradicao: ["wine", "coffee"],
  comunidade_linguas: ["ple", "social"],
};

const CATEGORY_COVERS: Record<string, string> = {
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  surf: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80",
  breathwork: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
  crafts: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
  ceramics: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  ple: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  social: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
};

export default function HomePage() {
  const { lang } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchUserAndProfile();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          providers (
            id,
            name,
            bio_pt,
            bio_en,
            avatar_url,
            instagram_handle,
            telegram_chat_id
          )
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar sessões:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserAndProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data) setProfile(data);
    }
  }

  // Filtragem pelos grupos de eixos
  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === "all") return true;
    const allowed = CATEGORY_MAPPING[selectedCategory] || [];
    return allowed.includes(ev.category);
  });

  // Ação 1: Reserva com Créditos
  async function handleBookWithCredits(event: any) {
    if (!user) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Inicia sessão para reservar com créditos." : "Please sign in to book with credits.",
      });
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          userId: user.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao processar reserva.");

      setFeedback({
        type: "success",
        message: lang === "pt" ? "Vaga confirmada com sucesso!" : "Booking successfully confirmed!",
      });
      fetchEvents();
      fetchUserAndProfile();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  // Ação 2: Pagamento Direto / Checkout Stripe (Avulso)
  async function handleBuySingleTicket(event: any) {
    if (!user) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Inicia sessão para prosseguir para o pagamento." : "Please sign in to proceed to checkout.",
      });
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          itemType: "single_ticket",
          eventId: event.id,
          eventTitle: lang === "pt" ? event.title_pt || event.title_en : event.title_en || event.title_pt,
          priceEur: event.price_eur,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar checkout.");
      if (json.url) {
        window.location.href = json.url;
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
      setActionLoading(false);
    }
  }

  // Ação 3: Compra do Pacote de Créditos
  async function handleBuyCreditPackage(packageId: string) {
    if (!user) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Inicia sessão para adquirir o teu passe." : "Please sign in to purchase your pass.",
      });
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          itemType: "credit_package",
          packageId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao iniciar compra do passe.");
      if (json.url) {
        window.location.href = json.url;
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-900 pb-24">
      {/* MENSAGEM / FEEDBACK TOAST */}
      {feedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center justify-between border backdrop-blur-md ${
              feedback.type === "success"
                ? "bg-emerald-900/90 text-white border-emerald-700"
                : "bg-red-900/90 text-white border-red-700"
            }`}
          >
            <p className="text-xs font-semibold">{feedback.message}</p>
            <button
              onClick={() => setFeedback(null)}
              className="text-white/70 hover:text-white text-xs font-bold underline ml-4 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 text-orange-950 text-xs font-bold tracking-tight">
            <Compass className="w-3.5 h-3.5 text-orange-600" />
            <span>Ericeira & Mafra Community Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-stone-900">
            {lang === "pt" ? "Wellness, Oficinas e Tradição na Ericeira." : "Wellness, Crafts & Local Culture in Ericeira."}
          </h1>

          <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-2xl">
            {lang === "pt"
              ? "Práticas de corpo & mente, artesanias manuais, experiências gastronómicas e eventos comunitários. Reserva sessões regulares com o teu passe ou participa diretamente em workshops especiais."
              : "Body & mind practices, artisan workshops, gastronomic tours and community gatherings. Book regular sessions with your pass or join special workshops directly."}
          </p>

          {profile && (
            <div className="pt-2 flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {lang === "pt" ? "O teu saldo:" : "Your balance:"}{" "}
                <strong className="text-orange-600">{profile.credits_balance || 0}</strong> {lang === "pt" ? "créditos" : "credits"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* BARRA DE FILTROS */}
      <section className="sticky top-20 z-20 bg-[#FDFBF7]/90 backdrop-blur-md border-y border-stone-200/60 py-3.5 px-4 sm:px-8 mb-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === tab.id
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:border-stone-400"
              }`}
            >
              {lang === "pt" ? tab.label_pt : tab.label_en}
            </button>
          ))}
        </div>
      </section>

      {/* GRELHA DE EXPERIÊNCIAS & SESSÕES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
            {lang === "pt" ? "Próximas Sessões & Workshops" : "Upcoming Sessions & Workshops"}
          </h2>
          <span className="text-xs font-semibold text-stone-500">
            {filteredEvents.length} {lang === "pt" ? "disponíveis" : "available"}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-stone-400 tracking-wider uppercase">
            {lang === "pt" ? "A carregar agenda..." : "Loading schedule..."}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/70 p-8 space-y-2">
            <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-extrabold text-stone-800 text-sm">
              {lang === "pt" ? "Sem sessões agendadas nesta categoria" : "No sessions found in this category"}
            </h3>
            <p className="text-xs text-stone-500">
              {lang === "pt" ? "Seleciona outra categoria para ver a programação." : "Select another filter to explore available activities."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const spotsLeft = ev.max_spots - ev.booked_spots;
              const isSoldOut = spotsLeft <= 0;
              const isCreditsAllowed = (ev.pricing_model ?? "credits_allowed") === "credits_allowed";
              const creditsCost = ev.credits_cost || Math.round(ev.price_eur / 5);
              const coverImg = CATEGORY_COVERS[ev.category] || CATEGORY_COVERS.wellness;

              const title = lang === "pt" ? ev.title_pt || ev.title_en : ev.title_en || ev.title_pt;
              const dateStr = new Date(ev.start_time).toLocaleDateString(lang === "pt" ? "pt-PT" : "en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = new Date(ev.start_time).toLocaleTimeString(lang === "pt" ? "pt-PT" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="group bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Imagem de Capa */}
                    <div className="relative h-48 w-full bg-stone-900 overflow-hidden">
                      <img
                        src={coverImg}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute top-3.5 left-3.5 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-stone-900 shadow-xs">
                          {ev.category}
                        </span>
                        {!isCreditsAllowed && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs">
                            Workshop
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 text-white flex items-center justify-between text-xs">
                        <span className="font-bold capitalize flex items-center gap-1 text-amber-300">
                          🗓️ {dateStr} • {timeStr}
                        </span>
                        <span className="text-[11px] text-stone-300 font-semibold">{ev.duration_minutes} min</span>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-extrabold text-stone-900 text-base leading-snug group-hover:text-orange-600 transition">
                        {title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">{ev.location_name}</span>
                      </div>

                      {ev.providers && (
                        <div className="flex items-center gap-2 pt-1">
                          {ev.providers.avatar_url ? (
                            <img
                              src={ev.providers.avatar_url}
                              alt={ev.providers.name}
                              className="w-6 h-6 rounded-full object-cover border border-stone-200"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 font-bold text-[10px] flex items-center justify-center">
                              {ev.providers.name?.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-stone-700 truncate">
                            {ev.providers.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Cartão */}
                  <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between bg-[#FAF9F6]">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-stone-900 text-lg">{ev.price_eur}€</span>
                        {isCreditsAllowed && (
                          <span className="text-[11px] text-stone-500 font-medium">
                            {lang === "pt" ? "ou" : "or"}{" "}
                            <strong className="text-stone-800">{creditsCost} cr.</strong>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-stone-400" />
                        {isSoldOut ? "Esgotado" : `${spotsLeft} vagas restantes`}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{lang === "pt" ? "Ver Detalhes" : "Details"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECÇÃO DO ERICEIRA PASS (COMPRA DE CRÉDITOS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-20">
        <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white rounded-[36px] p-8 sm:p-12 border border-stone-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10 mb-8">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-600 text-white inline-block">
              {lang === "pt" ? "Passe Comunitário Multi-Estúdio" : "Multi-Studio Community Pass"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              {lang === "pt" ? "Ericeira Pass: Flexibilidade Sem Fidelização" : "Ericeira Pass: Full Flexibility, No Lock-in"}
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed">
              {lang === "pt"
                ? "Um único saldo de créditos para reservares aulas em múltiplos estúdios parceiros na vila. Paga com MB WAY, Cartão ou PayPal e usa ao teu ritmo."
                : "A single credit balance to book sessions across multiple verified partner studios. Pay with MB WAY, Card or PayPal and use at your own pace."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Pacote 12 */}
            <div className="bg-stone-800/80 rounded-3xl p-6 border border-stone-700/80 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Iniciação</span>
                <h3 className="text-2xl font-black">12 Créditos</h3>
                <p className="text-xs text-stone-400">Ideal para ~3 a 4 aulas de Yoga, Breathwork ou Surf Conditioning.</p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">59€</span>
                </div>
              </div>

              <button
                disabled={actionLoading}
                onClick={() => handleBuyCreditPackage("pack_12")}
                className="w-full py-3 rounded-2xl bg-white hover:bg-stone-200 text-stone-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {lang === "pt" ? "Comprar 12 Créditos" : "Buy 12 Credits"}
              </button>
            </div>

            {/* Pacote 35 (Destaque) */}
            <div className="bg-orange-600/90 rounded-3xl p-6 border border-orange-400 flex flex-col justify-between space-y-6 relative shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-200">Mais Popular</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-700 text-[10px] font-black uppercase">
                    Melhor Valor
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">35 Créditos</h3>
                <p className="text-xs text-orange-100">O passe ideal para residentes e praticantes regulares (8 a 10 aulas).</p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">165€</span>
                  <span className="text-xs text-orange-200 ml-1.5">(4,71€ / crédito)</span>
                </div>
              </div>

              <button
                disabled={actionLoading}
                onClick={() => handleBuyCreditPackage("pack_35")}
                className="w-full py-3 rounded-2xl bg-stone-950 hover:bg-black text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                {lang === "pt" ? "Comprar Ericeira Pass" : "Buy Ericeira Pass"}
              </button>
            </div>

            {/* Pacote 70 */}
            <div className="bg-stone-800/80 rounded-3xl p-6 border border-stone-700/80 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Comunidade & Família</span>
                <h3 className="text-2xl font-black">70 Créditos</h3>
                <p className="text-xs text-stone-400">Para quem treina quase diariamente ou partilha entre o casal.</p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">315€</span>
                  <span className="text-xs text-stone-400 ml-1.5">(4,50€ / crédito)</span>
                </div>
              </div>

              <button
                disabled={actionLoading}
                onClick={() => handleBuyCreditPackage("pack_70")}
                className="w-full py-3 rounded-2xl bg-white hover:bg-stone-200 text-stone-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {lang === "pt" ? "Comprar 70 Créditos" : "Buy 70 Credits"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL DETALHE DO EVENTO / CHECKOUT */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        onBookWithCredits={handleBookWithCredits}
        onBuySingleTicket={handleBuySingleTicket}
      />
    </div>
  );
}