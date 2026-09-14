'use client';

import {
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileCheck2,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Target,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildApplicationIntelligence } from '@/lib/intelligence';
import type { Job } from '@/lib/jobs';

function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BriefCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <article className="intelligence-card">
      <div className="intelligence-card-title">
        <span className="intelligence-icon">{icon}</span>
        <h3>{title}</h3>
        <Button
          aria-label={`Copy ${title}`}
          className="copy-button"
          onClick={copy}
          size="icon"
          type="button"
          variant="ghost"
        >
          {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
        </Button>
      </div>
      <p>{text}</p>
    </article>
  );
}

export default function ApplicationWorkspace({
  job,
  onClose,
  onEdit,
}: {
  job: Job;
  onClose: () => void;
  onEdit: () => void;
}) {
  const intelligence = buildApplicationIntelligence(job);
  const packageText = [
    `APPLICATION WORKSPACE · ${job.role} · ${job.company}`,
    '',
    'JOB DNA',
    intelligence.jobDna,
    '',
    'FIT MAP',
    intelligence.fitMap,
    '',
    'APPLICATION STRATEGY',
    intelligence.applicationStrategy,
    '',
    'EVIDENCE PLAN',
    intelligence.evidencePlan,
    '',
    'EMPLOYER RESEARCH',
    intelligence.employerBrief,
    '',
    'TRUTH AND CONFIDENCE CHECK',
    intelligence.truthCheck,
    '',
    'DOCUMENT QUALITY',
    intelligence.documentQuality,
    '',
    'INTERVIEW PACK',
    intelligence.interviewPack,
    '',
    'CAREER PATHWAY',
    intelligence.careerPathway,
    '',
    'APPLICATION PACK',
    intelligence.applicationPack,
  ].join('\n');
  const ready = intelligence.readiness.readyToApply;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="application-workspace sm:max-w-5xl">
        <DialogTitle className="workspace-title">
          <BrainCircuit /> Frank’s application workspace
        </DialogTitle>
        <DialogDescription>
          {job.role} · {job.company}. Use this as a preparation and review
          space; confirm all facts and personal claims before submitting.
        </DialogDescription>

        <section className="readiness-hero" aria-label="Application readiness">
          <div>
            <span className="workspace-kicker">APPLICATION READINESS</span>
            <strong>{intelligence.readiness.score}%</strong>
            <p>
              {ready
                ? 'Prepared enough for a final human review.'
                : 'A few essential pieces still need attention.'}
            </p>
          </div>
          <div className={`readiness-state ${ready ? 'ready' : 'review'}`}>
            {ready ? <CheckCircle2 /> : <TriangleAlert />}
            <span>{ready ? 'Ready for review' : 'Preparation needed'}</span>
          </div>
        </section>

        <section className="checkpoint-grid">
          {intelligence.readiness.checkpoints.map((item) => (
            <div className={`checkpoint ${item.complete ? 'complete' : ''}`} key={item.label}>
              {item.complete ? <CheckCircle2 /> : <XCircle />}
              <div>
                <strong>{item.label}</strong>
                {!item.complete && <p>{item.guidance}</p>}
              </div>
            </div>
          ))}
        </section>

        <section className="workspace-actions" aria-label="Workspace actions">
          <Button onClick={onEdit} type="button">
            <ClipboardCheck size={16} /> Edit application inputs
          </Button>
          <Button
            onClick={() =>
              download(
                `Application_workspace_${job.company}_${job.role}`
                  .replaceAll(/[^a-z0-9]+/gi, '_')
                  .replace(/^_|_$/g, '')
                  .concat('.txt'),
                packageText,
              )
            }
            type="button"
            variant="outline"
          >
            <Download size={16} /> Download application brief
          </Button>
        </section>

        <section className="intelligence-grid">
          <BriefCard icon={<Target size={18} />} text={intelligence.jobDna} title="Job listing DNA" />
          <BriefCard icon={<BrainCircuit size={18} />} text={intelligence.fitMap} title="Your fit map" />
          <BriefCard icon={<ClipboardCheck size={18} />} text={intelligence.applicationStrategy} title="Apply-or-skip strategy" />
          <BriefCard icon={<FileCheck2 size={18} />} text={intelligence.evidencePlan} title="Evidence bank and KSC plan" />
          <BriefCard icon={<ShieldCheck size={18} />} text={intelligence.employerBrief} title="Employer research brief" />
          <BriefCard icon={<ShieldCheck size={18} />} text={intelligence.truthCheck} title="Truth and confidence guardrail" />
          <BriefCard icon={<FileCheck2 size={18} />} text={intelligence.documentQuality} title="Resume and letter quality check" />
          <BriefCard icon={<MessageSquareText size={18} />} text={intelligence.interviewPack} title="Interview simulator and objections" />
          <BriefCard icon={<GraduationCap size={18} />} text={intelligence.careerPathway} title="Career pathway and skill gap" />
          <BriefCard icon={<FileCheck2 size={18} />} text={intelligence.applicationPack} title="Application pack and follow-up" />
        </section>
        <p className="workspace-footnote">
          This workspace uses the saved job listing details and Ray’s existing
          evidence. It does not browse employers, submit applications, or make
          claims on Ray’s behalf.
        </p>
      </DialogContent>
    </Dialog>
  );
}
