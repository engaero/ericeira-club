import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (fullName.length > 120) throw new ApiError(400, "Nome demasiado longo.", "invalid_name");
    if (phone && !/^[+\d\s()-]{6,25}$/.test(phone)) throw new ApiError(400, "Telefone inválido.", "invalid_phone");

    // Só o próprio utilizador (deduzido do token) e só estas duas colunas.
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName || null, phone: phone || null })
      .eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "user/profile");
  }
}
