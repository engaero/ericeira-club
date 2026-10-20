"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, CheckCircle2, ShieldAlert, UserCheck, 
  Clock, Banknote, SendHorizontal 
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [approvedProviders, setApprovedProviders] = useState<any[]>([]);
  const [payoutStats, setPayoutStats] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/");
      return;
    }

    setCurrentUserId(session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (!profile?.is_admin) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadData(session.user.id);
    setLoading(false);
  }

  async function loadData(adminId?: string) {
    const uid = adminId || currentUserId;
    if (!uid) return;

    try {
      const res = await fetch("/api/admin/financial-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: uid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.providers) {
        setPendingProviders(data.providers.filter((p: any) => !p.verified));
        setApprovedProviders(data.providers.filter((p: any) => p.verified));
      }

      if (data.balances) {
        setPayoutStats(data.balances);
      }
    } catch (err: any) {
      console.error("Erro financeiro:", err.message);
    }
  }

  async function handleApprove(providerId: string) {
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, adminUserId: currentUserId }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setMsg("Instrutor aprovado com sucesso!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao aprovar.");
    }
  }

  async function handleRecordPayout(provider: any, amount: number) {
    if (amount <= 0) {
      alert("Não existem valores pendentes para este prestador.");
      return;
    }

    if (!provider.iban) {
      alert("Este prestador ainda não preencheu o IBAN.");
      return;
    }

    const recipientHolder = provider.bank_account_holder || provider.name;
    const ref = prompt(
      `Confirmar liquidação de ${amount.toFixed(2)}€?\n\nTitular Conta: ${recipientHolder}\nIBAN: ${provider.iban}\nNome Fiscal: ${provider.tax_name || 'N/A'} (NIF: ${provider.tax_id || 'N/A'})\n\nIndica a referência bancária:`,
      "SEPA - " + new Date().toISOString().split("T")[0]
    );
    if (!ref) return;

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: currentUserId,
          providerId: provider.id,
          amountEur: amount,
          periodStart: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
          bankReference: ref,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setMsg(`Transferência de ${amount.toFixed(2)}€ registada com sucesso!`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao registar transferência.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
        A validar permissões de administrador...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-sm max-w-md space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Acesso Restrito</h2>
          <p className="text-sm text-stone-600">Não tens permissões de administrador no Ericeira Hub.</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition"
          >
            Voltar ao Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>
          <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold uppercase">
            Administração Ericeira Hub
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Painel de Gestão & Finanças</h1>
          <p className="text-stone-600 text-sm">Moderação de parceiros e liquidação de transferências a 80%.</p>
        </div>

        {msg && (
          <div className="p-3 bg-teal-700 text-white text-sm rounded-xl flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)} className="underline text-xs cursor-pointer">Fechar</button>
          </div>
        )}

        {/* PENDENTES DE APROVAÇÃO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold">Candidaturas Pendentes ({pendingProviders.length})</h2>
          </div>

          {pendingProviders.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 text-stone-500 text-xs italic">
              Não existem parceiros pendentes de aprovação.
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingProviders.map((p) => (
                <div key={p.id} className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                        {p.category}
                      </span>
                      <span className="text-xs text-stone-400">Tipo: {p.type}</span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                    <p className="text-xs text-stone-500">Email: {p.email} | Telegram: {p.telegram_chat_id || "Não indicado"}</p>
                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100 mt-2">
                      {p.bio_en || p.bio_pt}
                    </p>
                  </div>

                  <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition cursor-pointer shadow"
                    >
                      <UserCheck className="w-4 h-4" /> Aprovar Parceiro
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LIQUIDAÇÃO DE PAGAMENTOS AOS INSTRUTORES */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-bold">Liquidações a Prestadores (Payouts Pendentes)</h2>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100 text-xs">
            {approvedProviders.map((p) => {
              const pendingBalance = payoutStats[p.id] || 0;

              return (
                <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-stone-900">{p.name}</strong>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">{p.category}</span>
                    </div>

                    <div className="text-stone-600 text-xs space-y-0.5 pt-1">
                      <p>
                        Conta Bancária: <strong className="text-stone-800">{p.bank_account_holder || "Titular não indicado"}</strong>
                      </p>
                      <p>
                        IBAN: <strong className="font-mono text-stone-700">{p.iban || "Pendente"}</strong>
                      </p>
                      <p className="text-stone-500 text-[11px]">
                        Fiscal: <strong>{p.tax_name || "Nome fiscal não indicado"}</strong> (NIF: <span className="font-mono">{p.tax_id || "Não fornecido"}</span>) | {p.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs text-stone-400 block uppercase">A Transferir (80%)</span>
                      <span className="text-lg font-extrabold text-teal-700">{pendingBalance.toFixed(2)}€</span>
                    </div>

                    <button
                      disabled={pendingBalance <= 0 || !p.iban}
                      onClick={() => handleRecordPayout(p, pendingBalance)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      Marcar Transferido
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}