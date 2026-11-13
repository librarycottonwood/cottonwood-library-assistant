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
        # Host-generated result files live outside the checkout in real runs.
        # This fixture keeps them in its temp folder; remove them between calls.
        self.run('git','reset','--','outputs','repair.patch')
        for name in ('outputs','repair.patch'):
            (self.root/name).unlink(missing_ok=True)
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
    def test_connector_security_and_credentials_are_outside_scope(self):
        for name in ('index.mjs','google.mjs','reports.mjs','mcp.mjs','format.mjs','library-mcp.mjs','publishing.mjs'):
            path=self.root/'connector/src'/name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text('Changed security policy')
            self.assertNotEqual(self.patch().returncode,0)
            path.unlink()
    def test_existing_connector_presentation_cannot_be_automatically_rewritten(self):
        path=self.root/'connector/src/format.mjs'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text('Original formatting')
        self.run('git','add','connector')
        self.run('git','commit','-qm','Connector fixture')
        self.source=self.run('git','rev-parse','HEAD').stdout.strip()
        path.write_text('import {env} from "cloudflare:workers"; env.CMS_PUBLISHER.save("338888442", "forged")')
        self.assertNotEqual(self.patch().returncode,0)
    def test_connector_package_scripts_cannot_be_changed(self):
        import json
        path=self.root/'connector/package.json'
        path.parent.mkdir(parents=True,exist_ok=True)
        original={'scripts':{'test':'node --test'},'dependencies':{'oauth':'1.2.3'}}
        path.write_text(json.dumps(original))
        self.run('git','add','connector')
        self.run('git','commit','-qm','Connector package fixture')
        self.source=self.run('git','rev-parse','HEAD').stdout.strip()
        path.write_text(json.dumps({**original,'scripts':{'test':'echo passed'}}))
        self.assertNotEqual(self.patch().returncode,0)
        path.write_text(json.dumps({**original,'dependencies':{'oauth':'1.2.4'}}))
        self.assertNotEqual(self.patch().returncode,0)
    def test_cms_adapter_repair_can_be_exported_but_data_and_publishing_cannot(self):
        adapter=self.root/'src/content/sanity.mjs'
        adapter.parent.mkdir(parents=True,exist_ok=True)
        adapter.write_text('original adapter')
        self.run('git','add','src/content')
        self.run('git','commit','-qm','CMS adapter fixture')
        self.source=self.run('git','rev-parse','HEAD').stdout.strip()
        adapter.write_text('technical adapter repair')
        self.assertEqual(self.patch().returncode,0)
        adapter.write_text('original adapter')
        for name in ('src/content/seed.ts','studio/schema.ts','cms-publisher/src/index.mjs','.github/workflows/cms.yml','scripts/cms-publishing.mjs'):
            file=self.root/name
            file.parent.mkdir(parents=True,exist_ok=True)
            file.write_text('out of scope change')
            self.assertNotEqual(self.patch().returncode,0,name)
            file.unlink()
    def test_studio_dependency_repair_cannot_change_scripts_or_add_packages(self):
        import json
        file=self.root/'studio/package.json';file.parent.mkdir()
        original={'scripts':{'check':'tsc --noEmit'},'dependencies':{'sanity':'6.20.0'}}
        file.write_text(json.dumps(original))
        self.run('git','add','studio')
        self.run('git','commit','-qm','Studio fixture')
        self.source=self.run('git','rev-parse','HEAD').stdout.strip()
        file.write_text(json.dumps({**original,'dependencies':{'sanity':'6.20.1'}}))
        self.assertEqual(self.patch().returncode,0)
        file.write_text(json.dumps({**original,'scripts':{'check':'echo pass'}}))
        self.assertNotEqual(self.patch().returncode,0)
        file.write_text(json.dumps({**original,'dependencies':{'sanity':'6.20.0','new-package':'1.0.0'}}))
        self.assertNotEqual(self.patch().returncode,0)

if __name__ == '__main__':
    unittest.main()


class ReconnectTests(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('reconnect', Path(__file__).with_name('reconnect.py'))
        self.reconnect = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.reconnect)
    def auth(self, claims):
        import base64, json
        part = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip('=')
        return json.dumps({'auth_mode': 'chatgpt', 'tokens': {'id_token': 'h.' + part + '.s', 'refresh_token': 'x'}}).encode()
    def test_only_the_library_account_is_recognised(self):
        r = self.reconnect
        self.assertEqual(r.account_email(self.auth({'email': 'LibraryCottonwood@gmail.com'})), r.LIBRARY_EMAIL)
        self.assertEqual(r.account_email(self.auth({'https://api.openai.com/profile': {'email': 'someone@example.com'}})), 'someone@example.com')
        self.assertIsNone(r.account_email(b'{"tokens":{}}'))
    def test_device_code_is_read_from_colored_output(self):
        out = 'Enter this one-time code \x1b[90m(expires in 15 minutes)\x1b[0m\n   \x1b[94mGQW2-93XTT\x1b[0m\n'
        self.assertEqual(self.reconnect.find_code(out), 'GQW2-93XTT')
        self.assertIsNone(self.reconnect.find_code('Welcome to Codex [v0.167.1]'))
