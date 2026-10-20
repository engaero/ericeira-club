import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { providerId, name, bioPt, bioEn, instagramHandle, avatarUrl } = await request.json();

    if (!providerId) {
      return NextResponse.json({ error: "Identificador de prestador em falta." }, { status: 400 });
    }

    const cleanInstagram = instagramHandle
      ? instagramHandle.replace("@", "").trim()
      : null;

    const { error } = await supabaseAdmin
      .from("providers")
      .update({
        name: name?.trim(),
        bio_pt: bioPt?.trim(),
        bio_en: bioEn?.trim(),
        instagram_handle: cleanInstagram,
        avatar_url: avatarUrl?.trim() || null,
      })
      .eq("id", providerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}