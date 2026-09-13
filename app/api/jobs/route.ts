import { getDb, listJobs } from '@/lib/database';
import { validateJob } from '@/lib/jobs';
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  try {
    return json({ jobs: await listJobs() });
  } catch (e) {
    console.error('Job read failed', e);
    return json(
      { error: 'Unable to load your tracker. Please try again.' },
      503,
    );
  }
}
export async function POST(request: Request) {
  return write(request, false);
}
export async function PUT(request: Request) {
  return write(request, true);
}
async function write(request: Request, update: boolean) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'This request must come from your tracker.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return json({ error: 'Please send job details as JSON.' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 40000)
    return json({ error: 'Job details are too large.' }, 413);
  let raw: Record<string, unknown>;
  let data;
  let text = '';
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Job details are required.' }, 400);
    const decoder = new TextDecoder();
    let length = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 40000) {
        await reader.cancel();
        return json({ error: 'Job details are too large.' }, 413);
      }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return json({ error: 'Unable to read job details.' }, 400);
  }
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON. Please check your job details.' }, 400);
  }
  try {
    data = validateJob(raw);
    if (
      update &&
      (typeof raw.id !== 'string' ||
        !raw.id ||
        raw.id.length > 100 ||
        !Number.isInteger(raw.version) ||
        Number(raw.version) < 1)
    )
      throw new Error('A valid job and version are required.');
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Invalid job details.' },
      400,
    );
  }
  try {
    const db = getDb();
    const now = new Date().toISOString();
    if (update) {
      const result = await db
        .prepare(
          'UPDATE jobs SET data=?,version=version+1,updated_at=? WHERE id=? AND version=?',
        )
        .bind(JSON.stringify(data), now, raw.id, raw.version)
        .run();
      if (result.meta.changes === 0)
        return json(
          {
            error:
              'This job changed in another window. Close and reopen it to get the latest details.',
          },
          409,
        );
      return json({
        job: { ...data, id: raw.id, version: Number(raw.version) + 1 },
      });
    }
    const id = crypto.randomUUID();
    await db
      .prepare(
        'INSERT INTO jobs (id,data,version,created_at,updated_at) VALUES (?,?,1,?,?)',
      )
      .bind(id, JSON.stringify(data), now, now)
      .run();
    return json({ job: { ...data, id, version: 1 } }, 201);
  } catch (e) {
    console.error('Job save failed', e);
    return json(
      { error: 'Your changes were not saved. Please try again.' },
      503,
    );
  }
}
