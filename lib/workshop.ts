import type { JobData } from './jobs';

type Profile = {
  services: string;
  values: string;
  fit: string;
  cover: string;
};

const profiles: Record<string, Profile> = {
  'anglicare southern queensland': {
    services:
      'Anglicare Southern Queensland is a long-established community care organisation supporting vulnerable people and communities across Queensland, including aged care, family support, homelessness, youth support and counselling.',
    values:
      'Its work is strongly connected to compassion, dignity, respect and practical support for people who need care or assistance.',
    fit:
      'This connects with my experience in property, care-related workflows, compliance, documentation and digital systems.',
    cover:
      'I am interested in using technology to improve care, documentation, governance and operational workflows for frontline services.',
  },
  ozcare: {
    services:
      'Ozcare is a Queensland not-for-profit provider of aged care, home care, nursing, retirement living, respite care, allied health and dementia support services.',
    values:
      'Its values include respect, integrity, compassion and empathy, with a strong focus on practical support for clients and communities.',
    fit:
      'This matches my background in IT support, systems administration, application development, documentation and care-related workflow improvement.',
    cover:
      'I am interested in improving systems that help staff deliver accurate, reliable and person-centred care.',
  },
  'mediaform pty ltd': {
    services:
      'MediaForm is an Australian-owned IT and office technology business supplying technology products and services to business customers.',
    values:
      'The business is commercially focused, customer-facing and built around practical technology solutions.',
    fit:
      'This suits my experience in computer retail, technical support, customer service, sales, stock control and business operations.',
    cover:
      'I can combine technical knowledge with customer service and commercial awareness to help clients choose suitable technology solutions.',
  },
};

function profileFor(job: JobData): Profile {
  return (
    profiles[job.company.toLowerCase()] ?? {
      services: `${job.company} operates in the ${job.industry || 'target'} industry and is recruiting for ${job.role}.`,
      values:
        'The organisation appears to need reliable communication, practical problem-solving and people who can understand workplace needs.',
      fit:
        'This connects with my background in technical support, systems improvement, documentation and customer service.',
      cover:
        'I can bring practical technology experience, clear communication and a steady approach to solving workplace problems.',
    }
  );
}

function isSalesRole(job: JobData) {
  return /sales|account|business development/i.test(
    `${job.role} ${job.industry} ${job.requirements}`,
  );
}

function starResponses(job: JobData) {
  if (isSalesRole(job)) {
    return [
      'STAR Response 1 - Customer service and technology advice',
      'S: In previous retail, technical support and business operations roles, I worked with customers who needed practical help choosing or fixing technology.',
      'T: My task was to understand what the customer needed, explain the options clearly and support a solution that suited their situation.',
      'A: I asked questions, listened carefully, used my product and technical knowledge, and explained technical information in plain English. I also followed up where needed and kept records accurate.',
      'R: Customers received clearer advice and better support, and the business benefited from stronger service, repeat trust and more organised follow-up.',
      '',
      'STAR Response 2 - Managing priorities',
      'S: In store and operations environments, I often had to manage customer service, stock, accounts, reporting and team needs at the same time.',
      'T: I needed to keep daily work moving while still maintaining accuracy and good communication.',
      'A: I prioritised urgent issues, communicated clearly with customers and staff, and kept details organised so work was not missed.',
      'R: The work was handled more smoothly and customers received more reliable service, which is important in account management and IT sales.',
      '',
      'STAR Response 3 - Solving a technical problem',
      'S: A customer or staff member would sometimes present with a hardware, software or network issue that was stopping them from working properly.',
      'T: I needed to diagnose the issue and provide a practical solution.',
      'A: I checked the symptoms, tested likely causes, explained what I was doing and worked through the issue step by step.',
      'R: The issue was resolved or narrowed down clearly, and the person had more confidence in the technology and support being provided.',
    ].join('\n');
  }

  return [
    'STAR Response 1 - Improving workplace systems',
    'S: In my work with Amma Care Support Services, I was involved in property and operational workflows where information needed to be organised clearly for supported accommodation, compliance, maintenance and internal communication.',
    'T: The task was to help turn practical workplace needs into clearer digital workflow ideas so staff could manage documents, incidents, risks, properties, contractors and reporting more effectively.',
    'A: I looked at the real problems staff were dealing with, identified what information needed to be captured, and helped map out practical systems and processes. I focused on workflows that would be useful for both technical and non-technical users.',
    'R: This created a clearer understanding of how technology could support daily operations and compliance needs, and it demonstrated my ability to analyse business processes and design practical improvements.',
    '',
    'STAR Response 2 - Troubleshooting and user support',
    'S: In previous technical support work, I often dealt with hardware, software, network and system issues where people needed problems fixed quickly and clearly.',
    'T: I needed to diagnose the issue, explain it in plain English and find a practical solution without causing unnecessary disruption.',
    'A: I asked questions, checked likely causes, tested solutions and kept the user informed. I documented important details and focused on the user’s actual need.',
    'R: Problems were resolved more efficiently and users had more confidence in the system or equipment.',
    '',
    'STAR Response 3 - Translating needs into action',
    'S: In care-related and operational environments, staff often need systems that reflect real workflows rather than purely technical assumptions.',
    'T: My task was to understand the practical requirement and turn it into something that could be documented, tested or improved.',
    'A: I listened to the users, broke the process into steps, identified gaps and thought through how information should be captured and used.',
    'R: The result was clearer documentation and more practical system thinking, which is directly relevant to business analysis and business systems roles.',
  ].join('\n');
}

