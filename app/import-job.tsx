'use client';

import { useState } from 'react';
import { ArrowUpRight, Link2, LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ImportedJob } from '@/lib/job-import';
import type { JobData } from '@/lib/jobs';

type ImportResponse = { imported?: ImportedJob; error?: string };

export default function ImportJob({
  onClose,
  onUseDraft,
}: {
  onClose: () => void;
  onUseDraft: (draft: JobData) => void;
}) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ImportedJob | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const body = (await response.json()) as ImportResponse;
      if (!response.ok || !body.imported)
        throw new Error(body.error || 'The listing could not be imported.');
      setResult(body.imported);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The listing could not be imported. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="import-dialog" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle className="import-title">
            <Link2 size={20} /> Import a job listing
          </DialogTitle>
          <DialogDescription>
            Paste a public HTTPS job-listing link. Career Tracker reads the
            listing and creates an editable draft; nothing is saved until you
            review it and choose Save.
          </DialogDescription>
        </DialogHeader>
        <form className="import-form" onSubmit={submit}>
          <label htmlFor="job-listing-url">Job listing URL</label>
          <Input
            id="job-listing-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://careers.example.com/jobs/…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            maxLength={2000}
            disabled={busy}
          />
          <p className="import-hint">
            Public pages only. Links that need a login, solve a CAPTCHA, or
            load an unsupported page cannot be imported.
          </p>
          <Button className="import-submit" disabled={busy} type="submit">
            {busy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
            {busy ? 'Reading listing…' : 'Create draft'}
          </Button>
        </form>
        {error && <p className="import-error" role="alert">{error}</p>}
        {result && (
          <section className="import-preview" aria-live="polite">
            <div className="import-preview-heading">
              <div>
                <span className="eyebrow">IMPORT PREVIEW</span>
                <h3>{result.draft.role || 'Job title needs review'}</h3>
                <p>{result.summary}</p>
              </div>
              <a
                className="import-source-link"
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="import-field-list">
              {result.fields.map((field) => (
                <div className="import-field" key={field.label}>
                  <span>{field.label}</span>
                  <strong>{field.value || 'Not found'}</strong>
                  <small className={`import-confidence ${field.confidence}`}>
                    {field.confidence === 'listing'
                      ? 'From listing'
                      : field.confidence === 'inferred'
                        ? 'Inferred — check it'
                        : 'Needs your input'}
                  </small>
                </div>
              ))}
            </div>
            <p className="import-review-note">
              Check the source, especially the company, closing date, and
              requirements. Complete any missing title or company before
              saving.
            </p>
          </section>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {result && (
            <Button type="button" onClick={() => onUseDraft(result.draft)}>
              Review editable draft <ArrowUpRight size={16} />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
