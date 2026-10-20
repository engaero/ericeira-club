import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { userId, fullName, phone } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Utilizador não autenticado." }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
      })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}