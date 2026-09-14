import { env } from 'cloudflare:workers';
import {
  cookieValue,
  readSession,
  sessionCookieName,
  type AuthSecrets,
} from './auth';

export function getAuthSecrets(): AuthSecrets {
  const values = env as unknown as Record<string, unknown>;
  const adminPassword = values.admin_login_pass;
  const guestPassword = values.guest_login_pass;
  if (
    typeof adminPassword !== 'string' ||
    !adminPassword ||
    typeof guestPassword !== 'string' ||
    !guestPassword
  )
    throw new Error('Authentication is not configured.');
  return { adminPassword, guestPassword };
}

export async function getRequestSession(request: Request) {
  return readSession(
    cookieValue(request.headers.get('cookie'), sessionCookieName),
    getAuthSecrets(),
  );
}

export async function getCookieHeaderSession(cookieHeader: string | null) {
  return readSession(cookieValue(cookieHeader, sessionCookieName), getAuthSecrets());
}
