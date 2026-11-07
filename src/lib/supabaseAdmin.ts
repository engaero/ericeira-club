import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * Cliente com a service role key: ignora RLS.
 * Nunca importar a partir de componentes cliente (o "server-only" faz o build falhar se isso acontecer).
 */
export const supabaseAdmin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);
