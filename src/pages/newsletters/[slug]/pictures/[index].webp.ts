// The pictures in an issue's web version, taken from its Word file at build time and resized to WebP.
import type { APIRoute, GetStaticPaths } from 'astro';
import { accessibleIssue } from '../../../../content/accessible-issue';
import { contentRepository } from '../../../../content/repository';

export const getStaticPaths = (async () => {
  const paths = [];
  for (const newsletter of await contentRepository.getNewsletters()) {
    const issue = await accessibleIssue({ ...newsletter, id: newsletter.id! });
    for (const picture of issue?.pictures ?? []) paths.push({ params: { slug: newsletter.id!, index: String(picture.index) }, props: { bytes: picture.bytes } });
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(props.bytes as Buffer), { headers: { 'Content-Type': 'image/webp' } });
