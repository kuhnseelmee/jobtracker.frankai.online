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

function advertisedOn(job: JobData) {
  if (job.url.includes('seek.com')) return 'SEEK';
  if (job.url.includes('indeed.com')) return 'Indeed';
  if (job.url.includes('talent.com')) return 'Talent.com';
  return job.url ? 'the advertised listing' : 'the job advertisement';
}

function addressee(job: JobData) {
  const firstContact = job.contact.split('·')[0]?.trim();
  if (firstContact && !firstContact.includes('@') && !/\d{4}/.test(firstContact))
    return firstContact;
  return 'Hiring Manager';
}

function organisationResearchPoint(job: JobData) {
  if (job.company === 'Anglicare Southern Queensland')
    return 'its practical community support work and focus on helping vulnerable people across Queensland';
  if (job.company === 'Ozcare')
    return 'its person-centred care services and values of respect, integrity, compassion and empathy';
  if (job.company === 'MediaForm Pty Ltd')
    return 'its long-standing role as an Australian technology supplier supporting business customers with practical IT and office solutions';
  return 'the organisation’s work and the opportunity to contribute practical skills in a professional team';
}

function kscExamples(job: JobData) {
  if (isSalesRole(job)) {
    return [
      [
        'Customer service and client communication',
        'In my computer retail and technical support experience, I regularly worked with customers to understand their needs, explain technology clearly and recommend practical options. This supported stronger customer relationships and better service outcomes.',
      ],
      [
        'Technology product knowledge',
        'When assisting customers with hardware, software and system issues, I used technical troubleshooting skills to identify the problem and explain suitable repair or product options in plain English.',
      ],
      [
        'Sales support and follow-up',
        'I have experience with stock control, supplier communication, accounts, customer records and operational follow-up, while maintaining accuracy and professional communication.',
      ],
      [
        'Organisation and willingness to learn',
        'I am comfortable learning new products, systems and workplace procedures. My varied IT, retail and operations background has trained me to adapt quickly while staying organised and reliable.',
      ],
    ];
  }

  return [
    [
      'Business analysis and process improvement',
      'In my work with Amma Care Support Services, I helped translate frontline property, support coordination and compliance requirements into digital workflow concepts. This supported clearer documentation, better evidence capture and more practical systems thinking.',
    ],
    [
      'Stakeholder communication',
      'When working across operational and technical tasks, I communicated with both technical and non-technical people, asked questions to understand the need and explained systems or issues in plain English.',
    ],
    [
      'Systems and technical problem-solving',
      'I have diagnosed and resolved hardware, software, network and user support issues across a long technical career, while documenting important details and focusing on practical outcomes.',
    ],
    [
      'Documentation, accuracy and learning',
      'I understand the importance of accurate documentation, compliance awareness and continuous learning. I am comfortable learning new systems and turning complex requirements into clearer steps for users and teams.',
    ],
  ];
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

  const kscs = kscExamples(job);

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
    `Dear ${addressee(job)},`,
    '',
    `RE: Application for ${job.role} position`,
    '',
    `I am writing to apply for the ${job.role} position with ${job.company}, as advertised on ${advertisedOn(job)}. I am interested in this opportunity because of ${organisationResearchPoint(job)}. This role stood out to me because the job advertisement highlights requirements that connect with my practical experience, including ${selectedSkills(job)
      .slice(0, 2)
      .join(' and ')
      .toLowerCase()}.`,
    '',
    'I have enclosed my resume to support my application. It shows that I would bring important attributes to the position, including:',
    '',
    `${kscs[0][0]}: ${kscs[0][1]}`,
    '',
    `${kscs[1][0]}: ${kscs[1][1]}`,
    '',
    `${kscs[2][0]}: ${kscs[2][1]}`,
    '',
    `${kscs[3][0]}: ${kscs[3][1]}`,
    '',
    `I believe I would be a suitable candidate for this position because I bring ${isSalesRole(job) ? 'technical knowledge, customer service experience and commercial awareness' : 'systems thinking, documentation skills and practical technical experience'} with a genuine interest in ${job.industry || 'this field'}. ${applicationFit(job)}`,
    '',
    `Thank you for considering my application. I would welcome the opportunity to discuss how my skills, experience and interest in this role could support ${job.company}. I am available for interview and can be contacted on 0402 203 723.`,
    '',
    'Sincerely,',
    '',
    'Raymond Douglas Wooler',
  ]
    .join('\n');

  return { resumeDraft, coverLetterDraft };
}
