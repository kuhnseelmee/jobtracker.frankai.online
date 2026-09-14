import { getRequestSession } from '@/lib/auth-server';
import { extractJobListing, validateImportUrl } from '@/lib/job-import';

const maxUrlLength = 2000;
const maxListingBytes = 1_500_000;
const fetchTimeoutMs = 12_000;
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

async function readListing(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html'))
    throw new Error('That link did not return a readable HTML job listing.');
  const length = Number(response.headers.get('content-length') || 0);
  if (length > maxListingBytes) throw new Error('That job listing is too large to import.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The job listing could not be read.');
  const decoder = new TextDecoder();
  let received = 0;
  let html = '';
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    received += part.value.byteLength;
    if (received > maxListingBytes) {
      await reader.cancel();
      throw new Error('That job listing is too large to import.');
    }
    html += decoder.decode(part.value, { stream: true });
  }
  return html + decoder.decode();
}

async function fetchListing(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
  try {
    return await fetch(url, {
      redirect: 'manual',
      headers: { Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('The job listing took too long to respond. Try the link again later.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session) return json({ error: 'Please sign in to import a job listing.' }, 401);
    if (session.role !== 'administrator') return json({ error: 'Guest access is read-only.' }, 403);
  } catch (error) {
    console.error('Authentication check failed', error);
    return json({ error: 'Authentication is temporarily unavailable.' }, 503);
  }
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'This import request must come from Career Tracker.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return json({ error: 'Please provide a job listing URL.' }, 415);
  let submittedUrl: unknown;
  try {
    const body: unknown = await request.json();
    submittedUrl =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as { url?: unknown }).url
        : undefined;
  } catch {
    return json({ error: 'Please provide a valid job listing URL.' }, 400);
  }
  if (typeof submittedUrl !== 'string' || submittedUrl.length > maxUrlLength)
    return json({ error: 'Please provide a valid job listing URL.' }, 400);
  let url: URL;
  try {
    url = validateImportUrl(submittedUrl);
    const visited = new Set<string>();
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      if (visited.has(url.toString())) throw new Error('The job listing redirected in a loop.');
      visited.add(url.toString());
      const response = await fetchListing(url);
      if (response.status < 300 || response.status >= 400) {
        if (!response.ok) throw new Error(`The job listing returned ${response.status}.`);
        return json({ imported: extractJobListing(await readListing(response), url.toString()) });
      }
      const next = response.headers.get('location');
      if (!next) throw new Error('The listing redirected without a destination.');
      url = validateImportUrl(new URL(next, url).toString());
    }
    throw new Error('The job listing redirected too many times.');
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to import this job listing.' }, 422);
  }
}
