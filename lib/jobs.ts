export const statuses = [
  'Saved',
  'Preparing',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Archived',
] as const;
export const priorities = ['Not set', 'High', 'Medium', 'Low'] as const;
export type JobData = ReturnType<typeof blankJob>;
export type Job = JobData & { id: string; version: number };
export function blankJob() {
  return {
    role: '',
    company: '',
    industry: '',
    location: '',
    employment: '',
    salary: '',
    contact: '',
    url: '',
    deadline: '',
    deadlineNote: '',
    applied: '',
    followUp: '',
    latestReply: '',
    status: 'Saved',
    priority: 'Not set',
    requirements: '',
    why: '',
    notes: '',
    nextAction: '',
    checkedAt: '',
  };
}
export function validateJob(input: unknown): JobData {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Please provide job details.');
  const raw = input as Record<string, unknown>;
  const result = Object.fromEntries(
    Object.entries(blankJob()).map(([key, def]) => {
      const value = raw[key] ?? def;
      if (typeof value !== 'string') throw new Error(`${key} must be text.`);
      if (
        value.length >
        (['requirements', 'why', 'notes'].includes(key) ? 10000 : 1000)
      )
        throw new Error(`${key} is too long.`);
      return [key, value.trim()];
    }),
  ) as JobData;
  if (!result.role) throw new Error('A role title is required.');
  if (!result.company) throw new Error('A company name is required.');
  if (!(statuses as readonly string[]).includes(result.status))
    throw new Error('Choose a valid application stage.');
  if (!(priorities as readonly string[]).includes(result.priority))
    throw new Error('Choose a valid priority.');
  for (const key of [
    'deadline',
    'applied',
    'followUp',
    'latestReply',
    'checkedAt',
  ] as const) {
    const v = result[key];
    if (
      v &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
        !Number.isFinite(Date.parse(v)) ||
        new Date(v).toISOString().slice(0, 10) !== v)
    )
      throw new Error(`Choose a valid ${key} date.`);
  }
  if (result.url) {
    try {
      const u = new URL(result.url);
      if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password)
        throw new Error();
    } catch {
      throw new Error('Listing link must be an http or https URL.');
    }
  }
  return result;
}
export function todayBrisbane() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export function daysUntil(date: string, today: string) {
  return date
    ? Math.round((Date.parse(date) - Date.parse(today)) / 86400000)
    : null;
}
export function displayDate(date: string) {
  return date
    ? new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(date))
    : 'Not set';
}
export function reminders(jobs: Job[], today: string) {
  return jobs
    .filter((j) => !['Archived', 'Rejected', 'Withdrawn'].includes(j.status))
    .flatMap((job) => {
      const result: { job: Job; date: string; kind: string; days: number }[] =
        [];
      if (job.deadline && ['Saved', 'Preparing'].includes(job.status))
        result.push({
          job,
          date: job.deadline,
          kind: 'Application deadline',
          days: daysUntil(job.deadline, today)!,
        });
      if (job.followUp)
        result.push({
          job,
          date: job.followUp,
          kind: 'Follow-up',
          days: daysUntil(job.followUp, today)!,
        });
      return result;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function toCsv(jobs: Job[]) {
  const keys = Object.keys(blankJob()) as (keyof JobData)[];
  const cell = (v: string) =>
    `"${(/^[=+@\-\t\r]/.test(v) ? "'" + v : v).replaceAll('"', '""')}"`;
  return [
    keys.join(','),
    ...jobs.map((j) => keys.map((k) => cell(j[k])).join(',')),
  ].join('\r\n');
}
