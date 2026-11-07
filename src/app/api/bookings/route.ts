import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireUser, throwFromRpcError } from "@/lib/auth";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { isUuid } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    if (!isUuid(body.eventId)) throw new ApiError(400, "Sessão inválida.", "invalid_event");
    const eventId = body.eventId;

    // Reserva atómica (locks + validações dentro da função SQL; só o servidor a pode invocar).
    const { data, error } = await supabaseAdmin.rpc("app_book_with_credits", {
      p_event_id: eventId,
      p_user_id: user.id,
    });
    throwFromRpcError(error);

    // Notificação ao instrutor — nunca pode transformar uma reserva feita em erro.
    try {
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
          .eq("id", user.id)
          .maybeSingle();

        const dateFormatted = new Date(ev.start_time).toLocaleString("pt-PT", {
          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          timeZone: "Europe/Lisbon",
        });

        await sendTelegramNotification(
          provider.telegram_chat_id,
          `🌊 <b>Nova Reserva no Ericeira Hub!</b>\n\n` +
            `👤 <b>Aluno:</b> ${escapeHtml(profile?.full_name || profile?.email || "Novo aluno")}\n` +
            `🗓️ <b>Aula:</b> ${escapeHtml(ev.title_pt || ev.title_en)}\n` +
            `⏰ <b>Horário:</b> ${escapeHtml(dateFormatted)}\n` +
            `🎟️ <b>Vagas restantes:</b> ${Math.max(0, ev.max_spots - ev.booked_spots)} de ${ev.max_spots}\n\n` +
            `<i>Reserva confirmada via Ericeira Pass (créditos).</i>`
        );
      }
    } catch (notifyErr) {
      console.error("[Bookings] Falha na notificação (reserva já confirmada):", notifyErr);
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    return handleApiError(err, "bookings");
  }
}
