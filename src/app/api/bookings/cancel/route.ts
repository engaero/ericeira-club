import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireUser, throwFromRpcError } from "@/lib/auth";
import { notifyAdmin, escapeHtml } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    if (typeof body.bookingId !== "string" || body.bookingId.length === 0 || body.bookingId.length > 64) {
      throw new ApiError(400, "Reserva inválida.", "invalid_booking");
    }
    const bookingId = body.bookingId;

    // A regra das 12 horas e o estorno são decididos DENTRO da função SQL, de forma atómica:
    // >= 12h → vaga libertada e reembolso; < 12h → vaga libertada sem reembolso.
    const { data, error } = await supabaseAdmin.rpc("app_cancel_booking", {
      p_booking_id: bookingId,
      p_user_id: user.id,
    });
    throwFromRpcError(error);

    // Compras diretas (Stripe) reembolsadas: devolver o dinheiro no Stripe.
    let stripeRefundFailed = false;
    if (data?.refunded && data?.payment_method === "stripe_direct" && data?.payment_intent) {
      try {
        await stripe.refunds.create(
          { payment_intent: data.payment_intent },
          { idempotencyKey: `cancel-refund-${bookingId}` }
        );
      } catch (refundErr) {
        stripeRefundFailed = true;
        console.error("[Cancel] Falha no reembolso Stripe:", refundErr);
        await notifyAdmin(`Reembolso Stripe falhou para a reserva ${escapeHtml(bookingId)} — tratar manualmente.`);
      }
    }

    return NextResponse.json({
      success: true,
      result: { refunded: Boolean(data?.refunded), stripeRefundFailed },
    });
  } catch (err) {
    return handleApiError(err, "bookings/cancel");
  }
}
