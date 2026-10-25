#!/usr/bin/env node
// PreToolUse guard for the Cottonwood Library repository.
//
// Claude Code pipes the pending tool call to this script as JSON on stdin.
// - exit 2 + a reason on stderr  -> the call is blocked
// - exit 0 + {"hookSpecificOutput": {"permissionDecision": "ask"}} -> a person must approve it
// - exit 0 with no output -> no opinion; normal permission rules apply
//
// It enforces the rules that must never depend on Claude following instructions:
// no pushes or force-pushes to main, no deleting main or maintenance-reports,
// no direct Cloudflare / wrangler / Sanity admin deploys, no reading secrets, and
// a human click before anything is merged (merging is what saves to the live site).
//
// Runs on the Node that is on PATH (22 in Claude Code cloud sessions); no dependencies.
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const PROTECTED_BRANCHES = ['main', 'master', 'maintenance-reports'];
const NO_PUSH_BRANCHES = ['main', 'master'];

const deny = reason => ({decision: 'deny', reason});
const ask = reason => ({decision: 'ask', reason});

// ---------- shell parsing (good enough for the commands Claude writes) ----------

/** Split a command line into simple commands on ; && || | & newlines, $( ) and backticks, honoring quotes. */
export function splitCommands(command) {
  const parts = [];
  let current = '', quote = null;
  const push = () => { if (current.trim()) parts.push(current.trim()); current = ''; };
  for (let i = 0; i < command.length; i++) {
    const c = command[i], next = command[i + 1];
    if (quote) {
      if (c === '\\' && quote === '"') { current += c + (next ?? ''); i++; continue; }
      if (c === quote) quote = null;
      // Command substitution inside double quotes still runs a command.
      if (quote === '"' && c === '$' && next === '(') { push(); i++; continue; }
      current += c;
      continue;
    }
    if (c === '\\') { current += c + (next ?? ''); i++; continue; }
    if (c === "'" || c === '"') { quote = c; current += c; continue; }
    if (c === '$' && next === '(') { push(); i++; continue; }
    if (';&|\n`()'.includes(c)) { push(); if ((c === '&' || c === '|') && next === c) i++; continue; }
    current += c;
  }
  push();
  return parts;
}

/** Tokenize one simple command, removing quotes. */
export function tokenize(command) {
  const tokens = [];
  let current = '', quote = null, started = false;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) { quote = null; continue; }
      if (c === '\\' && quote === '"' && i + 1 < command.length) { current += command[++i]; continue; }
      current += c; continue;
    }
    if (c === "'" || c === '"') { quote = c; started = true; continue; }
    if (c === '\\' && i + 1 < command.length) { current += command[++i]; started = true; continue; }
    if (/\s/.test(c)) { if (started) tokens.push(current); current = ''; started = false; continue; }
    current += c; started = true;
  }
  if (started) tokens.push(current);
  return tokens;
}

const WRAPPERS = new Set(['sudo', 'env', 'command', 'builtin', 'exec', 'nohup', 'time', 'nice', 'stdbuf', 'noglob', 'xargs', 'timeout']);

/** Drop leading VAR=value assignments and wrapper programs so `FOO=1 sudo git push` is seen as `git push`. */
export function stripWrappers(tokens) {
  let t = [...tokens];
  for (;;) {
    if (t.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(t[0])) { t.shift(); continue; }
    if (t.length && WRAPPERS.has(path.basename(t[0]))) {
      const wrapper = path.basename(t.shift());
      if (wrapper === 'timeout') while (t.length && (/^-/.test(t[0]) || /^\d/.test(t[0]))) t.shift();
      else while (t.length && /^-/.test(t[0])) t.shift();
      continue;
    }
    // npx / pnpm exec / pnpm dlx / npm exec / yarn run a program named next.
    const head = t[0] && path.basename(t[0]);
    if (head === 'npx' || head === 'bunx') { t.shift(); while (t.length && /^-/.test(t[0])) t.shift(); continue; }
    if (head === 'pnpm' || head === 'npm' || head === 'yarn') {
      // Skip package-manager options such as --dir studio / -C studio / --prefix x / --filter x.
      let i = 1;
      while (i < t.length && t[i].startsWith('-')) i += ['--dir', '-C', '--prefix', '--filter', '-F', '--workspace', '-w'].includes(t[i]) && t[i] !== '-w' ? 2 : 1;
      if (['exec', 'dlx', 'x'].includes(t[i])) { t.splice(0, i + 1); while (t.length && /^-/.test(t[0])) t.shift(); continue; }
      if (i > 1 && t[i]) { t.splice(1, i - 1); }
    }
    if (head === 'pnpm' && t[1] && ['wrangler', 'sanity'].includes(t[1])) { t.shift(); continue; }
    break;
  }
  return t;
}

