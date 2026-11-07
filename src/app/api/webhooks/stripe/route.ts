import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { escapeHtml, notifyAdmin, sendTelegramNotification } from "@/lib/telegram";
import { CREDITS_VALIDITY_DAYS, CREDIT_PACKS, isPackId } from "@/lib/pricing";
import { isUuid } from "@/lib/validators";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Loose = Record<string, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook mal configurado." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[Stripe Webhook] Assinatura inválida:", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckout(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.async_payment_failed": {
        const s = event.data.object as Stripe.Checkout.Session;
        console.warn(`[Stripe Webhook] Pagamento assíncrono falhado (sessão ${s.id}).`);
        break;
      }

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as unknown as Loose);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as unknown as Loose);
        break;

      default:
        break; // eventos que não nos interessam
    }
  } catch (err) {
    // 500 => o Stripe volta a entregar o evento. Todas as operações são idempotentes.
    console.error(`[Stripe Webhook] Falha ao processar ${event.type} (${event.id}):`, err);
    return NextResponse.json({ error: "Falha ao processar evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/* ------------------------------------------------------------------ */

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  // Métodos de pagamento assíncronos: só cumprir quando o dinheiro estiver confirmado.
  if (session.payment_status !== "paid") {
    console.log(`[Stripe Webhook] Sessão ${session.id} ainda não paga (${session.payment_status}); a aguardar.`);
    return;
  }

  const metadata = session.metadata || {};
  const userId = metadata.userId;
  const itemType = metadata.itemType;
  if (!isUuid(userId) || !itemType) {
    console.error(`[Stripe Webhook] Sessão ${session.id} sem metadata válida.`);
    return;
  }

  if (itemType === "credit_package") {
    await fulfillCreditPackage(session, userId);
  } else if (itemType === "single_ticket") {
    await fulfillSingleTicket(session, userId, metadata.eventId);
  } else if (itemType === "concierge_subscription") {
    const { error } = await supabaseAdmin.rpc("app_set_concierge", {
      p_key: `checkout:${session.id}`,
      p_user_id: userId,
      p_tier: "monthly_family",
      p_valid_until: new Date(Date.now() + 35 * DAY_MS).toISOString(), // invoice.paid afina a data
      p_force: false,
    });
    if (error) throw error;
  }

  await saveStripeCustomer(userId, session.customer);
}

async function fulfillCreditPackage(session: Stripe.Checkout.Session, userId: string) {
  const packageId = session.metadata?.packageId;
  if (!isPackId(packageId)) throw new Error(`Pacote desconhecido na sessão ${session.id}`);
  const pack = CREDIT_PACKS[packageId];

  if (session.amount_total !== pack.amountCents) {
    await notifyAdmin(`Valor inesperado na sessão ${escapeHtml(session.id)}: ${session.amount_total} ≠ ${pack.amountCents} cêntimos.`);
    throw new Error(`Valor pago não corresponde ao pacote (${session.id})`);
  }

  const { data, error } = await supabaseAdmin.rpc("app_credit_wallet", {
    p_key: `checkout:${session.id}`,
    p_user_id: userId,
    p_credits: pack.credits,
    p_days: CREDITS_VALIDITY_DAYS,
  });
  if (error) throw error;
  console.log(`[Stripe Webhook] ${pack.credits} créditos → ${userId} (${data?.status}).`);
}

async function fulfillSingleTicket(session: Stripe.Checkout.Session, userId: string, eventId?: string) {
  if (!isUuid(eventId)) throw new Error(`Sessão ${session.id} sem eventId válido`);

  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const amountCents = session.amount_total ?? 0;

  const { data, error } = await supabaseAdmin.rpc("app_confirm_direct_booking", {
    p_key: `checkout:${session.id}`,
    p_session_id: session.id,
    p_event_id: eventId,
    p_user_id: userId,
    p_amount_cents: amountCents,
    p_payment_intent: paymentIntent,
  });
  if (error) throw error;

  const status: string = data?.status;

  if (status === "full" || status === "duplicate_booking" || status === "event_not_found") {
    // Pagou mas não há lugar / já tinha reserva: reembolso automático (idempotente no Stripe).
    if (!paymentIntent) throw new Error(`Sem payment_intent para reembolsar a sessão ${session.id}`);
    await stripe.refunds.create({ payment_intent: paymentIntent }, { idempotencyKey: `refund-${session.id}` });
    await notifyAdmin(`Compra reembolsada automaticamente (${escapeHtml(status)}) — sessão Stripe ${escapeHtml(session.id)}.`);
    return;
  }

  if (status !== "created") return; // already_processed

  const { data: ev } = await supabaseAdmin
    .from("events")
    .select("title_pt, title_en, start_time, max_spots, booked_spots, providers(name, telegram_chat_id)")
    .eq("id", eventId)
    .maybeSingle();

  const provider = ev?.providers as unknown as { telegram_chat_id?: string | null } | null;
  if (ev && provider?.telegram_chat_id) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const dateFormatted = new Date(ev.start_time).toLocaleString("pt-PT", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Lisbon",
    });
    const spotsRemaining = Math.max(0, ev.max_spots - ev.booked_spots);

    await sendTelegramNotification(
      provider.telegram_chat_id,
      `🌊 <b>Nova Compra Avulsa no Ericeira Hub!</b>\n\n` +
        `👤 <b>Aluno:</b> ${escapeHtml(profile?.full_name || profile?.email || "Novo aluno")}\n` +
        `🗓️ <b>Aula:</b> ${escapeHtml(ev.title_pt || ev.title_en)}\n` +
        `⏰ <b>Horário:</b> ${escapeHtml(dateFormatted)}\n` +
        `💳 <b>Pagamento:</b> ${(amountCents / 100).toFixed(2)}€ pago diretamente via Stripe\n` +
        `🎟️ <b>Vagas restantes:</b> ${spotsRemaining} de ${ev.max_spots}\n\n` +
        `<i>Vaga confirmada.</i>`
    );
  }
}

