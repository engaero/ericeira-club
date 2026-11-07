import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await readJson(request);
    if (!isUuid(body.providerId)) throw new ApiError(400, "Prestador inválido.", "invalid_provider");

    const { error } = await supabaseAdmin.from("providers").update({ verified: true }).eq("id", body.providerId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "admin/approve");
  }
}
