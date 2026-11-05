"""Bound private source/CMS preview storage; expired approval needs a fresh preview.

PR previews that can still go live are never deleted: the newest checked preview(s)
for every open PR head, and for PRs merged in the last two days (their live save
may still be running or need a re-run). Previews of closed PRs and of older,
superseded PR heads can never go live, so they are deleted first.
"""
import datetime
import json
import os
import subprocess
import sys

REPO = 'librarycottonwood/cottonwood-library-assistant'
PR_PREVIEW = 'library-pr-checked-preview'
# library-source-trial-result is the pre-rename name, kept so its leftovers are still bounded.
NAMES = ('library-preview-and-screenshots', 'library-cms-checked-preview', PR_PREVIEW, 'library-publish-live-result', 'library-source-trial-result')
LIMIT = 450 * 1024 * 1024
RECENT_MERGE = datetime.timedelta(days=2)
# Weekly CMS backups (sanity-backup.yml): the newest four are always kept and count against
# the allowance first, so previews make room for them; older backups are deleted.
BACKUP = 'library-cms-backup'
BACKUP_KEEP = 4


def order(artifact):
    return (artifact['created_at'], artifact['id'])


def selection(artifacts, reserve=0, protected_heads=frozenset()):
    """Return (keep, remove). protected_heads: head SHAs whose previews may still go live."""
    backups = sorted((a for a in artifacts if a['name'] == BACKUP and not a['expired']), key=order, reverse=True)
    active = sorted((a for a in artifacts if a['name'] in NAMES and not a['expired']), key=order, reverse=True)
    protected, keep, remove = list(backups[:BACKUP_KEEP]), [], list(backups[BACKUP_KEEP:])
    for artifact in active:
        if artifact['name'] != PR_PREVIEW:
            continue
        head = (artifact.get('workflow_run') or {}).get('head_sha')
        # Closed PR, long-merged PR, or an older head of a PR: it can never go live.
        (protected if head in protected_heads else remove).append(artifact)
    for name in NAMES:
        if name == PR_PREVIEW:
            continue
        matching = [a for a in active if a['name'] == name]
        keep.extend(matching[:3])
        remove.extend(matching[3:])
    keep.sort(key=order)
    budget = LIMIT - reserve - sum(a['size_in_bytes'] for a in protected)
    while keep and sum(a['size_in_bytes'] for a in keep) > budget:
        remove.append(keep.pop(0))
    return sorted(protected + keep, key=order), remove


def live_heads(open_prs, closed_prs, now):
    heads = {pr['head']['sha'] for pr in open_prs if pr.get('base', {}).get('ref') == 'main'}
    for pr in closed_prs:
        merged = pr.get('merged_at')
        if merged and now - datetime.datetime.fromisoformat(merged.replace('Z', '+00:00')) <= RECENT_MERGE:
            heads.add(pr['head']['sha'])
    return heads


def gh(path, paginate=False):
    command = ['gh', 'api'] + (['--paginate', '--slurp'] if paginate else []) + [path]
    return json.loads(subprocess.check_output(command))


def main():
    if os.environ.get('GITHUB_REPOSITORY') != REPO or os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('Artifact cleanup is restricted to trusted library main workflows')
    reserve = 80 * 1024 * 1024 if '--reserve-preview' in sys.argv else 0
    # Any listing failure stops here, before anything is deleted.
    open_prs = [pr for page in gh(f'repos/{REPO}/pulls?state=open&per_page=100', True) for pr in page]
    closed_prs = gh(f'repos/{REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100')
    heads = live_heads(open_prs, closed_prs, datetime.datetime.now(datetime.timezone.utc))
    pages = gh(f'repos/{REPO}/actions/artifacts?per_page=100', True)
    keep, remove = selection([a for page in pages for a in page['artifacts']], reserve, heads)
    for artifact in remove:
        identifier = int(artifact['id'])
        subprocess.run(['gh', 'api', f'repos/{REPO}/actions/artifacts/{identifier}', '-X', 'DELETE'], check=True)
    used = sum(a['size_in_bytes'] for a in keep)
    if used > LIMIT - reserve:
        print(f'Warning: open PR previews and the latest CMS backups use {used // (1024 * 1024)} MiB, over the {LIMIT // (1024 * 1024)} MiB allowance. Close stale saves.')
    print(f'Retained {len(keep)} archives ({len(heads)} PR heads that can still go live); removed {len(remove)}. Expired/pruned approvals require a fresh preview.')


if __name__ == '__main__':
    main()