const shortBranch = ref => ref.replace(/^refs\/heads\//, '').replace(/^heads\//, '');

function currentBranch(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000}).trim();
  } catch { return null; }
}

// ---------- secrets ----------

/** True for files that hold credentials. `.env.example` is fine to read. */
export function isSecretPath(file) {
  if (!file) return false;
  const name = path.basename(String(file));
  if (/^\.env(\..+)?$/.test(name) && !/\.example$/.test(name)) return true;
  if (/^\.dev\.vars(\..+)?$/.test(name)) return true;
  if (/\.(pem|key|p12|pfx)$/i.test(name)) return true;
  if (/^id_(rsa|ed25519|ecdsa|dsa)$/.test(name)) return true;
  if (/^(\.npmrc|\.netrc|\.git-credentials)$/.test(name)) return true;
  const normalized = String(file).replace(/\\/g, '/');
  if (/(^|\/)\.wrangler\/config\//.test(normalized)) return true;
  if (/(^|\/)\.config\/gh\/hosts\.yml$/.test(normalized)) return true;
  if (/(^|\/)\.config\/\.wrangler\//.test(normalized)) return true;
  return false;
}

const SECRET_VAR = /\$\{?[A-Za-z_]*(TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY|VAULT_KEY|AUTH_SEED)[A-Za-z_]*\}?/;

// ---------- per-program rules ----------

function checkGit(args, cwd) {
  // Skip git's global options: -C dir, -c key=value, --git-dir=..., etc.
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    if (['-C', '-c', '--git-dir', '--work-tree', '--namespace'].includes(args[i])) i += 2; else i += 1;
  }
  const sub = args[i];
  const rest = args.slice(i + 1);
  if (sub === 'push') return checkPush(rest, cwd);
  if (sub === 'branch' && rest.some(a => /^(-d|-D|--delete)$/.test(a))) {
    const names = rest.filter(a => !a.startsWith('-')).map(shortBranch);
    const hit = names.find(n => PROTECTED_BRANCHES.includes(n.replace(/^origin\//, '')));
    if (hit) return deny(`Deleting the ${hit} branch is not allowed. main holds the website and maintenance-reports holds the daily check results.`);
  }
  return null;
}

function checkPush(args, cwd) {
  const flags = args.filter(a => a.startsWith('-'));
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (['-o', '--push-option', '--repo', '--receive-pack', '--exec'].includes(a)) { i++; continue; }
    if (!a.startsWith('-')) positional.push(a);
  }
  if (flags.some(f => /^(-f|--force|--force-with-lease.*|--force-if-includes)$/.test(f) || (/^-[a-zA-Z]+$/.test(f) && f.includes('f')))) {
    return deny('Force-pushing is not allowed in this repository. Push a new commit instead.');
  }
  if (flags.some(f => /^(--mirror|--all|--branches|--prune)$/.test(f))) {
    return deny('Pushing every branch (--all/--mirror/--prune) is not allowed; it can overwrite or delete main and maintenance-reports. Push only your own branch.');
  }
  const deleting = flags.some(f => /^(-d|--delete)$/.test(f));
  const refspecs = positional.slice(1); // first positional is the remote
  if (deleting) {
    const hit = refspecs.map(shortBranch).find(n => PROTECTED_BRANCHES.includes(n));
    if (hit) return deny(`Deleting the ${hit} branch is not allowed.`);
    return null;
  }
  if (refspecs.length === 0) {
    const branch = currentBranch(cwd);
    if (branch && NO_PUSH_BRANCHES.includes(branch)) return deny(`You are on ${branch}. Pushing to ${branch} is not allowed; create a branch and open a pull request.`);
    return null;
  }
  for (const spec of refspecs) {
    if (spec.startsWith('+')) return deny('Force-pushing (a "+" refspec) is not allowed in this repository.');
    const dst = spec.includes(':') ? spec.slice(spec.indexOf(':') + 1) : spec;
    const target = shortBranch(dst);
    if (dst === '') {
      const victim = shortBranch(spec.slice(1));
      if (PROTECTED_BRANCHES.includes(victim)) return deny(`Deleting the ${victim} branch is not allowed.`);
      continue;
    }
    let effective = target;
    if (target === 'HEAD') effective = currentBranch(cwd) ?? 'HEAD';
    if (NO_PUSH_BRANCHES.includes(effective)) return deny(`Pushing to ${effective} is not allowed. Website changes go branch -> pull request -> preview -> approval -> merge.`);
    if (effective === 'maintenance-reports') return deny('maintenance-reports is written only by the GitHub workflows. Do not push to it.');
  }
  return null;
}

/** gh CLI: REST calls via `gh api`, plus the GraphQL-backed subcommands Jaden may use locally. */
function checkGh(args) {
  const sub = args[0];
  if (sub === 'pr' && args[1] === 'merge') return ask('Merging a pull request saves it to the live website. Approve only after the person said yes to the preview ("Ready to save?").');
  if (sub === 'secret' || sub === 'variable') return deny('Changing GitHub secrets or variables is an account-owner task, not something Claude does.');
  if (sub === 'repo' && ['delete', 'edit', 'rename', 'archive', 'unarchive'].includes(args[1])) return deny('Changing repository settings is an account-owner task.');
  if (sub === 'ruleset') return deny('Changing GitHub rulesets is an account-owner task.');
  if (sub === 'auth' && args[1] === 'token') return deny('Printing the GitHub token is not allowed.');
  if (sub === 'workflow' && args[1] === 'run') return ask('Starting a workflow by hand can publish or change accounts. A person must approve this.');
  if (sub === 'workflow' && ['disable', 'enable'].includes(args[1])) return deny('Turning workflows on or off is an account-owner task.');
  if (sub === 'api') return checkGhApi(args.slice(1));
  return null;
}

function checkGhApi(args) {
  let method = null;
  const positional = [];
  let hasFields = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-X' || a === '--method') { method = (args[++i] || '').toUpperCase(); continue; }
    if (/^(-X|--method=)/.test(a)) { method = a.replace(/^(-X|--method=)/, '').toUpperCase(); continue; }
    if (['-f', '-F', '--field', '--raw-field', '--input'].includes(a)) { hasFields = true; i++; continue; }
    if (['-H', '--header', '-q', '--jq', '-t', '--template', '--hostname', '--cache'].includes(a)) { i++; continue; }
    if (!a.startsWith('-')) positional.push(a);
  }
  const route = (positional[0] || '').replace(/^\/+/, '').replace(/^https:\/\/api\.github\.com\//, '').split('?')[0];
  method = method || (hasFields ? 'POST' : 'GET');
  if (method === 'GET' || method === 'HEAD') return null;

  // Routes may start with a shell variable such as $REPO/..., so match on the tail.
  if (/\/git\/refs\/(heads\/)?.+$/.test(route)) {
    const branch = route.replace(/^.*\/git\/refs\/(heads\/)?/, '');
    if (PROTECTED_BRANCHES.includes(branch)) return deny(`Changing or deleting the ${branch} branch through the API is not allowed.`);
  }
  if (/\/pulls\/\d+\/merge$/.test(route) || /(^|\/)merges$/.test(route)) {
    return ask('Merging saves this change to the live website. Approve only after the person said yes to the preview ("Ready to save?").');
  }
  if (/\/actions\/workflows\/[^/]+\/dispatches$/.test(route)) {
    return ask('Starting a workflow by hand can publish or change accounts. A person must approve this.');
  }
  if (/\/branches\/[^/]+\/protection/.test(route) || /\/rulesets/.test(route) || /\/actions\/(secrets|variables|permissions)/.test(route) ||
      /\/(collaborators|keys|hooks|environments|pages)(\/|$)/.test(route) || /\/actions\/workflows\/[^/]+\/(disable|enable)$/.test(route)) {
    return deny('Changing repository security, access, secrets, hooks or branch protection is an account-owner task.');
  }
  if ((/^repos\/[^/]+\/[^/]+\/?$/.test(route) || /^\$\{?\w+\}?\/?$/.test(route)) && ['PATCH', 'DELETE', 'PUT'].includes(method)) return deny('Changing or deleting the repository itself is an account-owner task.');
  if (/^orgs\//.test(route) || /^user(\/|$)/.test(route)) return deny('Changing organization or account settings is an account-owner task.');
  return null;
}

function checkWrangler(args) {
  const sub = args.find(a => !a.startsWith('-'));
  if (!sub && args.some(a => /^(--version|-v|--help|-h)$/.test(a))) return null;
  if (sub === 'deploy' && args.includes('--dry-run')) return null; // the build check uses this; it uploads nothing
  if (['dev', 'types', 'docs'].includes(sub)) return null;
  return deny('Direct Cloudflare/wrangler commands are not allowed here. The website, publisher and connector are deployed only by the GitHub workflows on the library Cloudflare account.');
}

function checkSanity(args) {
  const words = args.filter(a => !a.startsWith('-'));
  const joined = words.join(' ');
  if (/\b(deploy|undeploy)\b/.test(joined) || /^(dataset|cors|users|tokens|hook|projects|backup|documents\s+delete|graphql\s+deploy|schema\s+deploy)/.test(joined)) {
    return deny('Sanity project, dataset, schema, Studio, access and token changes are account-owner tasks. Edit content through the Sanity connector instead.');
  }
  return null;
}

const DEPLOY_SCRIPTS = [/(^|\/)cms-publisher\/deploy\.mjs$/, /(^|\/)connector\/publish\.mjs$/, /(^|\/)scripts\/live-hosting\.mjs$/];

function checkNode(args) {
  const script = args.find(a => !a.startsWith('-'));
  if (!script) return null;
  if (DEPLOY_SCRIPTS.some(r => r.test(script)) || /^(deploy|publish)\.mjs$/.test(script)) return deny('Deploy scripts run only inside the trusted GitHub workflows.');
  if (/(^|\/)scripts\/publish-live\.mjs$/.test(script) && args.includes('deliver')) return deny('Live publishing runs only inside the trusted GitHub workflow.');
  if (/(^|\/)studio\/scripts\/run\.mjs$|^scripts\/run\.mjs$/.test(script)) return checkSanity(args.slice(args.indexOf(script) + 1));
  return null;
}

const WRITE_COMMANDS = new Set(['rm', 'mv', 'cp', 'tee', 'truncate', 'chmod', 'ln', 'install', 'dd']);
const GUARDED_FILES = /(^|\/)\.claude\/(settings\.json|hooks\/)|(^|\/)\.github\/workflows\//;

/** Decide about one simple command (already split from a compound command). */
export function checkSimpleCommand(raw, cwd) {
  const rawTokens = tokenize(raw);
  // A bare `env` / `printenv` / `export` / `set` prints every variable, credentials included.
  const dump = rawTokens.filter(t => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(t));
  if ((['env', 'printenv', 'set'].includes(dump[0]) && dump.length === 1) || (dump[0] === 'export' && (dump.length === 1 || (dump.length === 2 && dump[1] === '-p')))) {
    return deny('Dumping every environment variable can expose credentials. Ask for the one non-secret value you need.');
  }
  const tokens = stripWrappers(rawTokens);
  if (!tokens.length) return null;
  const program = path.basename(tokens[0]);
  const args = tokens.slice(1);

  // bash -c '...' / sh -c / eval: check the inner script too.
  if (['bash', 'sh', 'zsh', 'dash'].includes(program)) {
    const at = args.indexOf('-c');
    if (at >= 0 && args[at + 1]) return checkCommand(args[at + 1], cwd);
  }
  if (program === 'eval') return checkCommand(args.join(' '), cwd);

  // Secrets: reading credential files or printing credential variables.
  if (tokens.some(t => isSecretPath(t.replace(/^[<>]+/, '')) || isSecretPath(t.split('=').pop()))) {
    return deny('That touches a credentials file (.env, .dev.vars, keys). Secrets stay out of Claude sessions; ask Jaden or a board admin if a value is needed.');
  }
  if (['echo', 'printf', 'printenv', 'cat'].includes(program)) {
    if (SECRET_VAR.test(raw)) return deny('Printing tokens or secrets is not allowed.');
    if (program === 'printenv' && args.some(a => /(TOKEN|SECRET|PASSWORD|KEY)/.test(a))) return deny('Printing tokens or secrets is not allowed.');
  }
  if (/api\.cloudflare\.com/.test(raw)) return deny('Calling the Cloudflare API directly is not allowed; deploys run only in the GitHub workflows.');
  if (/^CLOUDFLARE_API_TOKEN=/.test(raw.trim()) || /\bCLOUDFLARE_API_TOKEN=\S/.test(raw)) return deny('Setting a Cloudflare token here means a deploy from outside the GitHub workflows. Not allowed.');

  // Protected configuration: changing the guard itself, settings or workflows needs a person.
  if (WRITE_COMMANDS.has(program) || (program === 'sed' && args.some(a => /^-i/.test(a))) || (program === 'perl' && args.some(a => /^-p?i/.test(a))) || (program === 'git' && ['rm', 'mv', 'checkout', 'restore'].includes(args[0]))) {
    if (args.some(a => GUARDED_FILES.test(a))) return ask('This changes Claude\'s safety settings or the GitHub workflows. A person must approve it.');
  }
  if (/>{1,2}\s*\S*(\.claude\/(settings\.json|hooks\/)|\.github\/workflows\/)/.test(raw)) return ask('This changes Claude\'s safety settings or the GitHub workflows. A person must approve it.');

  switch (program) {
    case 'git': return checkGit(args, cwd);
    case 'gh': return checkGh(args);
    case 'wrangler': return checkWrangler(args);
    case 'sanity': return checkSanity(args);
    case 'node': return checkNode(args);
    case 'npm': case 'pnpm': case 'yarn': {
      const run = args[0] === 'run' ? args[1] : args[0];
      if (run && /^(deploy|publish|release:publish)$/.test(run) && !args.includes('--dry-run')) return deny('Deploys run only inside the trusted GitHub workflows.');
      return null;
    }
    case 'curl': case 'wget': return null; // covered by the Cloudflare API check above
    default: return null;
  }
}

/** Decide about a full Bash command line. Deny beats ask beats nothing. */
export function checkCommand(command, cwd) {
  let pending = null;
  for (const part of splitCommands(String(command ?? ''))) {
    const result = checkSimpleCommand(part, cwd);
    if (result?.decision === 'deny') return result;
    if (result?.decision === 'ask' && !pending) pending = result;
  }
  return pending;
}

// ---------- MCP connectors (Sanity, GitHub tools in cloud sessions, others) ----------

const SANITY_ADMIN_TOOLS = /__(deploy_schema|deploy_studio|create_project|create_dataset|update_dataset|add_cors_origin|cors_origins_delete|run_sanity_cli|create_embeddings_index|delete_dataset)$/;

export function checkMcp(toolName, input) {
  const name = String(toolName);
  if (/sanity/i.test(name) && SANITY_ADMIN_TOOLS.test(name)) {
    return deny('Sanity schema, Studio, project, dataset and access changes are account-owner tasks. Only content edits are allowed from here.');
  }
  const text = JSON.stringify(input ?? {});
  if (/merge/i.test(name) && /pull|pr\b|branch/i.test(name + text)) {
    return ask('Merging saves this change to the live website. Approve only after the person said yes to the preview ("Ready to save?").');
  }
  if (/(delete|remove)/i.test(name) && /(branch|ref)/i.test(name)) {
    const hit = PROTECTED_BRANCHES.find(b => new RegExp(`(^|[^\\w-])(refs/heads/)?${b}([^\\w-]|$)`).test(text));
    if (hit) return deny(`Deleting the ${hit} branch is not allowed.`);
  }
  if (/(push|update_ref|create_or_update_file|commit)/i.test(name) && /"(branch|ref)"\s*:\s*"(refs\/heads\/)?(main|master|maintenance-reports)"/.test(text)) {
    return deny('Writing directly to main or maintenance-reports is not allowed. Use a branch and a pull request.');
  }
  if (/cloudflare/i.test(name) && /(deploy|publish|create|update|delete|put|write)/i.test(name)) {
    return deny('Cloudflare changes run only through the GitHub workflows on the library account.');
  }
  return null;
}

// ---------- entry point ----------

export function decide(event) {
  const tool = event?.tool_name;
  const input = event?.tool_input ?? {};
  const cwd = event?.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (tool === 'Bash') return checkCommand(input.command, cwd);
  if (['Read', 'Edit', 'Write', 'NotebookEdit'].includes(tool)) {
    const file = input.file_path ?? input.notebook_path;
    if (isSecretPath(file)) return deny(`${path.basename(file)} holds credentials. Secrets stay out of Claude sessions.`);
    return null;
  }
  if (tool === 'Grep' || tool === 'Glob') {
    const glob = String((tool === 'Glob' ? input.pattern : input.glob) ?? '');
    if (isSecretPath(input.path) || isSecretPath(glob) || /(^|\/)\.(env|dev\.vars)(\*|$|\.(?!example))/.test(glob)) return deny('Searching credential files is not allowed.');
    return null;
  }
  if (typeof tool === 'string' && tool.startsWith('mcp__')) return checkMcp(tool, input);
  return null;
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  let event;
  try { event = JSON.parse(raw); } catch {
    process.stderr.write('Safety check could not read the tool call, so it was blocked.\n');
    process.exit(2);
  }
  let result;
  try { result = decide(event); } catch (error) {
    process.stderr.write(`Safety check failed (${error.message}), so the call was blocked.\n`);
    process.exit(2);
  }
  if (result?.decision === 'deny') { process.stderr.write(result.reason + '\n'); process.exit(2); }
  if (result?.decision === 'ask') {
    process.stdout.write(JSON.stringify({hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: result.reason}}) + '\n');
  }
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
