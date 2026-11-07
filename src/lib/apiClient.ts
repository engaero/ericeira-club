import { supabase } from "./supabase";

interface AuthFetchOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
}

/**
 * fetch para as nossas rotas /api com o token da sessão Supabase.
 * O servidor deduz o utilizador do token — nunca enviar userId/adminUserId no corpo.
 */
export async function authFetch(path: string, options: AuthFetchOptions = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  return fetch(path, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/** authFetch + parse JSON + erro com a mensagem do servidor. */
export async function authJson<T = Record<string, unknown>>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const res = await authFetch(path, options);
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* resposta sem corpo */
  }
  if (!res.ok) {
    const err = new Error(typeof json.error === "string" ? json.error : "Erro inesperado.") as Error & { code?: string };
    err.code = typeof json.code === "string" ? json.code : undefined;
    throw err;
  }
  return json as T;
}
