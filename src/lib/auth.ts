import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabaseAdmin";
import type { ProviderRow } from "@/types/db";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

/** Identifica o utilizador a partir do access token do Supabase (nunca do corpo do pedido). */
export async function requireUser(request: Request): Promise<User> {
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "Sessão inválida. Inicia sessão novamente.", "unauthenticated");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError(401, "Sessão inválida. Inicia sessão novamente.", "unauthenticated");
  }
  return data.user;
}

export async function getOptionalUser(request: Request): Promise<User | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

export async function requireAdmin(request: Request): Promise<User> {
  const user = await requireUser(request);
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.is_admin) {
    throw new ApiError(403, "Acesso reservado a administradores.", "forbidden");
  }
  return user;
}

/** Exige que o utilizador seja dono de um perfil de prestador (verificado, por omissão). */
export async function requireProvider(
  request: Request,
  options: { verified?: boolean } = {}
): Promise<{ user: User; provider: ProviderRow }> {
  const { verified = true } = options;
  const user = await requireUser(request);

  const { data } = await supabaseAdmin
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) throw new ApiError(403, "Não tens um perfil de prestador.", "not_a_provider");
  if (verified && !data.verified) {
    throw new ApiError(403, "O teu perfil de prestador ainda aguarda aprovação.", "provider_not_verified");
  }
  return { user, provider: data as ProviderRow };
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    /* cai no erro abaixo */
  }
  throw new ApiError(400, "Pedido inválido.", "bad_request");
}

/** Converte qualquer erro numa resposta JSON sem expor detalhes internos. */
export function handleApiError(err: unknown, context: string): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  console.error(`[${context}]`, err);
  return NextResponse.json({ error: "Erro interno. Tenta novamente mais tarde.", code: "internal" }, { status: 500 });
}

/** Mapeia exceções de funções SQL (RAISE EXCEPTION 'codigo') para erros de API legíveis. */
const RPC_ERRORS: Record<string, { status: number; message: string }> = {
  event_not_found: { status: 404, message: "Sessão não encontrada." },
  direct_only_event: { status: 400, message: "Esta sessão só aceita pagamento direto em euros." },
  event_started: { status: 400, message: "Esta sessão já começou." },
  event_full: { status: 409, message: "Esta sessão está esgotada." },
  invalid_credits_cost: { status: 400, message: "Esta sessão não aceita créditos." },
  profile_not_found: { status: 404, message: "Perfil não encontrado." },
  credits_expired: { status: 400, message: "Os teus créditos expiraram." },
  insufficient_credits: { status: 400, message: "Saldo de créditos insuficiente." },
  already_booked: { status: 409, message: "Já tens uma vaga confirmada nesta aula." },
  booking_not_found: { status: 404, message: "Reserva não encontrada." },
  booking_not_active: { status: 400, message: "Esta reserva já não está ativa." },
  amount_exceeds_balance: { status: 400, message: "O valor excede o saldo pendente do prestador." },
  provider_not_found: { status: 404, message: "Prestador não encontrado." },
};

export function throwFromRpcError(error: { message?: string } | null): void {
  if (!error) return;
  const code = Object.keys(RPC_ERRORS).find((c) => error.message?.includes(c));
  if (code) {
    const { status, message } = RPC_ERRORS[code];
    throw new ApiError(status, message, code);
  }
  console.error("[RPC]", error);
  throw new ApiError(500, "Erro interno. Tenta novamente mais tarde.", "internal");
}
