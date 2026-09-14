'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  BriefcaseBusiness,
  Plus,
  Search,
  CalendarDays,
  ArrowRight,
  Check,
  ShieldCheck,
  Flag,
  Sparkles,
  LogOut,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import JobEditor, { Choice } from './job-editor';
import ApplicationWorkspace from './application-workspace';
import ImportJob from './import-job';
import {
  blankJob,
  validateJob,
  statuses,
  reminders,
  todayBrisbane,
  displayDate,
  daysUntil,
  toCsv,
  type Job,
  type JobData,
} from '@/lib/jobs';

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function calendar(job: Job, date: string, kind: string) {
  const escape = (s: string) =>
    s
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(',', '\\,')
      .replaceAll(';', '\\;');
  const start = new Date(`${date}T09:00:00+10:00`)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('.000', '');
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('.000', '');
  download(
    'career-reminder.ics',
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Career Tracker//EN',
      'BEGIN:VEVENT',
      `UID:${job.id}-${date}-${kind.replaceAll(' ', '-')}@career-tracker`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `SUMMARY:${escape(kind + ' · ' + job.company)}`,
      `DESCRIPTION:${escape(job.role + '\n' + job.nextAction + '\n' + job.url)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Job search reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'),
    'text/calendar',
  );
}
export default function Tracker({
  initialJobs,
  initialError = '',
  user,
}: {
  initialJobs: Job[];
  initialError?: string;
  user: { email: string; role: 'administrator' | 'guest' };
}) {
  const canEdit = user.role === 'administrator';
  const [jobs, setJobs] = useState(initialJobs),
    [error, setError] = useState(initialError),
    [notice, setNotice] = useState(''),
    [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Job | JobData | null>(null),
    [workspaceJob, setWorkspaceJob] = useState<Job | null>(null),
    [importing, setImporting] = useState(false),
    [query, setQuery] = useState(''),
    [stage, setStage] = useState('All active'),
    [sort, setSort] = useState('Recently saved'),
    [tab, setTab] = useState('opportunities');
  const openEditor = (job: Job | JobData) => {
    if (!canEdit) {
      setNotice('Guest access is read-only.');
      return;
    }
    setEditing(job);
  };
  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/');
  }
  const [today, setToday] = useState(todayBrisbane);
  useEffect(() => {
    const t = setInterval(() => setToday(todayBrisbane()), 60000);
    return () => clearInterval(t);
  }, []);
  async function reload() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/jobs');
      const d = (await r.json()) as { jobs: Job[]; error?: string };
      if (!r.ok) throw new Error(d.error);
      setJobs(d.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  }
  async function save(draft: Job | JobData) {
    const data = validateJob(draft);
    const existing = 'id' in draft;
    const r = await fetch('/api/jobs', {
      method: existing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        existing ? { ...data, id: draft.id, version: draft.version } : data,
      ),
    });
    const result = (await r.json()) as { job: Job; error?: string };
    if (!r.ok) {
      if (r.status === 409) await reload();
      throw new Error(result.error || 'Unable to save your changes.');
    }
    setJobs((old) =>
      existing
        ? old.map((j) => (j.id === result.job.id ? result.job : j))
        : [...old, result.job],
    );
    setNotice(`${result.job.company} saved.`);
    return result.job as Job;
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  // A small optional agent surface uses the same validation and save path as the form.
  useEffect(() => {
    type Context = {
      registerTool: (
        tool: unknown,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => console.warn('Tracker tools could not register.'));
      } catch {
        console.warn('Tracker tools unavailable.');
      }
    };
    register({
      name: 'list_job_opportunities',
      description: 'Read the saved job opportunities in this tracker.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const r = await fetch('/api/jobs');
        if (!r.ok) throw new Error('Unable to load jobs.');
        return r.json();
      },
    });
    if (canEdit) register({
      name: 'save_new_job_opportunity',
      description:
        'Create a saved job opportunity. Does not send a job application or contact an employer.',
      inputSchema: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          company: { type: 'string' },
          url: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['role', 'company'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (input: unknown) => {
        if (!input || typeof input !== 'object' || Array.isArray(input))
          throw new Error('Job details required.');
        const allowed = ['role', 'company', 'url', 'notes'];
        if (Object.keys(input).some((k) => !allowed.includes(k)))
          throw new Error('Unsupported field.');
        const job = await save({ ...blankJob(), ...input });
        return {
          id: job.id,
          company: job.company,
          role: job.role,
          status: job.status,
        };
      },
    });
    return () => lifecycle.abort();
    // The save path uses functional state updates, so these tools do not need to re-register.
  }, [canEdit]);
  const active = jobs.filter((j) => j.status !== 'Archived');
  const actions = useMemo(() => reminders(jobs, today), [jobs, today]);
  const shown = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            (stage === 'All active'
              ? j.status !== 'Archived'
              : j.status === stage) &&
            `${j.company} ${j.role} ${j.location} ${j.industry}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .toSorted((a, b) =>
          sort === 'Company'
            ? a.company.localeCompare(b.company)
            : sort === 'Priority'
              ? ['High', 'Medium', 'Low', 'Not set'].indexOf(a.priority) -
                ['High', 'Medium', 'Low', 'Not set'].indexOf(b.priority)
              : sort === 'Deadline'
                ? (a.deadline || '9999').localeCompare(b.deadline || '9999')
                : jobs.indexOf(b) - jobs.indexOf(a),
        ),
    [jobs, stage, query, sort],
  );
  const stats = [
    [
      String(
        active.filter((j) => ['Saved', 'Preparing'].includes(j.status)).length,
      ),
      'Saved & preparing',
    ],
    [
      String(
        jobs.filter(
          (j) =>
            j.applied ||
            ['Applied', 'Interview', 'Offer', 'Rejected'].includes(j.status),
        ).length,
      ),
      'Applications sent',
    ],
    [
      String(active.filter((j) => j.status === 'Interview').length),
      'At interview',
    ],
    [String(actions.filter((a) => a.days <= 7).length), 'Overdue & due soon'],
  ];
  return (
    <main className="workspace">
      <header className="topbar">
        <div className="brand">
          <BriefcaseBusiness /> Career Tracker
        </div>
        <span className="private-label">
          <ShieldCheck size={15} /> {user.role === 'administrator' ? 'Administrator' : 'Guest · read-only'}
        </span>
        <Button className="signout-button" onClick={signOut} size="sm" variant="ghost">
          <LogOut size={15} /> Sign out
        </Button>
      </header>
      <section className="page">
        <div className="eyebrow">YOUR NEXT CHAPTER</div>
        <div className="heading">
          <div>
            <h1>
              Good opportunities.
              <br />
              <span>A clear next step.</span>
            </h1>
            <p>Keep your search organised, from the first save to the offer.</p>
          </div>
          <div className="heading-actions">
            {canEdit && (
              <Button
                className="import-button"
                variant="outline"
                onClick={() => setImporting(true)}
              >
                <Link2 size={17} /> Import from URL
              </Button>
            )}
            <Button className="add-button" disabled={!canEdit} onClick={() => openEditor(blankJob())}>
              <Plus size={18} /> Add opportunity
            </Button>
          </div>
        </div>
        <div className="metrics">
          {stats.map(([n, t], i) => (
            <div key={t}>
              <div className="metric-top">
                <strong>{n.padStart(2, '0')}</strong>
                <span className={`metric-dot dot-${i}`} />
              </div>
              <span>{t}</span>
            </div>
          ))}
        </div>
        <div className="view-bar">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="view-tabs">
              <TabsTrigger value="opportunities">
                <BriefcaseBusiness size={16} /> Opportunities
              </TabsTrigger>
              <TabsTrigger value="actions">
                <CalendarDays size={16} /> Next actions{' '}
                <span className="count">{actions.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            onClick={() =>
              download(
                'job-applications.csv',
                toCsv(jobs),
                'text/csv;charset=utf-8',
              )
            }
            disabled={!jobs.length}
          >
            <ArrowDownToLine size={16} /> Export CSV
          </Button>
        </div>
        {error && (
          <div role="alert" className="error-banner">
            {error}
            <Button variant="outline" onClick={reload} disabled={loading}>
              {loading ? 'Loading…' : 'Retry'}
            </Button>
          </div>
        )}
        {loading && <Skeleton className="h-24 mb-5" />}
        {tab === 'opportunities' ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  My opportunities <span className="count">{shown.length}</span>
                </h2>
                <p className="subtext">
                  Build a shortlist. Make every application count.
                </p>
              </div>
            </div>
            <div className="filters">
              <div className="search">
                <Search size={18} />
                <Input
                  aria-label="Search opportunities"
                  placeholder="Search role, company or location"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 shadow-none h-11 pl-10 text-base"
                />
              </div>
              <Choice
                id="filter-stage"
                label="Stage"
                value={stage}
                options={['All active', ...statuses]}
                onChange={setStage}
              />
              <Choice
                id="sort"
                label="Sort by"
                value={sort}
                options={['Recently saved', 'Company', 'Priority', 'Deadline']}
                onChange={setSort}
              />
            </div>
            {shown.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ROLE & COMPANY</TableHead>
                    <TableHead>STAGE</TableHead>
                    <TableHead>PRIORITY</TableHead>
                    <TableHead>DEADLINE</TableHead>
                    <TableHead>
                      <span className="sr-only">Open details</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((job, i) => (
                    <TableRow key={job.id} className="job-row">
                      <TableCell>
                        <div className="job-main">
                          <span
                            className={`company-icon company-${i % 3}`}
                            aria-hidden="true"
                          >
                            {job.company === 'Ozcare'
                              ? 'OZ'
                              : job.company === 'MediaForm Pty Ltd'
                                ? 'MF'
                                : job.company.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <button
                              className="role-link"
                              onClick={() => openEditor(job)}
                            >
                              {job.role}
                            </button>
                            <p>{job.company}</p>
                            <small>{job.location || 'Location not set'}</small>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`stage stage-${job.status.toLowerCase()}`}
                        >
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`priority priority-${job.priority.toLowerCase().replace(' ', '-')}`}
                        >
                          <Flag size={13} />
                          {job.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        {job.deadline ? (
                          <>
                            <span>{displayDate(job.deadline)}</span>
                            <p
                              className={
                                daysUntil(job.deadline, today)! < 0
                                  ? 'deadline-warning'
                                  : ''
                              }
                            >
                              {daysUntil(job.deadline, today)! < 0
                                ? 'Date passed'
                                : daysUntil(job.deadline, today) === 0
                                  ? 'Today'
                                  : `${daysUntil(job.deadline, today)} days away`}
                            </p>
                          </>
                        ) : (
                          <span
                            className="deadline-warning"
                            title={job.deadlineNote}
                          >
                            {job.deadlineNote ? 'Confirm date' : 'Not set'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="row-actions">
                          <Button
                            aria-label={`Open application workspace for ${job.company}`}
                            className="workspace-button"
                            onClick={() => setWorkspaceJob(job)}
                            size="sm"
                            variant="outline"
                          >
                            <Sparkles size={15} /> Workspace
                          </Button>
                          <Button
                            aria-label={`Edit ${job.company} opportunity`}
                            variant="ghost"
                            size="icon"
                            disabled={!canEdit}
                            onClick={() => openEditor(job)}
                          >
                            <ArrowUpRight size={20} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="empty-state">
                <BriefcaseBusiness />
                <h3>
                  {jobs.length
                    ? 'No matching opportunities'
                    : 'Start your shortlist'}
                </h3>
                <p>
                  {jobs.length
                    ? 'Try a different search or application stage.'
                    : 'Add a job to track your next career move.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setStage('All active');
                    if (!jobs.length) openEditor(blankJob());
                  }}
                >
                  {jobs.length ? 'Clear filters' : canEdit ? 'Add opportunity' : 'Guest access is read-only'}
                </Button>
              </div>
            )}
            <div className="table-footer">
              <span>
                {shown.length} of {jobs.length} opportunities
              </span>
              <span>Open any role to edit details and track progress.</span>
            </div>
          </section>
        ) : (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Your next steps</h2>
                <p className="subtext">
                  Application deadlines and follow-ups · Brisbane time
                </p>
              </div>
            </div>
            {actions.length ? (
              <div className="actions-list">
                {actions.map((a) => (
                  <div className="action-row" key={`${a.job.id}-${a.kind}`}>
                    <div className={`day-chip ${a.days <= 0 ? 'urgent' : ''}`}>
                      <strong>
                        {a.days < 0
                          ? Math.abs(a.days)
                          : a.days === 0
                            ? '!'
                            : a.days}
                      </strong>
                      <span>
                        {a.days < 0
                          ? 'days overdue'
                          : a.days === 0
                            ? 'today'
                            : 'days away'}
                      </span>
                    </div>
                    <div className="action-info">
                      <span className="action-kind">
                        {a.kind} · {displayDate(a.date)}
                      </span>
                      <button disabled={!canEdit} onClick={() => openEditor(a.job)}>
                        {a.job.company}
                      </button>
                      <p>{a.job.nextAction || a.job.role}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => calendar(a.job, a.date, a.kind)}
                    >
                      <CalendarDays size={16} /> Calendar
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={!canEdit}
                      onClick={() => openEditor(a.job)}
                      aria-label={`Edit reminder for ${a.job.company}`}
                    >
                      <ArrowRight size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CalendarDays />
                <h3>Make space for your next move.</h3>
                <p>
                  Set a deadline or follow-up date on a job and it will appear
                  here.
                </p>
                <Button
                  onClick={() => {
                    if (active[0]) openEditor(active[0]);
                    else openEditor(blankJob());
                  }}
                >
                  Set your first reminder
                </Button>
              </div>
            )}
            <div className="reminder-note">
              Reminders are shown here when you open the tracker. Use Calendar
              to add an alert to your calendar app.
            </div>
          </section>
        )}
        <div className="lower-grid">
          <section className="next-card">
            <div className="mini-title">
              <Sparkles size={17} /> A LITTLE PREPARATION
            </div>
            <h2>Find the fit. Tell your story.</h2>
            <p>
              Match your experience to the criteria, tailor your résumé and
              record the next action before you apply.
            </p>
            <div className="steps">
              <span>
                <Check /> Review the role
              </span>
              <span>
                <Check /> Tailor your application
              </span>
              <span>
                <Check /> Plan a follow-up
              </span>
            </div>
            {active[0] && (
              <Button
                className="open-workspace"
                onClick={() => setWorkspaceJob(active[0])}
                variant="outline"
              >
                <Sparkles size={16} /> Open Frank’s application workspace
              </Button>
            )}
          </section>
          <aside className="source-card">
            <ShieldCheck size={21} />
            <h3>Your research, kept together.</h3>
            <p>
              Anglicare, Ozcare and MediaForm were checked on 14 September 2026.
              Read the source listing before applying; availability can change.
            </p>
            <p className="source-note">
              Ozcare’s closing date needs confirmation.
            </p>
          </aside>
        </div>
        <footer className="page-footer">
          <span>Career Tracker · One step closer.</span>
          <span>{displayDate(today)} · Brisbane</span>
        </footer>
      </section>
        {editing && (
          <JobEditor
          key={'id' in editing ? `${editing.id}-${editing.version}` : 'new'}
          job={editing}
          onClose={() => setEditing(null)}
          onSave={async (d) => {
            await save(d);
          }}
          />
        )}
        {workspaceJob && (
          <ApplicationWorkspace
            job={workspaceJob}
            onClose={() => setWorkspaceJob(null)}
            canEdit={canEdit}
            onEdit={() => {
              setWorkspaceJob(null);
              openEditor(workspaceJob);
            }}
          />
        )}
        {importing && (
          <ImportJob
            onClose={() => setImporting(false)}
            onUseDraft={(draft) => {
              setImporting(false);
              openEditor(draft);
            }}
          />
        )}
      {notice && (
        <output className="saved-toast">
          <Check size={17} />
          {notice}
        </output>
      )}
    </main>
  );
}
