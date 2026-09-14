'use client';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { statuses, priorities, type Job, type JobData } from '@/lib/jobs';
import { generateWorkshop } from '@/lib/workshop';
export function Choice({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="field">
      <label id={`${id}-label`}>{label}</label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) onChange(v);
        }}
      >
        <SelectTrigger
          aria-labelledby={`${id}-label`}
          className="w-full h-10 bg-white"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export default function JobEditor({
  job,
  onClose,
  onSave,
}: {
  job: Job | JobData;
  onClose: () => void;
  onSave: (job: Job | JobData) => Promise<void>;
}) {
  const withGeneratedWorkshop = (source: Job | JobData) => {
    const generated = generateWorkshop(source);
    return {
      ...source,
      starResponses: source.starResponses || generated.starResponses,
      keySelectionCriteria:
        source.keySelectionCriteria || generated.keySelectionCriteria,
      employerResearch: source.employerResearch || generated.employerResearch,
      coverLetterWorkshop:
        source.coverLetterWorkshop || generated.coverLetterWorkshop,
    };
  };
  const [draft, setDraft] = useState(() => withGeneratedWorkshop(job));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof JobData, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave(draft);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to save. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  function field(
    key: keyof JobData,
    label: string,
    type = 'text',
    required = false,
  ) {
    return (
      <div className="field" key={key}>
        <label htmlFor={key}>
          {label}
          {required ? ' *' : ''}
        </label>
        <Input
          id={key}
          type={type}
          value={draft[key]}
          required={required}
          maxLength={1000}
          onChange={(e) => set(key, e.target.value)}
          className="h-10 text-base"
        />
      </div>
    );
  }
  function area(key: keyof JobData, label: string, placeholder = '') {
    return (
      <div className="field full" key={key}>
        <label htmlFor={key}>{label}</label>
        <Textarea
          id={key}
          value={draft[key]}
          maxLength={10000}
          placeholder={placeholder}
          onChange={(e) => set(key, e.target.value)}
          className="min-h-24 text-base"
        />
      </div>
    );
  }
  function generateApplicationWorkshop() {
    setDraft((d) => ({ ...d, ...generateWorkshop(d) }));
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="editor sm:max-w-3xl" showCloseButton={!busy}>
        <DialogTitle className="text-2xl font-semibold">
          {'id' in job ? 'Opportunity details' : 'Add an opportunity'}
        </DialogTitle>
        <DialogDescription>
          Keep the listing, your preparation and next steps in one place.
        </DialogDescription>
        {job.url && /^https?:\/\//.test(job.url) && (
          <a
            className="listing-link"
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original job listing ↗
          </a>
        )}
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <div className="editor-body">
              <div className="form-grid">
                {field('role', 'Job title', 'text', true)}
                {field('company', 'Company', 'text', true)}
                <Choice
                  id="status"
                  label="Application stage"
                  value={draft.status}
                  options={statuses}
                  onChange={(v) => set('status', v)}
                />
                <Choice
                  id="priority"
                  label="My priority"
                  value={draft.priority}
                  options={priorities}
                  onChange={(v) => set('priority', v)}
                />
                {field('location', 'Location')}
                {field('industry', 'Industry')}
                {field('employment', 'Work type / arrangement')}
                {field('salary', 'Salary / benefits')}
                {field('contact', 'Contact person, email or phone')}
                {field('url', 'Job listing URL', 'url')}
              </div>
              <h3>Dates & next steps</h3>
              <div className="form-grid">
                {field('deadline', 'Application deadline', 'date')}
                {field('followUp', 'Follow-up date', 'date')}
                {field('applied', 'Date applied', 'date')}
                {field('latestReply', 'Latest reply', 'date')}
                <div className="full">
                  {field('deadlineNote', 'Closing date notes')}
                </div>
                <div className="full">
                  {field('nextAction', 'My next action')}
                </div>
              </div>
              <p className="form-help">
                Reminders appear in Next actions. Download a calendar reminder
                there for alerts in your calendar.
              </p>
              <h3>Make the application yours</h3>
              <div className="form-grid">
                {area('requirements', 'Requirements / selection criteria')}
                {area('why', 'Why this role appeals to me')}
                {area(
                  'notes',
                  'Application notes',
                  'Résumé version, cover letter, interview notes or feedback…',
                )}
                {field('checkedAt', 'Listing last checked', 'date')}
              </div>
              <div className="workshop-head">
                <div>
                  <h3>Frank’s application workshop</h3>
                  <p className="form-help">
                    Generated from this job’s listing details, employer and your
                    saved experience notes. Edit anything before using it.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateApplicationWorkshop}
                >
                  <Sparkles size={16} /> Generate with Frank
                </Button>
              </div>
              <div className="form-grid">
                {area('starResponses', 'STAR responses')}
                {area('keySelectionCriteria', 'Key selection criteria')}
                {area('employerResearch', 'Employer research')}
                {area('coverLetterWorkshop', 'Cover letter workshop')}
              </div>
            </div>
            <div className="editor-footer">
              {error && (
                <p role="alert" className="error full">
                  {error}
                </p>
              )}
              <p className="form-help">
                Changes are saved when you select Save.
              </p>
              <div>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving…' : 'Save opportunity'}
                </Button>
              </div>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
