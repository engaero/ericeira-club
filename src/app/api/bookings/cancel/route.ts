import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { bookingId, userId } = await request.json();

    if (!bookingId || !userId) {
      return NextResponse.json({ error: "Parâmetros em falta." }, { status: 400 });
    }

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