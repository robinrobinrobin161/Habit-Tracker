# Small Steps

A personal React habit journal for GitHub Pages, with Supabase authentication and storage, interactive Anki-style year heatmaps, and a daily Telegram reminder at **20:00 Europe/Berlin**, including daylight-saving changes.

## Local preview

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

Without Supabase settings the app offers a clearly labelled, interactive sample preview. Preview edits are temporary. Real accounts never use preview data.

To connect real storage, copy `.env.example` to `.env.local`, fill in the public Supabase values, and restart the server. Never put a secret key or Telegram bot token in a `VITE_` variable.

## 1. Set up Supabase

Follow [the step-by-step Supabase guide](SUPABASE-SETUP.md). It explains each screen and which values to keep.

## 2. Set up Telegram delivery

Follow [the Telegram setup guide](TELEGRAM-SETUP.md). Create a bot with Telegram's official BotFather, start a private chat with it, and save its token and your chat ID as GitHub secrets. No phone number, Twilio account, Gmail app password, or Telegram Premium subscription is needed for this daily bot message.

The reminder contains its date and a journal link. Opening the link changes nothing. Sign in and choose the day you want to check off. Past days remain editable.

## 3. Deploy to GitHub Pages

The local project is linked to https://github.com/robinrobinrobin161/Habit-Tracker. Push these files to its `main` branch, then select **GitHub Actions** under Settings → Pages. GitHub authentication is required to upload the files.

In Settings → Secrets and variables → Actions add these **variables**:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon or publishable key |
| `SITE_URL` | Full HTTPS Pages address, e.g. `https://USERNAME.github.io/Habit-Tracker/` |

Add these **secrets**:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | Same Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_...`), used only by Actions |
| `OWNER_USER_ID` | UUID of your Supabase user |
| `TELEGRAM_BOT_TOKEN` | Private token from BotFather |
| `TELEGRAM_CHAT_ID` | Your private bot conversation ID |

Run **Deploy tracker to GitHub Pages** from Actions. Sign in and add a habit before testing Telegram delivery. If you previously configured email or SMS, remove unused Gmail and Twilio secrets (including `SMS_TO`) and revoke unused provider credentials. The app no longer sends email or SMS. Replace the old Supabase service-role secret with `SUPABASE_SECRET_KEY`.

## How it behaves

- Add, edit, recolor, and permanently delete habits. Deletion asks for confirmation and removes the associated check-ins.
- Click any calendar square for today or a past date to mark or undo completion. Future dates are disabled and rejected by the database.
- Telegram links open the journal without changing data. Sign in, then choose today or a past day. Existing habit-specific links still require confirmation.
- Germany's calendar day is used on all devices, regardless of the device's timezone. The open app updates its current date automatically.
- Days completed, longest streak, and daily average apply to the selected year through today. Daily average is completed days divided by elapsed days of that calendar year (including days before habit creation). Current streak spans years, ending today or yesterday if today is still pending.
- One compact Telegram links to the full habit list. No habits means no Telegram.
- `reminder_deliveries` reserves each Berlin date before the Telegram request, preventing duplicate sends on concurrent or repeated runs. The provider cannot guarantee exactly-once delivery: a failed or interrupted run may leave an uncertain status. Inspect the Actions log and your Telegram bot chat before deleting that day's delivery row to permit a deliberate retry. The existing `sent` database status means accepted by Telegram, not confirmed read. Do not delete an accepted record just to rerun the job.
- Schedules use GitHub's timezone-aware cron. Actions may run late; exact-minute delivery is not guaranteed. In public repositories GitHub can disable schedules after 60 days of repository inactivity. Watch workflow failures and re-enable the schedule if needed.

GitHub scheduling documentation: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## Validation

```sh
npm test
npm run build
```

Tests cover Germany calendar dates, leap years, backdated streak calculations, Telegram request behavior, and Pages links. Before relying on production, verify login, persistence after refresh, a past-day edit, and a real reminder after adding the external credentials. Database policies must also be checked using a second test account: it must not read or modify your habits, check-ins, or delivery records.

## Layout

- `src/`: React interface and date/statistics logic
- `supabase/schema.sql`: tables, constraints, grants, and row-level access policies
- `scripts/`: Telegram reminder sender and content
- `.github/workflows/`: Pages deployment and daily reminder jobs
- `tests/`: date, streak, and Telegram tests
