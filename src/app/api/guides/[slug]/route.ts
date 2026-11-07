import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOptionalUser, handleApiError } from "@/lib/auth";

/**
 * Devolve o guia. O conteúdo privado só é enviado se a subscrição Concierge estiver ativa
 * (tier ≠ free E concierge_valid_until no futuro). O paywall passa a ser aplicado no servidor.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!/^[a-z0-9-]{1,120}$/i.test(slug)) {
      return NextResponse.json({ error: "Guia não encontrado.", code: "not_found" }, { status: 404 });
    }

    const { data: guide } = await supabaseAdmin
      .from("concierge_guides")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!guide) {
      return NextResponse.json({ error: "Guia não encontrado.", code: "not_found" }, { status: 404 });
    }

    let hasAccess = false;
    const user = await getOptionalUser(request);
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("concierge_tier, concierge_valid_until")
        .eq("id", user.id)
        .maybeSingle();

      hasAccess = Boolean(
        profile?.concierge_tier &&
          profile.concierge_tier !== "free" &&
          profile.concierge_valid_until &&
          new Date(profile.concierge_valid_until).getTime() > Date.now()
      );
    }

    const { content_private_markdown, ...publicFields } = guide;
    return NextResponse.json({
      guide: hasAccess ? { ...publicFields, content_private_markdown } : publicFields,
      hasAccess,
      isAuthenticated: Boolean(user),
    });
  } catch (err) {
    return handleApiError(err, "guides");
  }
}
