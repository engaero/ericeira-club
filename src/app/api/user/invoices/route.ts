import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { handleApiError, requireUser } from "@/lib/auth";

async function handler(request: Request) {
  try {
    const user = await requireUser(request);

    // Customer guardado pelo webhook; fallback por e-mail (verificado, vindo do token — nunca do corpo).
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerIds: string[] = profile?.stripe_customer_id ? [profile.stripe_customer_id] : [];
    if (customerIds.length === 0 && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });
      customerIds = customers.data.map((c) => c.id);
    }

    const charges = await Promise.all(
      customerIds.map((customer) => stripe.charges.list({ customer, limit: 10 }))
    );

    const receipts = charges
      .flatMap((c) => c.data)
      .sort((a, b) => b.created - a.created)
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        amountEur: (c.amount / 100).toFixed(2),
        date: new Date(c.created * 1000).toISOString(),
        receiptUrl: c.receipt_url,
        description: c.description || "Compra Ericeira Hub",
        status: c.status,
      }));

    return NextResponse.json({ receipts });
  } catch (err) {
    return handleApiError(err, "user/invoices");
  }
}

export { handler as GET, handler as POST };
