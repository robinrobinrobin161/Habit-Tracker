import test from 'node:test';
import assert from 'node:assert/strict';
import { berlinDay, yearDays, shiftDay, validDay, stats } from '../src/dates.js';
import { reminderText, sendTelegram } from '../scripts/telegram.mjs';
test('Berlin dates respect midnight in summer and winter', () => {
  assert.equal(berlinDay(new Date('2026-07-01T22:30:00Z')), '2026-07-02');
  assert.equal(berlinDay(new Date('2026-01-01T22:30:00Z')), '2026-01-01');
  assert.equal(berlinDay(new Date('2026-01-01T23:30:00Z')), '2026-01-02');
});
test('calendar handles leap years and year boundaries', () => {
  assert.equal(yearDays(2024).length, 366); assert.equal(yearDays(2025).length, 365);
  assert.equal(shiftDay('2026-01-01', -1), '2025-12-31');
  assert.equal(validDay('2026-02-30'), false); assert.equal(validDay('2024-02-29'), true);
});
test('streak includes yesterday when today is pending and crosses years', () => {
  assert.deepEqual(stats(['2025-12-31','2026-01-01','2026-01-02'], 2026, '2026-01-03'), { count: 2, longest: 2, current: 3, average: 67 });
  assert.equal(stats(['2026-01-01'], 2026, '2026-01-04').current, 0);
  assert.equal(stats(['2026-01-03'], 2026, '2026-01-03').current, 1);
  assert.equal(stats([], 2027, '2026-01-03').average, 0);
});
test('Telegram reminder preserves Pages path and contains no habit details or credentials', () => {
  const text = reminderText('2026-10-30', 'https://example.github.io/Habit-Tracker/');
  assert.ok(text.includes('2026-10-30')); assert.ok(text.endsWith('https://example.github.io/Habit-Tracker/'));
  assert.throws(() => reminderText('2026-10-30', 'javascript:alert(1)'));
  assert.throws(() => reminderText('2026-10-30', 'https://user:password@example.org/'));
});
const telegramEnv = { TELEGRAM_BOT_TOKEN: '123456:fake_test_token', TELEGRAM_CHAT_ID: '123456789' };
test('Telegram sends only to configured private chat with link previews disabled', async () => {
  const id = await sendTelegram(telegramEnv, 'Test reminder', async (url, options) => {
    assert.equal(url, `https://api.telegram.org/bot${telegramEnv.TELEGRAM_BOT_TOKEN}/sendMessage`);
    const payload = JSON.parse(options.body);
    assert.equal(payload.chat_id, telegramEnv.TELEGRAM_CHAT_ID);
    assert.equal(payload.text, 'Test reminder');
    assert.equal(payload.link_preview_options.is_disabled, true);
    assert.equal(payload.parse_mode, undefined);
    return { ok: true, json: async () => ({ ok: true, result: { message_id: 42 } }) };
  });
  assert.equal(id, 42);
});
test('Telegram rejection is not retried and group destinations are rejected', async () => {
  let calls = 0;
  await assert.rejects(sendTelegram(telegramEnv, 'Test', async () => { calls++; return { ok: false, status: 403, json: async () => ({ ok: false }) }; }), /HTTP 403/);
  assert.equal(calls, 1);
  await assert.rejects(sendTelegram({ ...telegramEnv, TELEGRAM_CHAT_ID: '-123' }, 'Test'), /private-chat ID/);
});
test('Telegram network failures cannot expose the bot token through errors', async () => {
  await assert.rejects(sendTelegram(telegramEnv, 'Test', async () => { throw new Error(`Request failed: ${telegramEnv.TELEGRAM_BOT_TOKEN}`); }), error => !String(error).includes(telegramEnv.TELEGRAM_BOT_TOKEN) && /timed out/.test(error.message));
});
