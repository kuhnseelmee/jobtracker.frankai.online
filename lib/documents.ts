import type { JobData } from './jobs';

export const contactBlock = [
  'Raymond Douglas Wooler',
  '0402 203 723',
  'rdwooler@gmail.com',
  'LinkedIn Profile',
  'raywooler.online | frankai.online',
].join('\n');

function isSalesRole(job: JobData) {
  return /sales|account|business development/i.test(
    `${job.role} ${job.industry} ${job.requirements}`,
  );
}

function resumeProfile(job: JobData) {
  if (isSalesRole(job)) {
    return `Practical, self-directed IT and operations professional with more than 25 years of experience across computer retail, technical support, systems administration, sales, customer service, digital design and business operations. For the ${job.role} role with ${job.company}, I bring a strong mix of technical product knowledge, customer communication, account support, sales awareness and practical problem-solving.`;
  }

  return `Practical, self-directed IT and operations professional with more than 25 years of experience across technical support, systems administration, application development, digital workflows, property operations and customer service. For the ${job.role} role with ${job.company}, I bring experience translating operational needs into workable systems, documenting processes, troubleshooting issues and communicating clearly with technical and non-technical stakeholders.`;
}

function selectedSkills(job: JobData) {
  if (isSalesRole(job)) {
    return [
      'Customer service, client communication and relationship building',
      'Computer retail, IT product knowledge and technical troubleshooting',
      'Sales support, quoting, follow-up, stock control and supplier communication',
      'Clear explanation of technical information for non-technical customers',
      'Business operations, reporting, accounts receivable and administration',
      'Reliable organisation, attention to detail and practical problem-solving',
    ];
  }

  return [
    'Business analysis, workflow thinking and requirements gathering',
    'Process mapping, documentation, evidence capture and system improvement',
    'Technical support across hardware, software, networks and user issues',
    'Application and web development concepts including React, NestJS and Supabase',
    'Care, property, compliance and governance workflow awareness',
    'Clear communication with technical and non-technical stakeholders',
  ];
}

function selectedExperience(job: JobData) {
  if (isSalesRole(job)) {
    return [
      'Built broad experience across computer retail, customer service, warranty support, supplier communication, stock control, accounts and technical support.',
      'Provided clear technical advice to customers by translating complex hardware, software and system issues into practical repair options and service recommendations.',
      'Managed store operations, rosters, technical department activity, point-of-sale, customer service, banking, reconciliation, stock ordering, marketing and advertising production.',
      'Supported business development through customer-focused technical communication, product knowledge and organised follow-up.',
    ];
  }

  return [
    'Translated frontline property, support coordination and compliance requirements into digital workflow concepts for the Amma Care Connect platform.',
    'Developed and refined system concepts covering participants, properties, documents, incidents, risks, staff, contractors, service agreements, governance reviews and reporting.',
    'Diagnosed, repaired, upgraded and maintained customer computer systems, including hardware faults, operating system issues, software configuration, data transfer and performance problems.',
    'Administered Windows Server and workstation environments, including daily backup, troubleshooting, installation, maintenance, network upgrades, security support and user assistance.',
  ];
}

function applicationFit(job: JobData) {
  if (isSalesRole(job)) {
    return `This background is relevant to ${job.company} because the role requires customer communication, technology awareness, follow-up, organisation and the ability to understand client needs. My mix of IT support, retail sales and business operations experience would help me build practical relationships with customers and recommend suitable technology solutions.`;
  }

  return `This background is relevant to ${job.company} because the role requires clear analysis, stakeholder communication, documentation, practical system thinking and the ability to understand operational needs. My experience across technical systems and care-related workflows gives me a useful bridge between frontline work and technology improvement.`;
}

export function generateApplicationDocuments(job: JobData): Pick<
  JobData,
  'resumeDraft' | 'coverLetterDraft'
> {
  const resumeDraft = [
    contactBlock,
    '',
    `TAILORED RESUME - ${job.role.toUpperCase()} - ${job.company.toUpperCase()}`,
    '',
    'Professional Profile',
    resumeProfile(job),
    '',
    'Selected Key Skills',
    ...selectedSkills(job).map((skill) => `- ${skill}`),
    '',
    'Relevant Experience Highlights',
    ...selectedExperience(job).map((item) => `- ${item}`),
    '',
    'Application Fit',
    applicationFit(job),
    '',
    'Education and Accreditations',
    '- Graduated Senior - Springwood State High School, QLD',
    '- Diploma of Management coursework - Axiom College, Brisbane',
    '- Forklift Truck Certificate - Competent Support Services',
    '- Certificate of Participation, Senior Division - University of Southern Queensland Australian Computer Competition',
    '',
    'Referees',
    'Available upon request.',
  ].join('\n');

  const employerReason = isSalesRole(job)
    ? 'I am particularly interested in this role because it allows me to combine practical IT knowledge, customer service, account support and business development.'
    : 'I am particularly interested in this role because it allows me to combine technical knowledge, business process improvement, documentation and practical systems thinking.';

  const coverLetterDraft = [
    contactBlock,
    '',
    new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Australia/Brisbane',
    }).format(new Date()),
    '',
    job.contact ? `${job.contact}` : `${job.company} Recruitment Team`,
    job.company,
    job.location || '',
    '',
    `Dear ${job.contact && !job.contact.includes('@') ? job.contact.split('·')[0].trim() : 'Hiring Manager'},`,
    '',
    `Re: Application for ${job.role}`,
    '',
    `I am writing to express my interest in the ${job.role} position with ${job.company}. ${employerReason}`,
    '',
    resumeProfile(job),
    '',
    applicationFit(job),
    '',
    `In previous roles, I have developed a strong practical base across IT support, systems administration, customer service, business operations, documentation and problem-solving. I am comfortable investigating issues, asking clear questions, organising information and communicating with people who have different levels of technical knowledge.`,
    '',
    `I would welcome the opportunity to discuss how my experience and approach could support ${job.company}. Thank you for considering my application.`,
    '',
    'Kind regards,',
    '',
    'Raymond Wooler',
  ]
    .filter((line) => line !== '')
    .join('\n\n');

  return { resumeDraft, coverLetterDraft };
}
