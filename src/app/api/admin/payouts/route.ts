import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { adminUserId, providerId, amountEur, periodStart, periodEnd, bankReference } = await request.json();

    // 1. Confirmar privilégios de administrador
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", adminUserId)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "Acesso reservado a administradores." }, { status: 403 });
    }

    // 2. Registar transferência concluída
    const { data, error } = await supabaseAdmin.from("provider_payouts").insert({
      provider_id: providerId,
      amount_eur: parseFloat(amountEur),
      period_start: periodStart,
      period_end: periodEnd,
      bank_reference: bankReference || "Transferência Bancária SEPA",
      status: "paid",
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, payout: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}