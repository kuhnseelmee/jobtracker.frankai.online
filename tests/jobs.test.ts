import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateJob,
  blankJob,
  daysUntil,
  reminders,
  todayBrisbane,
  toCsv,
} from '../lib/jobs.ts';
import { generateWorkshop } from '../lib/workshop.ts';
import { generateApplicationDocuments } from '../lib/documents.ts';
import { createPdfBlob, createResumePdfBlob, pdfFileName } from '../lib/pdf.ts';
import { buildApplicationIntelligence } from '../lib/intelligence.ts';
import {
  authenticate,
  cookieValue,
  createSession,
  readSession,
  sessionCookieName,
} from '../lib/auth.ts';
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
void test('accepts generated workshop fields', () => {
  const job = {
    ...blankJob(),
    role: 'Business Analyst',
    company: 'Ozcare',
    industry: 'Health Care and Social Assistance',
  };
  const generated = generateWorkshop(job);
  const v = validateJob({ ...job, ...generated });
  assert.match(v.starResponses, /STAR Response 1/);
  assert.match(v.keySelectionCriteria, /Ozcare/);
  assert.match(v.employerResearch, /respect/i);
  assert.match(v.coverLetterWorkshop, /Cover letter workshop/);
});
void test('accepts generated application documents and creates pdf blobs', async () => {
  const job = {
    ...blankJob(),
    role: 'Business Development / Account Manager - IT Sales',
    company: 'MediaForm Pty Ltd',
    industry: 'ICT equipment supply and technology sales',
  };
  const generated = generateApplicationDocuments(job);
  const v = validateJob({ ...job, ...generated });
  assert.match(v.resumeDraft, /Raymond Douglas Wooler/);
  assert.match(v.resumeDraft, /TAILORED RESUME/);
  assert.match(v.coverLetterDraft, /Dear Hiring Manager/);
  const pdf = createPdfBlob(v.coverLetterDraft, 'Cover Letter');
  const resumePdf = createResumePdfBlob(v.resumeDraft, 'Resume');
  assert.equal(pdf.type, 'application/pdf');
  assert.equal(resumePdf.type, 'application/pdf');
  assert.ok(pdf.size > 1000);
  assert.ok(resumePdf.size > 1000);
  const resumePdfText = await resumePdf.text();
  assert.match(resumePdfText, /\/Subtype \/Link/);
  assert.match(resumePdfText, /mailto:rdwooler@gmail.com/);
  assert.match(resumePdfText, /https:\/\/www.linkedin.com\/in\/raymond-wooler-391866394/);
  assert.match(resumePdfText, /https:\/\/raywooler.online/);
  assert.match(resumePdfText, /https:\/\/frankai.online/);
  assert.equal(
    pdfFileName('Raymond Wooler Resume - MediaForm Pty Ltd - IT Sales'),
    'Raymond_Wooler_Resume_-_MediaForm_Pty_Ltd_-_IT_Sales.pdf',
  );
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
void test('builds a grounded application workspace without treating missing evidence as complete', () => {
  const intelligence = buildApplicationIntelligence({
    ...blankJob(),
    role: 'Business Analyst',
    company: 'Ozcare',
    industry: 'Health Care and Social Assistance',
    requirements:
      'Process mapping, stakeholder engagement, UAT and enterprise applications.',
    why: 'I want to improve systems that support care staff.',
    employerResearch: 'Employer research completed.',
    starResponses: 'STAR Response 1 - Improving workplace systems',
    keySelectionCriteria: 'Business analysis and process improvement',
    resumeDraft: 'Tailored resume draft',
    coverLetterDraft: 'Tailored cover letter draft',
  });
  assert.ok(intelligence.readiness.score >= 70);
  assert.equal(intelligence.readiness.readyToApply, true);
  assert.match(intelligence.jobDna, /Ozcare/);
  assert.match(intelligence.interviewPack, /stakeholder/i);
  assert.match(intelligence.truthCheck, /personally verify/i);
  assert.match(intelligence.applicationPack, /Resume PDF/);
});
void test('application intelligence highlights missing preparation and deadline risk', () => {
  const intelligence = buildApplicationIntelligence({
    ...blankJob(),
    role: 'Systems Analyst',
    company: 'Example Co',
    deadline: todayBrisbane(),
  });
  assert.ok(intelligence.readiness.score < 40);
  assert.equal(intelligence.readiness.readyToApply, false);
  assert.ok(intelligence.readiness.blockers.some((item) => /requirements/i.test(item)));
  assert.ok(intelligence.deadlineRisk.includes('today'));
});
void test('authenticates the two configured roles and signs expiring sessions', async () => {
  const secrets = { adminPassword: 'admin-test-pass', guestPassword: 'guest-test-pass' };
  const administrator = await authenticate(
    'ADMIN@jobtracker.frankai.online',
    'admin-test-pass',
    secrets,
  );
  const guest = await authenticate(
    'guest@jobtracker.frankai.online',
    'guest-test-pass',
    secrets,
  );
  assert.deepEqual(administrator, {
    email: 'admin@jobtracker.frankai.online',
    role: 'administrator',
  });
  assert.deepEqual(guest, {
    email: 'guest@jobtracker.frankai.online',
    role: 'guest',
  });
  assert.equal(await authenticate('guest@jobtracker.frankai.online', 'wrong', secrets), null);
  const session = await createSession(administrator!, secrets, 1000);
  assert.deepEqual(await readSession(session.value, secrets, 1001), {
    ...administrator,
    expiresAt: 44200,
  });
  assert.equal(await readSession(session.value, secrets, 44200), null);
  assert.equal(await readSession(`${session.value}tampered`, secrets, 1001), null);
  assert.equal(cookieValue(`other=1; ${sessionCookieName}=ok`, sessionCookieName), 'ok');
});
