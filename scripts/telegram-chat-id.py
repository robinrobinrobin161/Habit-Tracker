"""Find private bot conversations without putting the token in browser history."""
import getpass
import json
import re
import urllib.request


def main():
    token = getpass.getpass('Paste your bot token (hidden): ').strip()
    if not re.fullmatch(r'\d+:[A-Za-z0-9_-]+', token):
        raise ValueError('Invalid token format')
    request = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/getUpdates',
        data=json.dumps({'allowed_updates': ['message'], 'timeout': 0}).encode(),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.load(response)
    if not payload.get('ok'):
        raise ValueError('Telegram rejected the request')
    chats = {}
    for update in payload.get('result', []):
        chat = update.get('message', {}).get('chat', {})
        if chat.get('type') == 'private':
            chats[chat['id']] = chat.get('first_name', 'Private chat')
    if not chats:
        print('No recent private messages found. Open your bot in Telegram, send /start, then run this again.')
    for chat_id, name in chats.items():
        print(f'{name}: {chat_id}')
    if chats:
        print('Choose your own chat ID and store it as the GitHub secret TELEGRAM_CHAT_ID.')


if __name__ == '__main__':
    try:
        main()
    except (Exception, KeyboardInterrupt):
        print('Could not retrieve chats. Check the token and connection. Use a new bot without an existing webhook.')
        raise SystemExit(1)
