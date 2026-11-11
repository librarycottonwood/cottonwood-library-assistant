// A newsletter's accessible Word version (src/content/accessible-newsletter.mjs): the two real 2026 issues pass, and
// small Word files built here show each problem the website refuses before offering the download (no Heading 1,
// skipped levels, the Title style, a picture with no description, a leftover "Manual Review" section).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import {checkAccessibleNewsletter, headingProblems} from '../src/content/accessible-newsletter.mjs';

const fixture = name => readFile(new URL(`../src/content/fixtures/newsletters/cottonwood-library-newsletter-${name}.docx`, import.meta.url));

// A 1×1 PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const paragraph = (text, style) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t>${escape(text)}</w:t></w:r></w:p>`;
const heading = (level, text) => paragraph(text, `Heading${level}`);
const picture = ({alt = '', decorative = false} = {}) => `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="952500" cy="952500"/>
  <wp:docPr id="1" name="Picture 1" descr="${escape(alt)}">${decorative ? '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/></a:ext></a:extLst>' : ''}</wp:docPr>
  <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:blipFill><a:blip r:embed="rIdPicture"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

/** A minimal real .docx with Word's built-in heading styles. */
async function word(body, {href = 'https://example.org/'} = {}) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdPicture" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/picture.png"/><Relationship Id="rIdLink" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escape(href)}" TargetMode="External"/></Relationships>`);
  const styles = [1, 2, 3, 4].map(level => `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/></w:style>`).join('') + '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style>';
  zip.file('word/styles.xml', `<?xml version="1.0"?><w:styles ${W}>${styles}</w:styles>`);
  zip.file('word/media/picture.png', PNG);
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document ${W}><w:body>${body.join('')}</w:body></w:document>`);
  return zip.generateAsync({type: 'uint8array'});
}

for (const issue of ['summer-2026', 'fall-2026']) {
  test(`the ${issue} Word version passes: Heading 1 title, headings in order, every picture described or decorative`, async () => {
    const result = await checkAccessibleNewsletter(await fixture(issue));
    assert.deepEqual(result.problems, []);
    assert.deepEqual(result.headings[0], {level: 1, text: 'CHECK IT OUT….'});
    assert.ok(result.headings.filter(heading => heading.level === 2).length >= 4);
    assert.ok(!result.headings.some(heading => /manual review/i.test(heading.text)));
    assert.ok(result.pictures.length >= 6 && result.pictures.every(picture => picture.alt.length > 3 || picture.decorative));
    assert.ok(result.pictures.some(picture => picture.decorative), 'decorative pictures are marked, not described');
  });
}

test('a Word file without a Heading 1 is refused', async () => {
  const result = await checkAccessibleNewsletter(await word([heading(2, 'Storytime'), paragraph('Wednesdays at 11:30.')]));
  assert.match(result.problems.join(' '), /no Heading 1/);
});

test('a Word file that skips a heading level is refused', async () => {
  const result = await checkAccessibleNewsletter(await word([heading(1, 'Fall news'), heading(3, 'Storytime'), paragraph('Wednesdays.')]));
  assert.match(result.problems.join(' '), /"Storytime" jumps from Heading 1 to Heading 3/);
  assert.deepEqual(headingProblems([{level: 1, text: 'A'}, {level: 2, text: 'B'}, {level: 3, text: 'C'}, {level: 2, text: 'D'}]), []);
  assert.match(headingProblems([{level: 2, text: 'Intro'}, {level: 1, text: 'Title'}]).join(' '), /starts with a Heading 2/);
});

test('a picture needs a description unless it is marked decorative', async () => {
  const missing = await checkAccessibleNewsletter(await word([heading(1, 'Fall news'), picture()]));
  assert.match(missing.problems.join(' '), /Picture 1 .*no description/);
  const decorative = await checkAccessibleNewsletter(await word([heading(1, 'Fall news'), picture({decorative: true})]));
  assert.deepEqual(decorative.problems, []);
  const described = await checkAccessibleNewsletter(await word([heading(1, 'Fall news'), picture({alt: 'Volunteers at the book sale'})]));
  assert.deepEqual(described.problems, []);
  assert.deepEqual(described.pictures, [{name: 'Picture 1', alt: 'Volunteers at the book sale', decorative: false}]);
});

test('a leftover "Manual Review" section is refused', async () => {
  const result = await checkAccessibleNewsletter(await word([heading(1, 'Fall news'), paragraph('Hello.'), heading(2, 'Manual Review'), paragraph('Page 2: check the date.')]));
  assert.match(result.problems.join(' '), /Manual Review/);
});

test('the Title style and files that are not Word documents are refused', async () => {
  assert.match((await checkAccessibleNewsletter(await word([paragraph('Fall news', 'Title'), heading(1, 'Fall news')]))).problems.join(' '), /Title or Subtitle/);
  assert.match((await checkAccessibleNewsletter(new TextEncoder().encode('%PDF-1.7'))).problems.join(' '), /not a Word/);
  assert.deepEqual((await checkAccessibleNewsletter(await word([heading(1, 'Fall news'), heading(2, 'Storytime')]))).problems, []);
});
