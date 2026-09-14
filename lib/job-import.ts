import { blankJob, todayBrisbane, type JobData } from './jobs';

export type ImportConfidence = 'listing' | 'inferred' | 'missing';
export type ImportedField = {
  label: string;
  value: string;
  confidence: ImportConfidence;
};
export type ImportedJob = {
  draft: JobData;
  fields: ImportedField[];
  sourceUrl: string;
  summary: string;
};

type JobPosting = Record<string, unknown>;

const maxListingTextLength = 9000;

function text(value: unknown) {
  if (typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value))) return '';
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipped(value: unknown, limit = maxListingTextLength) {
  const normalized = text(value);
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
}

function meta(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i').exec(html)?.[0];
  return text(tag?.match(/content=["']([^"']*)["']/i)?.[1]);
}

function heading(html: string) {
  return clipped(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1], 300);
}

function listingText(html: string) {
  return clipped(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' '),
  );
}

function jobPostings(value: unknown): JobPosting[] {
  if (Array.isArray(value)) return value.flatMap(jobPostings);
  if (!value || typeof value !== 'object') return [];
  const node = value as JobPosting;
  const type = node['@type'];
  const isJob =
    type === 'JobPosting' ||
    (Array.isArray(type) && type.some((entry) => entry === 'JobPosting'));
  return [ ...(isJob ? [node] : []), ...Object.values(node).flatMap(jobPostings) ];
}

function jsonLdJob(html: string) {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const script of scripts) {
    try {
      const found = jobPostings(JSON.parse(script[1]));
      if (found[0]) return found[0];
    } catch {
      // A malformed structured-data block should not prevent plain-page extraction.
    }
  }
  return undefined;
}

function address(value: unknown) {
  const locations = Array.isArray(value) ? value : [value];
  const location = locations.find((entry) => entry && typeof entry === 'object') as
    | Record<string, unknown>
    | undefined;
  const place = location?.address;
  const source = place && typeof place === 'object' ? (place as Record<string, unknown>) : location;
  return [source?.addressLocality, source?.addressRegion, source?.addressCountry]
    .map(text)
    .filter(Boolean)
    .join(', ');
}

function salary(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const source = value as Record<string, unknown>;
  const details = source.value && typeof source.value === 'object' ? (source.value as Record<string, unknown>) : source;
  const amount = details.value ?? details.minValue ?? details.maxValue;
  const maximumValue = text(details.maxValue);
  const maximum = maximumValue && details.maxValue !== amount ? `–${maximumValue}` : '';
  const currency = text(source.currency || details.currency);
  const unit = text(details.unitText || details.unitCode);
  return [currency, `${text(amount)}${maximum}`, unit].filter(Boolean).join(' ');
}

function date(value: unknown) {
  const source = text(value);
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(source);
  return match?.[1] || '';
}

function firstString(value: unknown) {
  return (Array.isArray(value) ? value : [value]).map(text).filter(Boolean).join(', ');
}

function inferIndustry(title: string, content: string) {
  const searchable = `${title} ${content}`.toLowerCase();
  if (/software|technology|ict|systems|data|digital|cyber/.test(searchable))
    return 'Information Media and Telecommunications';
  if (/care|health|clinical|hospital|disability/.test(searchable))
    return 'Health Care and Social Assistance';
  if (/construction|building|trade|site/.test(searchable)) return 'Construction';
  if (/sales|retail|customer service/.test(searchable)) return 'Retail Trade';
  return '';
}

export function validateImportUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('Enter a complete public job-listing URL.');
  }
  const host = url.hostname.toLowerCase();
  const blockedHost =
    !host.includes('.') ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === 'metadata.google.internal' ||
    host === '0.0.0.0' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('10.') ||
    host.startsWith('127.') ||
    host.startsWith('169.254.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.includes(':') ||
    /^fc|^fd|^fe80/i.test(host);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    blockedHost ||
    (url.port && !['80', '443'].includes(url.port))
  )
    throw new Error('Use a safe, public HTTPS job-listing URL.');
  return url;
}

export function extractJobListing(html: string, sourceUrl: string): ImportedJob {
  const structured = jsonLdJob(html);
  const content = listingText(html);
  const role = clipped(structured?.title, 300) || heading(html) || meta(html, 'og:title') || '';
  const company =
    clipped((structured?.hiringOrganization as Record<string, unknown> | undefined)?.name, 300) ||
    clipped(meta(html, 'company'), 300);
  const location = address(structured?.jobLocation) || clipped(meta(html, 'job:location'), 300);
  const employment = firstString(structured?.employmentType);
  const pay = salary(structured?.baseSalary);
  const deadline = date(structured?.validThrough);
  const requirements = clipped(structured?.description || meta(html, 'description') || content);
  const inferredIndustry = inferIndustry(role, requirements);
  const description = requirements || 'No readable job description was found. Open the source listing and enter the details manually.';
  const direct = (value: string): ImportConfidence => (value ? 'listing' : 'missing');
  const fields: ImportedField[] = [
    { label: 'Job title', value: role, confidence: direct(role) },
    { label: 'Company', value: company, confidence: direct(company) },
    { label: 'Location', value: location, confidence: direct(location) },
    { label: 'Employment type', value: employment, confidence: direct(employment) },
    { label: 'Salary', value: pay, confidence: direct(pay) },
    { label: 'Deadline', value: deadline, confidence: direct(deadline) },
    { label: 'Industry', value: inferredIndustry, confidence: inferredIndustry ? 'inferred' : 'missing' },
  ];
  return {
    sourceUrl,
    fields,
    summary: structured ? 'Structured job-posting data was found and combined with readable listing text.' : 'The draft was extracted from readable public page content. Check every field against the source listing.',
    draft: {
      ...blankJob(),
      role,
      company,
      industry: inferredIndustry,
      location,
      employment,
      salary: pay,
      deadline,
      url: sourceUrl,
      requirements: description,
      notes: `Imported from ${sourceUrl}\nImported on ${todayBrisbane()}. Review imported fields against the original listing before saving.`,
      checkedAt: todayBrisbane(),
      nextAction: 'Review the imported listing details, confirm the closing date, and tailor the application.',
    },
  };
}
