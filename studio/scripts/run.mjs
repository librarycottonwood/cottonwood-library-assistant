import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const directory = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const fixtureIndex = args.indexOf('--offline-fixture');
if (fixtureIndex !== -1) {
  args.splice(fixtureIndex, 1);
  if (args[0] !== 'build') throw new Error('The offline fixture is only for a local compilation check.');
  process.env.SANITY_STUDIO_PROJECT_ID = 'cmscheck';
  process.env.SANITY_STUDIO_DATASET = 'validation';
  console.info('OFFLINE COMPILATION ONLY: fixture identifiers; no connected library project and no deployment.');
} else {
  for (const file of ['.env', '.env.local']) {
    const path = `${directory}/${file}`;
    if (existsSync(path)) process.loadEnvFile(path);
  }
}

// Configuration does the same validation inside the CLI. This preflight gives a
// short, actionable error before the CLI starts an interactive setup prompt.
if (!process.env.SANITY_STUDIO_PROJECT_ID?.trim() || !process.env.SANITY_STUDIO_DATASET?.trim()) {
  console.error('Sanity is not connected yet. After the library creates its account, fill in studio/.env.local using .env.example. To check the build without an account, run pnpm build:offline.');
  process.exit(1);
}
process.env.SANITY_TELEMETRY_DISABLED = '1';
const result = spawnSync(process.execPath, ['node_modules/sanity/bin/sanity', ...args], {
  cwd: directory,
  env: process.env,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
