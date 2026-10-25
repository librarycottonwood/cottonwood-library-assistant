import {readFileSync} from 'node:fs';

// Every library website, publisher and connector deployment belongs to the
// library's own Cloudflare account. A personal account or a personal
// `wrangler login` must never receive a library deployment.
export const LIBRARY_CLOUDFLARE_ACCOUNT_ID = 'e05729fd6b6fad329e31896d8b1c2da9';

export function requireLibraryAccount(env = process.env) {
  if (env.CLOUDFLARE_ACCOUNT_ID !== LIBRARY_CLOUDFLARE_ACCOUNT_ID) {
    throw Error('Refusing to deploy: CLOUDFLARE_ACCOUNT_ID must be the library Cloudflare account. Deploy only through the trusted library GitHub workflows.');
  }
  // Without an explicit library API token, wrangler would fall back to whatever
  // account is signed in on this computer.
  if (!env.CLOUDFLARE_API_TOKEN) throw Error('Refusing to deploy without the library account API token; never use a personal wrangler login.');
  return LIBRARY_CLOUDFLARE_ACCOUNT_ID;
}

/** Worker deploys also pin the account in wrangler.jsonc; both must agree. */
export function requireLibraryWorkerConfig(file, env = process.env) {
  requireLibraryAccount(env);
  const account = readFileSync(file, 'utf8').match(/"account_id"\s*:\s*"([a-f0-9]{32})"/)?.[1];
  if (account !== LIBRARY_CLOUDFLARE_ACCOUNT_ID) throw Error(`Refusing to deploy: ${file} must name the library Cloudflare account.`);
  return account;
}
