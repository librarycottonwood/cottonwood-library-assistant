"""Encrypt refreshed Codex sign-in for private GitHub artifact storage.

The encryption key is a repository secret. Neither raw auth nor the key is
uploaded, logged, or included in repair artifacts.
"""
import base64
import json
import os
import sys
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

AAD = b'cottonwood-library-codex-auth-v1'

def validate(raw):
    data = json.loads(raw)
    if data.get('auth_mode') != 'chatgpt' or not data.get('tokens', {}).get('refresh_token'):
        raise ValueError('Expected managed ChatGPT sign-in with refresh support')
    return raw

def seal(raw, key):
    validate(raw)
    nonce = os.urandom(12)
    return nonce + AESGCM(key).encrypt(nonce, raw, AAD)

def open_sealed(raw, key):
    return validate(AESGCM(key).decrypt(raw[:12], raw[12:], AAD))

if __name__ == '__main__':
    mode, source, target = sys.argv[1:]
    key = base64.b64decode(os.environ['LIBRARY_AUTH_VAULT_KEY'], validate=True)
    if mode == 'restore':
        raw = open_sealed(Path(source).read_bytes(), key) if Path(source).exists() else validate(os.environ['LIBRARY_CODEX_AUTH_SEED'].encode())
    elif mode == 'seal':
        raw = seal(Path(source).read_bytes(), key)
    else:
        raise ValueError('Unknown vault operation')
    p = Path(target)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(raw)
    p.chmod(0o600)
