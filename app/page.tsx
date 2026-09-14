import Tracker from './tracker';
import Login from './login';
import { headers } from 'next/headers';
import { getCookieHeaderSession } from '@/lib/auth-server';
import { listJobs } from '@/lib/database';
import type { Job } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let session;
  try {
    session = await getCookieHeaderSession((await headers()).get('cookie'));
  } catch (error) {
    console.error('Authentication check failed', error);
    return <Login />;
  }
  if (!session) return <Login />;
  let jobs: Job[] = [];
  let error = '';
  try {
    jobs = await listJobs();
  } catch (e) {
    console.error('Initial tracker load failed', e);
    error = 'Your saved jobs could not be loaded. Please retry.';
  }
  return <Tracker initialJobs={jobs} initialError={error} user={session} />;
}
