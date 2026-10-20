import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Erro na verificação do Webhook:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;

    const userId = metadata?.userId;
    const itemType = metadata?.itemType;

    // 1. Pacotes de Créditos
    if ((itemType === "credit_package" || itemType === "ericeira_pass") && userId) {
      const creditsToAdd = parseInt(metadata.creditsToAdd || "10", 10);

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("credits_balance")
        .eq("id", userId)
        .maybeSingle();

      const currentBalance = profile?.credits_balance || 0;
      const newBalance = currentBalance + creditsToAdd;

      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, credits_balance: newBalance }, { onConflict: "id" });

      console.log(`[Stripe Webhook] ${creditsToAdd} créditos adicionados ao utilizador ${userId}.`);
    }

    // 2. Compra Avulsa de Aula Específica
    else if (itemType === "single_ticket" && userId && metadata.eventId) {
      const eventId = metadata.eventId;
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
      const commission = amountPaid * 0.20;

      // Incrementar vagas
      const { data: ev } = await supabaseAdmin
        .from("events")
        .select("title_en, start_time, max_spots, booked_spots, providers(name, telegram_chat_id)")
        .eq("id", eventId)
        .single();

      if (ev) {
        await supabaseAdmin
          .from("events")
          .update({ booked_spots: ev.booked_spots + 1 })
          .eq("id", eventId);
      }

      // Registar a reserva direta
      await supabaseAdmin.from("bookings").insert({
        event_id: eventId,
        user_id: userId,
        payment_method: "stripe_direct",
        amount_paid_eur: amountPaid,
        commission_eur: commission,
        status: "confirmed",
      });

      // Notificar no Telegram
      if (ev?.providers?.telegram_chat_id) {
        const spotsRemaining = Math.max(0, ev.max_spots - (ev.booked_spots + 1));
        const dateFormatted = new Date(ev.start_time).toLocaleString("pt-PT", {
          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
        });

        const message =
          `🌊 *Nova Compra Avulsa no Ericeira Hub!*\n\n` +
          `👤 *Aluno ID:* ${userId}\n` +
          `🗓️ *Aula:* ${ev.title_en}\n` +
          `⏰ *Horário:* ${dateFormatted}\n` +
          `💳 *Pagamento:* ${amountPaid.toFixed(2)}€ pago diretamente via Stripe\n` +
          `🎟️ *Vagas restantes:* ${spotsRemaining} de ${ev.max_spots}\n\n` +
          `_Vaga confirmada._`;

        await sendTelegramNotification(ev.providers.telegram_chat_id, message);
      }
    }

    // 3. Subscrição de Concierge
    else if (itemType === "concierge_subscription" && userId) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 31);

      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          concierge_tier: "monthly_family",
          concierge_valid_until: validUntil.toISOString(),
        },
        { onConflict: "id" }
      );
    }
  }

  return NextResponse.json({ received: true });
}