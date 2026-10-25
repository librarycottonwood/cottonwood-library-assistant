"""Bound private source/CMS preview storage; expired approval needs a fresh preview."""
import json
import os
import subprocess
import sys

REPO = 'librarycottonwood/cottonwood-library-assistant'
# library-source-trial-result is the pre-rename name, kept so its leftovers are still bounded.
NAMES = ('library-preview-and-screenshots', 'library-cms-checked-preview', 'library-pr-checked-preview', 'library-publish-live-result', 'library-source-trial-result')

def selection(artifacts, reserve=0):
    active = sorted((a for a in artifacts if a['name'] in NAMES and not a['expired']),
                    key=lambda a: (a['created_at'], a['id']), reverse=True)
    keep, remove = [], []
    for name in NAMES:
        matching = [a for a in active if a['name'] == name]
        keep.extend(matching[:3])
        remove.extend(matching[3:])
    keep.sort(key=lambda a: (a['created_at'], a['id']))
    while keep and sum(a['size_in_bytes'] for a in keep) > 450 * 1024 * 1024 - reserve:
        remove.append(keep.pop(0))
    return keep, remove

def main():
    if os.environ.get('GITHUB_REPOSITORY') != REPO or os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('Artifact cleanup is restricted to trusted library main workflows')
    reserve = 80 * 1024 * 1024 if '--reserve-preview' in sys.argv else 0
    pages = json.loads(subprocess.check_output(['gh','api','--paginate','--slurp',f'repos/{REPO}/actions/artifacts?per_page=100']))
    keep, remove = selection([a for page in pages for a in page['artifacts']], reserve)
    for artifact in remove:
        identifier = int(artifact['id'])
        subprocess.run(['gh','api',f'repos/{REPO}/actions/artifacts/{identifier}','-X','DELETE'],check=True)
    print(f'Retained {len(keep)} checked preview archives within the storage allowance. Expired/pruned approvals require a fresh preview.')

if __name__ == '__main__':
    main()
