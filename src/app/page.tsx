"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import EventDetailModal from "@/components/EventDetailModal";
import PackagesModal from "@/components/PackagesModal";
import Image from "next/image";
import { authJson } from "@/lib/apiClient";
import {
  CATEGORY_TABS,
  CATEGORY_MAPPING,
  CATEGORY_LABELS_MAP,
  CATEGORY_COVERS,
} from "@/lib/categories";
import {
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Compass,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Zap,
  Ticket,
} from "lucide-react";

export default function HomePage() {
  const { lang } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPackages, setShowPackages] = useState(false);

  useEffect(() => {
    loadUser();
    loadEvents();
  }, []);

  // Retorno do Stripe (?payment=success|cancelled): mostra o resultado e espera pelo webhook.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;

    window.history.replaceState({}, "", window.location.pathname);

    if (payment === "cancelled") {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Pagamento cancelado. Não foi cobrado nada." : "Payment cancelled. You were not charged.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message:
        lang === "pt" ? "Pagamento recebido! A confirmar a tua compra…" : "Payment received! Confirming your purchase…",
    });

    // O webhook pode demorar alguns segundos (MB WAY, etc.): refresca saldo e sessões algumas vezes.
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      loadUser();
      loadEvents();
      if (attempts >= 6) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function errorMessage(err: unknown): string {
    const e = err as { code?: string; message?: string };
    const pt: Record<string, string> = {
      unauthenticated: "Inicia sessão para continuar.",
      insufficient_credits: "Saldo de créditos insuficiente.",
      credits_expired: "Os teus créditos expiraram.",
      event_full: "Esta sessão está esgotada.",
      event_started: "Esta sessão já começou.",
      already_booked: "Já tens uma vaga confirmada nesta aula.",
      direct_only_event: "Esta sessão só aceita pagamento direto em euros.",
    };
    const en: Record<string, string> = {
      unauthenticated: "Please sign in to continue.",
      insufficient_credits: "Not enough credits.",
      credits_expired: "Your credits have expired.",
      event_full: "This session is sold out.",
      event_started: "This session has already started.",
      already_booked: "You already have a confirmed spot in this class.",
      direct_only_event: "This session only accepts direct payment in euros.",
    };
    const dict = lang === "pt" ? pt : en;
    return (e.code && dict[e.code]) || e.message || (lang === "pt" ? "Ocorreu um erro." : "Something went wrong.");
  }

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user || null);

    if (session?.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("credits_balance, full_name")
        .eq("id", session.user.id)
        .maybeSingle();
      setProfile(prof || null);
    }
  }

  async function loadEvents() {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          provider_id,
          title_pt,
          title_en,
          description_pt,
          description_en,
          category,
          pricing_model,
          price_eur,
          credits_cost,
          max_spots,
          booked_spots,
          duration_minutes,
          start_time,
          location_name,
          google_maps_url,
          what_to_bring,
          image_url,
          providers (
            id,
            name,
            avatar_url,
            bio_pt,
            bio_en,
            instagram_handle
          )
        `)
        .gte("start_time", now)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar eventos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookWithCredits(eventOrId: any) {
    if (!user) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Inicia sessão para reservar." : "Please sign in to book.",
      });
      return;
    }

    const eventId = typeof eventOrId === "string" ? eventOrId : eventOrId?.id;
    if (!eventId) return;

    try {
      // authJson já serializa o corpo e envia o token; o servidor deduz o utilizador do token.
      await authJson("/api/bookings", { body: { eventId } });

      setFeedback({
        type: "success",
        message: lang === "pt" ? "Vaga reservada com sucesso!" : "Booking confirmed!",
      });

      setSelectedEvent(null);
      await loadEvents();
      await loadUser();
    } catch (err) {
      setFeedback({ type: "error", message: errorMessage(err) });
    }
  }

  async function handleBuySingleTicket(
    eventOrId: any,
    priceEur?: number,
    eventTitle?: string
  ) {
    if (!user) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Inicia sessão para comprar o bilhete." : "Please sign in to checkout.",
      });
      return;
    }

    const eventId = typeof eventOrId === "string" ? eventOrId : eventOrId?.id;

    if (!eventId) return;

    try {
      // Preço e título são lidos da base de dados pelo servidor — nunca enviar valores do cliente.
      const res = await authJson<{ url: string }>("/api/checkout", {
        body: { itemType: "single_ticket", eventId },
      });

      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setFeedback({ type: "error", message: errorMessage(err) });
    }
  }

  // Compra de pacotes de créditos (Ericeira Pass)
  async function handleBuyCreditPackage(packageId: string) {
    if (!user) {
      setFeedback({
        type: "error",
        message:
          lang === "pt"
            ? "Inicia sessão (botão no topo da página) para comprar créditos."
            : "Please sign in (button at the top of the page) to buy credits.",
      });
      return;
    }

    try {
      const res = await authJson<{ url: string }>("/api/checkout", {
        body: { itemType: "credit_package", packageId },
      });
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setFeedback({ type: "error", message: errorMessage(err) });
    }
  }

  // Filtragem
  const filteredEvents = events.filter((ev) => {
    if (selectedCategory !== "all") {
      const allowedCategories = CATEGORY_MAPPING[selectedCategory] || [];
      if (!allowedCategories.includes(ev.category)) {
        return false;
      }
    }

    if (selectedLocation !== "all" && ev.location_name !== selectedLocation) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle =
        (ev.title_pt && ev.title_pt.toLowerCase().includes(q)) ||
        (ev.title_en && ev.title_en.toLowerCase().includes(q));
      const matchDesc =
        (ev.description_pt && ev.description_pt.toLowerCase().includes(q)) ||
        (ev.description_en && ev.description_en.toLowerCase().includes(q));
      const matchProvider =
        ev.providers?.name && ev.providers.name.toLowerCase().includes(q);
      const matchLocation =
        ev.location_name && ev.location_name.toLowerCase().includes(q);

      if (!matchTitle && !matchDesc && !matchProvider && !matchLocation) {
        return false;
      }
    }

    return true;
  });

  const uniqueLocations = Array.from(
    new Set(events.map((e) => e.location_name).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-900">
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
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 text-orange-900 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>
              {lang === "pt"
                ? "Plataforma Oficial da Comunidade"
                : "Official Community Hub"}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-stone-900">
            {lang === "pt"
              ? "Wellness, Oficinas e Tradição na Ericeira."
              : "Wellness, Crafts & Local Culture in Ericeira."}
          </h1>

          <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-2xl">
            {lang === "pt"
              ? "Práticas de corpo & mente, artesanias manuais, experiências gastronómicas e eventos comunitários. Um único passe para aceder aos melhores estúdios da vila ou reserva direta de workshops especiais."
              : "Body & mind practices, artisan workshops, gastronomic tours and community gatherings. A single pass for the best local studios or direct bookings for special workshops."}
          </p>

          <div className="pt-1">
            <button
              onClick={() => {
                if (user) {
                  setShowPackages(true);
                } else {
                  setFeedback({
                    type: "error",
                    message:
                      lang === "pt"
                        ? "Inicia sessão (botão no topo da página) para comprar créditos."
                        : "Please sign in (button at the top of the page) to buy credits.",
                  });
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              {lang === "pt" ? "Comprar Créditos (Ericeira Pass)" : "Buy Credits (Ericeira Pass)"}
            </button>
          </div>

          {profile && (
            <div className="pt-2 flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {lang === "pt" ? "O teu saldo:" : "Your balance:"}{" "}
                <strong className="text-orange-600">{profile.credits_balance || 0}</strong>{" "}
                {lang === "pt" ? "créditos" : "credits"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* SECÇÃO DOS 4 EIXOS / MODALIDADES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setSelectedCategory("corpo_mente")}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              selectedCategory === "corpo_mente"
                ? "bg-white border-stone-900 shadow-md ring-2 ring-stone-900"
                : "bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-lg mb-3">
              🧘
            </div>
            <h2 className="font-black text-sm text-stone-900">
              {lang === "pt" ? "Corpo & Mente" : "Body & Mind"}
            </h2>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              {lang === "pt"
                ? "Sauna, banho de gelo, respiração, yoga e treino de surf."
                : "Sauna, ice bath, breathwork, yoga and surf fitness."}
            </p>
          </button>

          <button
            onClick={() => setSelectedCategory("artes_oficinas")}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              selectedCategory === "artes_oficinas"
                ? "bg-white border-stone-900 shadow-md ring-2 ring-stone-900"
                : "bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-lg mb-3">
              🎨
            </div>
            <h2 className="font-black text-sm text-stone-900">
              {lang === "pt" ? "Artes & Oficinas" : "Arts & Crafts"}
            </h2>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              {lang === "pt"
                ? "Cerâmica, macramé, marcenaria e ofícios manuais."
                : "Ceramics, macrame, woodworking and artisan crafts."}
            </p>
          </button>

          <button
            onClick={() => setSelectedCategory("sabor_tradicao")}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              selectedCategory === "sabor_tradicao"
                ? "bg-white border-stone-900 shadow-md ring-2 ring-stone-900"
                : "bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-lg mb-3">
              🍷
            </div>
            <h2 className="font-black text-sm text-stone-900">
              {lang === "pt" ? "Sabor & Tradição" : "Taste & Tradition"}
            </h2>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              {lang === "pt"
                ? "Enoturismo, prova de vinhos de Mafra e café de especialidade."
                : "Wine tasting, local Mafra vineyards and specialty coffee."}
            </p>
          </button>

          <button
            onClick={() => setSelectedCategory("comunidade_linguas")}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              selectedCategory === "comunidade_linguas"
                ? "bg-white border-stone-900 shadow-md ring-2 ring-stone-900"
                : "bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-lg mb-3">
              💬
            </div>
            <h2 className="font-black text-sm text-stone-900">
              {lang === "pt" ? "Línguas & Social" : "Languages & Social"}
            </h2>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              {lang === "pt"
                ? "Português para estrangeiros (PLE) e convívios comunitários."
                : "Portuguese language exchange (PLE) and local meetups."}
            </p>
          </button>
        </div>
      </section>

      {/* FILTROS E PESQUISA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-6">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                  }`}
                >
                  {lang === "pt" ? tab.label_pt : tab.label_en}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-stone-100">
            <div className="sm:col-span-8">
              <input
                type="text"
                placeholder={
                  lang === "pt"
                    ? "Pesquisar por aula, instrutor ou local..."
                    : "Search by session, host, or location..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-900 transition"
              >
                <option value="all">
                  {lang === "pt" ? "Todas as localizações" : "All locations"}
                </option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* GRELHA DE EVENTOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <div className="flex items-center justify-between pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              {lang === "pt" ? "Experiências Agendadas" : "Upcoming Sessions"}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === "pt"
                ? `${filteredEvents.length} sessões disponíveis para reserva`
                : `${filteredEvents.length} sessions available for booking`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400 font-bold uppercase tracking-wider">
            {lang === "pt" ? "A carregar sessões..." : "Loading sessions..."}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 space-y-3">
            <Compass className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-extrabold text-stone-900 text-base">
              {lang === "pt" ? "Nenhuma sessão encontrada" : "No sessions found"}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {lang === "pt"
                ? "Não foram encontradas experiências para os filtros selecionados. Tenta limpar a pesquisa."
                : "No experiences match your current filters. Try adjusting your search."}
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedLocation("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
            >
              {lang === "pt" ? "Limpar Filtros" : "Clear Filters"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const spotsLeft = ev.max_spots - ev.booked_spots;
              const isSoldOut = spotsLeft <= 0;
              const title =
                lang === "pt"
                  ? ev.title_pt || ev.title_en
                  : ev.title_en || ev.title_pt;
              const categoryObj = CATEGORY_LABELS_MAP[ev.category] || {
                pt: ev.category,
                en: ev.category,
                emoji: "🌊",
              };

              const dateObj = new Date(ev.start_time);
              const formattedDate = dateObj.toLocaleDateString(
                lang === "pt" ? "pt-PT" : "en-US",
                {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                }
              );
              const formattedTime = dateObj.toLocaleTimeString(
                lang === "pt" ? "pt-PT" : "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-stone-400/80 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-800">
                        {categoryObj.emoji} {lang === "pt" ? categoryObj.pt : categoryObj.en}
                      </span>

                      {ev.pricing_model === "direct_only" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Ticket className="w-3 h-3 text-amber-700" />
                          <span>Workshop Direto</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200/60 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-orange-600" />
                          <span>
                            {ev.credits_cost || Math.round(ev.price_eur / 5)} cr.
                          </span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                        {title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {formattedDate} • {formattedTime}
                        </span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{ev.duration_minutes} min</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-stone-600">
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

                  <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between bg-[#FAF9F6]">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-stone-900">
                          {ev.price_eur}€
                        </span>
                        {ev.pricing_model !== "direct_only" && (
                          <span className="text-[11px] font-bold text-stone-400">
                            ou {ev.credits_cost || Math.round(ev.price_eur / 5)} cr.
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold block ${
                          isSoldOut ? "text-red-600" : "text-stone-500"
                        }`}
                      >
                        {isSoldOut
                          ? (lang === "pt" ? "Esgotado" : "Sold out")
                          : `${spotsLeft} ${lang === "pt" ? "vagas restantes" : "spots left"}`}
                      </span>
                    </div>

                    <button className="px-4 py-2 rounded-xl bg-stone-900 text-white font-black text-xs uppercase tracking-wider group-hover:bg-orange-600 transition flex items-center gap-1 cursor-pointer">
                      <span>{lang === "pt" ? "Reservar" : "Book"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DE PACOTES DE CRÉDITOS */}
      <PackagesModal
        isOpen={showPackages}
        onClose={() => setShowPackages(false)}
        onSelectPackage={handleBuyCreditPackage}
      />

      {/* MODAL DETALHE DO EVENTO / CHECKOUT */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          onBookWithCredits={handleBookWithCredits}
          onBuySingleTicket={handleBuySingleTicket}
        />
      )}
    </div>
  );
}