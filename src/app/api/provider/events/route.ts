import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireProvider } from "@/lib/auth";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { cleanString, isHttpsUrl, isUuid, toNumber } from "@/lib/validators";

/** Criar sessão — só prestadores VERIFICADOS, sempre no seu próprio nome. */
export async function POST(request: Request) {
  try {
    const { provider } = await requireProvider(request);
    const body = await readJson(request);

    const titlePt = body.titlePt ? cleanString(body.titlePt, 160) : null;
    const titleEn = body.titleEn ? cleanString(body.titleEn, 160) : null;
    if (!titlePt && !titleEn) throw new ApiError(400, "Preenche pelo menos um título.", "invalid_title");

    const category = String(body.category ?? "");
    if (!EVENT_CATEGORIES.includes(category)) throw new ApiError(400, "Categoria inválida.", "invalid_category");

    const pricingModel = body.pricingModel === "direct_only" ? "direct_only" : "credits_allowed";

    const priceEur = toNumber(body.priceEur);
    if (priceEur === null || priceEur < 0.5 || priceEur > 2000) throw new ApiError(400, "Preço inválido (0,50€ a 2000€).", "invalid_price");

    const maxSpots = toNumber(body.maxSpots);
    if (maxSpots === null || !Number.isInteger(maxSpots) || maxSpots < 1 || maxSpots > 200) {
      throw new ApiError(400, "Número de vagas inválido (1 a 200).", "invalid_spots");
    }

    const duration = toNumber(body.durationMinutes) ?? 60;
    if (!Number.isInteger(duration) || duration < 15 || duration > 720) {
      throw new ApiError(400, "Duração inválida.", "invalid_duration");
    }

    // Uma sessão (startTime) ou várias (startTimes, recorrência semanal calculada no cliente
    // para respeitar a hora local nas mudanças de hora). Máx. 26 sessões, dentro de 1 ano.
    const rawStarts: unknown[] = Array.isArray(body.startTimes) ? body.startTimes : [body.startTime];
    if (rawStarts.length < 1 || rawStarts.length > 26) {
      throw new ApiError(400, "Número de sessões inválido (1 a 26).", "invalid_occurrences");
    }
    const maxStart = Date.now() + 366 * 24 * 60 * 60 * 1000;
    const starts: Date[] = rawStarts.map((v) => new Date(String(v)));
    for (const d of starts) {
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now() || d.getTime() > maxStart) {
        throw new ApiError(400, "A data de início tem de ser no futuro (até 1 ano).", "invalid_start");
      }
    }

    let creditsCost: number | null = null;
    if (pricingModel === "credits_allowed") {
      creditsCost = toNumber(body.creditsCost);
      if (creditsCost === null || !Number.isInteger(creditsCost) || creditsCost < 1 || creditsCost > 50) {
        throw new ApiError(400, "Custo em créditos inválido (1 a 50).", "invalid_credits");
      }
    }

    const locationName = cleanString(body.locationName, 160) || "Ericeira";
    const googleMapsUrl = isHttpsUrl(body.googleMapsUrl)
      ? String(body.googleMapsUrl)
      : `https://maps.google.com/?q=${encodeURIComponent(`${locationName}, Ericeira`)}`;

    const records = starts.map((start) => ({
      provider_id: provider.id,
      title_pt: titlePt || titleEn,
      title_en: titleEn || titlePt,
      category,
      pricing_model: pricingModel,
      price_eur: priceEur,
      credits_cost: creditsCost,
      max_spots: maxSpots,
      booked_spots: 0,
      duration_minutes: duration,
      start_time: start.toISOString(),
      location_name: locationName,
      google_maps_url: googleMapsUrl,
      what_to_bring: body.whatToBring ? cleanString(body.whatToBring, 500) : null,
      description_pt: body.descriptionPt ? cleanString(body.descriptionPt, 3000) : null,
      description_en: body.descriptionEn ? cleanString(body.descriptionEn, 3000) : null,
    }));

    const { data, error } = await supabaseAdmin.from("events").insert(records).select();
    if (error) throw error;

    return NextResponse.json({ success: true, events: data, event: data?.[0] ?? null });
  } catch (err) {
    return handleApiError(err, "provider/events POST");
  }
}

/** Eliminar sessão — só do próprio prestador e só se não houver reservas confirmadas. */
export async function DELETE(request: Request) {
  try {
    const { provider } = await requireProvider(request);
    const body = await readJson(request);
    if (!isUuid(body.eventId)) throw new ApiError(400, "Sessão inválida.", "invalid_event");

    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("id", body.eventId)
      .eq("provider_id", provider.id)
      .maybeSingle();
    if (!ev) throw new ApiError(404, "Sessão não encontrada.", "event_not_found");

    const { count } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id)
      .eq("status", "confirmed");
    if ((count ?? 0) > 0) {
      throw new ApiError(
        409,
        "Esta sessão tem reservas confirmadas. Contacta o Hub para a cancelar e reembolsar os alunos.",
        "event_has_bookings"
      );
    }

    const { error } = await supabaseAdmin.from("events").delete().eq("id", ev.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "provider/events DELETE");
  }
}
