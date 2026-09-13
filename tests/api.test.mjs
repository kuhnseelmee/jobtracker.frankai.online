import test from 'node:test';
import assert from 'node:assert/strict';
const base = 'http://localhost:3001';
const call = (method, data, headers = {}) =>
  fetch(`${base}/api/jobs`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: base, ...headers },
    body: JSON.stringify(data),
  });
test('database persists edits and blocks invalid or conflicting writes', async () => {
  const initial = await (await fetch(`${base}/api/jobs`)).json();
  assert.equal(
    initial.jobs.filter((j) =>
      [
        'anglicare-business-analyst-1706',
        'ozcare-business-systems-analyst',
        'mediaform-it-sales-account-manager',
      ].includes(j.id),
    ).length,
    3,
  );
  const r = await call('POST', {
    role: 'Integration test role',
    company: 'Local test only',
    status: 'Saved',
  });
  assert.equal(r.status, 201);
  const { job } = await r.json();
  const edited = {
    ...job,
    notes: 'Prepared a tailored résumé',
    status: 'Applied',
    applied: '2026-09-14',
    followUp: '2026-09-21',
  };
  const update = await call('PUT', edited);
  assert.equal(update.status, 200);
  const saved = (await update.json()).job;
  assert.equal(saved.version, 2);
  const read = await (await fetch(`${base}/api/jobs`)).json();
  assert.equal(read.jobs.find((j) => j.id === job.id).notes, edited.notes);
  assert.equal((await call('PUT', edited)).status, 409);
  assert.equal((await call('POST', { company: 'Missing role' })).status, 400);
  assert.equal(
    (
      await call('POST', {
        role: 'X',
        company: 'Y',
        url: 'javascript:alert(1)',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        'POST',
        { role: 'X', company: 'Y' },
        { Origin: 'https://evil.example' },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        'POST',
        { role: 'X', company: 'Y' },
        { 'Content-Type': 'text/plain' },
      )
    ).status,
    415,
  );
  assert.equal(
    (await call('POST', { role: 'X', company: 'Y', notes: 'x'.repeat(45000) }))
      .status,
    413,
  );
  assert.equal(
    (await call('PUT', { ...saved, status: 'Archived' })).status,
    200,
  );
  const archive = await (await fetch(`${base}/api/jobs`)).json();
  assert.equal(archive.jobs.find((j) => j.id === job.id).status, 'Archived');
  const seed = initial.jobs.find(
    (j) => j.id === 'ozcare-business-systems-analyst',
  );
  const updatedSeed = await (
    await call('PUT', {
      ...seed,
      nextAction: 'Testing persistence of a seeded record',
    })
  ).json();
  const reread = await (await fetch(`${base}/api/jobs`)).json();
  assert.equal(
    reread.jobs.find((j) => j.id === seed.id).nextAction,
    'Testing persistence of a seeded record',
  );
  assert.equal(
    (await call('PUT', { ...seed, version: updatedSeed.job.version })).status,
    200,
  );
});
