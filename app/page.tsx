import Tracker from './tracker';
import { listJobs } from '@/lib/database';
import type { Job } from '@/lib/jobs';
export default async function Home() {
  let jobs: Job[] = [];
  let error = '';
  try {
    jobs = await listJobs();
  } catch (e) {
    console.error('Initial tracker load failed', e);
    error = 'Your saved jobs could not be loaded. Please retry.';
  }
  return <Tracker initialJobs={jobs} initialError={error} />;
}
