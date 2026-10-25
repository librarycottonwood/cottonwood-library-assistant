// One-time live hosting setup, run only by the trusted main workflow with the
// library account token. Creates the live Pages project if it does not exist.
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {ensureLiveProject, checkHosting} from './cms-publishing.mjs';
import {REPOSITORY} from '../cms-publisher/src/contract.mjs';

async function main(env = process.env) {
  if (env.GITHUB_REPOSITORY !== REPOSITORY || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
      env.GITHUB_WORKFLOW_REF !== `${REPOSITORY}/.github/workflows/live-hosting-setup.yml@refs/heads/main`) throw Error('Live hosting setup is restricted to its trusted main workflow.');
  const result = await ensureLiveProject(env);
  await checkHosting(env);
  const summary = `${result.created ? 'Created' : 'Confirmed'} live hosting project ${result.name} on the library Cloudflare account: ${result.liveUrl}`;
  console.log(summary);
  if (env.GITHUB_STEP_SUMMARY) await writeFile(env.GITHUB_STEP_SUMMARY, summary + '\n', {flag: 'a'});
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {console.error(error.message); process.exitCode = 1;});
