import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail em falta." }, { status: 400 });
    }

    // 1. Procurar cliente Stripe associado ao email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ invoices: [] });
    }

    const customerId = customers.data[0].id;

    // 2. Procurar pagamentos / sessões concluídas
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 10,
    });

    const receipts = charges.data.map((c) => ({
      id: c.id,
      amountEur: (c.amount / 100).toFixed(2),
      date: new Date(c.created * 1000).toISOString(),
      receiptUrl: c.receipt_url,
      description: c.description || "Compra Ericeira Hub",
      status: c.status,
    }));

    return NextResponse.json({ receipts });
  } catch (err: any) {
    console.error("[Stripe Invoices Error]:", err);
    return NextResponse.json({ error: err.message || "Erro ao obter recibos." }, { status: 500 });
  }
}