"""Reconnect the repair worker's ChatGPT sign-in with a one-time device code.

Started by the library assistant (an issue titled "Reconnect automatic repairs"
opened by the library account) or by a manual workflow run. The person in the
chat opens the link while signed in to the library ChatGPT account and types the
code. Nobody needs a terminal. The sign-in is accepted only for the library
account, then the workflow seals it into the encrypted vault.
"""
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

LIBRARY_EMAIL = 'librarycottonwood@gmail.com'
DEVICE_URL = 'https://auth.openai.com/codex/device'
CODE = re.compile(r'\b([A-Z0-9]{4}-[A-Z0-9]{4,6})\b')
ANSI = re.compile(r'\x1b\[[0-9;]*m')


def account_email(raw):
    """Email of the ChatGPT account in a Codex auth.json, from its id_token."""
    token = json.loads(raw).get('tokens', {}).get('id_token') or ''
    parts = token.split('.')
    if len(parts) < 2:
        return None
    payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=' * (-len(parts[1]) % 4)))
    profile = payload.get('https://api.openai.com/profile') or {}
    return (payload.get('email') or profile.get('email') or '').lower() or None


def find_code(text):
    match = CODE.search(ANSI.sub('', text))
    return match.group(1) if match else None


def comment(body):
    issue = os.environ.get('ISSUE_NUMBER')
    if not issue:
        return
    url = f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/issues/{issue}/comments"
    req = urllib.request.Request(url, method='POST', data=json.dumps({'body': body}).encode(), headers={
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json'})
    urllib.request.urlopen(req).read()


def summary(text):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(text + '\n')


def login(codex_home):
    home = Path(codex_home)
    home.mkdir(parents=True, exist_ok=True)
    proc = subprocess.Popen(['codex', 'login', '--device-auth'], env={**os.environ, 'CODEX_HOME': str(home)},
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    seen = ''
    code = None
    deadline = time.time() + 60
    while code is None and time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            break
        seen += line
        code = find_code(seen)
    if code is None:
        proc.kill()
        raise RuntimeError('Codex did not offer a device code')
    message = (f'Open {DEVICE_URL} while signed in to ChatGPT as {LIBRARY_EMAIL}, '
               f'type this code and approve: **{code}**\n\nThe code works for 15 minutes. '
               'It came from the library\'s own repair system.\n\n<!-- library-reconnect-code -->')
    comment(message)
    summary(message)
    try:
        proc.communicate(timeout=16 * 60)
    except subprocess.TimeoutExpired:
        proc.kill()
        raise RuntimeError('Nobody approved the code within 15 minutes')
    auth = home / 'auth.json'
    if proc.returncode != 0 or not auth.exists():
        raise RuntimeError('The sign-in was not approved')
    email = account_email(auth.read_bytes())
    if email != LIBRARY_EMAIL:
        auth.unlink()
        raise RuntimeError('The code was approved by a different ChatGPT account; sign-in discarded')


if __name__ == '__main__':
    try:
        login(sys.argv[1])
    except RuntimeError as error:
        print(error)
        comment(f'Automatic repairs are still paused: {error}. Nothing else changed. '
                'Ask the library assistant to start again.\n\n<!-- library-reconnect-result -->')
        sys.exit(1)
