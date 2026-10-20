"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Calendar, MapPin, CheckCircle2, 
  CreditCard, ShieldCheck, XCircle, LogOut, User, 
  Receipt, ExternalLink, Save, Phone, Clock 
} from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Estados do formulário de perfil
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/");
      return;
    }

    setCurrentUser(session.user);

    // 1. Carregar Perfil
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || "");
      setPhone(profileData.phone || "");
    }

    // 2. Carregar Reservas
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        payment_method,
        created_at,
        events (
          id,
          title_en,
          start_time,
          duration_minutes,
          location_name,
          category,
          providers ( name )
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (bookingsData) setBookings(bookingsData);

    // 3. Carregar Histórico do Stripe
    if (session.user.email) {
      try {
        const res = await fetch("/api/user/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });
        const resData = await res.json();
        if (resData.receipts) setReceipts(resData.receipts);
      } catch (e) {
        console.error("Erro ao carregar recibos:", e);
      }
    }

    setLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          fullName,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfileSuccessMsg("Dados atualizados com sucesso!");
      loadUserData();
    } catch (err: any) {
      alert(err.message || "Erro ao guardar dados.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Cancelamento com validação da regra de antecedência de 12 horas
  async function handleCancel(booking: any) {
    const startTime = new Date(booking.events?.start_time).getTime();
    const now = new Date().getTime();
    const hoursLeft = (startTime - now) / (1000 * 60 * 60);

    let confirmMsg = "";
    if (hoursLeft >= 12) {
      confirmMsg = `Faltam ${Math.round(hoursLeft)} horas para o início da sessão.\n\nSe cancelares agora, o teu crédito será integralmente devolvido ao saldo do teu Ericeira Pass.\n\nPretendes continuar com o cancelamento?`;
    } else {
      confirmMsg = `Atenção à política de cancelamento:\nFaltam menos de 12 horas para a sessão (ou a aula já começou).\n\nA tua vaga será libertada para a turma, mas o crédito NÃO será reembolsado, de modo a proteger o instrutor.\n\nPretendes cancelar mesmo assim?`;
    }

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, userId: currentUser.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.result?.refunded) {
        setActionNotice("Reserva cancelada com sucesso! O teu crédito foi devolvido ao saldo.");
      } else {
        setActionNotice("Reserva cancelada. Conforme a política de 12h, a vaga foi libertada sem estorno de créditos.");
      }

      loadUserData();
    } catch (err: any) {
      alert(err.message || "Erro ao cancelar a reserva.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
        A carregar os teus dados...
      </div>
    );
  }

  const isConciergeActive = profile?.concierge_tier && profile.concierge_tier !== "free";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      {/* NAVBAR */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500 hidden sm:inline">{currentUser?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
              className="p-2 text-stone-500 hover:text-stone-800 cursor-pointer"
              title="Terminar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10 space-y-10">
        {actionNotice && (
          <div className="p-3 bg-teal-700 text-white text-sm rounded-xl flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-xs underline cursor-pointer">
              Fechar
            </button>
          </div>
        )}

        {/* CARTÕES DE ESTADO / CARTEIRA */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Ericeira Pass Balance
              </span>
              <p className="text-3xl font-extrabold text-stone-900">
                {profile?.credits_balance ?? 0} <span className="text-base font-medium text-stone-500">créditos</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Family Concierge
              </span>
              <div className="flex items-center gap-2 pt-1">
                {isConciergeActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Subscrição Ativa
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-stone-500">Plano Gratuito</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE DADOS PESSOAIS */}
        <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <User className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-base text-stone-900">Os Teus Dados de Contacto</h3>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
              {profileSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                placeholder="ex: Simão Morant"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="+351 912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? "A gravar..." : "Atualizar Dados"}
              </button>
            </div>
          </form>
        </section>

        {/* HISTÓRICO DE RESERVAS COM POLÍTICA DE 12 HORAS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-2xl font-bold tracking-tight">As tuas Reservas</h2>
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> Cancelamento com estorno até 12h antes
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
              Ainda não tens nenhuma aula reservada.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const event = b.events;
                const isCancelled = b.status === "cancelled";
                const dateStr = event?.start_time
                  ? new Date(event.start_time).toLocaleString("pt-PT", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div
                    key={b.id}
                    className={`bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCancelled ? "opacity-60 bg-stone-50" : ""
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800">
                          {event?.category}
                        </span>
                        {isCancelled && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Cancelada
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{event?.title_en}</h3>
                      <p className="text-xs text-stone-500">
                        Instrutor: <strong className="text-stone-700">{event?.providers?.name}</strong>
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-stone-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-700" /> {dateStr}
                        </span>
                        <a
						  href={event?.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(event?.location_name + ', Ericeira')}`}
						  target="_blank"
						  rel="noopener noreferrer"
						  className="flex items-center gap-1 hover:text-teal-700 hover:underline transition"
						>
						  <MapPin className="w-3.5 h-3.5 text-teal-700" /> {event?.location_name} ↗
						</a>
                      </div>
                    </div>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancel(b)}
                        className="text-xs font-semibold px-4 py-2 rounded-xl text-red-600 border border-red-200 hover:bg-red-50 transition cursor-pointer self-start sm:self-center"
                      >
                        Cancelar Reserva
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RECIBOS & TRANSAÇÕES STRIPE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            <h2 className="text-2xl font-bold tracking-tight">Histórico de Pagamentos & Recibos</h2>
          </div>

          {receipts.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 text-stone-500 text-xs text-center">
              Sem pagamentos diretos registados via Stripe.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-stone-100">
                {receipts.map((rec) => (
                  <div key={rec.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-stone-900">{rec.description}</p>
                      <p className="text-stone-500">
                        {new Date(rec.date).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-stone-900 text-sm">{rec.amountEur}€</span>
                      {rec.receiptUrl && (
                        <a
                          href={rec.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold transition"
                        >
                          Recibo <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}