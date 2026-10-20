import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      providerId,
      titleEn,
      titlePt,
      category,
      locationName,
      googleMapsUrl,
      startTime,
      durationMinutes,
      priceEur,
      creditsCost,
      maxSpots,
    } = body;

    if (!providerId || !titleEn || !startTime || !priceEur || !maxSpots) {
      return NextResponse.json({ error: "Preenche todos os campos obrigatórios." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from("events").insert({
      provider_id: providerId,
      title_en: titleEn,
      title_pt: titlePt || titleEn,
      category,
      location_name: locationName,
	  google_maps_url: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(locationName + ', Ericeira')}`,
      start_time: startTime,
      duration_minutes: parseInt(durationMinutes, 10) || 60,
      price_eur: parseFloat(priceEur),
      credits_cost: parseInt(creditsCost, 10) || 1,
      max_spots: parseInt(maxSpots, 10),
      booked_spots: 0,
    }).select().single();

    if (error) {
      console.error("[Events API] Erro ao criar evento:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}