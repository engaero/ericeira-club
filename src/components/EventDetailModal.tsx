"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Users, Clock, Sparkles, CreditCard, MapPin, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CATEGORY_COVERS, CATEGORY_LABELS_MAP } from "@/lib/categories";
import { suggestedCreditsForPrice } from "@/lib/pricing";
import type { EventRow } from "@/types/db";

interface Props {
  event: EventRow | any | null;
  isOpen: boolean;
  onClose: () => void;
  onBookWithCredits: (eventOrId: any) => Promise<void> | void;
  onBuySingleTicket: (eventOrId: any, priceEur?: number, eventTitle?: string) => Promise<void> | void;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onBookWithCredits,
  onBuySingleTicket,
}: Props) {
  const { lang } = useLanguage();
  const [healthAgreed, setHealthAgreed] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setHealthAgreed(false);
      setWarningMsg(null);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const rawTitle = lang === "pt" ? event.title_pt || event.title_en : event.title_en || event.title_pt;
  const title: string = rawTitle || (lang === "pt" ? "Sessão" : "Session");

  const rawDescription =
    lang === "pt"
      ? event.description_pt || event.description_en
      : event.description_en || event.description_pt;
  const description: string = rawDescription || "";

  const categoryInfo = CATEGORY_LABELS_MAP[event.category] || {
    pt: event.category,
    en: event.category,
    emoji: "🌊",
  };

  const coverImage =
    event.image_url ||
    CATEGORY_COVERS[event.category] ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";

  const dateObj = new Date(event.start_time);
  const formattedDate = dateObj.toLocaleDateString(lang === "pt" ? "pt-PT" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = dateObj.toLocaleTimeString(lang === "pt" ? "pt-PT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const spotsLeft = Math.max(0, Number(event.max_spots) - Number(event.booked_spots || 0));
  const isSoldOut = spotsLeft <= 0;

  const isDirectOnly = event.pricing_model === "direct_only";
  const creditsCost = event.credits_cost || suggestedCreditsForPrice(Number(event.price_eur));

  const provider = event.providers;
  const hostBio = lang === "pt" ? provider?.bio_pt || provider?.bio_en : provider?.bio_en || provider?.bio_pt;

  function validateHealth(): boolean {
    if (!healthAgreed) {
      setWarningMsg(
        lang === "pt"
          ? "Por favor confirma a declaração de saúde e termos de responsabilidade antes de continuar."
          : "Please accept the health declaration and liability terms before proceeding."
      );
      return false;
    }
    setWarningMsg(null);
    return true;
  }

  function handleCreditsClick() {
    if (!validateHealth()) return;
    onBookWithCredits(event.id || event);
  }

  function handleTicketClick() {
    if (!validateHealth()) return;
    onBuySingleTicket(event.id || event, Number(event.price_eur), title);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 my-6 relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative h-56 sm:h-64 w-full shrink-0 bg-stone-900">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 700px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-white/95 text-stone-900 backdrop-blur-md shadow-sm">
              {categoryInfo.emoji || "✨"} {lang === "pt" ? categoryInfo.pt : categoryInfo.en}
            </span>
            {isDirectOnly ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-sm">
                {lang === "pt" ? "Workshop Exclusivo €" : "Special Workshop €"}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {lang === "pt" ? "Aceita Créditos" : "Credits Accepted"}
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-sm">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-200 mt-2 font-medium">
              <span className="capitalize">{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-300" />
                {formattedTime} ({event.duration_minutes} min)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                {event.location_name || "Ericeira"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 text-stone-800">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {lang === "pt" ? "Sobre a Sessão" : "About this Session"}
            </h4>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {description || (lang === "pt" ? "Sem descrição detalhada disponível." : "No detailed description provided.")}
            </p>
          </div>

          {event.what_to_bring && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                🎒 {lang === "pt" ? "O que deves trazer" : "What to bring"}
              </h5>
              <p className="text-xs text-amber-800 leading-relaxed">
                {event.what_to_bring}
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {lang === "pt" ? "Anfitrião da Experiência" : "Session Host"}
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
                  alt={provider.name || "Host"}
                  className="w-12 h-12 rounded-full object-cover border border-stone-300 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stone-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {provider?.name?.charAt(0) || "E"}
                </div>
              )}

              <div className="space-y-1">
                <h5 className="font-extrabold text-sm text-stone-900 leading-tight">
                  {provider?.name || (lang === "pt" ? "Instrutor Comunitário" : "Community Host")}
                </h5>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {hostBio || (lang === "pt" ? "Profissional local verificado na Ericeira." : "Verified local host in Ericeira.")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-stone-200 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-stone-500 shrink-0" />
              <div>
                <span className="block text-stone-400 text-[10px] uppercase font-bold">
                  {lang === "pt" ? "Disponibilidade" : "Availability"}
                </span>
                <span className="font-extrabold text-stone-900">
                  {isSoldOut
                    ? (lang === "pt" ? "Esgotado" : "Sold out")
                    : `${spotsLeft} ${lang === "pt" ? "vagas livres" : "spots left"}`}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <div className="truncate">
                <span className="block text-stone-400 text-[10px] uppercase font-bold">
                  {lang === "pt" ? "Local" : "Location"}
                </span>
                <span className="font-extrabold text-stone-900 truncate block">
                  {event.location_name || "Ericeira"}
                </span>
              </div>
            </div>
          </div>

          {/* TERMO DE RESPONSABILIDADE E APTIDÃO DE SAÚDE */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                id="health-agreement"
                type="checkbox"
                checked={healthAgreed}
                onChange={(e) => {
                  setHealthAgreed(e.target.checked);
                  if (e.target.checked) setWarningMsg(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
              />
              <label htmlFor="health-agreement" className="text-xs text-stone-600 leading-relaxed cursor-pointer select-none">
                {lang === "pt" ? (
                  <>
                    Declaro estar em <strong>condições de saúde e aptidão física</strong> adequadas para a prática desta atividade (especialmente sauna/gelo, respiração ou surf), sem histórico cardiovascular impeditivo, e aceito os{" "}
                    <a href="/terms" target="_blank" className="underline font-bold text-stone-900">
                      Termos de Responsabilidade
                    </a>{" "}
                    e regras de cancelamento.
                  </>
                ) : (
                  <>
                    I declare that I am in <strong>adequate physical and health condition</strong> for this activity (particularly sauna/ice, breathwork or surf), with no cardiac contraindications, and accept the{" "}
                    <a href="/terms" target="_blank" className="underline font-bold text-stone-900">
                      Liability Terms
                    </a>{" "}
                    and cancellation policy.
                  </>
                )}
              </label>
            </div>
            {warningMsg && (
              <div className="text-[11px] font-bold text-red-600 flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{warningMsg}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-stone-200 bg-[#FAF9F6] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900">{event.price_eur}€</span>
              {!isDirectOnly && (
                <span className="text-xs font-bold text-stone-500">
                  {lang === "pt" ? `ou ${creditsCost} créditos` : `or ${creditsCost} credits`}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 block">
              {lang === "pt" ? "Cancelamento gratuito até 12h antes" : "Free cancellation up to 12h prior"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isDirectOnly && (
              <button
                disabled={isSoldOut}
                onClick={handleCreditsClick}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-teal-800 hover:bg-teal-700 disabled:bg-stone-300 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {isSoldOut
                    ? (lang === "pt" ? "Esgotado" : "Sold Out")
                    : (lang === "pt" ? `Reservar (${creditsCost} cr.)` : `Book (${creditsCost} cr.)`)}
                </span>
              </button>
            )}

            <button
              disabled={isSoldOut}
              onClick={handleTicketClick}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                isDirectOnly
                  ? "bg-stone-900 hover:bg-orange-600 disabled:bg-stone-300 text-white"
                  : "bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {isSoldOut
                  ? (lang === "pt" ? "Esgotado" : "Sold Out")
                  : isDirectOnly
                  ? (lang === "pt" ? `Comprar Bilhete (${event.price_eur}€)` : `Buy Ticket (${event.price_eur}€)`)
                  : (lang === "pt" ? `Pagar ${event.price_eur}€` : `Pay ${event.price_eur}€`)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}