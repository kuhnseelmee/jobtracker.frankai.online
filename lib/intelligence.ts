import { daysUntil, todayBrisbane, type JobData } from './jobs';

type Checkpoint = {
  label: string;
  complete: boolean;
  guidance: string;
};

export type ApplicationIntelligence = {
  readiness: {
    score: number;
    readyToApply: boolean;
    checkpoints: Checkpoint[];
    blockers: string[];
  };
  jobDna: string;
  fitMap: string;
  applicationStrategy: string;
  evidencePlan: string;
  employerBrief: string;
  truthCheck: string;
  deadlineRisk: string;
  documentQuality: string;
  interviewPack: string;
  careerPathway: string;
  applicationPack: string;
};

function hasText(value: string) {
  return value.trim().length > 20;
}

function isSalesRole(job: JobData) {
  return /sales|account|business development/i.test(
    `${job.role} ${job.industry} ${job.requirements}`,
  );
}

function roleLens(job: JobData) {
  if (isSalesRole(job))
    return 'customer discovery, practical technology advice, account follow-up and commercially aware communication';
  return 'requirements discovery, workflow analysis, stakeholder communication, documentation, testing and practical system improvement';
}

function keywordSignals(job: JobData) {
  const source = `${job.requirements} ${job.role}`.toLowerCase();
  const candidates = [
    'process mapping',
    'stakeholder engagement',
    'requirements gathering',
    'testing',
    'uat',
    'enterprise applications',
    'integrations',
    'data',
    'customer service',
    'sales',
    'account management',
    'technical support',
  ];
  return candidates.filter((term) => source.includes(term));
}

function deadlineRisk(job: JobData) {
  if (!job.deadline)
    return 'No confirmed closing date is saved. Recheck the original listing before spending time on a final application pack.';
  const days = daysUntil(job.deadline, todayBrisbane());
  if (days === null)
    return 'The saved closing date could not be calculated. Recheck the date in the original listing.';
  if (days < 0)
    return `The saved closing date passed ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago. Confirm the role is still open before applying.`;
  if (days === 0)
    return 'The saved closing date is today. Complete the evidence, document and final listing checks before submitting.';
  if (days <= 3)
    return `The saved closing date is in ${days} day${days === 1 ? '' : 's'}. Treat this as a focused preparation task and confirm the time zone.`;
  return `The saved closing date is in ${days} days. Set a personal completion date at least two working days earlier.`;
}

