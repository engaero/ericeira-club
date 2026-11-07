import "server-only";

/** Escapa texto de utilizador para mensagens com parse_mode HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Envia uma mensagem Telegram em HTML (<b>, <i>). Todo o conteúdo dinâmico deve passar por escapeHtml().
 * Nunca lança erro: uma notificação falhada não deve partir o fluxo principal.
 */
export async function sendTelegramNotification(chatId: string | null | undefined, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId) {
    console.warn("[Telegram] Token ou Chat ID em falta. Notificação ignorada.");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error("[Telegram] Erro ao enviar mensagem:", res.status, await res.text());
    }
  } catch (error) {
    console.error("[Telegram] Falha na chamada à API:", error);
  }
}

/** Alerta operacional para o administrador (ADMIN_TELEGRAM_CHAT_ID). */
export async function notifyAdmin(message: string) {
  await sendTelegramNotification(process.env.ADMIN_TELEGRAM_CHAT_ID, `⚠️ ${message}`);
}
