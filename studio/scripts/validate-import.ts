import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createSchema} from 'sanity';
import {validateDocument} from '@sanity/validation';
import {schemaTypes} from '../schemas/index.ts';

const schema = createSchema({name: 'cottonwood-import-validation', types: schemaTypes});
export async function validateImportSnapshot(snapshot: {schemaVersion: number; documents: Record<string, unknown>[]}) {
  if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.documents)) throw new Error('Expected a schemaVersion: 1 CMS snapshot with documents.');
  const failures = [];
  const warnings = [];
  for (const document of snapshot.documents) {
    if (typeof document._type !== 'string') throw new Error('Each migration document needs a schema type.');
    if (document._type.startsWith('sanity.')) continue;
    const result = await validateDocument({schema, document: document as Parameters<typeof validateDocument>[0]['document']});
    const errors = result.markers.filter((marker) => marker.level === 'error');
    const documentWarnings = result.markers.filter((marker) => marker.level === 'warning');
    const unknownFields = documentWarnings.filter((marker) => marker.code === 'object.unknown-field');
    if (errors.length || unknownFields.length) failures.push({id: document._id, errors, unknownFields});
    if (documentWarnings.length) warnings.push({id: document._id, markers: documentWarnings});
  }
  return {status: failures.length ? 'failed' : 'local_builtin_rules_passed', failures, warnings,
    limitation: 'No account or client used. Custom form callbacks, asset existence, permissions, and real publication remain unverified.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const file = process.argv.slice(2).find((argument) => argument !== '--');
  if (!file) throw new Error('Pass a migration snapshot path. This command performs local schema validation only.');
  const result = await validateImportSnapshot(JSON.parse(await readFile(file, 'utf8')));
  console.info(JSON.stringify(result, null, 2));
  process.exitCode = result.failures.length ? 1 : 0;
}
