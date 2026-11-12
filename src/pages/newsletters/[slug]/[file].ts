// Download address for a test Word version kept in src/content/fixtures (local fixture site and local previews only).
// Real issues link straight to their Word file on the Sanity CDN, so this makes no pages in CI or live builds.
import { readFile } from 'node:fs/promises';
import type { APIRoute, GetStaticPaths } from 'astro';
import { contentRepository } from '../../../content/repository';
import { DOCX_MIME } from '../../../content/sanity.mjs';

export const getStaticPaths = (async () => (await contentRepository.getNewsletters())
  .filter(newsletter => newsletter.accessibleFile && !newsletter.accessibleFile.source.startsWith('https://'))
  .map(newsletter => ({ params: { slug: newsletter.id!, file: newsletter.accessibleFile!.fileName }, props: { source: newsletter.accessibleFile!.source } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => new Response(new Uint8Array(await readFile(props.source as string)), { headers: { 'Content-Type': DOCX_MIME } });
