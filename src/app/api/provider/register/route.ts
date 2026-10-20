import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      type,
      category,
      bioEn,
      bioPt,
      telegramChatId,
      email,
      hourlyRateEur,
    } = body;

    if (!userId || !name || !type || !category || !email) {
      return NextResponse.json({ error: "Preenche todos os campos obrigatórios." }, { status: 400 });
    }

    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    // Registar com verified: false aguardando validação do administrador
    const { data, error } = await supabaseAdmin.from("providers").insert({
      user_id: userId,
      name,
      slug: cleanSlug,
      type,
      category,
      bio_en: bioEn || bioPt,
      bio_pt: bioPt || bioEn,
      telegram_chat_id: telegramChatId || null,
      email,
      hourly_rate_eur: hourlyRateEur ? parseFloat(hourlyRateEur) : null,
      verified: false, // <-- PENDENTE DE APROVAÇÃO
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Já tens um perfil de prestador associado a esta conta." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, provider: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}