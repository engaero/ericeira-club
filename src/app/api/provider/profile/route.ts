import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireProvider } from "@/lib/auth";
import { cleanString, isHttpsUrl } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const { provider } = await requireProvider(request, { verified: false });
    const body = await readJson(request);

    const name = cleanString(body.name, 120);
    if (!name) throw new ApiError(400, "O nome é obrigatório.", "invalid_name");

    const instagram = body.instagramHandle ? String(body.instagramHandle).replace(/^@/, "").trim() : null;
    if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) {
      throw new ApiError(400, "Handle de Instagram inválido.", "invalid_instagram");
    }
    if (body.avatarUrl && !isHttpsUrl(body.avatarUrl)) {
      throw new ApiError(400, "O avatar tem de ser um URL https.", "invalid_avatar");
    }

    const { error } = await supabaseAdmin
      .from("providers")
      .update({
        name,
        bio_pt: body.bioPt ? cleanString(body.bioPt, 2000) : null,
        bio_en: body.bioEn ? cleanString(body.bioEn, 2000) : null,
        instagram_handle: instagram,
        avatar_url: body.avatarUrl ? String(body.avatarUrl).trim() : null,
      })
      .eq("id", provider.id); // só o próprio perfil
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "provider/profile");
  }
}
