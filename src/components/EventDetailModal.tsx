"use client";

import { useEffect } from "react";
import { X, Users, Clock, ExternalLink, Sparkles, CreditCard, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onBookWithCredits: (event: any) => void;
  onBuySingleTicket: (event: any) => void;
}

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const CATEGORY_IMAGES: Record<string, string> = {
  surf: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80",
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  breathwork: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  crafts: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
  skate: "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?auto=format&fit=crop&w=1200&q=80",
  ple: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
};

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onBookWithCredits,
  onBuySingleTicket,
}: Props) {
  const { lang } = useLanguage();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const spotsLeft = event.max_spots - event.booked_spots;
  const isSoldOut = spotsLeft <= 0;
  const eventDate = new Date(event.start_time);

  const locale = lang === "pt" ? "pt-PT" : "en-US";
  const dateStr = eventDate.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = eventDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const titleDisplay = lang === "pt" ? (event.title_pt || event.title_en) : (event.title_en || event.title_pt);
  const descDisplay = lang === "pt"
    ? (event.description_pt || event.description_en || "Sessão orientada na Ericeira.")
    : (event.description_en || event.description_pt || "Guided session in Ericeira.");

  const coverImage = CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.wellness;
  const creditsNeeded = event.credits_cost || Math.round(event.price_eur / 5);

  const provider = event.providers;
  const hostBio = lang === "pt"
    ? (provider?.bio_pt || provider?.bio_en)
    : (provider?.bio_en || provider?.bio_pt);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-8 sm:py-12 overflow-y-auto font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl relative border border-stone-200 overflow-hidden my-auto"
      >
        {/* BOTÃO FECHAR PERFEITAMENTE VISÍVEL DENTRO DA ÁREA SEGURA */}
        <button
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-white text-stone-900 shadow-xl border border-stone-200/90 flex items-center justify-center transition hover:bg-stone-100 hover:scale-105 cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* CABEÇALHO COM IMAGEM */}
        <div className="relative h-60 sm:h-64 w-full bg-stone-900">
          <img
            src={coverImage}
            alt={titleDisplay}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          <div className="absolute top-5 left-5 flex gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 text-stone-900 backdrop-blur-md shadow-xs">
              {event.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-stone-200 backdrop-blur-md">
              {event.level || "Todos os níveis"}
            </span>
          </div>

          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <span className="text-xs font-semibold text-amber-300 block capitalize">
              🗓️ {dateStr} às {timeStr} ({event.duration_minutes} min)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {titleDisplay}
            </h2>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-240px)] overflow-y-auto">
          {/* Informações rápidas em grelha */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200/70 text-xs">
            <div>
              <span className="text-stone-400 block font-semibold uppercase text-[10px]">Vagas</span>
              <p className="font-extrabold text-stone-900 text-sm mt-0.5 flex items-center gap-1">
                <Users className="w-4 h-4 text-orange-600" />
                {isSoldOut ? "Esgotado" : `${spotsLeft} de ${event.max_spots}`}
              </p>
            </div>

            <div>
              <span className="text-stone-400 block font-semibold uppercase text-[10px]">Duração</span>
              <p className="font-extrabold text-stone-900 text-sm mt-0.5 flex items-center gap-1">
                <Clock className="w-4 h-4 text-teal-700" />
                {event.duration_minutes} minutos
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-stone-400 block font-semibold uppercase text-[10px]">Nível</span>
              <p className="font-extrabold text-stone-900 text-sm mt-0.5 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {event.level || "Aberto"}
              </p>
            </div>
          </div>

          {/* Descrição detalhada da sessão */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {lang === "pt" ? "Sobre esta sessão" : "About this session"}
            </h4>
            <p className="text-stone-700 text-sm leading-relaxed">
              {descDisplay}
            </p>
          </div>

          {/* O que levar */}
          {event.what_to_bring && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                🎒 {lang === "pt" ? "O que deves levar / Vestuário" : "What to bring"}
              </h4>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                {event.what_to_bring}
              </p>
            </div>
          )}

          {/* CARTÃO COMPLETO DO INSTRUTOR COM BIO & FOTO */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {lang === "pt" ? "Conhece o teu Instrutor / Anfitrião" : "Meet your Host"}
              </span>
              {provider?.instagram_handle && (
                <a
                  href={`https://instagram.com/${provider.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 transition"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>@{provider.instagram_handle}</span>
                </a>
              )}
            </div>

            <div className="flex items-start gap-3.5">
              {provider?.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.name}
                  className="w-12 h-12 rounded-full object-cover border border-stone-300 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stone-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {provider?.name?.charAt(0) || "E"}
                </div>
              )}

              <div className="space-y-1">
                <h5 className="font-extrabold text-sm text-stone-900 leading-tight">
                  {provider?.name}
                </h5>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {hostBio || (lang === "pt" ? "Profissional verificado na Ericeira." : "Verified local professional in Ericeira.")}
                </p>
              </div>
            </div>
          </div>

          {/* Ponto de encontro & Maps */}
          <div className="space-y-1 pt-1 border-t border-stone-100">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              {lang === "pt" ? "Ponto de Encontro" : "Meeting Point"}
            </span>
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-stone-900 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                {event.location_name}
              </p>
              <a
                href={
                  event.google_maps_url ||
                  `https://maps.google.com/?q=${encodeURIComponent(
                    event.location_name + ", Ericeira"
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-900 hover:text-orange-600 underline"
              >
                Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* RODAPÉ DE AÇÃO & RESERVA */}
          <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-stone-900">{event.price_eur}€</span>
                <span className="text-xs text-stone-400 font-medium">
                  {lang === "pt" ? "ou" : "or"} <strong className="text-stone-900">{creditsNeeded} {lang === "pt" ? "créditos" : "credits"}</strong>
                </span>
              </div>
              <span className="text-[10px] text-stone-400 block pt-0.5">
                Cancelamento gratuito até 12 horas antes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isSoldOut}
                onClick={() => {
                  onBuySingleTicket(event);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-4 py-3 rounded-full bg-white border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {lang === "pt" ? `Pagar ${event.price_eur}€` : `Pay ${event.price_eur}€`}
              </button>

              <button
                disabled={isSoldOut}
                onClick={() => {
                  onBookWithCredits(event);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-6 py-3 rounded-full bg-stone-900 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md disabled:bg-stone-200 disabled:text-stone-400"
              >
                {isSoldOut ? "Esgotado" : (lang === "pt" ? `Usar ${creditsNeeded} Créd.` : `Use ${creditsNeeded} Cred.`)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}