function keySelectionCriteria(job: JobData) {
  if (isSalesRole(job)) {
    return [
      `KSCs for ${job.role} - ${job.company}`,
      '- Strong customer service, sales and account management skills',
      '- Ability to communicate with clients and understand their business or technology needs',
      '- Confidence preparing quotes, following up leads and building customer relationships',
      '- Interest or knowledge in ICT products, equipment and technology solutions',
      '- Ability to identify new business opportunities and support existing customers',
      '- Strong organisation, time management and attention to detail',
      '- Professional communication skills by phone, email and in person',
      '- Ability to work on site as part of a Brisbane-based team',
    ].join('\n');
  }

  return [
    `KSCs for ${job.role} - ${job.company}`,
    '- Experience analysing business processes, workflows and operational requirements',
    '- Ability to communicate with stakeholders and understand user needs',
    '- Skills in requirements gathering, process mapping and documentation',
    '- Ability to identify gaps, inefficiencies and improvement opportunities',
    '- Experience supporting testing, user acceptance testing, user stories or system changes',
    '- Strong written and verbal communication skills',
    '- Understanding of care, health, community services or compliance-focused environments',
    '- Ability to work independently while supporting practical business outcomes',
  ].join('\n');
}

function employerResearch(job: JobData) {
  const p = profileFor(job);
  return [
    `Employer research for ${job.company}`,
    p.services,
    p.values,
    `Why this appeals to me: ${p.fit}`,
    `Cover letter angle: ${p.cover}`,
    job.url ? `Original listing to recheck before applying: ${job.url}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function coverLetterWorkshop(job: JobData) {
  const p = profileFor(job);
  const skillFocus = isSalesRole(job)
    ? 'customer service, sales, technical product knowledge and clear client communication'
    : 'business analysis, technical troubleshooting, documentation and workflow improvement';

  return [
    `Cover letter workshop for ${job.role} - ${job.company}`,
    '',
    'Opening focus:',
    `I am interested in the ${job.role} position because it connects with my background in ${skillFocus}.`,
    '',
    'Why this employer:',
    p.cover,
    '',
    'Evidence to include:',
    '- Practical IT and operations experience across support, systems, documentation and problem-solving',
    `- Relevant experience connected to ${job.industry || 'the organisation’s industry'}`,
    '- Ability to communicate clearly with technical and non-technical people',
    '- Strong attention to detail, reliability and willingness to learn',
    '',
    'Closing focus:',
    `I would welcome the opportunity to discuss how my practical technical background and operational experience could support ${job.company}.`,
  ].join('\n');
}

export function generateWorkshop(job: JobData): Pick<
  JobData,
  | 'starResponses'
  | 'keySelectionCriteria'
  | 'employerResearch'
  | 'coverLetterWorkshop'
> {
  return {
    starResponses: starResponses(job),
    keySelectionCriteria: keySelectionCriteria(job),
    employerResearch: employerResearch(job),
    coverLetterWorkshop: coverLetterWorkshop(job),
  };
}
