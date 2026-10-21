"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Euro,
  Sparkles,
} from "lucide-react";

export default function ProviderPortalPage() {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [creating, setCreating] = useState(false);

  // Campos do formulário de nova sessão
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

  useEffect(() => {
    loadProviderData();
  }, []);

  async function loadProviderData() {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      // 1. Procurar perfil de anfitrião/prestador associado ao user
      const { data: prov, error: provError } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (provError) throw provError;

      if (prov) {
        setProvider(prov);

        // 2. Procurar sessões do prestador
        const { data: evList, error: evError } = await supabase
          .from("events")
          .select("*")
          .eq("provider_id", prov.id)
          .order("start_time", { ascending: true });

        if (evError) throw evError;
        setEvents(evList || []);

        // 3. Procurar histórico de reservas
        const eventIds = (evList || []).map((e) => e.id);
        if (eventIds.length > 0) {
          const { data: bookList, error: bookError } = await supabase
            .from("bookings")
            .select("*, events(title_pt, title_en, price_eur)")
            .in("event_id", eventIds)
            .order("created_at", { ascending: false });

          if (bookError) throw bookError;
          setBookings(bookList || []);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do portal:", err.message);
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Auto-calcular créditos recomendados ao mudar o preço em Euros
  function handlePriceChange(value: number) {
    setPriceEur(value);
    setCreditsCost(Math.max(1, Math.round(value / 5)));
  }

  // Criar nova sessão/workshop
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!provider) return;

    if (!titlePt && !titleEn) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Preenche pelo menos um título para a sessão." : "Please provide a title.",
      });
      return;
    }

    if (!startTime) {
      setFeedback({
        type: "error",
        message: lang === "pt" ? "Indica o dia e hora de início." : "Please indicate the date and time.",
      });
      return;
    }

    try {
      setCreating(true);

      const payload = {
        provider_id: provider.id,
        title_pt: titlePt || titleEn,
        title_en: titleEn || titlePt,
        category,
        pricing_model: pricingModel,
        price_eur: priceEur,
        credits_cost: pricingModel === "direct_only" ? null : creditsCost,
        max_spots: maxSpots,
        duration_minutes: durationMinutes,
        start_time: new Date(startTime).toISOString(),
        location_name: locationName,
        what_to_bring: whatToBring,
        description_pt: descPt,
        description_en: descEn,
      };

      const { data, error } = await supabase.from("events").insert([payload]).select().single();
      if (error) throw error;

      setFeedback({
        type: "success",
        message: lang === "pt" ? "Sessão agendada com sucesso no Ericeira Hub!" : "Session successfully published!",
      });

      // Limpar formulário
      setTitlePt("");
      setTitleEn("");
      setStartTime("");
      setWhatToBring("");
      setDescPt("");
      setDescEn("");

      // Recarregar lista
      setEvents((prev) => [...prev, data]);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setCreating(false);
    }
  }

  // Cancelar/remover sessão
  async function handleDeleteEvent(eventId: string) {
    const confirmDelete = window.confirm(
      lang === "pt"
        ? "Tens a certeza que queres cancelar esta sessão?"
        : "Are you sure you want to delete this session?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setFeedback({
        type: "success",
        message: lang === "pt" ? "Sessão eliminada com sucesso." : "Session removed.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-stone-500 font-sans text-xs font-bold uppercase tracking-wider">
        {lang === "pt" ? "A verificar credenciais de anfitrião..." : "Verifying host credentials..."}
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-[85vh] bg-[#FDFBF7] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-orange-600 mx-auto" />
          <h2 className="text-xl font-black text-stone-900">
            {lang === "pt" ? "Área de Anfitrião & Parceiro" : "Host & Partner Portal"}
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            {lang === "pt"
              ? "A tua conta ainda não está associada a um perfil verificado de instrutor ou estúdio no Ericeira Hub."
              : "Your account is not registered as an instructor or studio partner yet."}
          </p>
          <Link
            href="/become-a-partner"
            className="inline-block w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md"
          >
            {lang === "pt" ? "Preencher Candidatura de Parceiro" : "Complete Partner Application"}
          </Link>
        </div>
      </div>
    );
  }

  // Cálculos de saldo acumulado
  const totalBookings = bookings.length;
  const creditsReceived = bookings.filter((b) => b.payment_method === "credits").length * 4; // 4€ líquidos por crédito
  const directEurosReceived = bookings
    .filter((b) => b.payment_method === "stripe_direct")
    .reduce((acc, curr) => acc + (curr.amount_paid_eur - (curr.commission_eur || 0)), 0);

  const totalPayoutEst = creditsReceived + directEurosReceived;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-900 pb-24">
      {/* MENSAGEM FEEDBACK */}
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

      {/* CABEÇALHO DO PORTAL */}
      <section className="pt-12 pb-8 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
          <div className="flex items-center gap-4">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.name}
                className="w-14 h-14 rounded-full object-cover border border-stone-300 shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-stone-900 text-white font-black text-lg flex items-center justify-center">
                {provider.name?.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
                {lang === "pt" ? "Portal do Anfitrião" : "Host Dashboard"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                {provider.name}
              </h1>
            </div>
          </div>

          {/* TELEGRAM STATUS */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                provider.telegram_chat_id
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {provider.telegram_chat_id ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === "pt" ? "Notificações Telegram Ativas" : "Telegram Alerts Active"}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  {lang === "pt" ? "Telegram Desligado" : "Telegram Disconnected"}
                </>
              )}
            </span>
          </div>
        </div>

        {/* MÉTRICAS / BALANÇO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {lang === "pt" ? "Reservas Registadas" : "Total Bookings"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-stone-900">{totalBookings}</span>
              <Users className="w-5 h-5 text-stone-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {lang === "pt" ? "Sessões Ativas" : "Active Sessions"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-stone-900">{events.length}</span>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {lang === "pt" ? "Valor Líquido Acumulado" : "Estimated Payout"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-700">{totalPayoutEst.toFixed(2)}€</span>
              <Euro className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: CRIAR SESSÃO & LISTAGEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* FORMULÁRIO DE NOVA SESSÃO (5 COLUNAS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-orange-600" />
              {lang === "pt" ? "Publicar Nova Sessão / Workshop" : "Publish Session or Workshop"}
            </h2>
            <p className="text-xs text-stone-500">
              {lang === "pt"
                ? "Configura o horário, a tipologia de produto e o modelo de pagamento."
                : "Set schedule, product category and pricing structure."}
            </p>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-semibold text-stone-700">
            {/* Título PT */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "Título (Português)" : "Title (Portuguese)"}</label>
              <input
                type="text"
                placeholder="Ex: Cerâmica Manual - Introdução à Roda"
                value={titlePt}
                onChange={(e) => setTitlePt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
              />
            </div>

            {/* Título EN */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "Título (Inglês)" : "Title (English)"}</label>
              <input
                type="text"
                placeholder="Ex: Wheel Throwing Pottery Workshop"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "Categoria / Eixo Temático" : "Category / Strategic Axis"}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs bg-white"
              >
                <optgroup label="Corpo & Mente">
                  <option value="wellness">Wellness & Recuperação</option>
                  <option value="yoga">Yoga & Práticas Somáticas</option>
                  <option value="breathwork">Breathwork & Ice Bath</option>
                  <option value="surf">Surf Conditioning & Treino</option>
                </optgroup>
                <optgroup label="Artes & Oficinas">
                  <option value="crafts">Oficinas Manuais / Crafts</option>
                  <option value="ceramics">Cerâmica</option>
                </optgroup>
                <optgroup label="Sabor & Tradição">
                  <option value="wine">Vinho & Degustação</option>
                  <option value="coffee">Café Especial / Cupping</option>
                </optgroup>
                <optgroup label="Línguas & Social">
                  <option value="ple">Português Língua Estrangeira</option>
                  <option value="social">Encontros Comunitários</option>
                </optgroup>
              </select>
            </div>

            {/* MODELO DE PAGAMENTO (REGULAR VS DIRECT ONLY) */}
            <div className="space-y-1 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
              <label className="text-stone-900 font-extrabold flex items-center justify-between">
                <span>{lang === "pt" ? "Modelo de Pagamento" : "Billing Model"}</span>
                {pricingModel === "direct_only" && (
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-black uppercase">
                    Workshop Especial
                  </span>
                )}
              </label>

              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-stone-900 text-xs bg-white mt-1"
              >
                <option value="credits_allowed">
                  Aula Regular (Permite Ericeira Pass ou Avulso)
                </option>
                <option value="direct_only">
                  Workshop Especial (Apenas Pagamento Direto em €)
                </option>
              </select>

              <p className="text-[11px] text-stone-500 font-normal leading-relaxed pt-1">
                {pricingModel === "direct_only"
                  ? "Recomendado para workshops de cerâmica, tours e tickets acima de 40€. Os utilizadores pagam em Euros e não esgotam a bolsa de créditos regulares."
                  : "Os alunos podem usar créditos do passe (recebes 4,00€ por crédito consumido) ou comprar avulso."}
              </p>
            </div>

            {/* PREÇO E CRÉDITOS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label>{lang === "pt" ? "Preço de Balcão (€)" : "Ticket Price (€)"}</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={priceEur}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label>
                  {pricingModel === "direct_only" ? "Créditos (Desativado)" : "Custo em Créditos"}
                </label>
                <input
                  type="number"
                  disabled={pricingModel === "direct_only"}
                  value={pricingModel === "direct_only" ? 0 : creditsCost}
                  onChange={(e) => setCreditsCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs disabled:bg-stone-100 disabled:text-stone-400"
                />
              </div>
            </div>

            {/* VAGAS E DURAÇÃO */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label>{lang === "pt" ? "Vagas Máximas" : "Max Spots"}</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxSpots}
                  onChange={(e) => setMaxSpots(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === "pt" ? "Duração (min)" : "Duration (min)"}</label>
                <input
                  type="number"
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
                />
              </div>
            </div>

            {/* DATA E HORA DE INÍCIO */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "Data e Hora de Início" : "Start Date & Time"}</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs bg-white"
              />
            </div>

            {/* LOCALIZAÇÃO / MORADA */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "Ponto de Encontro / Estúdio" : "Studio / Meeting Spot"}</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Rua do Limoeiro 12, Ericeira"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
              />
            </div>

            {/* O QUE LEVAR */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "O que levar / Requisitos" : "What to bring"}</label>
              <input
                type="text"
                value={whatToBring}
                onChange={(e) => setWhatToBring(e.target.value)}
                placeholder="Ex: Roupa confortável que possa sujar, toalha..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs"
              />
            </div>

            {/* DESCRIÇÃO PT */}
            <div className="space-y-1">
              <label>{lang === "pt" ? "Descrição Resumida (PT)" : "Short Description (PT)"}</label>
              <textarea
                rows={2}
                value={descPt}
                onChange={(e) => setDescPt(e.target.value)}
                placeholder="Explicita o foco da aula, material incluído e nível..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {creating
                ? (lang === "pt" ? "A agendar sessão..." : "Publishing...")
                : (lang === "pt" ? "Publicar no Calendário do Hub" : "Publish to Hub Schedule")}
            </button>
          </form>
        </div>

        {/* LISTAGEM DE SESSÕES ATIVAS & INSCRITOS (7 COLUNAS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-stone-900">
              {lang === "pt" ? "As Tuas Sessões Agendadas" : "Your Active Sessions"}
            </h2>
            <span className="text-xs font-bold text-stone-500">
              {events.length} {lang === "pt" ? "sessões" : "sessions"}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200/80 space-y-2">
              <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs font-bold text-stone-700">
                {lang === "pt" ? "Ainda não publicaste nenhuma sessão." : "No published sessions yet."}
              </p>
              <p className="text-xs text-stone-500">
                {lang === "pt"
                  ? "Utiliza o formulário ao lado para abrir vagas para a comunidade."
                  : "Use the form to schedule upcoming slots."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const spotsLeft = ev.max_spots - ev.booked_spots;
                const isSoldOut = spotsLeft <= 0;
                const dateStr = new Date(ev.start_time).toLocaleDateString(
                  lang === "pt" ? "pt-PT" : "en-US",
                  { weekday: "short", day: "numeric", month: "short" }
                );
                const timeStr = new Date(ev.start_time).toLocaleTimeString(
                  lang === "pt" ? "pt-PT" : "en-US",
                  { hour: "2-digit", minute: "2-digit" }
                );

                const isDirectOnly = ev.pricing_model === "direct_only";

                return (
                  <div
                    key={ev.id}
                    className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-800">
                          {ev.category}
                        </span>
                        {isDirectOnly ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                            Workshop Direto
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800">
                            Passe ({ev.credits_cost || Math.round(ev.price_eur / 5)} cr.)
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-stone-900 text-sm">
                        {lang === "pt" ? ev.title_pt || ev.title_en : ev.title_en || ev.title_pt}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {dateStr} • {timeStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-600" />
                          {ev.location_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-black text-stone-900 block">
                          {ev.price_eur}€
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            isSoldOut ? "text-red-600" : "text-stone-500"
                          }`}
                        >
                          {ev.booked_spots} / {ev.max_spots} vagas
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title={lang === "pt" ? "Cancelar sessão" : "Delete session"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}