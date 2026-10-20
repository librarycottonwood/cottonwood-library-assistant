import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSchema} from 'sanity';
import {validateDocument} from '@sanity/validation';
import {schemaTypes} from '../schemas/index.ts';
import {validateImportSnapshot} from '../scripts/validate-import.ts';

const schema = createSchema({name: 'cottonwood-test', types: schemaTypes});
const base = {_id: 'event.community-gathering', _type: 'event', _rev: 'test', _createdAt: '2026-10-20T00:00:00Z', _updatedAt: '2026-10-20T00:00:00Z'};
const event = {...base, title: 'Community gathering', slug: {_type: 'slug', current: 'community-gathering'}, summary: 'A confirmed library gathering.', sessions: [{_key: 'date-1', _type: 'eventSession', startsAt: '2026-11-07T18:00:00Z', endsAt: '2026-11-07T20:00:00Z'}]};

test('built-in rules in the compiled event schema accept a valid record without an optional photo', async () => {
  const result = await validateDocument({schema, document: event});
  assert.equal(result.status, 'notEvaluated'); // No API client: custom rules are tested separately below.
  assert.deepEqual(result.markers, []);
});

test('the actual compiled Sanity form prevents publication when a confirmed date is missing', async () => {
  const result = await validateDocument({schema, document: {...event, sessions: [{_key: 'date-1', _type: 'eventSession'}]}});
  assert.equal(result.status, 'failed');
  assert.ok(result.markers.some((marker) => marker.code === 'value.required' && marker.path.includes('startsAt')));
});

test('built-in rules in the compiled program schema accept an imported image and require its description', async () => {
  const program = {...base, _id: 'program.readers', _type: 'program', title: 'Readers', slug: {_type: 'slug', current: 'readers'}, audience: 'adults', schedule: 'As announced', description: 'Share your reading.', details: 'Contact the library for confirmed dates.', image: {_type: 'libraryImage', legacyKey: 'exterior', alt: 'The library entrance.'}};
  const result = await validateDocument({schema, document: program});
  assert.equal(result.status, 'notEvaluated');
  assert.deepEqual(result.markers, []);
  const missingAlt = await validateDocument({schema, document: {...program, image: {_type: 'libraryImage', legacyKey: 'exterior'}}});
  assert.equal(missingAlt.status, 'failed');
  assert.ok(missingAlt.markers.some((marker) => marker.path.includes('alt')));
});

test('migration validation reports and rejects unknown editor fields instead of hiding warnings', async () => {
  const result = await validateImportSnapshot({schemaVersion: 1, documents: [{...event, obsoleteField: 'left over from a prototype'}]});
  assert.equal(result.status, 'failed');
  assert.ok(result.failures[0].unknownFields.some((marker) => marker.path.includes('obsoleteField')));
  assert.equal(result.warnings.length, 1);
});

test('migration provenance is a known protected field and newsletter addresses are required', async () => {
  const imported = await validateImportSnapshot({schemaVersion: 1, documents: [{...event, migrationSource: 'existing reviewed source'}]});
  assert.equal(imported.status, 'local_builtin_rules_passed');
  assert.deepEqual(imported.warnings, []);
  const newsletter = {...base, _type: 'newsletter', _id: 'newsletter-current', issue: 'Fall 2026', title: 'Library news', summary: 'What is happening at the library.', legacyFileUrl: '/documents/newsletter.pdf', cover: {_type: 'libraryImage', legacyKey: 'newsletter', alt: 'Newsletter cover.'}};
  const missingSlug = await validateImportSnapshot({schemaVersion: 1, documents: [newsletter]});
  assert.equal(missingSlug.status, 'failed');
  assert.ok(missingSlug.failures[0].errors.some((marker) => marker.path.includes('slug')));
  const addressed = await validateImportSnapshot({schemaVersion: 1, documents: [{...newsletter, slug: {_type: 'slug', current: 'fall-2026'}}]});
  assert.equal(addressed.status, 'local_builtin_rules_passed');
  assert.deepEqual(addressed.warnings, []);
});
