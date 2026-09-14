const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 54;
const lineHeight = 15;
const contentWidth = pageWidth - margin * 2;

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
  const pageRefs: number[] = [];

  for (const page of pages) {
    const operations = page
      .map((line, index) => {
        const y = pageHeight - margin - index * lineHeight;
        return `BT /F1 10 Tf ${margin} ${y.toFixed(2)} Td (${escapePdfText(line)}) Tj ET`;
      })
      .join('\n');
    const streamObject = add(
      `<< /Length ${operations.length} >>\nstream\n${operations}\nendstream`,
    );
    const pageObject = add(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${streamObject} 0 R >>`,
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

export function pdfFileName(name: string) {
  return `${name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 90)}.pdf`;
}
