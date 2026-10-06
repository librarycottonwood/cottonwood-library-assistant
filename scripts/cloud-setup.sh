#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) === 24 ? 0 : 1)'; then
  if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm install 24
    nvm use 24
  else
    echo 'Administrator setup required: select Node 24 in this environment.' >&2
    exit 1
  fi
fi
if ! command -v pnpm >/dev/null || [ "$(pnpm --version)" != '11.15.1' ]; then
  npm install --global pnpm@11.15.1
fi
pnpm install --frozen-lockfile
if [ ! -x /usr/bin/chromium ] && [ -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ]; then
  pnpm exec playwright install --with-deps chromium
fi
pnpm check
pnpm build
