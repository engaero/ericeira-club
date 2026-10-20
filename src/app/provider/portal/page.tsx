"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CreateEventModal from "@/components/CreateEventModal";
import { 
  ArrowLeft, PlusCircle, Calendar, MapPin, 
  Users, AlertCircle, Clock, Banknote, Save, CheckCircle2, User 
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function ProviderPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados de perfil público
  const [name, setName] = useState("");
  const [bioPt, setBioPt] = useState("");
  const [bioEn, setBioEn] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSavedMsg, setProfileSavedMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Estados de dados bancários e fiscais
  const [iban, setIban] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [taxId, setTaxId] = useState("");
  const [taxName, setTaxName] = useState("");
  const [bankSavedMsg, setBankSavedMsg] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    loadProviderData();
  }, []);

  async function loadProviderData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/");
      return;
    }

    setCurrentUser(session.user);

    const { data: provData } = await supabase
      .from("providers")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (provData) {
      setProvider(provData);
      setName(provData.name || "");
      setBioPt(provData.bio_pt || "");
      setBioEn(provData.bio_en || "");
      setInstagramHandle(provData.instagram_handle || "");
      setAvatarUrl(provData.avatar_url || "");
      setIban(provData.iban || "");
      setBankAccountHolder(provData.bank_account_holder || "");
      setTaxId(provData.tax_id || "");
      setTaxName(provData.tax_name || "");

      if (provData.verified) {
        const { data: evData } = await supabase
          .from("events")
          .select(`
            *,
            bookings (
              id,
              status,
              payment_method,
              amount_paid_eur,
              commission_eur,
              created_at,
              profiles ( full_name, email, phone )
            )
          `)
          .eq("provider_id", provData.id)
          .order("start_time", { ascending: true });

        if (evData) setEvents(evData);

        const { data: payoutsData } = await supabase
          .from("provider_payouts")
          .select("*")
          .eq("provider_id", provData.id)
          .order("created_at", { ascending: false });

        if (payoutsData) setPayouts(payoutsData);
      }
    }

    setLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSavedMsg("");

    try {
      const res = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          name,
          bioPt,
          bioEn,
          instagramHandle,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfileSavedMsg("Perfil público atualizado com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao guardar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveBankDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingBank(true);
    setBankSavedMsg("");

    try {
      const res = await fetch("/api/provider/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          iban,
          bankAccountHolder,
          taxId,
          taxName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBankSavedMsg("Dados fiscais e bancários guardados com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao gravar dados.");
    } finally {
      setSavingBank(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
        A carregar portal do instrutor...
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-stone-400 mx-auto" />
          <h2 className="text-xl font-bold">Ainda não és Instrutor / Parceiro</h2>
          <p className="text-sm text-stone-600">
            A tua conta ({currentUser?.email}) é de membro comum. Se és instrutor ou freelancer local na Ericeira, envia a tua candidatura para começar.
          </p>
          <button
            onClick={() => router.push("/become-a-partner")}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-orange-600 transition cursor-pointer"
          >
            Submeter Candidatura de Parceiro
          </button>
        </div>
      </div>
    );
  }

  if (!provider.verified) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-sm max-w-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Candidatura em Revisão</h2>
          <p className="text-sm text-stone-600">
            Olá, <strong>{provider.name}</strong>! A tua candidatura foi recebida e está sob validação pela administração do Ericeira Hub.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition cursor-pointer"
          >
            Voltar ao Hub
          </button>
        </div>
      </div>
    );
  }

  let totalNetPayable = 0;
  let confirmedBookingsCount = 0;
  const ratePerCredit = parseFloat(provider.payout_payout_rate_eur || 4.00);

  events.forEach((ev) => {
    const activeBookings = ev.bookings?.filter((b: any) => b.status === "confirmed") || [];
    confirmedBookingsCount += activeBookings.length;
    const eventCredits = ev.credits_cost || Math.round(ev.price_eur / 5);

    activeBookings.forEach(() => {
      totalNetPayable += (eventCredits * ratePerCredit);
    });
  });

  const totalAlreadyPaid = payouts.reduce((acc, curr) => acc + parseFloat(curr.amount_eur || 0), 0);
  const currentBalancePending = Math.max(0, totalNetPayable - totalAlreadyPaid);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans pb-20">
      <CreateEventModal
        isOpen={isModalOpen}
        providerId={provider.id}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProviderData}
      />

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>
          <div className="flex items-center gap-2">
            {provider.avatar_url && (
              <img src={provider.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-stone-200" />
            )}
            <span className="text-xs bg-stone-100 text-stone-800 px-3 py-1 rounded-full font-bold">
              {provider.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-10 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Painel do Instrutor</h1>
            <p className="text-stone-500 text-sm">Gere o teu perfil público, sessões agendadas e recebimentos.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-stone-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Publicar Nova Sessão
          </button>
        </div>

        {/* CARTÕES DE RESUMO FINANCEIRO (80% LÍQUIDO) */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Saldo Pendente a Transferir
            </span>
            <p className="text-3xl font-black text-teal-800">{currentBalancePending.toFixed(2)}€</p>
            <span className="text-[11px] text-stone-400 block pt-1">
              80% líquido calculado automaticamente
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Já Liquidado
            </span>
            <p className="text-3xl font-black text-stone-900">{totalAlreadyPaid.toFixed(2)}€</p>
            <span className="text-[11px] text-stone-400 block pt-1">
              Transferências concluídas pela administração
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Presenças Confirmadas
            </span>
            <p className="text-3xl font-black text-stone-900">{confirmedBookingsCount}</p>
            <span className="text-[11px] text-stone-400 block pt-1">
              Alunos inscritos nas tuas aulas
            </span>
          </div>
        </div>

        {/* FORMULÁRIO DE PERFIL PÚBLICO & BIOGRAFIA */}
        <section className="bg-white p-6 sm:p-8 rounded-[28px] border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              <h3 className="font-extrabold text-lg text-stone-900">O Teu Perfil Público & Biografia</h3>
            </div>
            <span className="text-xs text-stone-400">Visível no modal e cartões das aulas</span>
          </div>

          {profileSavedMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {profileSavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Nome Profissional / Marca *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Instagram Handle (sem @)
                </label>
                <div className="relative">
                  <InstagramIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="sofia.yoga.ericeira"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                URL da Foto de Perfil (Avatar)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Biografia Curta (Português)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Instrutora certificada de Vinyasa e Breathwork na Ericeira há 6 anos..."
                  value={bioPt}
                  onChange={(e) => setBioPt(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Short Bio (English)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Certified Vinyasa & Breathwork teacher based in Ericeira for 6 years..."
                  value={bioEn}
                  onChange={(e) => setBioEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? "A gravar..." : "Atualizar Perfil Público"}
              </button>
            </div>
          </form>
        </section>

        {/* DADOS FISCAIS E BANCÁRIOS */}
        <section className="bg-white p-6 sm:p-8 rounded-[28px] border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
            <Banknote className="w-5 h-5 text-teal-700" />
            <h3 className="font-extrabold text-lg text-stone-900">Dados para Pagamentos (Payouts)</h3>
          </div>

          {bankSavedMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {bankSavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveBankDetails} className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Nome do Titular da Conta (IBAN) *
              </label>
              <input
                type="text"
                required
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                IBAN Português ou SEPA *
              </label>
              <input
                type="text"
                required
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none uppercase font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Nome / Firma Associada ao NIF/NIPC *
              </label>
              <input
                type="text"
                required
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                NIF / NIPC (Para Emissão de Recibo/Fatura) *
              </label>
              <input
                type="text"
                required
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none text-xs"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-stone-100">
              <p className="text-[11px] text-stone-500">
                Os fechos de contas são efetuados quinzenalmente mediante recibo verde ou fatura do prestador.
              </p>
              <button
                type="submit"
                disabled={savingBank}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingBank ? "A guardar..." : "Guardar Dados de Payout"}
              </button>
            </div>
          </form>
        </section>

        {/* LISTAGEM DE SESSÕES */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">As tuas Sessões Agendadas</h2>

          {events.length === 0 ? (
            <div className="bg-white p-12 rounded-[28px] border border-stone-200/80 text-center text-stone-500 text-sm">
              Ainda não tens nenhuma aula publicada. Clica em &quot;Publicar Nova Sessão&quot; para começar.
            </div>
          ) : (
            <div className="grid gap-6">
              {events.map((ev) => {
                const dateStr = new Date(ev.start_time).toLocaleString("pt-PT", {
                  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                });

                const confirmedBookings = ev.bookings?.filter((b: any) => b.status === "confirmed") || [];

                return (
                  <div key={ev.id} className="bg-white rounded-[28px] border border-stone-200/80 shadow-xs p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800">
                            {ev.category}
                          </span>
                          <span className="text-xs text-stone-500 font-medium">
                            {ev.price_eur}€ / {ev.credits_cost} créditos
                          </span>
                        </div>
                        <h3 className="text-xl font-bold">{ev.title_en}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-stone-600 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" /> {dateStr} ({ev.duration_minutes} min)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" /> {ev.location_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> {confirmedBookings.length} / {ev.max_spots} Inscritos
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Alunos Inscritos ({confirmedBookings.length})
                      </h4>

                      {confirmedBookings.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">Nenhum aluno inscrito até ao momento.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {confirmedBookings.map((b: any) => (
                            <div key={b.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200/80 text-xs space-y-1">
                              <p className="font-bold text-stone-800">{b.profiles?.full_name || b.profiles?.email || "Aluno"}</p>
                              <p className="text-stone-500">{b.profiles?.email}</p>
                              <span className="inline-block text-[10px] font-semibold text-teal-800 uppercase">
                                {b.payment_method === "ericeira_pass_credits" ? "Ericeira Pass" : "Cartão / MB"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}