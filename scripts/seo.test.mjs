import test from 'node:test';
import assert from 'node:assert/strict';
import { articleNode, eventNodes, jsonLd, libraryNode, openingHours, parseDays, parseHours } from '../src/content/seo.mjs';

test('day text from Sanity becomes schema.org days', () => {
  assert.deepEqual(parseDays('Monday–Wednesday'), ['Monday', 'Tuesday', 'Wednesday']);
  assert.deepEqual(parseDays('Saturday'), ['Saturday']);
  assert.deepEqual(parseDays('Mon, Wed & Fri'), ['Monday', 'Wednesday', 'Friday']);
  assert.deepEqual(parseDays('Tues. to Thurs.'), ['Tuesday', 'Wednesday', 'Thursday']);
  assert.deepEqual(parseDays('Fridays'), ['Friday']);
  for (const text of ['Weekdays', 'Holidays', 'By appointment', '']) assert.equal(parseDays(text), null, text);
});
test('hour text from Sanity becomes 24-hour opening and closing times', () => {
  assert.deepEqual(parseHours('11 a.m.–5 p.m.'), { opens: '11:00', closes: '17:00' });
  assert.deepEqual(parseHours('11 a.m.–2 p.m.'), { opens: '11:00', closes: '14:00' });
  assert.deepEqual(parseHours('10:30 a.m. to noon'), { opens: '10:30', closes: '12:00' });
  assert.deepEqual(parseHours('11–5 p.m.'), { opens: '11:00', closes: '17:00' });
  assert.deepEqual(parseHours('1–4 p.m.'), { opens: '13:00', closes: '16:00' });
  for (const text of ['Closed', 'By appointment', '11–5', '5 p.m.–11 a.m.', '']) assert.equal(parseHours(text), null, text);
});
test('opening hours skip closed days, and are left out entirely when any open row is unreadable', () => {
  const rows = [{ days: 'Monday–Wednesday', hours: '11 a.m.–5 p.m.' }, { days: 'Thursday–Friday', hours: 'Closed' }, { days: 'Saturday', hours: '11 a.m.–2 p.m.' }];
  assert.deepEqual(openingHours(rows), [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday'], opens: '11:00', closes: '17:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['https://schema.org/Saturday'], opens: '11:00', closes: '14:00' },
  ]);
  assert.equal(openingHours([...rows, { days: 'Sunday', hours: 'Call ahead' }]), null);
  assert.equal(openingHours([{ days: 'Every day', hours: 'Closed' }]), null);
});
test('the library record uses the Sanity contact details', () => {
  const node = libraryNode({ name: 'Cottonwood Community Library', address: '3427 Main Street', locality: 'Cottonwood, CA 96022', mailingAddress: 'PO Box 1807, Cottonwood, CA 96022', phone: '(530) 347-4818', phoneHref: 'tel:+15303474818', email: 'cottonlib@shasta.com', hours: [], facebookUrl: 'https://www.facebook.com/x', instagramUrl: '', directionsUrl: 'https://maps.example/' });
  assert.equal(node['@type'], 'Library');
  assert.deepEqual(node.address, { '@type': 'PostalAddress', streetAddress: '3427 Main Street', addressLocality: 'Cottonwood', addressRegion: 'CA', postalCode: '96022', addressCountry: 'US' });
  assert.equal(node.telephone, '+1-530-347-4818');
  assert.equal(node.contactPoint.address.postOfficeBoxNumber, '1807');
  assert.deepEqual(node.sameAs, ['https://www.facebook.com/x']);
  assert.equal('openingHoursSpecification' in node, false);
});
test('events and posts', () => {
  const [online] = eventNodes([{ title: 'Auction', summary: 'Bid', startsAt: '2026-11-14T12:00:00-08:00', endsAt: '2026-11-15T15:00:00-08:00', location: 'Online', link: 'https://givebutter.com/c/x' }], { url: 'https://site/events/a/' });
  assert.equal(online.eventAttendanceMode, 'https://schema.org/OnlineEventAttendanceMode');
  assert.deepEqual(online.location, { '@type': 'VirtualLocation', url: 'https://givebutter.com/c/x' });
  const [inPerson] = eventNodes([{ title: 'Story Time', summary: 'Stories', startsAt: 'a', endsAt: 'b' }], { url: 'u' });
  assert.equal(inPerson.location['@id'], 'https://www.cottonwoodcommunitylibrary.com/#library');
  assert.equal('datePublished' in articleNode({ title: 'T', summary: 'S', publishedAt: null }, { url: 'u' }), false);
});
test('CMS text cannot close the JSON-LD script', () => {
  assert.equal(jsonLd([{ name: '</script><script>alert(1)</script>' }]).includes('</'), false);
});
