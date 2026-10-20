export async function sendTelegramNotification(chatId: string, message: string) {
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
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[Telegram] Erro ao enviar mensagem:", err);
    }
  } catch (error) {
    console.error("[Telegram] Falha na chamada à API:", error);
  }
}