import importlib.util
import os
import secrets
import unittest
from pathlib import Path
from cryptography.exceptions import InvalidTag

spec = importlib.util.spec_from_file_location('vault', Path(__file__).with_name('vault.py'))
vault = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vault)

class CredentialVaultTests(unittest.TestCase):
    def setUp(self):
        self.key = secrets.token_bytes(32)
        self.raw = b'{"auth_mode":"chatgpt","tokens":{"refresh_token":"synthetic-test-only"}}'
    def test_refreshed_auth_round_trip_and_ciphertext_only(self):
        sealed = vault.seal(self.raw, self.key)
        self.assertNotIn(b'synthetic-test-only', sealed)
        self.assertEqual(vault.open_sealed(sealed, self.key), self.raw)
        self.assertNotEqual(sealed, vault.seal(self.raw, self.key))
    def test_modified_archive_cannot_be_restored(self):
        sealed = bytearray(vault.seal(self.raw, self.key))
        sealed[-1] ^= 1
        with self.assertRaises(InvalidTag):
            vault.open_sealed(bytes(sealed), self.key)
    def test_wrong_secret_cannot_read_auth(self):
        with self.assertRaises(InvalidTag):
            vault.open_sealed(vault.seal(self.raw,self.key), secrets.token_bytes(32))
    def test_api_auth_or_missing_refresh_is_rejected(self):
        for raw in (b'{"auth_mode":"apikey"}', b'{"auth_mode":"chatgpt","tokens":{}}'):
            with self.assertRaises(ValueError):
                vault.seal(raw, self.key)


class RepairBoundaryTests(unittest.TestCase):
    def setUp(self):
        import tempfile, subprocess, json
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.run = lambda *args: subprocess.run(args, cwd=self.root, check=True, capture_output=True, text=True)
        self.run('git','init','-q')
        self.run('git','config','user.email','test@example.invalid')
        self.run('git','config','user.name','Test')
        (self.root/'src/components').mkdir(parents=True)
        (self.root/'src/components/test.astro').write_text('original')
        (self.root/'package.json').write_text(json.dumps({'scripts':{'check':'astro check'},'dependencies':{'astro':'7.3.3'}}))
        self.run('git','add','.')
        self.run('git','commit','-qm','Fixture')
        self.source=self.run('git','rev-parse','HEAD').stdout.strip()
    def tearDown(self):
        self.tmp.cleanup()
    def patch(self):
        import subprocess
        env=dict(os.environ,GITHUB_REPOSITORY='librarycottonwood/cottonwood-library-assistant',GITHUB_OUTPUT=str(self.root/'outputs'),RUNNER_TEMP=str(self.root))
        return subprocess.run(['python3',str(Path(__file__).with_name('github.py').resolve()),'patch',self.source],cwd=self.root,env=env,capture_output=True,text=True)
    def test_check_script_cannot_be_weakened(self):
        import json
        p=self.root/'package.json'; d=json.loads(p.read_text());d['scripts']['check']='echo passed';p.write_text(json.dumps(d))
        self.assertNotEqual(self.patch().returncode,0)
    def test_website_content_is_outside_automatic_scope(self):
        (self.root/'src/pages').mkdir();(self.root/'src/pages/index.astro').write_text('Changed public wording')
        self.assertNotEqual(self.patch().returncode,0)
    def test_symbolic_link_cannot_export_files(self):
        (self.root/'src/components/auth').symlink_to('/auth/auth.json')
        self.assertNotEqual(self.patch().returncode,0)
    def test_component_repair_is_exported_against_exact_source(self):
        (self.root/'src/components/test.astro').write_text('repaired')
        self.assertEqual(self.patch().returncode,0)
        self.assertTrue((self.root/'repair.patch').exists())

if __name__ == '__main__':
    unittest.main()
