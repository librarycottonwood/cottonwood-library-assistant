#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) throw Error("Select Node 24 before checking the CMS.")'
# Entirely local compilation/rehearsal. No library account or remote mutations.
# scripts/browser.mjs uses a system Chromium when there is one (GitHub runners, the repair container).
if [ ! -x /usr/bin/chromium ] && [ -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ]; then
  pnpm exec playwright install chromium
fi
pnpm cms:test
pnpm --dir studio install --frozen-lockfile
pnpm --dir studio check
pnpm --dir studio build:offline
node --test scripts/studio-production-browser.test.mjs
SANITY_STUDIO_PROJECT_ID=cmscheck SANITY_STUDIO_DATASET=validation pnpm --dir studio schema:extract
pnpm cms:seed --project cmscheck --dataset validation --out output/cms/migration-schema.json
pnpm --dir studio validate:import ../output/cms/migration-schema.json
npm ci --prefix cms-publisher --ignore-scripts
npm test --prefix cms-publisher
npm run build --prefix cms-publisher
