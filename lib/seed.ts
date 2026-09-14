import { blankJob, type Job } from './jobs';
import { generateWorkshop } from './workshop';
import { generateApplicationDocuments } from './documents';

const rawSeedJobs: Job[] = [
  {
    ...blankJob(),
    id: 'anglicare-business-analyst-1706',
    version: 1,
    company: 'Anglicare Southern Queensland',
    role: 'Business Analyst',
    industry: 'Health Care and Social Assistance',
    location: 'Fortitude Valley, Brisbane QLD',
    employment:
      'Full time · 12-month fixed-term contract · Flexible work options',
    contact: 'Daniel Walsh · dwalsh@anglicaresq.org.au',
    url: 'https://au.talent.com/view?id=634362660950969755',
    salary: 'Not specified',
    deadlineNote:
      'No closing date shown. Applications progress as received; confirm availability with the employer.',
    requirements:
      'Requirements gathering, BPMN and process mapping; gap and impact analysis; business cases, user stories and testing; stakeholder and vendor collaboration. Relevant degree or significant relevant experience. Queensland driver licence, reliable vehicle, police certificate and regional travel required.',
    why: 'This role connects my interest in practical technology and process improvement with services that support people in the community. My experience across technical systems and care-related workflows gives me useful context for understanding staff needs.',
    nextAction:
      'Review the current listing and map my experience to the selection criteria.',
    checkedAt: '2026-09-14',
    notes:
      'Job 1706. Advert dated 18 August 2026. Listing readable on 14 September; employer-side application availability not confirmed. Flexible work options do not mean fully remote.',
  },
  {
    ...blankJob(),
    id: 'ozcare-business-systems-analyst',
    version: 1,
    company: 'Ozcare',
    role: 'Business Analyst – Business Systems',
    industry: 'Health Care and Social Assistance',
    location: 'Kangaroo Point, Brisbane QLD',
    employment: 'Full time · Ongoing business systems / BAU role',
    contact:
      '1800 692 273 · General careers/application assistance (not a named hiring manager)',
    url: 'https://au.indeed.com/viewjob?jk=beb0fa3e2de8644f',
    salary: 'Not specified · Salary packaging advertised',
    deadlineNote:
      'Conflicting dates: advert says 5 October 2026 at 9:59 am (timezone unstated); metadata says 3 October. Confirm with Ozcare before setting a deadline.',
    requirements:
      'Business analysis experience; enterprise applications; requirements and process mapping; integrations and data flows; stakeholder facilitation; testing and user acceptance testing. This is an ongoing BAU position, not project-based.',
    why: 'I enjoy investigating how systems work and making them more useful. This role appeals to me because improving business applications can reduce administration for care staff, while drawing on my technical troubleshooting and systems experience.',
    nextAction:
      'Confirm the closing date and prepare examples of systems improvements.',
    checkedAt: '2026-09-14',
    notes:
      'Advert dated 3 September 2026. Listing readable on 14 September. Careers page: https://ozcare.org.au/careers/',
  },
  {
    ...blankJob(),
    id: 'mediaform-it-sales-account-manager',
    version: 1,
    company: 'MediaForm Pty Ltd',
    role: 'Business Development / Account Manager – IT Sales',
    industry: 'ICT equipment supply and technology sales',
    location: 'Salisbury, Brisbane QLD',
    employment: 'Permanent full time · Onsite',
    contact: 'employment.qld@mediaform.com.au',
    url: 'https://au.indeed.com/viewjob?jk=9d47a7481fa40971',
    salary: 'Not specified',
    deadlineNote:
      'No closing date shown. Confirm that applications are still being accepted.',
    requirements:
      'Sales or account management experience; communication and customer relationship skills; identifying new opportunities, managing quotes and growing accounts. IT experience beneficial, with training provided. Restricted to local Brisbane applicants who are Australian citizens or permanent residents; check eligibility.',
    why: 'I would enjoy combining my practical IT and hardware knowledge with customer service. Helping clients choose suitable technology and building ongoing relationships also connects with my interest in business development.',
    nextAction:
      'Check eligibility and tailor my résumé around technical knowledge and client service.',
    checkedAt: '2026-09-14',
    notes:
      'Onsite address: 246 Evans Road, Salisbury QLD 4107. Listing readable on 14 September. Employer careers page: https://www.mediaform.com.au/contact-us/employment/',
  },
];

export const seedJobs: Job[] = rawSeedJobs.map((job) => ({
  ...job,
  ...generateWorkshop(job),
  ...generateApplicationDocuments(job),
}));
