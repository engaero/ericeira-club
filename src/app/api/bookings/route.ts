import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const { eventId, userId } = await request.json();

    if (!eventId || !userId) {
      return NextResponse.json({ error: "Parâmetros em falta." }, { status: 400 });
    }

    // 1. Executa a reserva atómica na base de dados
    const { data, error } = await supabase.rpc("book_with_credits", {
      p_event_id: eventId,
      p_user_id: userId,
    });

    // 2. Intercetar erro da RPC (incluindo chave duplicada se já estiver inscrito)
    if (error) {
      if (error.message.includes("bookings_event_id_user_id_key")) {
        return NextResponse.json(
          { error: "Já tens uma vaga confirmada nesta aula." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Procurar dados do evento e instrutor para a notificação
    const { data: eventData } = await supabaseAdmin
      .from("events")
      .select("title_en, start_time, max_spots, booked_spots, providers(name, telegram_chat_id)")
      .eq("id", eventId)
      .single();

    // 4. Procurar nome/email do aluno
    const { data: userData } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const providerData = eventData?.providers as any;

    if (providerData?.telegram_chat_id && eventData) {
      const spotsRemaining = eventData.max_spots - eventData.booked_spots;
      const dateFormatted = new Date(eventData.start_time).toLocaleString("pt-PT", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      const studentName = userData?.full_name || userData?.email || "Novo Aluno";

      const message =
        `🌊 *Nova Reserva no Ericeira Hub!*\n\n` +
        `👤 *Aluno:* ${studentName}\n` +
        `🗓️ *Aula:* ${eventData.title_en}\n` +
        `⏰ *Horário:* ${dateFormatted}\n` +
        `🎟️ *Vagas restantes:* ${spotsRemaining} de ${eventData.max_spots}\n\n` +
        `_Reserva confirmada via Ericeira Pass (créditos)._`;

      await sendTelegramNotification(providerData.telegram_chat_id, message);
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    if (err?.message?.includes("bookings_event_id_user_id_key")) {
      return NextResponse.json(
        { error: "Já tens uma vaga confirmada nesta aula." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message || "Erro interno do servidor." }, { status: 500 });
  }
}