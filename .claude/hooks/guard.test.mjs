// Pipes sample PreToolUse hook JSON into guard.mjs, exactly as Claude Code does,
// and checks the result: exit 2 = blocked, "ask" JSON = needs a person, silent = allowed.
// Run: node --test .claude/hooks/
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync, execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const guard = path.join(path.dirname(fileURLToPath(import.meta.url)), 'guard.mjs');

function repoOn(branch) {
  const dir = mkdtempSync(path.join(tmpdir(), 'guard-test-'));
  const git = (...args) => execFileSync('git', args, {cwd: dir, stdio: 'ignore'});
  git('init', '-q', '-b', branch);
  git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
  return dir;
}
const onMain = repoOn('main');
const onFeature = repoOn('claude/add-news-post');
test.after(() => { rmSync(onMain, {recursive: true, force: true}); rmSync(onFeature, {recursive: true, force: true}); });

function run(event) {
  const result = spawnSync(process.execPath, [guard], {input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8'});
  if (result.status === 2) return {outcome: 'deny', reason: result.stderr.trim()};
  assert.equal(result.status, 0, `unexpected exit ${result.status}: ${result.stderr}`);
  if (!result.stdout.trim()) return {outcome: 'allow'};
  const output = JSON.parse(result.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'PreToolUse');
  return {outcome: output.hookSpecificOutput.permissionDecision, reason: output.hookSpecificOutput.permissionDecisionReason};
}
const bash = (command, cwd = onFeature) => ({session_id: 'test', hook_event_name: 'PreToolUse', cwd, permission_mode: 'default', tool_name: 'Bash', tool_input: {command, description: 'test'}, tool_use_id: 'toolu_test'});
const tool = (tool_name, tool_input, cwd = onFeature) => ({session_id: 'test', hook_event_name: 'PreToolUse', cwd, tool_name, tool_input, tool_use_id: 'toolu_test'});

const expectations = [
  // Pushes to main and force pushes
  ['deny', bash('git push origin main')],
  ['deny', bash('git push origin HEAD:main')],
  ['deny', bash('git push origin claude/x:refs/heads/main')],
  ['deny', bash('git push -u origin HEAD', onMain)],
  ['deny', bash('git push', onMain)],
  ['deny', bash('git push --force origin claude/x')],
  ['deny', bash('git push -f')],
  ['deny', bash('git push --force-with-lease origin claude/x')],
  ['deny', bash('git push origin +claude/x')],
  ['deny', bash('git push --mirror origin')],
  ['deny', bash('git push --all origin')],
  ['deny', bash('git -C . push origin main')],
  ['deny', bash('cd site && git push origin main')],
  ['deny', bash("bash -c 'git push origin main'")],
  ['deny', bash('FOO=1 git push origin main')],
  ['deny', bash('echo done; git push origin HEAD:refs/heads/main')],
  ['allow', bash('git push -u origin claude/add-news-post')],
  ['allow', bash('git push -u origin HEAD')],
  ['allow', bash('git push')],
  ['allow', bash('git commit -m "Explain why we never git push origin main"')],
  // Deleting protected branches
  ['deny', bash('git push origin --delete maintenance-reports')],
  ['deny', bash('git push origin :maintenance-reports')],
  ['deny', bash('git push origin -d main')],
  ['deny', bash('git branch -D maintenance-reports')],
  ['deny', bash('gh api -X DELETE repos/librarycottonwood/cottonwood-library-assistant/git/refs/heads/maintenance-reports')],
  ['deny', bash('gh api --method DELETE /repos/librarycottonwood/cottonwood-library-assistant/git/refs/heads/main')],
  ['deny', bash('gh api -X PATCH repos/librarycottonwood/cottonwood-library-assistant/git/refs/heads/main -f sha=abc -F force=true')],
  ['deny', bash('REPO=repos/librarycottonwood/cottonwood-library-assistant; gh api -X DELETE $REPO/git/refs/heads/maintenance-reports')],
  ['deny', bash('gh api -X PATCH $REPO')],
  ['allow', bash('gh api -X DELETE repos/librarycottonwood/cottonwood-library-assistant/git/refs/heads/content/old-request')],
  ['allow', bash('gh api -X DELETE $REPO/git/refs/heads/claude/news-book-sale')],
  ['allow', bash('git push origin --delete content/old-request')],
  // Merging needs a person
  ['ask', bash('gh api -X PUT repos/librarycottonwood/cottonwood-library-assistant/pulls/57/merge -f merge_method=merge')],
  ['ask', bash('gh pr merge 57 --merge')],
  ['ask', bash('gh api -X PUT $REPO/pulls/57/merge -f merge_method=merge')],
  ['ask', bash('gh workflow run cms.yml')],
  ['ask', tool('mcp__github__merge_pull_request', {owner: 'librarycottonwood', repo: 'cottonwood-library-assistant', pull_number: 57})],
  ['allow', bash('gh api repos/librarycottonwood/cottonwood-library-assistant/pulls/57')],
  ['allow', bash('gh api repos/librarycottonwood/cottonwood-library-assistant/pulls -f title="News: book sale" -f head=claude/news -f base=main')],
  ['allow', bash('gh api repos/librarycottonwood/cottonwood-library-assistant/commits/abc123/statuses')],
  ['allow', bash('gh api repos/librarycottonwood/cottonwood-library-assistant/issues -f title="Weekly check-in" -f body=@report.md')],
  // Repository and account settings
  ['deny', bash('gh secret set CLOUDFLARE_API_TOKEN')],
  ['deny', bash('gh variable set LIBRARY_CONTENT_SOURCE --body local')],
  ['deny', bash('gh repo delete librarycottonwood/cottonwood-library-assistant --yes')],
  ['deny', bash('gh api -X DELETE repos/librarycottonwood/cottonwood-library-assistant/branches/main/protection')],
  ['deny', bash('gh api -X PUT repos/librarycottonwood/cottonwood-library-assistant/actions/secrets/X -f encrypted_value=1')],
  ['deny', bash('gh auth token')],
  // Direct deploys
  ['deny', bash('wrangler deploy')],
  ['deny', bash('npx wrangler pages deploy dist --project-name cottonwood-library')],
  ['deny', bash('pnpm exec wrangler login')],
  ['deny', bash('cd cms-publisher && npx wrangler secret put CMS_STATUS_TOKEN')],
  ['deny', bash('CLOUDFLARE_API_TOKEN=abc CLOUDFLARE_ACCOUNT_ID=e05729fd6b6fad329e31896d8b1c2da9 node cms-publisher/deploy.mjs')],
  ['deny', bash('node connector/publish.mjs')],
  ['deny', bash('node scripts/publish-live.mjs deliver')],
  ['deny', bash('node scripts/live-hosting.mjs')],
  ['deny', bash('curl -X POST https://api.cloudflare.com/client/v4/accounts/x/pages/projects')],
  ['deny', bash('pnpm --dir studio exec sanity deploy')],
  ['deny', bash('npx sanity schema deploy')],
  ['deny', bash('npx sanity dataset delete production')],
  ['deny', tool('mcp__claude_ai_Sanity__deploy_schema', {projectId: '2ou0xy2r'})],
  ['deny', tool('mcp__claude_ai_Sanity__create_dataset', {projectId: '2ou0xy2r', dataset: 'x'})],
  ['allow', bash('npm run build --prefix cms-publisher')],
  ['allow', bash('npx wrangler deploy --dry-run --outdir dist')],
  ['allow', bash('wrangler --version')],
  ['allow', tool('mcp__claude_ai_Sanity__publish_documents', {projectId: '2ou0xy2r', dataset: 'production', ids: [{id: 'drafts.post-1'}]})],
  ['allow', tool('mcp__claude_ai_Sanity__query_documents', {projectId: '2ou0xy2r', dataset: 'production', query: '*[_type=="post"]'})],
  // Secrets
  ['deny', tool('Read', {file_path: '/repo/.env'})],
  ['deny', tool('Read', {file_path: '/repo/studio/.env.local'})],
  ['deny', tool('Read', {file_path: '/repo/connector/.dev.vars'})],
  ['deny', tool('Write', {file_path: '/repo/.env', content: 'X=1'})],
  ['deny', tool('Grep', {pattern: 'TOKEN', path: '/repo/.env.production'})],
  ['deny', tool('Glob', {pattern: '**/.env*'})],
  ['deny', bash('cat .env')],
  ['deny', bash('grep TOKEN studio/.env.local')],
  ['deny', bash('source .env && pnpm cms:import')],
  ['deny', bash('echo $SANITY_WRITE_TOKEN')],
  ['deny', bash('printenv')],
  ['deny', bash('env')],
  ['deny', bash('printenv CLOUDFLARE_API_TOKEN')],
  ['allow', tool('Read', {file_path: '/repo/.env.example'})],
  ['allow', bash('cat .env.example')],
  ['allow', tool('Read', {file_path: '/repo/src/pages/index.astro'})],
  ['allow', bash('set -euo pipefail')],
  ['allow', bash('env LIBRARY_CONTENT_SOURCE=local pnpm build')],
  // The guard and workflows themselves
  ['ask', bash('rm .claude/hooks/guard.mjs')],
  ['ask', bash("sed -i '' 's/deny/allow/' .claude/settings.json")],
  ['ask', bash('echo {} > .claude/settings.json')],
  ['ask', bash('git rm .github/workflows/check.yml')],
  // Ordinary work
  ['allow', bash('pnpm check && pnpm build')],
  ['allow', bash('git checkout -b claude/news-book-sale && git add -A && git commit -m "News: book sale"')],
  ['allow', bash('node --test scripts/images.test.mjs')],
  ['allow', tool('Edit', {file_path: '/repo/src/pages/index.astro', old_string: 'a', new_string: 'b'})],
];

for (const [expected, event] of expectations) {
  const label = event.tool_name === 'Bash' ? event.tool_input.command : `${event.tool_name} ${JSON.stringify(event.tool_input).slice(0, 80)}`;
  test(`${expected}: ${label}${event.cwd === onMain ? ' (on main)' : ''}`, () => {
    const result = run(event);
    assert.equal(result.outcome, expected, result.reason);
    if (expected !== 'allow') assert.ok(result.reason?.length > 10, 'a plain-language reason is given');
  });
}

test('unreadable hook input is blocked, not allowed', () => {
  assert.equal(run('not json').outcome, 'deny');
});
