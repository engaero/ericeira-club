import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { bookingId, userId } = await request.json();

    if (!bookingId || !userId) {
      return NextResponse.json({ error: "Parâmetros em falta." }, { status: 400 });
    }

    // 1. Verificar horário do evento associado
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("event_id, events(start_time)")
      .eq("id", bookingId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
    }

    const event = booking.events as any;
    if (event?.start_time) {
      const eventTime = new Date(event.start_time).getTime();
      const now = new Date().getTime();
      const diffHours = (eventTime - now) / (1000 * 60 * 60);

      if (diffHours < 12) {
        return NextResponse.json(
          {
            error:
              "Política de cancelamento: Não é possível cancelar ou reembolsar com menos de 12 horas de antecedência.",
          },
          { status: 400 }
        );
      }
    }

    // 2. Executar RPC de cancelamento e estorno
    const { data, error } = await supabase.rpc("cancel_booking_and_refund", {
      p_booking_id: bookingId,
      p_user_id: userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao cancelar." }, { status: 500 });
  }
}