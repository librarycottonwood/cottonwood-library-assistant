/** Checks a newsletter's accessible Word version (.docx) before the website offers it for download.
 * Deterministic and offline: it reads the Word file's own structure (styles, headings, picture descriptions).
 * The library assistant makes the Word file; see the newsletter skill's "Accessible Word version".
 */
import JSZip from 'jszip';

const MANUAL_REVIEW = /^manual review$/i;
// Word's "Mark as decorative" box (Office 2019 and later) stores this extension on the picture.
const DECORATIVE = /<(?:\w+:)?decorative\b[^>]*\bval="(?:1|true)"/;
const NOT_WORD = 'It is not a Word (.docx) file. Save it from Word or Google Docs as .docx and upload it again.';

const decode = text => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const short = text => text.length > 60 ? `${text.slice(0, 57)}…` : text;
const attribute = (tag, name) => decode((new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? '').trim());

/** Paragraph style ids mapped to their names ("Heading1" → "heading 1"), from word/styles.xml. */
function styleNames(xml = '') {
  const names = new Map();
  for (const match of xml.matchAll(/<w:style\b([^>]*)>([\s\S]*?)<\/w:style>/g)) {
    const id = attribute(match[1], 'w:styleId');
    const name = /<w:name w:val="([^"]*)"/.exec(match[2])?.[1];
    if (id) names.set(id, (name ?? id).toLowerCase());
  }
  return names;
}

/** Reads the parts of a Word file that matter for accessibility: headings, Title/Subtitle use and pictures. */
export async function readWordStructure(bytes) {
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch { return undefined; }
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) return undefined;
  const names = styleNames(await zip.file('word/styles.xml')?.async('string'));
  // Pictures inside mc:Fallback repeat the mc:Choice picture for old versions of Word.
  const body = xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '');

  const headings = [];
  let usesTitleStyle = false;
  for (const paragraph of body.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
    const id = /<w:pStyle w:val="([^"]+)"/.exec(paragraph[1])?.[1];
    if (!id) continue;
    const name = names.get(id) ?? id.toLowerCase();
    if (/^(title|subtitle)$/.test(name)) usesTitleStyle = true;
    const level = /^heading ?([1-9])$/.exec(name)?.[1];
    if (level) headings.push({ level: Number(level), text: decode([...paragraph[1].matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(match => match[1]).join('')).replace(/\s+/g, ' ').trim() });
  }

  const pictures = [];
  for (const drawing of body.matchAll(/<w:drawing>([\s\S]*?)<\/w:drawing>/g)) {
    const match = /<wp:docPr\b([^>]*?)(\/>|>([\s\S]*?)<\/wp:docPr>)/.exec(drawing[1]);
    if (!match || !/<a:blip\b/.test(drawing[1])) continue;
    pictures.push({ name: attribute(match[1], 'name'), alt: attribute(match[1], 'descr') || attribute(match[1], 'title'), decorative: DECORATIVE.test(match[3] ?? '') });
  }
  // Pictures from old versions of Word (VML) keep their description in o:title.
  for (const match of body.matchAll(/<v:imagedata\b([^>]*)>/g)) pictures.push({ name: '', alt: attribute(match[1], 'o:title'), decorative: false });
  return { headings, usesTitleStyle, pictures };
}

/** Heading problems a person must fix. An empty list means the headings pass. */
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

/**
 * Checks a Word file. Returns the problems a person must fix before it goes on the website (none means it passed).
 * @param {Uint8Array} bytes the .docx file
 * @returns {Promise<{problems: string[], headings: {level: number, text: string}[], pictures: {name: string, alt: string, decorative: boolean}[]}>}
 */
export async function checkAccessibleNewsletter(bytes) {
  const structure = await readWordStructure(bytes);
  if (!structure) return { problems: [NOT_WORD], headings: [], pictures: [] };
  const problems = [];
  if (structure.usesTitleStyle) problems.push('It uses the Title or Subtitle style. Use Heading 1 for the newsletter title and Normal for other text.');
  structure.pictures.forEach((picture, index) => {
    if (!picture.alt && !picture.decorative) problems.push(`Picture ${index + 1}${picture.name ? ` ("${short(picture.name)}")` : ''} has no description (alt text) and isn't marked decorative. Describe it, or mark it as decorative if it is only decoration.`);
  });
  problems.push(...headingProblems(structure.headings));
  return { problems, headings: structure.headings, pictures: structure.pictures };
}
