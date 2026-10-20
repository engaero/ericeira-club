import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { userId, userEmail, itemType, packageId, eventId, eventTitle, priceEur } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Utilizador não autenticado." }, { status: 401 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    let metadata: Record<string, string> = {
      userId,
      itemType,
    };

    let lineItems = [];
    let mode: "payment" | "subscription" = "payment";

    // 1. PACOTES DE CRÉDITOS (PAGAMENTO ÚNICO)
    if (itemType === "credit_package") {
      let name = "Ericeira Pass (35 Créditos)";
      let unitAmount = 16500;
      let creditsToAdd = 35;

      if (packageId === "pack_12") {
        name = "Pack Iniciante (12 Créditos)";
        unitAmount = 5900;
        creditsToAdd = 12;
      } else if (packageId === "pack_35") {
        name = "Ericeira Pass (35 Créditos)";
        unitAmount = 16500;
        creditsToAdd = 35;
      } else if (packageId === "pack_70") {
        name = "Pack Comunidade (70 Créditos)";
        unitAmount = 31500;
        creditsToAdd = 70;
      }

      metadata.creditsToAdd = creditsToAdd.toString();

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name,
            description: `Carteira de ${creditsToAdd} créditos para aulas e workshops na Ericeira.`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      });
    }

    // 2. COMPRA AVULSA (PAGAMENTO ÚNICO)
    else if (itemType === "single_ticket") {
      if (!eventId || !priceEur) {
        return NextResponse.json({ error: "Dados do evento incompletos." }, { status: 400 });
      }

      metadata.eventId = eventId;
      metadata.eventTitle = eventTitle || "Aula Avulso";

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Bilhete Avulso: ${eventTitle}`,
            description: "Reserva imediata (inclui taxa de serviço).",
          },
          unit_amount: Math.round(Number(priceEur) * 100),
        },
        quantity: 1,
      });
    }

    // 3. SUBSCRIÇÃO DO CONCIERGE (MENSAL RECORRENTE)
    else if (itemType === "concierge_subscription") {
      mode = "subscription";
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
    }

    // O MB WAY só é compatível com compras avulso e pacotes (não recorrente).
    // Nas subscrições mensais usamos ["card", "paypal"].
    const paymentMethodTypes = mode === "subscription" 
      ? ["card", "paypal"] 
      : ["card", "mb_way", "paypal"];

	const sessionParams: any = {
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      mode,
      customer_email: userEmail,
      metadata,
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    };

    if (mode === "subscription") {
      sessionParams.subscription_data = { metadata };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });  } catch (error: any) {
    console.error("Erro ao criar checkout Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}