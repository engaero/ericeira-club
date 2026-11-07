import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { handleApiError, requireUser } from "@/lib/auth";

/** Perfil completo do próprio prestador (inclui dados sensíveis que o browser já não pode ler diretamente). */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { data, error } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ provider: data ?? null });
  } catch (err) {
    return handleApiError(err, "provider/me");
  }
}
