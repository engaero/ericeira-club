import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { providerId, adminUserId } = await request.json();

    // 1. Confirmar se quem está a chamar a rota é admin
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", adminUserId)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "Acesso reservado a administradores." }, { status: 403 });
    }

    // 2. Aprovar o prestador
    const { error } = await supabaseAdmin
      .from("providers")
      .update({ verified: true })
      .eq("id", providerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}