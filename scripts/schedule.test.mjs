import test from 'node:test';
import assert from 'node:assert/strict';
import { nextScheduledDay, parseSchedule } from '../src/content/schedule.mjs';

test('weekly programs get their next date, including today', () => {
  // 2026-10-29 is a Thursday.
  assert.deepEqual(nextScheduledDay('Wednesdays · 11:30 a.m.', '2026-10-29'), { day: '2026-11-04', time: '11:30 a.m.' });
  assert.deepEqual(nextScheduledDay('Every Thursday at 4 p.m.', '2026-10-29'), { day: '2026-10-29', time: '4 p.m.' });
  assert.deepEqual(nextScheduledDay('Tuesdays and Saturdays', '2026-10-29'), { day: '2026-10-31' });
});
test('monthly programs land on the right week, rolling into next month when this one has passed', () => {
  assert.deepEqual(nextScheduledDay('Third Tuesday · 2:30 p.m.', '2026-10-29'), { day: '2026-11-17', time: '2:30 p.m.' });
  assert.deepEqual(nextScheduledDay('Third Thursday · 1 p.m.', '2026-11-01'), { day: '2026-11-19', time: '1 p.m.' });
  assert.deepEqual(nextScheduledDay('Last Friday', '2026-10-29'), { day: '2026-10-30' });
  assert.deepEqual(nextScheduledDay('First Monday · 6–7 p.m.', '2026-12-08'), { day: '2027-01-04', time: '6–7 p.m.' });
});
test('schedules it cannot read with confidence are left alone', () => {
  for (const text of ['Every other Wednesday', 'By appointment', 'Monthly', 'First and third Tuesday', '']) assert.equal(parseSchedule(text), null, text);
});