async function saveStripeCustomer(userId: string, customer: Stripe.Checkout.Session["customer"]) {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return;
  // Falhar aqui não deve anular um pagamento já cumprido.
  const { error } = await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  if (error) console.error("[Stripe Webhook] Não foi possível guardar stripe_customer_id:", error);
}

async function userIdFromCustomer(customerId: string | undefined): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabaseAdmin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.id ?? null;
}

/** Renovações mensais: prolonga o acesso até ao fim do período pago (+3 dias de tolerância). */
async function handleInvoicePaid(invoice: Loose) {
  const line = invoice.lines?.data?.[0];
  const metadata: Loose =
    invoice.parent?.subscription_details?.metadata ?? invoice.subscription_details?.metadata ?? line?.metadata ?? {};

  const isSubscription = Boolean(invoice.subscription ?? invoice.parent?.subscription_details?.subscription);
  if (!isSubscription) return;

  let userId: string | null = isUuid(metadata.userId) ? metadata.userId : null;
  if (!userId) userId = await userIdFromCustomer(typeof invoice.customer === "string" ? invoice.customer : undefined);
  if (!userId) {
    console.error(`[Stripe Webhook] invoice.paid ${invoice.id} sem utilizador associado.`);
    return;
  }

  const periodEnd: number | undefined = line?.period?.end;
  const validUntil = new Date((periodEnd ? periodEnd * 1000 : Date.now() + 31 * DAY_MS) + 3 * DAY_MS);

  const { error } = await supabaseAdmin.rpc("app_set_concierge", {
    p_key: `invoice:${invoice.id}`,
    p_user_id: userId,
    p_tier: "monthly_family",
    p_valid_until: validUntil.toISOString(),
    p_force: false,
  });
  if (error) throw error;
}

/** Subscrição cancelada/terminada: remove o acesso. */
async function handleSubscriptionDeleted(subscription: Loose) {
  let userId: string | null = isUuid(subscription.metadata?.userId) ? subscription.metadata.userId : null;
  if (!userId) userId = await userIdFromCustomer(typeof subscription.customer === "string" ? subscription.customer : undefined);
  if (!userId) return;

  const { error } = await supabaseAdmin.rpc("app_set_concierge", {
    p_key: `subdel:${subscription.id}`,
    p_user_id: userId,
    p_tier: "free",
    p_valid_until: new Date().toISOString(),
    p_force: true,
  });
  if (error) throw error;
}
