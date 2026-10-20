import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      providerId,
      clientName,
      clientEmail,
      clientPhone,
      companyName,
      projectDescription,
      estimatedBudgetEur,
    } = body;

    if (!providerId || !clientName || !clientEmail || !projectDescription) {
      return NextResponse.json(
        { error: "Preenche os campos obrigatórios (Nome, E-mail e Descrição)." },
        { status: 400 }
      );
    }

    // 1. Gravar pedido na base de dados
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from("b2b_inquiries")
      .insert({
        provider_id: providerId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone || null,
        company_name: companyName || null,
        project_description: projectDescription,
        estimated_budget_eur: estimatedBudgetEur ? parseFloat(estimatedBudgetEur) : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[B2B Inquiry] Erro ao gravar:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 2. Procurar dados do freelancer para notificar via Telegram
    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("name, telegram_chat_id")
      .eq("id", providerId)
      .single();

    if (provider?.telegram_chat_id) {
      const budgetText = estimatedBudgetEur ? `${estimatedBudgetEur}€` : "A combinar";
      const companyText = companyName ? ` (${companyName})` : "";
      const phoneText = clientPhone ? `\n📞 *Tel:* ${clientPhone}` : "";

      const message =
        `💼 *Novo Pedido B2B no Ericeira Hub!*\n\n` +
        `👤 *Cliente:* ${clientName}${companyText}\n` +
        `✉️ *E-mail:* ${clientEmail}${phoneText}\n` +
        `💰 *Orçamento Est.:* ${budgetText}\n\n` +
        `📝 *Descrição do Projeto:*\n_${projectDescription}_\n\n` +
        `_Responde diretamente ao cliente através dos contactos fornecidos._`;

      await sendTelegramNotification(provider.telegram_chat_id, message);
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}