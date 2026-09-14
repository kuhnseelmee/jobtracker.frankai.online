import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJobListing, validateImportUrl } from '../lib/job-import.ts';

void test('accepts a public HTTPS listing URL and rejects unsafe import targets', () => {
  assert.equal(
    validateImportUrl('https://careers.example.com/jobs/systems-analyst').hostname,
    'careers.example.com',
  );
  for (const target of [
    'http://careers.example.com/jobs/1',
    'https://user:pass@careers.example.com/jobs/1',
    'https://localhost/jobs/1',
    'https://127.0.0.1/jobs/1',
    'https://192.168.1.1/jobs/1',
    'https://metadata.google.internal/jobs/1',
    'https://careers.example.com/jobs/1#details',
    'https://careers.example.com:8443/jobs/1',
  ]) assert.throws(() => validateImportUrl(target), /safe, public HTTPS/i);
});

void test('maps JSON-LD JobPosting data into a reviewable job draft', () => {
  const html = `
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"JobPosting","title":"Systems Analyst","hiringOrganization":{"@type":"Organization","name":"Ozcare"},"jobLocation":{"@type":"Place","address":{"@type":"PostalAddress","addressLocality":"Brisbane","addressRegion":"QLD","addressCountry":"AU"}},"employmentType":"FULL_TIME","baseSalary":{"@type":"MonetaryAmount","currency":"AUD","value":{"@type":"QuantitativeValue","minValue":95000,"maxValue":110000,"unitText":"YEAR"}},"validThrough":"2026-10-10","description":"Analyse systems, map processes and support users."}
    </script>`;
  const imported = extractJobListing(html, 'https://careers.example.com/jobs/1');
  assert.equal(imported.draft.role, 'Systems Analyst');
  assert.equal(imported.draft.company, 'Ozcare');
  assert.equal(imported.draft.location, 'Brisbane, QLD, AU');
  assert.equal(imported.draft.employment, 'FULL_TIME');
  assert.equal(imported.draft.salary, 'AUD 95000–110000 YEAR');
  assert.equal(imported.draft.deadline, '2026-10-10');
  assert.equal(imported.draft.industry, 'Information Media and Telecommunications');
  assert.equal(imported.draft.url, 'https://careers.example.com/jobs/1');
  assert.match(imported.draft.requirements, /map processes/i);
  assert.equal(imported.fields.find((field) => field.label === 'Company')?.confidence, 'listing');
});

void test('falls back to readable metadata without inventing missing company details', () => {
  const imported = extractJobListing(
    '<meta property="og:title" content="ICT Business Analyst"><meta name="description" content="Improve digital workflows and analyse business requirements.">',
    'https://careers.example.com/jobs/2',
  );
  assert.equal(imported.draft.role, 'ICT Business Analyst');
  assert.equal(imported.draft.company, '');
  assert.equal(imported.draft.industry, 'Information Media and Telecommunications');
  assert.equal(imported.fields.find((field) => field.label === 'Company')?.confidence, 'missing');
  assert.match(imported.summary, /readable public page content/i);
});
