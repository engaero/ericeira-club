import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireAdmin, throwFromRpcError } from "@/lib/auth";
import { cleanString, toNumber } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await readJson(request);

    const providerId = cleanString(body.providerId, 64);
    const amount = toNumber(body.amountEur);
    if (!providerId || amount === null || amount <= 0 || amount > 100000) {
      throw new ApiError(400, "Dados do pagamento inválidos.", "invalid_payout");
    }

    const periodStart = new Date(String(body.periodStart));
    const periodEnd = new Date(String(body.periodEnd));
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw new ApiError(400, "Período inválido.", "invalid_period");
    }

    // O valor é validado contra o saldo dentro da função SQL (com lock no prestador).
    const { data, error } = await supabaseAdmin.rpc("app_record_payout", {
      p_provider_id: providerId,
      p_amount_cents: Math.round(amount * 100),
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
      p_reference: cleanString(body.bankReference, 120) || "Transferência Bancária SEPA",
    });
    throwFromRpcError(error);

    return NextResponse.json({ success: true, payout: data });
  } catch (err) {
    return handleApiError(err, "admin/payouts");
  }
}
