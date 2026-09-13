import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateJob,
  blankJob,
  daysUntil,
  reminders,
  toCsv,
} from '../lib/jobs.ts';
void test('requires meaningful role and company', () => {
  assert.throws(() => validateJob(blankJob()), /role/i);
  assert.throws(
    () => validateJob({ ...blankJob(), role: 'Analyst' }),
    /company/i,
  );
});
void test('accepts clean data and strips unknown fields', () => {
  const v = validateJob({
    ...blankJob(),
    role: ' Analyst ',
    company: 'Acme',
    admin: true,
  });
  assert.equal(v.role, 'Analyst');
  assert.equal('admin' in v, false);
});
void test('rejects invalid stages, date rollovers, unsafe URLs and large content', () => {
  const b = { ...blankJob(), role: 'A', company: 'B' };
  for (const bad of [
    { status: 'Hired?' },
    { deadline: '2026-02-30' },
    { url: 'javascript:alert(1)' },
    { notes: 'a'.repeat(10001) },
    { followUp: 'tomorrow' },
    { priority: 'Urgent' },
  ])
    assert.throws(() => validateJob({ ...b, ...bad }));
});
void test('calendar differences have no daylight saving or time-of-day skew', () => {
  assert.equal(daysUntil('2026-09-15', '2026-09-14'), 1);
  assert.equal(daysUntil('2026-09-13', '2026-09-14'), -1);
  assert.equal(daysUntil('', '2026-09-14'), null);
});
void test('reminders omit archived jobs and applied application deadlines', () => {
  const b = { ...blankJob(), role: 'A', company: 'B', id: '1', version: 1 };
  const rows = reminders(
    [
      { ...b, deadline: '2026-09-14' },
      { ...b, id: '2', status: 'Archived', followUp: '2026-09-14' },
      {
        ...b,
        id: '3',
        status: 'Applied',
        deadline: '2026-09-14',
        followUp: '2026-09-16',
      },
    ],
    '2026-09-14',
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].kind, 'Application deadline');
  assert.equal(rows[1].kind, 'Follow-up');
});
void test('CSV escapes quotes and spreadsheet formula injection', () => {
  const s = toCsv([
    { ...blankJob(), id: '1', version: 1, company: '=CMD()', role: 'A,"B"' },
  ]);
  assert.match(s, /'=CMD/);
  assert.match(s, /A,""B""/);
});
