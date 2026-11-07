import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { handleApiError, requireAdmin } from "@/lib/auth";

// GET e POST (o painel antigo usava POST) — o admin é identificado pelo token, não pelo corpo.
async function handler(request: Request) {
  try {
    await requireAdmin(request);

    const { data: providers, error: provError } = await supabaseAdmin
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });
    if (provError) throw provError;

    // Saldos calculados na base de dados a partir do valor devido guardado em cada reserva
    // (snapshot no momento da reserva, só sessões já realizadas, descontando o já pago).
    const { data: rows, error: balError } = await supabaseAdmin.rpc("app_provider_balances");
    if (balError) throw balError;

    const balances: Record<string, number> = {};
    for (const r of (rows ?? []) as { provider_id: string; earned_cents: number; paid_cents: number }[]) {
      balances[r.provider_id] = Math.max(0, Number(r.earned_cents) - Number(r.paid_cents)) / 100;
    }

    return NextResponse.json({ providers: providers ?? [], balances });
  } catch (err) {
    return handleApiError(err, "admin/financial-summary");
  }
}

export { handler as GET, handler as POST };
