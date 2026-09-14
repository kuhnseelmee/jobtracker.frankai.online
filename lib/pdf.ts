const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 54;
const lineHeight = 15;
const contentWidth = pageWidth - margin * 2;
const defaultLinkedInUrl = 'https://www.linkedin.com/in/raymond-wooler-391866394';
type FontName = 'F1' | 'F2';
type PdfLink = { uri: string; x: number; y: number; width: number; height: number };
type PdfPage = { operations: string; links?: PdfLink[] };

function escapePdfText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replace(/[^ -~]/g, (char) => {
      if (char === '\n' || char === '\r' || char === '\t') return char;
      if (char === '–' || char === '—') return '-';
      if (char === '•') return '-';
      if (char === '’' || char === '‘') return "'";
      if (char === '“' || char === '”') return '"';
      return '';
    });
}

function wrapLine(line: string, maxCharacters: number) {
  if (!line.trim()) return [''];
  const words = line.split(/\s+/);
  const rows: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      rows.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) rows.push(current);
  return rows;
}

function drawText(
  value: string,
  x: number,
  y: number,
  options: { font?: FontName; size?: number; color?: string } = {},
) {
  const font = options.font ?? 'F1';
  const size = options.size ?? 10;
  const color = options.color ?? '0 0 0';
  return `${color} rg BT /${font} ${size} Tf ${x} ${y.toFixed(2)} Td (${escapePdfText(value)}) Tj ET`;
}

function fillRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  return `${color} rg ${x} ${y.toFixed(2)} ${width} ${height} re f`;
}

function estimateTextWidth(value: string, size: number) {
  return value.length * size * 0.52;
}

function normaliseWebsiteUrl(value: string) {
  const cleaned = value.trim().replace(/^https?:\/\//, '');
  return `https://${cleaned}`;
}

function normaliseLinkedInUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  if (/linkedin/i.test(value)) return defaultLinkedInUrl;
  return '';
}

function drawIconBadge(label: string, x: number, baseline: number) {
  const boxY = baseline - 9;
  return [
    fillRect(x, boxY, 16, 13, '0.03 0.50 0.51'),
    drawText(label, x + 3, baseline - 6, {
      font: 'F2',
      size: label.length > 2 ? 4.6 : 5.8,
      color: '0.02 0.11 0.13',
    }),
  ];
}

function drawFrankMark(x: number, y: number, size: number) {
  return [
    fillRect(x, y, size, size, '0.03 0.09 0.11'),
    fillRect(x + size * 0.24, y + size * 0.66, size * 0.54, size * 0.12, '0.33 0.91 0.77'),
    fillRect(x + size * 0.24, y + size * 0.21, size * 0.15, size * 0.57, '0.33 0.91 0.77'),
    fillRect(x + size * 0.39, y + size * 0.48, size * 0.39, size * 0.11, '0.33 0.91 0.77'),
    fillRect(x + size * 0.75, y + size * 0.12, size * 0.13, size * 0.13, '0.96 0.74 0.36'),
  ];
}

function paginate(text: string) {
  const lines = text
    .split(/\r?\n/)
    .flatMap((line) => wrapLine(line, Math.floor(contentWidth / 6.1)));
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage)
    pages.push(lines.slice(i, i + linesPerPage));
  return pages.length ? pages : [['']];
}

