import datetime
import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('cms_artifacts', pathlib.Path(__file__).with_name('cms-artifacts.py'))
cms_artifacts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cms_artifacts)
MB = 1024 * 1024


def artifact(identifier, name, head='', size=20 * MB, created='2026-10-27T00:00:00Z'):
    return {'id': identifier, 'name': name, 'size_in_bytes': size, 'expired': False,
            'created_at': created, 'workflow_run': {'head_sha': head}}


class SelectionTest(unittest.TestCase):
    def test_open_pr_previews_survive_newer_previews_of_other_prs(self):
        old_open = artifact(1, cms_artifacts.PR_PREVIEW, 'a' * 40, created='2026-10-20T00:00:00Z')
        newer = [artifact(10 + i, cms_artifacts.PR_PREVIEW, str(i) * 40, created=f'2026-10-2{i}T01:00:00Z') for i in range(1, 6)]
        keep, remove = cms_artifacts.selection([old_open] + newer, protected_heads={'a' * 40, '1' * 40})
        self.assertIn(1, [a['id'] for a in keep])
        self.assertIn(11, [a['id'] for a in keep])
        # Closed/superseded heads go even though they are newer.
        self.assertEqual(sorted(a['id'] for a in remove), [12, 13, 14, 15])

    def test_superseded_head_of_an_open_pr_is_removed(self):
        current = artifact(2, cms_artifacts.PR_PREVIEW, 'b' * 40, created='2026-10-27T02:00:00Z')
        superseded = artifact(1, cms_artifacts.PR_PREVIEW, 'c' * 40, created='2026-10-27T01:00:00Z')
        keep, remove = cms_artifacts.selection([current, superseded], protected_heads={'b' * 40})
        self.assertEqual([a['id'] for a in keep], [2])
        self.assertEqual([a['id'] for a in remove], [1])

    def test_budget_never_removes_a_protected_preview(self):
        protected = [artifact(i, cms_artifacts.PR_PREVIEW, str(i) * 40, size=100 * MB) for i in range(1, 6)]
        other = artifact(9, 'library-preview-and-screenshots', size=20 * MB)
        keep, remove = cms_artifacts.selection(protected + [other], protected_heads={str(i) * 40 for i in range(1, 6)})
        self.assertEqual(sorted(a['id'] for a in keep), [1, 2, 3, 4, 5])
        self.assertEqual([a['id'] for a in remove], [9])

    def test_other_categories_keep_three_newest_within_budget(self):
        items = [artifact(i, 'library-cms-checked-preview', size=MB, created=f'2026-10-2{i}T00:00:00Z') for i in range(1, 6)]
        keep, remove = cms_artifacts.selection(items + [artifact(99, 'unrelated')])
        self.assertEqual(sorted(a['id'] for a in keep), [3, 4, 5])
        self.assertEqual(sorted(a['id'] for a in remove), [1, 2])

    def test_reserve_shrinks_only_unprotected_budget(self):
        protected = artifact(1, cms_artifacts.PR_PREVIEW, 'a' * 40, size=300 * MB)
        others = [artifact(2, 'library-preview-and-screenshots', size=60 * MB, created='2026-10-26T00:00:00Z'),
                  artifact(3, 'library-preview-and-screenshots', size=60 * MB, created='2026-10-27T00:00:00Z')]
        keep, remove = cms_artifacts.selection([protected] + others, reserve=80 * MB, protected_heads={'a' * 40})
        # 450 - 80 reserved - 300 protected leaves room for only the newest 60 MiB.
        self.assertEqual(sorted(a['id'] for a in keep), [1, 3])
        self.assertEqual([a['id'] for a in remove], [2])

    def test_newest_backups_are_kept_and_counted_before_other_archives(self):
        backups = [artifact(i, cms_artifacts.BACKUP, size=50 * MB, created=f'2026-10-2{i}T00:00:00Z') for i in range(1, 7)]
        protected = artifact(10, cms_artifacts.PR_PREVIEW, 'a' * 40, size=200 * MB)
        others = [artifact(20, 'library-preview-and-screenshots', size=40 * MB, created='2026-10-26T00:00:00Z'),
                  artifact(21, 'library-preview-and-screenshots', size=40 * MB, created='2026-10-27T00:00:00Z')]
        keep, remove = cms_artifacts.selection(backups + [protected] + others, protected_heads={'a' * 40})
        # Four newest backups (200 MiB) + protected preview (200 MiB) leave 50 MiB: only the newest screenshot set fits.
        self.assertEqual(sorted(a['id'] for a in keep), [3, 4, 5, 6, 10, 21])
        self.assertEqual(sorted(a['id'] for a in remove), [1, 2, 20])

    def test_live_heads_cover_open_and_recently_merged_prs(self):
        now = datetime.datetime(2026, 10, 28, tzinfo=datetime.timezone.utc)
        open_prs = [{'head': {'sha': 'a'}, 'base': {'ref': 'main'}}, {'head': {'sha': 'x'}, 'base': {'ref': 'other'}}]
        closed = [{'head': {'sha': 'b'}, 'merged_at': '2026-10-27T12:00:00Z'},
                  {'head': {'sha': 'c'}, 'merged_at': '2026-10-20T12:00:00Z'},
                  {'head': {'sha': 'd'}, 'merged_at': None}]
        self.assertEqual(cms_artifacts.live_heads(open_prs, closed, now), {'a', 'b'})


if __name__ == '__main__':
    unittest.main()
