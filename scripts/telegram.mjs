export function reminderText(day, siteUrl) {
  const url = new URL(siteUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be a plain HTTPS website address.');
  return `Small Steps: your habit check-in for ${day}. Open your journal to confirm or edit days: ${url.href}`;
}
export function validateTelegramConfig(env) {
  for (const key of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']) {
    if (!env[key]) throw new Error(`Missing configuration: ${key}`);
  }
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(env.TELEGRAM_BOT_TOKEN)) throw new Error('Invalid Telegram bot token format.');
  if (!/^[1-9]\d*$/.test(env.TELEGRAM_CHAT_ID)) throw new Error('TELEGRAM_CHAT_ID must be a positive private-chat ID.');
}
export async function sendTelegram(env, text, request = fetch) {
  validateTelegramConfig(env);
  let response, result;
  try {
    response = await request(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, link_preview_options: { is_disabled: true } })
    });
    result = await response.json();
  } catch {
    // Network errors can include the request URL, which contains the private bot token.
    throw new Error('Telegram request failed or timed out. Check your bot chat before retrying.');
  }
  if (!response.ok || result.ok !== true || !Number.isInteger(result.result?.message_id)) {
    throw new Error(`Telegram did not confirm the message (HTTP ${response.status}). Check the token, chat ID, and that you started the bot.`);
  }
  return result.result.message_id;
}
