"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Euro,
  Repeat,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onEventCreated?: () => void;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  providerId,
  onEventCreated,
}: CreateEventModalProps) {
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos do formulário
  const [titlePt, setTitlePt] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState("wellness");
  const [pricingModel, setPricingModel] = useState<"credits_allowed" | "direct_only">("credits_allowed");
  const [priceEur, setPriceEur] = useState<number>(20);
  const [creditsCost, setCreditsCost] = useState<number>(4);
  const [maxSpots, setMaxSpots] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [startTime, setStartTime] = useState("");
  const [locationName, setLocationName] = useState("Ericeira");
  const [whatToBring, setWhatToBring] = useState("");
  const [descPt, setDescPt] = useState("");
  const [descEn, setDescEn] = useState("");

  // Recorrência semanal ("Set & Forget")
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);

  if (!isOpen) return null;

  function handlePriceChange(val: number) {
    setPriceEur(val);
    setCreditsCost(Math.max(1, Math.round(val / 5)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!titlePt && !titleEn) {
      setErrorMsg(
        lang === "pt"
          ? "Por favor, introduz pelo menos um título para a sessão."
          : "Please provide at least one title for the session."
      );
      return;
    }

    if (!startTime) {
      setErrorMsg(
        lang === "pt"
          ? "Por favor, seleciona a data e hora de início."
          : "Please select the session start date and time."
      );
      return;
    }

    try {
      setLoading(true);

      const baseDate = new Date(startTime);
      const totalOccurrences = isRecurring ? repeatWeeks : 1;
      const recordsToInsert = [];

      for (let i = 0; i < totalOccurrences; i++) {
        const occurrenceDate = new Date(baseDate);
        occurrenceDate.setDate(baseDate.getDate() + i * 7);

        recordsToInsert.push({
          provider_id: providerId,
          title_pt: titlePt || titleEn,
          title_en: titleEn || titlePt,
          category,
          pricing_model: pricingModel,
          price_eur: Number(priceEur),
          credits_cost: pricingModel === "direct_only" ? null : Number(creditsCost),
          max_spots: Number(maxSpots),
          duration_minutes: Number(durationMinutes),
          start_time: occurrenceDate.toISOString(),
          location_name: locationName,
          what_to_bring: whatToBring,
          description_pt: descPt,
          description_en: descEn,
        });
      }

      const { error } = await supabase.from("events").insert(recordsToInsert);
      if (error) throw error;

      // Limpar formulário
      setTitlePt("");
      setTitleEn("");
      setStartTime("");
      setWhatToBring("");
      setDescPt("");
      setDescEn("");
      setIsRecurring(false);
      setRepeatWeeks(4);

      if (onEventCreated) {
        onEventCreated();
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao publicar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#FAF9F6]">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black text-stone-900">
              {lang === "pt" ? "Publicar Nova Sessão / Workshop" : "Publish New Session or Workshop"}
            </h2>
            <p className="text-xs text-stone-500">
              {lang === "pt"
                ? "Disponibiliza vagas no calendário comunitário do Ericeira Hub."
                : "Open spots on the community schedule in Ericeira Hub."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-stone-700">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Títulos PT / EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label>{lang === "pt" ? "Título da Sessão (Português) *" : "Title (PT) *"}</label>
              <input
                type="text"
                required
                placeholder="Ex: Treino Funcional de Surf"
                value={titlePt}
                onChange={(e) => setTitlePt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="space-y-1">
              <label>{lang === "pt" ? "Título da Sessão (Inglês)" : "Title (EN)"}</label>
              <input
                type="text"
                placeholder="Ex: Surf Conditioning & Mobility"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label>{lang === "pt" ? "Eixo Temático / Categoria *" : "Category *"}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none focus:border-stone-900"
            >
              <optgroup label="Corpo & Mente">
                <option value="wellness">Wellness & Recuperação (Gelo, Sauna)</option>
                <option value="yoga">Yoga & Práticas Somáticas</option>
                <option value="breathwork">Breathwork & Respiração</option>
                <option value="surf">Treino Surf & Mobilidade</option>
              </optgroup>
              <optgroup label="Artes & Oficinas">
                <option value="crafts">Oficinas Manuais & Artesanato</option>
                <option value="ceramics">Cerâmica & Olaria</option>
              </optgroup>
              <optgroup label="Sabor & Tradição">
                <option value="wine">Vinho & Enoturismo</option>
                <option value="coffee">Café de Especialidade & Torra</option>
              </optgroup>
              <optgroup label="Línguas & Social">
                <option value="ple">Português Língua Estrangeira (PLE)</option>
                <option value="social">Encontros Comunitários</option>
              </optgroup>
            </select>
          </div>

          {/* Modelo de Cobrança */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-stone-900 font-extrabold">
                {lang === "pt" ? "Modelo de Pagamento" : "Billing Model"}
              </label>
              {pricingModel === "direct_only" ? (
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-black uppercase">
                  {lang === "pt" ? "Workshop Especial" : "Special Workshop"}
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                  {lang === "pt" ? "Aceita Ericeira Pass" : "Ericeira Pass Accepted"}
                </span>
              )}
            </div>

            <select
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs"
            >
              <option value="credits_allowed">
                {lang === "pt"
                  ? "Sessão Regular (Aceita Créditos do Ericeira Pass ou Avulso)"
                  : "Regular Session (Accepts Ericeira Pass Credits or Single Ticket)"}
              </option>
              <option value="direct_only">
                {lang === "pt"
                  ? "Workshop Especial (Exclusivo Pagamento em € - Stripe / MB WAY)"
                  : "Special Workshop (Direct Euro Payment Only - Stripe / MB WAY)"}
              </option>
            </select>
          </div>

          {/* Preço e Créditos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label>{lang === "pt" ? "Preço de Balcão (€) *" : "Price (€) *"}</label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={500}
                  required
                  value={priceEur}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs pl-8 focus:outline-none focus:border-stone-900"
                />
                <Euro className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label>
                {pricingModel === "direct_only"
                  ? (lang === "pt" ? "Créditos (Desativado)" : "Credits (Disabled)")
                  : (lang === "pt" ? "Custo em Créditos *" : "Credits Cost *")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  disabled={pricingModel === "direct_only"}
                  value={pricingModel === "direct_only" ? 0 : creditsCost}
                  onChange={(e) => setCreditsCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-xs pl-8 disabled:bg-stone-100 disabled:text-stone-400 focus:outline-none focus:border-stone-900"
                />
                <Sparkles className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Vagas e Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label>{lang === "pt" ? "Lotação / Vagas Máximas *" : "Max Spots *"}</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={maxSpots}
                  onChange={(e) => setMaxSpots(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs pl-8 focus:outline-none focus:border-stone-900"
                />
                <Users className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label>{lang === "pt" ? "Duração (minutos) *" : "Duration (mins) *"}</label>
              <div className="relative">
                <input
                  type="number"
                  step={15}
                  min={15}
                  max={480}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs pl-8 focus:outline-none focus:border-stone-900"
                />
                <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Data e Hora de Início */}
          <div className="space-y-1">
            <label>{lang === "pt" ? "Primeira Data e Hora *" : "First Session Date & Time *"}</label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs pl-8 focus:outline-none focus:border-stone-900"
              />
              <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Bloco de Recorrência Semanal ("Set & Forget") */}
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-orange-600" />
                <label
                  htmlFor="create-event-recurring-toggle"
                  className="text-xs font-bold text-stone-900 cursor-pointer"
                >
                  {lang === "pt" ? "Repetir Horário Semanal" : "Repeat Weekly Schedule"}
                </label>
              </div>
              <input
                type="checkbox"
                id="create-event-recurring-toggle"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="space-y-2 pt-2 border-t border-orange-200/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">
                    {lang === "pt" ? "Duração da programação:" : "Schedule duration:"}
                  </span>
                  <span className="font-extrabold text-orange-800">
                    {repeatWeeks} {lang === "pt" ? "semanas" : "weeks"}
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={1}
                  value={repeatWeeks}
                  onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <p className="text-[10px] text-stone-500">
                  {lang === "pt"
                    ? `Gera ${repeatWeeks} aulas automáticas no mesmo dia da semana e à mesma hora.`
                    : `Will automatically create ${repeatWeeks} sessions on the same weekday and time.`}
                </p>
              </div>
            )}
          </div>

          {/* Localização */}
          <div className="space-y-1">
            <label>{lang === "pt" ? "Local / Estúdio / Ponto de Encontro *" : "Location / Studio *"}</label>
            <div className="relative">
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: SOL Studios Ericeira / Praia do Sul"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs pl-8 focus:outline-none focus:border-stone-900"
              />
              <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Requisitos / O que levar */}
          <div className="space-y-1">
            <label>{lang === "pt" ? "O que levar / Requisitos" : "What to bring"}</label>
            <input
              type="text"
              value={whatToBring}
              onChange={(e) => setWhatToBring(e.target.value)}
              placeholder="Ex: Fato de banho, toalha grande, água..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none focus:border-stone-900"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label>{lang === "pt" ? "Descrição / Detalhes da Sessão" : "Description / Details"}</label>
            <textarea
              rows={3}
              value={descPt}
              onChange={(e) => setDescPt(e.target.value)}
              placeholder="Descreve o ritmo, os objetivos e para quem é indicada a sessão..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none focus:border-stone-900 resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
            >
              {lang === "pt" ? "Cancelar" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading
                ? (lang === "pt" ? "A agendar..." : "Publishing...")
                : isRecurring
                ? (lang === "pt" ? `Publicar ${repeatWeeks} Semanas` : `Publish ${repeatWeeks} Weeks`)
                : (lang === "pt" ? "Publicar no Calendário" : "Publish to Schedule")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}