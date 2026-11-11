/** A newsletter's accessible Word version (.docx), checked and turned into a readable web page at build time.
 * Deterministic and offline: mammoth reads the Word structure (real headings, lists, tables, links, pictures
 * with their descriptions). No AI or paid service is involved. The library assistant makes the Word file; see
 * plugins/cottonwood-library/skills/newsletter/accessible-word.md.
 */
import JSZip from 'jszip';
import mammoth from 'mammoth';

const MANUAL_REVIEW = /^manual review$/i;
// Word's "Mark as decorative" box (Office 2019 and later) stores this extension on the picture.
const DECORATIVE = /<(?:\w+:)?decorative\b[^>]*\bval="(?:1|true)"/;
const SAFE_LINK = /^(https:\/\/|http:\/\/|mailto:|tel:)/i;

const plainText = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const short = text => text.length > 60 ? `${text.slice(0, 57)}…` : text;

/** Every picture in the document body, in order: its description (alt text) and whether it is marked decorative. */
async function pictures(zip) {
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) return undefined;
  // Pictures inside mc:Fallback repeat the mc:Choice picture for old versions of Word.
  const body = xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '');
  const found = [];
  for (const drawing of body.matchAll(/<w:drawing>([\s\S]*?)<\/w:drawing>/g)) {
    const match = /<wp:docPr\b([^>]*?)(\/>|>([\s\S]*?)<\/wp:docPr>)/.exec(drawing[1]);
    if (!match || !/<a:blip\b/.test(drawing[1])) continue;
    const attribute = name => (new RegExp(`\\b${name}="([^"]*)"`).exec(match[1])?.[1] ?? '').trim();
    const extent = /<wp:extent cx="(\d+)" cy="(\d+)"/.exec(drawing[1]);
    // Size on the Word page in CSS pixels (914400 units per inch, 96 pixels per inch).
    const size = extent ? { width: Math.round(Number(extent[1]) / 9525), height: Math.round(Number(extent[2]) / 9525) } : undefined;
    found.push({ name: attribute('name'), alt: attribute('descr') || attribute('title'), decorative: DECORATIVE.test(match[3] ?? ''), size });
  }
  // Pictures from old versions of Word (VML) keep their description in o:title.
  for (const match of body.matchAll(/<v:imagedata\b([^>]*)>/g)) {
    const title = (/\bo:title="([^"]*)"/.exec(match[1])?.[1] ?? '').trim();
    found.push({ name: '', alt: title, decorative: false });
  }
  const styles = [...body.matchAll(/<w:pStyle w:val="([^"]+)"/g)].map(match => match[1]);
  return { pictures: found, usesTitleStyle: styles.some(style => /^(Title|Subtitle)$/i.test(style)) };
}

/** The headings in converted HTML, in order. */
export function headingsOf(html) {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(match => ({ level: Number(match[1]), text: plainText(match[2]) }));
}

/** Problems a person must fix in the Word file before it goes on the website. An empty list means it passed. */
export function headingProblems(headings) {
  const problems = [];
  if (!headings.some(heading => heading.level === 1)) problems.push('It has no Heading 1. Give the newsletter title the Heading 1 style.');
  else if (headings[0].level !== 1) problems.push(`It starts with a Heading ${headings[0].level} ("${short(headings[0].text)}"). The first heading must be the newsletter title in Heading 1.`);
  headings.forEach((heading, index) => {
    const previous = headings[index - 1];
    if (previous && heading.level > previous.level + 1) problems.push(`The heading "${short(heading.text)}" jumps from Heading ${previous.level} to Heading ${heading.level}. Use Heading ${previous.level + 1}.`);
    if (!heading.text) problems.push(`There is an empty Heading ${heading.level}. Delete it or type the heading.`);
  });
  if (headings.some(heading => MANUAL_REVIEW.test(heading.text))) problems.push('It still has the "Manual Review" section. Resolve those items, then delete the section.');
  return problems;
}

/** Removes a "Manual Review" heading and everything under it (up to the next heading at the same or a higher level). */
export function stripManualReview(html) {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
  const start = headings.findIndex(match => MANUAL_REVIEW.test(plainText(match[2])));
  if (start < 0) return html;
  const level = Number(headings[start][1]);
  const end = headings.slice(start + 1).find(match => Number(match[1]) <= level);
  return html.slice(0, headings[start].index) + (end ? html.slice(end.index) : '');
}

/** Moves every heading down one level (Heading 1 becomes h2), because the web page already has its own h1. */
export function shiftHeadings(html, by = 1) {
  return html.replace(/<(\/?)h([1-6])\b/g, (_, slash, level) => `<${slash}h${Math.min(6, Number(level) + by)}`);
}

/**
 * Checks a Word file and converts it to HTML.
 * @param {Uint8Array} bytes the .docx file
 * @returns {Promise<{problems: string[], html: string, headings: {level: number, text: string}[], images: {alt: string, contentType: string, bytes: Uint8Array, size?: {width: number, height: number}}[]}>}
 * `html` refers to its pictures as `src="newsletter-picture:<index>"`, in the order of `images`; the page swaps in real addresses.
 * Decorative pictures (no description) are left out of the web page.
 */
export async function readAccessibleNewsletter(bytes) {
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch { return { problems: ['It is not a Word (.docx) file. Save it from Word or Google Docs as .docx and upload it again.'], html: '', headings: [], images: [] }; }
  const structure = await pictures(zip);
  if (!structure) return { problems: ['It is not a Word (.docx) file. Save it from Word or Google Docs as .docx and upload it again.'], html: '', headings: [], images: [] };
  const problems = [];
  if (structure.usesTitleStyle) problems.push('It uses the Title or Subtitle style. Use Heading 1 for the newsletter title and Normal for other text.');
  structure.pictures.forEach((picture, index) => {
    if (!picture.alt && !picture.decorative) problems.push(`Picture ${index + 1}${picture.name ? ` ("${short(picture.name)}")` : ''} has no description (alt text) and isn't marked decorative. Describe it, or mark it as decorative if it is only decoration.`);
  });

  const images = [];
  let seen = 0;
  const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) }, {
    convertImage: mammoth.images.imgElement(async image => {
      const alt = (image.altText ?? '').trim();
      // mammoth reads pictures in document order, so the n-th picture here is the n-th one found above.
      const picture = structure.pictures[seen++];
      if (!alt) return { src: '' };
      images.push({ alt, contentType: image.contentType, bytes: await image.read(), ...(picture?.alt === alt && picture.size ? { size: picture.size } : {}) });
      return { src: `newsletter-picture:${images.length - 1}` };
    }),
  });
  const headings = headingsOf(result.value);
  problems.push(...headingProblems(headings));

  let html = stripManualReview(result.value)
    .replace(/<img src=""[^>]*\/?>/g, '') // decorative pictures
    .replace(/<a id="[^"]*"><\/a>/g, '') // Word bookmarks
    .replace(/<a href="([^"]*)">([\s\S]*?)<\/a>/g, (whole, href, text) => SAFE_LINK.test(href.replace(/&amp;/g, '&')) ? whole : text)
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, '');
  html = shiftHeadings(html);
  return { problems, html, headings, images };
}
