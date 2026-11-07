import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, readJson, requireProvider } from "@/lib/auth";
import { cleanString, isValidIban, isValidNif } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    // O prestador só altera os SEUS dados bancários (deduzido do token, não de um providerId enviado).
    const { provider } = await requireProvider(request, { verified: false });
    const body = await readJson(request);

    const iban = body.iban ? String(body.iban).replace(/\s+/g, "").toUpperCase() : null;
    const taxId = body.taxId ? String(body.taxId).replace(/\s+/g, "") : null;

    if (iban && !isValidIban(iban)) throw new ApiError(400, "IBAN inválido.", "invalid_iban");
    if (taxId && !isValidNif(taxId)) throw new ApiError(400, "NIF inválido.", "invalid_nif");

    const { error } = await supabaseAdmin
      .from("providers")
      .update({
        iban,
        bank_account_holder: body.bankAccountHolder ? cleanString(body.bankAccountHolder, 120) : null,
        tax_id: taxId,
        tax_name: body.taxName ? cleanString(body.taxName, 160) : null,
      })
      .eq("id", provider.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "provider/bank-details");
  }
}