export function createPdfBlob(text: string, title: string) {
  const pages = paginate(text);
  const objects: string[] = [];
  const add = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const fontObject = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldFontObject = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  );
  const pageRefs: number[] = [];

  for (const page of pages) {
    const operations = page
      .map((line, index) => {
        const y = pageHeight - margin - index * lineHeight;
        return drawText(line, margin, y);
      })
      .join('\n');
    const streamObject = add(
      `<< /Length ${operations.length} >>\nstream\n${operations}\nendstream`,
    );
    const pageObject = add(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R /F2 ${boldFontObject} 0 R >> >> /Contents ${streamObject} 0 R >>`,
    );
    pageRefs.push(pageObject);
  }

  const pagesObject = add(
    `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`,
  );
  const catalogObject = add(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);
  const infoObject = add(
    `<< /Title (${escapePdfText(title)}) /Creator (Career Tracker) >>`,
  );

  const resolved = objects.map((object) =>
    object.replace('/Parent 0 0 R', `/Parent ${pagesObject} 0 R`),
  );
  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  for (const [index, object] of resolved.entries()) {
    offsets.push(chunks.join('').length);
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  }
  const xrefOffset = chunks.join('').length;
  chunks.push(`xref\n0 ${resolved.length + 1}\n`);
  chunks.push('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i += 1)
    chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  chunks.push(
    `trailer\n<< /Size ${resolved.length + 1} /Root ${catalogObject} 0 R /Info ${infoObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

function parseResumeDraft(text: string) {
  const raw = text.split(/\r?\n/).map((line) => line.trim());
  const lines = raw.filter(Boolean);
  const titleIndex = lines.findIndex((line) => line.startsWith('TAILORED RESUME'));
  const header = titleIndex > 0 ? lines.slice(0, titleIndex) : lines.slice(0, 5);
  const subtitle = titleIndex >= 0 ? lines[titleIndex] : 'TAILORED RESUME';
  const body = lines.slice(titleIndex >= 0 ? titleIndex + 1 : header.length);
  const sections: { title: string; rows: string[] }[] = [];
  const known = new Set([
    'Professional Profile',
    'Selected Key Skills',
    'Relevant Experience Highlights',
    'Application Fit',
    'Additional Achievement',
    'Referees',
  ]);
  let current: { title: string; rows: string[] } | null = null;
  for (const line of body) {
    if (known.has(line)) {
      current = { title: line, rows: [] };
      sections.push(current);
    } else if (current) {
      current.rows.push(line);
    }
  }
  return {
    name: header[0] || 'Raymond Douglas Wooler',
    contact: header.slice(1),
    subtitle,
    sections,
  };
}

function buildPdfFromPages(pages: PdfPage[], title: string) {
  const objects: string[] = [];
  const add = (content: string) => {
    objects.push(content);
    return objects.length;
  };
  const fontObject = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldFontObject = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  );
  const pageRefs: number[] = [];
  for (const page of pages) {
    const streamObject = add(
      `<< /Length ${page.operations.length} >>\nstream\n${page.operations}\nendstream`,
    );
    const annotRefs = (page.links ?? []).map((link) =>
      add(
        `<< /Type /Annot /Subtype /Link /Rect [${link.x.toFixed(2)} ${link.y.toFixed(2)} ${(link.x + link.width).toFixed(2)} ${(link.y + link.height).toFixed(2)}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfText(link.uri)}) >> >>`,
      ),
    );
    const annots = annotRefs.length
      ? ` /Annots [${annotRefs.map((ref) => `${ref} 0 R`).join(' ')}]`
      : '';
    const pageObject = add(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R /F2 ${boldFontObject} 0 R >> >> /Contents ${streamObject} 0 R${annots} >>`,
    );
    pageRefs.push(pageObject);
  }
  const pagesObject = add(
    `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`,
  );
  const catalogObject = add(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);
  const infoObject = add(
    `<< /Title (${escapePdfText(title)}) /Creator (Career Tracker) >>`,
  );
  const resolved = objects.map((object) =>
    object.replace('/Parent 0 0 R', `/Parent ${pagesObject} 0 R`),
  );
  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  for (const [index, object] of resolved.entries()) {
    offsets.push(chunks.join('').length);
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  }
  const xrefOffset = chunks.join('').length;
  chunks.push(`xref\n0 ${resolved.length + 1}\n`);
  chunks.push('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i += 1)
    chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  chunks.push(
    `trailer\n<< /Size ${resolved.length + 1} /Root ${catalogObject} 0 R /Info ${infoObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );
  return new Blob(chunks, { type: 'application/pdf' });
}

export function createResumePdfBlob(text: string, title: string) {
  const resume = parseResumeDraft(text);
  const pages: PdfPage[] = [];
  let ops: string[] = [];
  let links: PdfLink[] = [];
  let y = 0;
  const pushPage = () => {
    if (ops.length) pages.push({ operations: ops.join('\n'), links });
  };
  const addLink = (label: string, uri: string, x: number, baseline: number, size: number) => {
    links.push({
      uri,
      x,
      y: baseline - 2,
      width: estimateTextWidth(label, size),
      height: size + 4,
    });
  };
  const drawLinkedText = (
    label: string,
    uri: string,
    x: number,
    baseline: number,
    size: number,
    icon?: string,
  ) => {
    const textX = icon ? x + 24 : x;
    if (icon) ops.push(...drawIconBadge(icon, x, baseline));
    ops.push(
      drawText(label, textX, baseline, {
        size,
        color: '0.62 0.91 0.92',
      }),
    );
    addLink(label, uri, textX, baseline, size);
  };
  const newPage = (first = false) => {
    pushPage();
    ops = [];
    links = [];
    const headerHeight = first ? 186 : 118;
    const headerBottom = pageHeight - headerHeight;
    ops.push(fillRect(0, headerBottom, pageWidth, headerHeight, '0.06 0.18 0.22'));
    ops.push(fillRect(0, headerBottom, pageWidth, 4, '0.03 0.50 0.51'));
    const nameX = first ? margin + 48 : margin;
    if (first) ops.push(...drawFrankMark(margin, pageHeight - 70, 34));
    ops.push(drawText(resume.name.toUpperCase(), nameX, pageHeight - 47, {
      font: 'F2',
      size: first ? 21 : 16,
      color: '1 1 1',
    }));
    ops.push(
      drawText(
        resume.subtitle.replace('TAILORED RESUME - ', ''),
        nameX,
        pageHeight - 72,
        {
          font: 'F1',
          size: 8.7,
          color: '0.78 0.87 0.89',
        },
      ),
    );
    if (first) {
      const contactX = 346;
      const contactY = pageHeight - 92;
      const contactSize = 8.8;
      const [location, phone, email, linkedIn, websites] = resume.contact;
      if (location)
        ops.push(
          drawText(location, contactX, contactY, {
            size: contactSize,
            color: '0.88 0.94 0.95',
          }),
        );
      if (phone)
        drawLinkedText(
          phone,
          `tel:${phone.replace(/\s+/g, '')}`,
          contactX,
          contactY - 15,
          contactSize,
          'PH',
        );
      if (email)
        drawLinkedText(
          email,
          `mailto:${email}`,
          contactX,
          contactY - 30,
          contactSize,
          '@',
        );
      if (linkedIn) {
        const linkedInUrl = normaliseLinkedInUrl(linkedIn);
        const linkedInText = linkedInUrl
          ? linkedInUrl.replace(/^https?:\/\//i, '')
          : 'LinkedIn profile available on request';
        if (linkedInUrl)
          drawLinkedText(
            linkedInText,
            linkedInUrl,
            contactX,
            contactY - 45,
            contactSize,
            'in',
          );
        else
          ops.push(
            drawText(linkedInText, contactX, contactY - 45, {
              size: contactSize,
              color: '0.88 0.94 0.95',
            }),
          );
      }
      const sites = (websites ?? '')
        .split('|')
        .map((site) => site.trim())
        .filter(Boolean);
      sites.slice(0, 2).forEach((site, index) => {
        drawLinkedText(
          site.replace(/^https?:\/\//i, ''),
          normaliseWebsiteUrl(site),
          contactX,
          contactY - 60 - index * 15,
          contactSize,
          'WEB',
        );
      });
    }
    y = headerBottom - 32;
  };
  const ensureSpace = (needed: number) => {
    if (y - needed < margin) newPage();
  };
  const section = (label: string) => {
    ensureSpace(36);
    ops.push(fillRect(margin, y - 7, 3, 17, '0.03 0.50 0.51'));
    ops.push(drawText(label.toUpperCase(), margin + 12, y, {
      font: 'F2',
      size: 11,
      color: '0.08 0.21 0.26',
    }));
    y -= 24;
  };
  const paragraph = (value: string) => {
    for (const line of wrapLine(value, 88)) {
      ensureSpace(15);
      ops.push(
        drawText(line, margin, y, { size: 9.7, color: '0.13 0.17 0.19' }),
      );
      y -= 13;
    }
    y -= 7;
  };
  const bullet = (value: string) => {
    const clean = value.replace(/^- /, '');
    const wrapped = wrapLine(clean, 82);
    wrapped.forEach((line, index) => {
      ensureSpace(15);
      if (index === 0)
        ops.push(
          drawText('-', margin + 6, y, {
            font: 'F2',
            size: 10,
            color: '0.03 0.50 0.51',
          }),
        );
      ops.push(
        drawText(line, margin + 22, y, { size: 9.4, color: '0.13 0.17 0.19' }),
      );
      y -= 12.5;
    });
    y -= 3;
  };

  newPage(true);
  for (const item of resume.sections) {
    section(item.title);
    for (const row of item.rows) {
      if (row.startsWith('- ')) bullet(row);
      else paragraph(row);
    }
    y -= 3;
  }
  pushPage();
  return buildPdfFromPages(pages, title);
}

export function pdfFileName(name: string) {
  return `${name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 90)}.pdf`;
}