export function buildApplicationIntelligence(job: JobData): ApplicationIntelligence {
  const checkpoints: Checkpoint[] = [
    {
      label: 'Listing and key requirements captured',
      complete: hasText(job.requirements),
      guidance: 'Paste the essential duties, selection criteria and eligibility requirements from the current listing.',
    },
    {
      label: 'Personal reason for applying written',
      complete: hasText(job.why),
      guidance: 'Write why this particular role and employer make sense for you.',
    },
    {
      label: 'Employer brief reviewed',
      complete: hasText(job.employerResearch),
      guidance: 'Check the company website and original listing, then update the employer brief.',
    },
    {
      label: 'Evidence and STAR examples prepared',
      complete: hasText(job.starResponses) && hasText(job.keySelectionCriteria),
      guidance: 'Use real examples only and link each claim to a clear situation, action and result.',
    },
    {
      label: 'Tailored resume ready',
      complete: hasText(job.resumeDraft),
      guidance: 'Generate or revise the tailored resume, then verify each statement is accurate.',
    },
    {
      label: 'Tailored cover letter ready',
      complete: hasText(job.coverLetterDraft),
      guidance: 'Generate or revise the letter, then check the addressee, organisation and role title.',
    },
  ];
  const completed = checkpoints.filter((item) => item.complete).length;
  const score = Math.round((completed / checkpoints.length) * 100);
  const blockers = checkpoints
    .filter((item) => !item.complete)
    .map((item) => item.label.toLowerCase());
  const signals = keywordSignals(job);
  const lens = roleLens(job);
  const roleName = job.role || 'this role';
  const company = job.company || 'this employer';
  const sales = isSalesRole(job);

  return {
    readiness: {
      score,
      readyToApply: score >= 70 && blockers.length <= 2,
      checkpoints,
      blockers,
    },
    jobDna: `${company} is seeking a ${roleName}. The role appears to be built around ${lens}.${signals.length ? ` The listing signals: ${signals.join(', ')}.` : ' Add the job advertisement requirements to reveal a more precise capability map.'}`,
    fitMap: sales
      ? 'Strongest likely overlap: practical IT knowledge, customer service, technical troubleshooting, clear explanation, retail and operations experience. Strengthen with one real example of relationship building, follow-up or identifying a customer need.'
      : 'Strongest likely overlap: technical problem-solving, systems thinking, documentation, process improvement and experience translating real operational needs into clearer workflows. Strengthen with one precise, personally completed example for each major criterion.',
    applicationStrategy: `Apply only after the original listing has been rechecked. Lead with ${sales ? 'client communication and practical technology knowledge' : 'the bridge between operational needs and practical systems'}. Use the first paragraph of the cover letter to connect your experience to ${company}, then use two or three evidence-backed examples instead of a long skills list.`,
    evidencePlan: `Evidence bank for ${roleName}:\n1. Select the STAR example that best proves ${sales ? 'customer discovery and clear technical advice' : 'workflow analysis and practical improvement'}.\n2. Match every KSC to a real activity you personally completed, contributed to or are still developing.\n3. Keep a short source note beside each claim so it can be defended in an interview.\n4. Where evidence is partial, say so plainly and explain how you would close the gap.`,
    employerBrief: hasText(job.employerResearch)
      ? `Research is saved for ${company}. Before submission, verify company facts, current priorities, the named contact and the job status against the employer’s own website or current listing.`
      : `Create an employer brief: check ${company}'s About page, services, recent news, values, role location, named contact and the current job advertisement. Capture only facts you can trace to a source.`,
    truthCheck: 'Frank’s drafts are preparation material, not evidence. Personally verify every employer fact, date, qualification, employment statement, contact detail and outcome. Remove any wording that implies you completed work you only planned, supported or are learning.',
    deadlineRisk: deadlineRisk(job),
    documentQuality: `Document quality check: use the exact role title and company name; prioritise the ${Math.max(3, Math.min(6, signals.length || 4))} most relevant skills; remove repeated claims; keep the resume to one or two pages; make the cover letter specific and concise; export PDFs only after a final read-through.`,
    interviewPack: `Interview rehearsal for ${roleName}:\n• Tell me about a time you had to understand a ${sales ? 'customer' : 'stakeholder'} need before proposing a solution.\n• Describe a technical or operational problem you investigated and how you communicated the outcome.\n• Which requirement in this role would stretch you most, and how would you close that gap?\n• Why ${company}, and why now?\n\nLikely employer concern: prove that your broad experience is focused for this role. Answer with one recent, specific example and a direct connection to the job requirements.`,
    careerPathway: `This opportunity can build toward ${sales ? 'technology account management, solution selling or client success' : 'business systems analysis, AI implementation, automation or systems integration'}. After the application, record the skills requested, questions asked and feedback received. That turns each application into a career evidence library rather than a one-off attempt.`,
    applicationPack: `Application pack status:\n• Resume PDF: ${hasText(job.resumeDraft) ? 'ready to review and download' : 'not yet drafted'}\n• Cover letter PDF: ${hasText(job.coverLetterDraft) ? 'ready to review and download' : 'not yet drafted'}\n• STAR and KSC evidence: ${hasText(job.starResponses) && hasText(job.keySelectionCriteria) ? 'prepared for review' : 'still needed'}\n• Employer research: ${hasText(job.employerResearch) ? 'saved; recheck before use' : 'still needed'}\n• Follow-up plan: ${job.followUp ? `scheduled for ${job.followUp}` : 'set a follow-up date after applying'}`,
  };
}
