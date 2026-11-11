// A newsletter's accessible Word version (src/content/accessible-newsletter.mjs): the two real 2026 issues pass, and
// small Word files built here show each problem the website refuses (no Heading 1, skipped levels, a picture with
// no description, a leftover "Manual Review" section).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import {readAccessibleNewsletter, headingProblems, stripManualReview, shiftHeadings} from '../src/content/accessible-newsletter.mjs';

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
const link = (text, href) => `<w:p><w:hyperlink r:id="rIdLink"><w:r><w:t>${escape(text)}</w:t></w:r></w:hyperlink></w:p>`;

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
  test(`the ${issue} Word version passes and becomes a web page with real headings and described pictures`, async () => {
    const result = await readAccessibleNewsletter(await fixture(issue));
    assert.deepEqual(result.problems, []);
    assert.equal(result.headings[0].level, 1);
    assert.equal(result.headings[0].text, 'CHECK IT OUT….');
    assert.ok(result.headings.filter(heading => heading.level === 2).length >= 4);
    assert.ok(result.images.length >= 5 && result.images.every(image => image.alt.length > 3 && image.size));
    // The page has its own h1, so the Word Heading 1 becomes an h2.
    assert.doesNotMatch(result.html, /<h1/);
    assert.match(result.html, /<h2>CHECK IT OUT….<\/h2>/);
    assert.doesNotMatch(result.html, /Manual Review|<img src=""/i);
    assert.equal((result.html.match(/<img /g) ?? []).length, result.images.length, 'decorative pictures are left out');
    if (issue === 'summer-2026') assert.match(result.html, /<ul><li>/, 'lists are real lists');
    assert.ok(result.html.includes('Cottonwood, CA 96022'));
  });
}

test('the fall issue keeps its link, its bold text and the wording of the PDF', async () => {
  const {html} = await readAccessibleNewsletter(await fixture('fall-2026'));
  assert.match(html, /<a href="https:\/\/cottonwoodcommunitylibrary\.com\/">Cottonwoodcommunitylibrary\.com<\/a>/);
  assert.match(html, /<strong>online auction<\/strong>/);
  assert.ok(html.includes('A ten dollar donation gets you a tile on the roof.'));
});

test('a Word file without a Heading 1 is refused', async () => {
  const result = await readAccessibleNewsletter(await word([heading(2, 'Storytime'), paragraph('Wednesdays at 11:30.')]));
  assert.match(result.problems.join(' '), /no Heading 1/);
});

test('a Word file that skips a heading level is refused', async () => {
  const result = await readAccessibleNewsletter(await word([heading(1, 'Fall news'), heading(3, 'Storytime'), paragraph('Wednesdays.')]));
  assert.match(result.problems.join(' '), /"Storytime" jumps from Heading 1 to Heading 3/);
  assert.deepEqual(headingProblems([{level: 1, text: 'A'}, {level: 2, text: 'B'}, {level: 3, text: 'C'}, {level: 2, text: 'D'}]), []);
  assert.match(headingProblems([{level: 2, text: 'Intro'}, {level: 1, text: 'Title'}]).join(' '), /starts with a Heading 2/);
});

test('a picture needs a description unless it is marked decorative; decorative pictures are hidden', async () => {
  const missing = await readAccessibleNewsletter(await word([heading(1, 'Fall news'), picture()]));
  assert.match(missing.problems.join(' '), /Picture 1 .*no description/);
  const decorative = await readAccessibleNewsletter(await word([heading(1, 'Fall news'), picture({decorative: true})]));
  assert.deepEqual(decorative.problems, []);
  assert.doesNotMatch(decorative.html, /<img/);
  const described = await readAccessibleNewsletter(await word([heading(1, 'Fall news'), picture({alt: 'Volunteers at the book sale'})]));
  assert.deepEqual(described.problems, []);
  assert.match(described.html, /<img alt="Volunteers at the book sale" src="newsletter-picture:0"/);
  assert.deepEqual(described.images[0].size, {width: 100, height: 100});
});

test('a leftover "Manual Review" section is refused, and never reaches the web page', async () => {
  const result = await readAccessibleNewsletter(await word([heading(1, 'Fall news'), paragraph('Hello.'), heading(2, 'Manual Review'), paragraph('Page 2: check the date.')]));
  assert.match(result.problems.join(' '), /Manual Review/);
  assert.doesNotMatch(result.html, /Manual Review|check the date/);
  assert.equal(stripManualReview('<h1>A</h1><h2>Manual review</h2><p>x</p><h3>y</h3><h2>B</h2>'), '<h1>A</h1><h2>B</h2>');
  assert.equal(shiftHeadings('<h1>A</h1><h6>B</h6>'), '<h2>A</h2><h6>B</h6>');
});

test('the Title style, files that are not Word documents and unsafe links are handled', async () => {
  assert.match((await readAccessibleNewsletter(await word([paragraph('Fall news', 'Title'), heading(1, 'Fall news')]))).problems.join(' '), /Title or Subtitle/);
  assert.match((await readAccessibleNewsletter(new TextEncoder().encode('%PDF-1.7'))).problems.join(' '), /not a Word/);
  const unsafe = await readAccessibleNewsletter(await word([heading(1, 'Fall news'), link('Click me', 'javascript:alert(1)')], {href: 'javascript:alert(1)'}));
  assert.doesNotMatch(unsafe.html, /javascript:|<a /);
  assert.match(unsafe.html, /Click me/);
});
