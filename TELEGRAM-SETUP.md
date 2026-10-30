# Telegram reminders

The tracker sends one private bot message at 20:00 Germany time, with a link to your journal. Ordinary bot messages are free; this app does not enable paid broadcasts. No Telegram Premium or phone-number configuration is required. GitHub and Supabase still have their own service limits.

## 1. Create your own bot

1. Open Telegram and go to the official [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Choose a display name, such as **Small Steps**.
4. Choose an available username ending in `bot`, such as your own variation of `small_steps_robin_bot`.
5. BotFather gives you a **bot token**. Save it privately. Do not paste it into our chat or commit it to the repository.
6. Open the link to your new bot and press **Start**, or send `/start`. Bots cannot begin a private conversation until you start it. This bot only sends scheduled reminders; it does not reply to commands.

## 2. Find your chat ID

Your chat ID identifies your private conversation; it is not your phone number.

The project includes a helper that asks for the bot token privately and retrieves recent private conversations directly from Telegram. It does not send a message or store the token.

In a terminal opened in this project folder, run:

```sh
python3 scripts/telegram-chat-id.py
```

Paste the token when prompted. It will not appear while you type. The helper prints the name and chat ID of recent private conversations. Choose your own name and save its number. If there is no result, send `/start` to your bot again and rerun the helper. Telegram only keeps incoming updates for a limited time.

Use a new dedicated bot. An existing bot with a webhook or another program consuming updates can prevent this helper from finding your chat. Do not change an existing bot's configuration to work around that.

If you are unfamiliar with the terminal, ask for help at this step. Do not put a token into a browser address or use a third-party chat-ID website.

## 3. Save the two private settings

In your GitHub repository, go to **Settings → Secrets and variables → Actions → Secrets → New repository secret**.

- `TELEGRAM_BOT_TOKEN`: the token from BotFather.
- `TELEGRAM_CHAT_ID`: the positive number for your private chat from Step 2.

The Supabase secrets and website address in README.md are also required. Your phone number is not used. If you created old Twilio/Gmail settings, remove those unused secrets.

## 4. Test after deployment

Sign in to the tracker and create at least one habit. In GitHub, open **Actions → Evening Telegram reminder → Run workflow**. This sends a real Telegram message to the configured chat. Open it on your phone, tap the journal link, and sign in to check off a day.

One message is allowed per Germany calendar date. A manual test uses that day's slot; the evening run will skip it. If a run fails or times out, check the bot conversation before retrying. Never reset a delivery record blindly: the message may already have arrived.

If notifications do not appear, check that the bot chat is unmuted and Telegram notifications are enabled on your phone. The workflow confirms Telegram accepted the message, not that you read it.

To stop reminders, disable **Evening Telegram reminder** in GitHub Actions. Blocking the bot also prevents messages but causes workflow failures.

Official references: [creating bots](https://core.telegram.org/bots/features#botfather), [Bot API](https://core.telegram.org/bots/api#sendmessage), and [bot limits](https://core.telegram.org/bots/faq#how-do-i-avoid-hitting-limits).
