import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { providerId, iban, bankAccountHolder, taxId, taxName } = await request.json();

    if (!providerId) {
      return NextResponse.json({ error: "Identificador de prestador em falta." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("providers")
      .update({
        iban: iban?.trim() || null,
        bank_account_holder: bankAccountHolder?.trim() || null,
        tax_id: taxId?.trim() || null,
        tax_name: taxName?.trim() || null,
      })
      .eq("id", providerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}