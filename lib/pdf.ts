const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 54;
const lineHeight = 15;
const contentWidth = pageWidth - margin * 2;
type FontName = 'F1' | 'F2';

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
    'Education and Accreditations',
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

function buildPdfFromStreams(streams: string[], title: string) {
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
  for (const operations of streams) {
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

export function createResumePdfBlob(text: string, title: string) {
  const resume = parseResumeDraft(text);
  const streams: string[] = [];
  let ops: string[] = [];
  let y = 0;
  const newPage = (first = false) => {
    if (ops.length) streams.push(ops.join('\n'));
    ops = [];
    ops.push(fillRect(0, pageHeight - 118, pageWidth, 118, '0.06 0.18 0.22'));
    ops.push(fillRect(0, pageHeight - 122, pageWidth, 4, '0.03 0.50 0.51'));
    ops.push(drawText(resume.name.toUpperCase(), margin, pageHeight - 48, {
      font: 'F2',
      size: first ? 22 : 16,
      color: '1 1 1',
    }));
    ops.push(
      drawText(
        resume.subtitle.replace('TAILORED RESUME - ', ''),
        margin,
        pageHeight - 71,
        {
          font: 'F1',
          size: 9,
          color: '0.78 0.87 0.89',
        },
      ),
    );
    resume.contact.slice(0, 4).forEach((line, index) => {
      ops.push(
        drawText(line, margin, pageHeight - 90 - index * 11, {
          size: 8.5,
          color: '0.88 0.94 0.95',
        }),
      );
    });
    y = pageHeight - 155;
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
  if (ops.length) streams.push(ops.join('\n'));
  return buildPdfFromStreams(streams, title);
}

export function pdfFileName(name: string) {
  return `${name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 90)}.pdf`;
}
