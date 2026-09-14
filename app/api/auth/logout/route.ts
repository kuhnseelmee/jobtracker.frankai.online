import { clearedSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'This sign-out request must come from Career Tracker.' }, { status: 403 });
  return Response.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': clearedSessionCookie(),
      },
    },
  );
}
