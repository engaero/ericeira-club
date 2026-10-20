import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { adminUserId } = await request.json();

    // 1. Confirmar se o utilizador é administrador
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", adminUserId)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "Acesso reservado a administradores." }, { status: 403 });
    }

    // 2. Carregar todos os prestadores aprovados
    const { data: provs } = await supabaseAdmin
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });

	// 3. Carregar todos os eventos incluindo credits_cost
    const { data: evs } = await supabaseAdmin
      .from("events")
      .select("provider_id, price_eur, credits_cost, bookings(id, status, payment_method, amount_paid_eur, commission_eur)");

    // 4. Carregar histórico de payouts já pagos
    const { data: payouts } = await supabaseAdmin
      .from("provider_payouts")
      .select("provider_id, amount_eur");

    // 5. Apurar saldos pendentes (Multiplicando credits_cost * 4.00€)
    const balances: Record<string, number> = {};

    provs?.forEach((p) => {
      let grossNetPayable = 0;
      const provEvents = evs?.filter((e) => e.provider_id === p.id) || [];
      const ratePerCredit = parseFloat(p.payout_payout_rate_eur || 4.00);

      provEvents.forEach((ev) => {
        const activeBookings = (ev.bookings as any[])?.filter((b: any) => b.status === "confirmed") || [];
        const eventCredits = ev.credits_cost || Math.round(ev.price_eur / 6);

        activeBookings.forEach((b: any) => {
          if (b.payment_method === "ericeira_pass_credits") {
            grossNetPayable += (eventCredits * ratePerCredit);
          } else {
            // Na compra avulsa, o instrutor recebe os mesmos 80% da tarifa base
            grossNetPayable += (eventCredits * ratePerCredit);
          }
        });
      });

      const alreadyPaid = payouts
        ?.filter((po) => po.provider_id === p.id)
        .reduce((acc, curr) => acc + parseFloat(curr.amount_eur || 0), 0) || 0;

      balances[p.id] = Math.max(0, grossNetPayable - alreadyPaid);
    });

    return NextResponse.json({
      providers: provs || [],
      balances,
    });
  } catch (err: any) {
    console.error("[Financial Summary Error]:", err);
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}