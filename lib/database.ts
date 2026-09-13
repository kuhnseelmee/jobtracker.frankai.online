import { env } from 'cloudflare:workers';
import { seedJobs } from './seed';
import type { Job } from './jobs';
export function getDb() {
  const db = (env as unknown as { DB: D1Database }).DB;
  if (!db) throw new Error('Database is unavailable.');
  return db;
}
export async function listJobs(): Promise<Job[]> {
  const db = getDb();
  const now = new Date().toISOString();
  await db.batch(
    seedJobs.map(({ id, version, ...data }) =>
      db
        .prepare(
          'INSERT OR IGNORE INTO jobs (id,data,version,created_at,updated_at) VALUES (?,?,?,?,?)',
        )
        .bind(id, JSON.stringify(data), version, now, now),
    ),
  );
  const { results } = await db
    .prepare('SELECT id,data,version FROM jobs ORDER BY created_at ASC,id ASC')
    .all<{ id: string; data: string; version: number }>();
  return results.map((r) => ({
    ...JSON.parse(r.data),
    id: r.id,
    version: r.version,
  }));
}
