"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Calendar, Filter, X, Users, ExternalLink, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import EventDetailModal from "@/components/EventDetailModal";

interface Props {
  events: any[];
  loading: boolean;
  onBookWithCredits: (event: any) => void;
  onBuySingleTicket: (event: any) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  surf: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80",
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  breathwork: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  crafts: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
  skate: "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?auto=format&fit=crop&w=800&q=80",
  ple: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
};

export default function WellnessSection({
  events,
  loading,
  onBookWithCredits,
  onBuySingleTicket,
}: Props) {
  const { lang, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Estado do Modal de Detalhe
  const [activeModalEvent, setActiveModalEvent] = useState<any | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const uniqueLocations = useMemo(() => {
    const locs = events.map((e) => e.location_name).filter(Boolean);
    return Array.from(new Set(locs));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = currentDate || new Date(0);
    const todayStr = currentDate ? currentDate.toISOString().split("T")[0] : "";

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = currentDate ? tomorrow.toISOString().split("T")[0] : "";

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    return events.filter((ev) => {
      if (selectedCategory !== "all" && ev.category !== selectedCategory) return false;
      if (selectedLocation !== "all" && ev.location_name !== selectedLocation) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchTitle =
          ev.title_en?.toLowerCase().includes(q) ||
          ev.title_pt?.toLowerCase().includes(q);
        const matchInstructor = ev.providers?.name?.toLowerCase().includes(q);
        const matchLocation = ev.location_name?.toLowerCase().includes(q);
        const matchCategory = ev.category?.toLowerCase().includes(q);

        if (!matchTitle && !matchInstructor && !matchLocation && !matchCategory) {
          return false;
        }
      }

      if (timeFilter !== "all" && currentDate) {
        const evDate = new Date(ev.start_time);
        const evDateStr = ev.start_time.split("T")[0];

        if (timeFilter === "today") return evDateStr === todayStr;
        if (timeFilter === "tomorrow") return evDateStr === tomorrowStr;
        if (timeFilter === "week") return evDate >= now && evDate <= nextWeek;
      }

      return true;
    });
  }, [events, selectedCategory, selectedLocation, timeFilter, searchQuery, currentDate]);

  function resetFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setTimeFilter("all");
  }

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedLocation !== "all" ||
    timeFilter !== "all";

  const categories = [
    { id: "all", label: lang === "pt" ? "✨ Todas" : "✨ All" },
    { id: "wellness", label: "🧊 Sauna & Ice" },
    { id: "breathwork", label: "🌬️ Breathwork" },
    { id: "crafts", label: "🏺 Cerâmica & DIY" },
    { id: "wine", label: "🍷 Adegas & Vinhos" },
    { id: "coffee", label: "☕ Specialty Coffee" },
    { id: "ple", label: "🇵🇹 Português (PLE)" },
  ];

  return (
    <section id="wellness" className="space-y-8">
      {/* MODAL DE DETALHE COMPLETO */}
      <EventDetailModal
        event={activeModalEvent}
        isOpen={Boolean(activeModalEvent)}
        onClose={() => setActiveModalEvent(null)}
        onBookWithCredits={onBookWithCredits}
        onBuySingleTicket={onBuySingleTicket}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] uppercase font-black tracking-widest text-orange-600 block">
            Curated Local Experiences • Ericeira & Mafra
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900">
            {lang === "pt" ? "Sessões, Oficinas & Raízes Locais" : "Sessions, Crafts & Local Roots"}
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-stone-900 text-[#FAF8F5] shadow-sm"
                  : "bg-white border border-stone-200/90 text-stone-600 hover:border-stone-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-[24px] border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-stone-200/80 rounded-2xl focus:ring-2 focus:ring-stone-900 focus:outline-none"
          />
        </div>

        <div className="relative w-full sm:w-56">
          <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-stone-200/80 rounded-2xl focus:ring-2 focus:ring-stone-900 focus:outline-none text-stone-700 font-medium"
          >
            <option value="all">{t("all_locations")}</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-48">
          <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-stone-200/80 rounded-2xl focus:ring-2 focus:ring-stone-900 focus:outline-none text-stone-700 font-medium"
          >
            <option value="all">{t("all_dates")}</option>
            <option value="today">{t("date_today")}</option>
            <option value="tomorrow">{t("date_tomorrow")}</option>
            <option value="week">{t("date_week")}</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-stone-400 text-sm font-medium">
          A carregar atividades da Ericeira...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white p-14 rounded-[28px] border border-stone-200/80 text-center space-y-3">
          <Filter className="w-8 h-8 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-base">
            {lang === "pt" ? "Sem sessões para este filtro" : "No sessions matching your criteria"}
          </h3>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition cursor-pointer"
          >
            {t("cat_all")}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {filteredEvents.map((ev) => {
            const spotsLeft = ev.max_spots - ev.booked_spots;
            const isSoldOut = spotsLeft <= 0;
            const eventDate = new Date(ev.start_time);

            const locale = lang === "pt" ? "pt-PT" : "en-US";
            const dateBadge = eventDate.toLocaleDateString(locale, {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const timeStr = eventDate.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            });

            const titleDisplay = lang === "pt" ? (ev.title_pt || ev.title_en) : (ev.title_en || ev.title_pt);
            const coverImage = CATEGORY_IMAGES[ev.category] || CATEGORY_IMAGES.wellness;
            const creditsNeeded = ev.credits_cost || Math.round(ev.price_eur / 5);

            return (
              <div
                key={ev.id}
                className="group bg-white rounded-[28px] border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* IMAGEM CLICÁVEL QUE ABRE O MODAL */}
                  <div 
                    onClick={() => setActiveModalEvent(ev)}
                    className="relative h-56 w-full overflow-hidden bg-stone-200 cursor-pointer"
                  >
                    <img
                      src={coverImage}
                      alt={titleDisplay}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-stone-900">
                        {ev.category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md flex items-center gap-1 ${
                          isSoldOut
                            ? "bg-stone-900/80 text-stone-300"
                            : spotsLeft <= 3
                            ? "bg-orange-500/95 text-white"
                            : "bg-black/60 text-white"
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        {isSoldOut ? t("sold_out") : `${spotsLeft} ${t("spots_left")}`}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                      <span className="text-xs font-bold bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
                        🗓️ {dateBadge} • {timeStr} ({ev.duration_minutes}m)
                      </span>
                      <span className="text-xs font-bold bg-white/20 hover:bg-white/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 transition">
                        <Info className="w-3 h-3" /> {lang === "pt" ? "Ver Detalhes" : "Details"}
                      </span>
                    </div>
                  </div>

                  {/* CONTEÚDO DO CARTÃO */}
                  <div className="p-6 space-y-3">
                    <h3 
                      onClick={() => setActiveModalEvent(ev)}
                      className="text-xl font-black text-stone-900 tracking-tight leading-snug cursor-pointer hover:text-orange-600 transition"
                    >
                      {titleDisplay}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                      <span>
                        Parceiro: <strong className="text-stone-800">{ev.providers?.name}</strong>
                      </span>

                      <a
                        href={
                          ev.google_maps_url ||
                          `https://maps.google.com/?q=${encodeURIComponent(
                            ev.location_name + ", Ericeira"
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-stone-600 hover:text-orange-600 font-semibold transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px] underline underline-offset-2">
                          {ev.location_name}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DE AÇÃO RÁPIDA */}
                <div className="px-6 py-4 bg-[#FAF8F5] border-t border-stone-200/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-stone-900">
                        ⚡ {creditsNeeded} {lang === "pt" ? "Créditos" : "Credits"}
                      </span>
                      <span className="text-xs text-stone-400">
                        ({ev.price_eur}€ {t("dropin")})
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 block">
                      {t("cancel_guarantee")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isSoldOut}
                      onClick={() => onBuySingleTicket(ev)}
                      className="px-3.5 py-2 rounded-full bg-white border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-bold transition cursor-pointer disabled:opacity-40"
                    >
                      {ev.price_eur}€
                    </button>

                    <button
                      disabled={isSoldOut}
                      onClick={() => onBookWithCredits(ev)}
                      className="px-5 py-2 rounded-full bg-stone-900 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer disabled:bg-stone-200 disabled:text-stone-400"
                    >
                      {isSoldOut ? t("sold_out") : (lang === "pt" ? "Entrar c/ Pass" : "Drop In")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}