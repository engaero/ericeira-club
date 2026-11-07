import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isTelegramChatId, toNumber } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!rateLimit(`provider-register:${user.id}:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
      throw new ApiError(429, "Demasiados pedidos. Tenta novamente mais tarde.", "rate_limited");
    }
    if (!user.email) throw new ApiError(400, "A tua conta não tem e-mail associado.", "no_email");

    const body = await readJson(request);
    const name = cleanString(body.name, 120);
    const type = cleanString(body.type, 40);
    const category = cleanString(body.category, 60);
    const bioEn = body.bioEn ? cleanString(body.bioEn, 2000) : null;
    const bioPt = body.bioPt ? cleanString(body.bioPt, 2000) : null;

    if (!name || !type || !category || (!bioEn && !bioPt)) {
      throw new ApiError(400, "Preenche todos os campos obrigatórios.", "invalid_provider");
    }

    let telegramChatId: string | null = null;
    if (body.telegramChatId) {
      const raw = String(body.telegramChatId).trim();
      if (!isTelegramChatId(raw)) throw new ApiError(400, "Telegram Chat ID inválido (só números).", "invalid_telegram");
      telegramChatId = raw;
    }

    let hourlyRate: number | null = null;
    if (body.hourlyRateEur !== undefined && body.hourlyRateEur !== null && body.hourlyRateEur !== "") {
      hourlyRate = toNumber(body.hourlyRateEur);
      if (hourlyRate === null || hourlyRate < 0 || hourlyRate > 10000) {
        throw new ApiError(400, "Valor/hora inválido.", "invalid_rate");
      }
    }

    const slug =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    // O utilizador e o e-mail vêm do token; o perfil nasce sempre por verificar.
    const { data, error } = await supabaseAdmin
      .from("providers")
      .insert({
        user_id: user.id,
        name,
        slug,
        type,
        category,
        bio_en: bioEn || bioPt,
        bio_pt: bioPt || bioEn,
        telegram_chat_id: telegramChatId,
        email: user.email,
        hourly_rate_eur: hourlyRate,
        verified: false,
      })
      .select("id, slug, verified")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "Já tens um perfil de prestador associado a esta conta.", "already_provider");
      }
      throw error;
    }

    return NextResponse.json({ success: true, provider: data });
  } catch (err) {
    return handleApiError(err, "provider/register");
  }
}
