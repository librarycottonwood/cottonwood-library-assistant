#!/usr/bin/env bash
# SessionStart hook: make cloud sessions ready to build the site.
# The website needs Node 24 and pnpm 11.15.1; cloud images ship Node 22.
# The cloud environment's setup script normally installs Node 24 into /opt/node24
# (see docs/setup-checklist.md). This hook is the fallback and puts it on PATH.
# Local sessions (Jaden's Mac) are left alone.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}"

NODE_VERSION=24.18.0
NODE_DIR=/opt/node24
if [ ! -x "$NODE_DIR/bin/node" ]; then
  case "$(uname -m)" in x86_64) arch=x64 ;; aarch64|arm64) arch=arm64 ;; *) echo "Unknown CPU $(uname -m); install Node 24 by hand." >&2; exit 0 ;; esac
  tmp=$(mktemp -d)
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$arch.tar.xz" -o "$tmp/node.tar.xz"
  mkdir -p "$NODE_DIR" 2>/dev/null || sudo mkdir -p "$NODE_DIR"
  tar -xJf "$tmp/node.tar.xz" -C "$NODE_DIR" --strip-components=1 2>/dev/null || sudo tar -xJf "$tmp/node.tar.xz" -C "$NODE_DIR" --strip-components=1
  rm -rf "$tmp"
fi
export PATH="$NODE_DIR/bin:$PATH"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$NODE_DIR/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
if [ "$(pnpm --version 2>/dev/null || true)" != "11.15.1" ]; then
  npm install --global pnpm@11.15.1 >/dev/null 2>&1 || sudo env "PATH=$PATH" npm install --global pnpm@11.15.1 >/dev/null
fi
# Install dependencies only when the lockfile changed since the last install.
stamp=node_modules/.lockfile.sha256
want=$(sha256sum pnpm-lock.yaml | cut -d' ' -f1)
if [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$want" ]; then
  pnpm install --frozen-lockfile >/dev/null
  echo "$want" > "$stamp"
fi
echo "Node $(node --version), pnpm $(pnpm --version) ready."
