"""Trusted host helpers. Never run these from the agent-modified checkout."""
import json
import os
import subprocess
import sys
import re
import urllib.request
from pathlib import Path

REPO = os.environ['GITHUB_REPOSITORY']
ROOT = 'https://api.github.com/repos/' + REPO

def api(path, method='GET', data=None):
    req = urllib.request.Request(ROOT + path, method=method,
        data=None if data is None else json.dumps(data).encode(),
        headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],
                 'Accept':'application/vnd.github+json','Content-Type':'application/json'})
    with urllib.request.urlopen(req) as r:
        raw = r.read()
        return json.loads(raw) if raw else None

def output(name, value):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
        f.write(f'{name}={value}\n')

def allowed(path):
    return path in ('package.json', 'pnpm-lock.yaml') or path.startswith(('src/components/', 'src/layouts/', 'src/styles/'))

mode = sys.argv[1] if __name__ == '__main__' else None
if mode == 'prepare':
    event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    if event.get('repository', {}).get('private') is not True:
        raise RuntimeError('Managed sign-in is restricted to the private library repository')
    main = api('/git/ref/heads/main')['object']['sha']
    failure = event.get('workflow_run')
    test_ref = event.get('inputs', {}).get('test_ref', '')
    if test_ref:
        if not test_ref.startswith('codex/upkeep-test-'):
            raise RuntimeError('Manual repair tests require an isolated upkeep-test branch')
        main = api('/git/ref/heads/'+test_ref)['object']['sha']
    ready = True
    followup_failure = False
    if failure:
        ready = (failure['conclusion']=='failure' and failure['head_branch']=='main'
                 and failure['head_sha']==main and failure['head_repository']['full_name']==REPO)
        commit = api('/commits/'+main)
        if ready and commit['commit']['message'].startswith('Library automatic repair:'):
            followup_failure = True
            ready = False  # Never repair the worker's own repair in a loop.
    artifacts = sorted(api('/actions/artifacts?per_page=100')['artifacts'], key=lambda a: a['created_at'], reverse=True)
    if failure and any(a['name']=='library-repair-attempt-'+main and not a['expired'] for a in artifacts):
        ready = False
    output('ready', str(ready).lower())
    output('source', main)
    output('repair', str(bool(failure or test_ref)).lower())
    output('followup_failure', str(followup_failure).lower())
    if not ready:
        sys.exit(0)
    # Restore only a vault produced by this exact worker on the trusted branch.
    for a in artifacts:
        if a['name']!='library-codex-auth' or a['expired']:
            continue
        run = api('/actions/runs/'+str(a['workflow_run']['id']))
        if run['name']=='Library automatic upkeep' and run['head_branch']=='main':
            subprocess.run(['gh','api',a['archive_download_url']], stdout=open(os.environ['RUNNER_TEMP']+'/vault.zip','wb'), check=True)
            import zipfile
            with zipfile.ZipFile(os.environ['RUNNER_TEMP']+'/vault.zip') as z:
                Path(os.environ['RUNNER_TEMP']+'/auth.enc').write_bytes(z.read('auth.enc'))
            break
    if failure and ready:
        with open(os.environ['RUNNER_TEMP']+'/review/failure.log','wb') as f:
            subprocess.run(['gh','run','view',str(failure['id']),'--repo',REPO,'--log-failed'],stdout=f,check=True)
elif mode == 'patch':
    source = sys.argv[2]
    if subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()!=source:
        raise RuntimeError('Agent changed the source commit')
    subprocess.run(['git','add','-N','.'],check=True)
    paths = subprocess.check_output(['git','diff','--name-only','HEAD'],text=True).splitlines()
    if not paths:
        output('patch', 'false')
    else:
        if any(Path(p).is_symlink() for p in paths):
            raise RuntimeError('Automatic repairs cannot introduce symbolic links')
        if 'package.json' in paths:
            original = json.loads(subprocess.check_output(['git', 'show', 'HEAD:package.json']))
            edited = json.loads(Path('package.json').read_text())
            for key in set(original) | set(edited):
                if key not in ('dependencies', 'devDependencies') and original.get(key) != edited.get(key):
                    raise RuntimeError('Automatic dependency repairs cannot change scripts or package metadata')
            for key in ('dependencies', 'devDependencies'):
                before, after = original.get(key, {}), edited.get(key, {})
                if set(before) != set(after) or any(not re.fullmatch(r'\d+\.\d+\.\d+(?:[-+][\w.]+)?', v) for v in after.values()):
                    raise RuntimeError('Automatic updates must retain the existing packages and exact versions')
        if len(paths)>8 or any(not allowed(p) for p in paths):
            raise RuntimeError('Repair requires work outside automatic maintenance scope')
        # Never accept deletion of source files or unusually large repairs.
        deleted = subprocess.check_output(['git','diff','--diff-filter=D','--name-only','HEAD'],text=True).strip()
        diff = subprocess.check_output(['git','diff','--binary','HEAD'])
        if deleted or len(diff)>40000:
            raise RuntimeError('Repair exceeded the small-change scope')
        Path(os.environ['RUNNER_TEMP']+'/repair.patch').write_bytes(diff)
        output('patch','true')
elif mode == 'finish':
    # CI evidence must refer to the exact repair head; stale base cannot be saved.
    source, head, target = sys.argv[2:]
    if target != "main" and not target.startswith("codex/upkeep-test-"):
        raise RuntimeError("Saving is restricted to main or an isolated rehearsal branch")
    runs = api('/actions/workflows/check.yml/runs?head_sha='+head)['workflow_runs']
    if not any(r['head_sha']==head and r['event']=='workflow_dispatch' and r['conclusion']=='success' for r in runs):
        raise RuntimeError('The repaired version has not passed the cloud checks')
    if api('/git/ref/heads/'+target)['object']['sha']!=source:
        raise RuntimeError('Another change was saved; leave this repair for a fresh review')
    # A non-forced fast-forward fails if concurrent main commits are not ancestors.
    api('/git/refs/heads/'+target,'PATCH',{'sha':head,'force':False})
    if target == 'main':
        api('/actions/workflows/check.yml/dispatches','POST',{'ref':'main'})

elif mode == 'alert':
    source = sys.argv[2]
    marker = '<!-- library-upkeep:' + source + ' -->'
    issues = api('/issues?state=open&per_page=100')
    if not any(marker in (i.get('body') or '') for i in issues):
        url = 'https://github.com/' + REPO + '/actions/runs/' + os.environ['GITHUB_RUN_ID']
        issue = api('/issues', 'POST', {
            'title': 'Website check needs attention',
            'body': "The website check found a problem I couldn't safely repair. Please ask your library assistant to review this alert.\n\n[Details for the assistant](" + url + ")\n\n" + marker,
            'assignees': ['librarycottonwood']})
        print(issue['html_url'])
