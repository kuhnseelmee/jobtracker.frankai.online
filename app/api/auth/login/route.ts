import { authenticate, createSession, sessionCookie } from '@/lib/auth';
import { getAuthSecrets } from '@/lib/auth-server';

const json = (value: unknown, status = 200, headers?: HeadersInit) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Cache-Control', 'no-store');
  return Response.json(value, { status, headers: responseHeaders });
};

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'This sign-in request must come from Career Tracker.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return json({ error: 'Please provide sign-in details.' }, 415);
  let input: { email?: unknown; password?: unknown };
  try {
    input = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return json({ error: 'Please provide valid sign-in details.' }, 400);
  }
  if (
    typeof input.email !== 'string' ||
    input.email.length > 200 ||
    typeof input.password !== 'string' ||
    input.password.length > 256
  )
    return json({ error: 'Please provide valid sign-in details.' }, 400);
  try {
    const user = await authenticate(input.email, input.password, getAuthSecrets());
    if (!user) return json({ error: 'Email or password is incorrect.' }, 401);
    const session = await createSession(user, getAuthSecrets());
    return json(
      { user: { email: user.email, role: user.role } },
      200,
      { 'Set-Cookie': sessionCookie(session.value, session.expiresAt) },
    );
  } catch (error) {
    console.error('Authentication configuration error', error);
    return json({ error: 'Sign-in is temporarily unavailable. Please try again.' }, 503);
  }
}
