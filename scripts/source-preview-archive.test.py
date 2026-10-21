import importlib.util
from pathlib import Path
import stat
import sys
import tempfile
import unittest
import zipfile

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('preview_archive', Path(__file__).with_name('source-preview-archive.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ArchiveTest(unittest.TestCase):
    def test_extracts_ordinary_static_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with zipfile.ZipFile(root / 'bundle.zip', 'w') as archive:
                archive.writestr('site/index.html', '<h1>Checked draft</h1>')
            module.extract(root / 'bundle.zip', root / 'result')
            self.assertEqual((root / 'result/site/index.html').read_text(), '<h1>Checked draft</h1>')

    def test_rejects_paths_and_links_before_writing_files(self):
        for name in ['../outside', '/absolute', 'nested/../../outside', 'back\\slash', 'C:/outside', 'site/link']:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                with zipfile.ZipFile(root / 'bundle.zip', 'w') as archive:
                    archive.writestr('site/index.html', 'must not be extracted')
                    entry = zipfile.ZipInfo(name)
                    if name == 'site/link':
                        entry.create_system = 3
                        entry.external_attr = (stat.S_IFLNK | 0o777) << 16
                    archive.writestr(entry, 'outside')
                with self.assertRaises(ValueError):
                    module.extract(root / 'bundle.zip', root / 'result')
                self.assertFalse((root / 'result/site/index.html').exists())
                self.assertFalse((root / 'outside').exists())


if __name__ == '__main__':
    unittest.main()
