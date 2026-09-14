export const roles = ['administrator', 'guest'] as const;
export type Role = (typeof roles)[number];
export type AuthSession = {
  email: string;
  role: Role;
  expiresAt: number;
};
export type AuthSecrets = {
  adminPassword: string;
  guestPassword: string;
};

export const sessionCookieName = 'career_tracker_session';
const sessionLifetimeSeconds = 60 * 60 * 12;

function encode(value: Uint8Array) {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decode(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function equals(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1)
    difference |= left[index] ^ right[index];
  return difference === 0;
}

async function signingKey(secrets: AuthSecrets) {
  const source = new TextEncoder().encode(
    `${secrets.adminPassword}:${secrets.guestPassword}`,
  );
  const digest = await crypto.subtle.digest('SHA-256', source);
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signature(input: string, secrets: AuthSecrets) {
  return new Uint8Array(
    await crypto.subtle.sign('HMAC', await signingKey(secrets), new TextEncoder().encode(input)),
  );
}

async function passwordMatches(value: string, expected: string) {
  const encoder = new TextEncoder();
  const [provided, saved] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(value)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return equals(new Uint8Array(provided), new Uint8Array(saved));
}

export async function authenticate(
  email: string,
  password: string,
  secrets: AuthSecrets,
): Promise<Pick<AuthSession, 'email' | 'role'> | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const candidates: Array<{ email: string; password: string; role: Role }> = [
    {
      email: 'admin@jobtracker.frankai.online',
      password: secrets.adminPassword,
      role: 'administrator',
    },
    {
      email: 'guest@jobtracker.frankai.online',
      password: secrets.guestPassword,
      role: 'guest',
    },
  ];
  const matched = candidates.find((candidate) => candidate.email === normalizedEmail);
  if (!matched || !(await passwordMatches(password, matched.password))) return null;
  return { email: matched.email, role: matched.role };
}

export async function createSession(
  user: Pick<AuthSession, 'email' | 'role'>,
  secrets: AuthSecrets,
  now = Math.floor(Date.now() / 1000),
) {
  const payload: AuthSession = { ...user, expiresAt: now + sessionLifetimeSeconds };
  const encodedPayload = encode(new TextEncoder().encode(JSON.stringify(payload)));
  const signed = `${encodedPayload}.${encode(await signature(encodedPayload, secrets))}`;
  return { value: signed, expiresAt: payload.expiresAt };
}

export async function readSession(
  value: string | undefined,
  secrets: AuthSecrets,
  now = Math.floor(Date.now() / 1000),
): Promise<AuthSession | null> {
  if (!value) return null;
  const [encodedPayload, encodedSignature, extra] = value.split('.');
  if (!encodedPayload || !encodedSignature || extra) return null;
  try {
    const expected = await signature(encodedPayload, secrets);
    if (!equals(decode(encodedSignature), expected)) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode(encodedPayload))) as AuthSession;
    if (
      !payload ||
      typeof payload.email !== 'string' ||
      !(roles as readonly string[]).includes(payload.role) ||
      !Number.isInteger(payload.expiresAt) ||
      payload.expiresAt <= now
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieValue(header: string | null, name: string) {
  if (!header) return undefined;
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function sessionCookie(value: string, expiresAt: number) {
  return `${sessionCookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, expiresAt - Math.floor(Date.now() / 1000))}`;
}

export function clearedSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
