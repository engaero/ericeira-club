import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { ApiError, handleApiError, readJson } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isEmail, isUuid, toNumber } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`b2b:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
      throw new ApiError(429, "Demasiados pedidos. Tenta novamente mais tarde.", "rate_limited");
    }

    const body = await readJson(request);

    // Campo isco (honeypot): humanos não o preenchem. Respondemos "ok" para não ensinar o bot.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    const providerId = body.providerId;
    const clientName = cleanString(body.clientName, 120);
    const projectDescription = cleanString(body.projectDescription, 3000);
    const companyName = body.companyName ? cleanString(body.companyName, 160) : null;
    const clientPhone = body.clientPhone ? cleanString(body.clientPhone, 30) : null;

    if (!isUuid(providerId) || !clientName || !isEmail(body.clientEmail) || !projectDescription) {
      throw new ApiError(400, "Preenche os campos obrigatórios (Nome, E-mail e Descrição).", "invalid_inquiry");
    }
    const clientEmail = body.clientEmail;

    let budget: number | null = null;
    if (body.estimatedBudgetEur !== undefined && body.estimatedBudgetEur !== null && body.estimatedBudgetEur !== "") {
      budget = toNumber(body.estimatedBudgetEur);
      if (budget === null || budget < 0 || budget > 10_000_000) {
        throw new ApiError(400, "Orçamento inválido.", "invalid_budget");
      }
    }

    // Só prestadores verificados recebem pedidos.
    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("name, telegram_chat_id, verified")
      .eq("id", providerId)
      .maybeSingle();
    if (!provider || !provider.verified) throw new ApiError(404, "Prestador não encontrado.", "provider_not_found");

    const { error: insertError } = await supabaseAdmin.from("b2b_inquiries").insert({
      provider_id: providerId,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      company_name: companyName,
      project_description: projectDescription,
      estimated_budget_eur: budget,
    });
    if (insertError) throw insertError;

    if (provider.telegram_chat_id) {
      await sendTelegramNotification(
        provider.telegram_chat_id,
        `💼 <b>Novo Pedido B2B no Ericeira Hub!</b>\n\n` +
          `👤 <b>Cliente:</b> ${escapeHtml(clientName)}${companyName ? ` (${escapeHtml(companyName)})` : ""}\n` +
          `✉️ <b>E-mail:</b> ${escapeHtml(clientEmail)}${clientPhone ? `\n📞 <b>Tel:</b> ${escapeHtml(clientPhone)}` : ""}\n` +
          `💰 <b>Orçamento Est.:</b> ${budget !== null ? `${budget}€` : "A combinar"}\n\n` +
          `📝 <b>Descrição do Projeto:</b>\n<i>${escapeHtml(projectDescription)}</i>\n\n` +
          `<i>Responde diretamente ao cliente através dos contactos fornecidos.</i>`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "b2b/inquiry");
  }
}
