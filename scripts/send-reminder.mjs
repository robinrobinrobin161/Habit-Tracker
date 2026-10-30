import { createClient } from '@supabase/supabase-js';
import { berlinDay } from '../src/dates.js';
import { reminderText, sendTelegram, validateTelegramConfig } from './telegram.mjs';
const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'OWNER_USER_ID', 'SITE_URL'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing configuration: ${key}`);
validateTelegramConfig(process.env);
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const day = berlinDay();
const { data: owner, error: ownerError } = await db.auth.admin.getUserById(process.env.OWNER_USER_ID);
if (ownerError || owner.user?.email !== 'robin04102003@gmail.com') throw new Error('OWNER_USER_ID must belong to the configured personal account.');
const { data: habits, error } = await db.from('habits').select('id').eq('user_id', process.env.OWNER_USER_ID).order('created_at');
if (error) throw new Error('Could not load habits.');
if (!habits.length) { console.log('No habits yet; no reminder needed.'); process.exit(0); }
const content = reminderText(day, process.env.SITE_URL);
const { error: claimError } = await db.from('reminder_deliveries').insert({ day });
if (claimError?.code === '23505') { console.log('A reminder was already attempted today. Inspect delivery status before retrying.'); process.exit(0); }
if (claimError) throw new Error('Could not reserve reminder delivery.');
let messageId;
try {
  messageId = await sendTelegram(process.env, content);
} catch {
  await db.from('reminder_deliveries').update({ status: 'failed' }).eq('day', day);
  throw new Error('Telegram message request failed or its result is uncertain. Check your Telegram bot chat before retrying.');
}
const { error: recordError } = await db.from('reminder_deliveries').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('day', day);
if (recordError) throw new Error('Telegram message was accepted but its status could not be recorded. Do not resend.');
console.log(`Telegram message accepted by Telegram for ${day}. Message ID: ${messageId}. This does not confirm the message was read.`);
