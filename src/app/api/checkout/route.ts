import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireUser } from "@/lib/auth";
import { CREDIT_PACKS, isPackId } from "@/lib/pricing";
import { isUuid } from "@/lib/validators";

const STRIPE_MIN_CENTS = 50;

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user.email) throw new ApiError(400, "A tua conta não tem e-mail associado.", "no_email");

    const body = await readJson(request);
    const itemType = String(body.itemType ?? "");

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");

    const metadata: Record<string, string> = { userId: user.id, itemType };
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: "payment" | "subscription" = "payment";

    // 1. PACOTES DE CRÉDITOS
    if (itemType === "credit_package") {
      if (!isPackId(body.packageId)) throw new ApiError(400, "Pacote inválido.", "invalid_package");
      const pack = CREDIT_PACKS[body.packageId];

      metadata.packageId = body.packageId;
      metadata.creditsToAdd = String(pack.credits);

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: pack.name,
            description: `Carteira de ${pack.credits} créditos para aulas e workshops na Ericeira.`,
          },
          unit_amount: pack.amountCents,
        },
        quantity: 1,
      });
    }

    // 2. BILHETE AVULSO
    else if (itemType === "single_ticket") {
      if (!isUuid(body.eventId)) throw new ApiError(400, "Sessão inválida.", "invalid_event");

      const { data: ev } = await supabaseAdmin
        .from("events")
        .select("id, title_pt, title_en, price_eur, start_time, max_spots, booked_spots")
        .eq("id", body.eventId)
        .maybeSingle();

      if (!ev) throw new ApiError(404, "Sessão não encontrada.", "event_not_found");
      if (new Date(ev.start_time).getTime() <= Date.now()) throw new ApiError(400, "Esta sessão já começou.", "event_started");
      if (ev.booked_spots >= ev.max_spots) throw new ApiError(409, "Esta sessão está esgotada.", "event_full");

      const { data: existing } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("event_id", ev.id)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .maybeSingle();
      if (existing) throw new ApiError(409, "Já tens uma vaga confirmada nesta aula.", "already_booked");

      const unitAmount = Math.round(Number(ev.price_eur) * 100);
      if (!Number.isFinite(unitAmount) || unitAmount < STRIPE_MIN_CENTS) {
        throw new ApiError(400, "Esta sessão não está disponível para compra direta.", "invalid_price");
      }

      const title = ev.title_pt || ev.title_en || "Aula";
      metadata.eventId = ev.id;
      metadata.eventTitle = title.slice(0, 200);

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Bilhete Avulso: ${title}`.slice(0, 250),
            description: "Reserva imediata (inclui taxa de serviço).",
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      });
    }

    // 3. SUBSCRIÇÃO CONCIERGE
    else if (itemType === "concierge_subscription") {
      mode = "subscription";

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("concierge_tier, concierge_valid_until")
        .eq("id", user.id)
        .maybeSingle();

      const stillActive =
        profile?.concierge_tier &&
        profile.concierge_tier !== "free" &&
        profile.concierge_valid_until &&
        new Date(profile.concierge_valid_until).getTime() > Date.now();
      if (stillActive) throw new ApiError(409, "Já tens uma subscrição Concierge ativa.", "already_subscribed");

      lineItems.push({
        price_data: {
          currency: "eur",
          recurring: { interval: "month" },
          product_data: {
            name: "Concierge Familiar Ericeira & Mafra",
            description: "Acesso aos guias restritos de saúde privada, escolas e apoio bilingue.",
          },
          unit_amount: 4900,
        },
        quantity: 1,
      });
    } else {
      throw new ApiError(400, "Tipo de compra inválido.", "invalid_item");
    }

    // Configuração agnóstica de payment_method_types compatível com Stripe v14 a v23
    const paymentMethods = mode === "subscription" ? ["card", "paypal"] : ["card", "mb_way", "paypal"];

    const params: any = {
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata,
      success_url: `${siteUrl}/?payment=success`,
      cancel_url: `${siteUrl}/?payment=cancelled`,
    };

    if (mode === "subscription") {
      params.subscription_data = { metadata };
    } else {
      params.customer_creation = "always";
      params.payment_intent_data = { metadata };
    }

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleApiError(err, "checkout");
  }
}