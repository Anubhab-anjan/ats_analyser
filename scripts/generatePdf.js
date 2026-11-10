/**
 * Standalone PDF Generator for Academic Project Report
 * Compiles PROJECT_REPORT.md into a publication-quality multi-page PDF document.
 * Requires zero external binaries.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// PDF Metric Constants (Points: 72 points per inch, US Letter: 612 x 792)
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 54;
const MARGIN_RIGHT = 54;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Approximate character widths relative to font size (1 em) for standard PDF fonts
const CHAR_WIDTH_RATIOS = {
  regular: 0.52,
  bold: 0.56,
  mono: 0.60
};

function estimateTextWidth(text, fontSize, type = 'regular') {
  const ratio = CHAR_WIDTH_RATIOS[type] || 0.52;
  return text.length * fontSize * ratio;
}

function wrapText(text, maxWidth, fontSize, type = 'regular') {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (estimateTextWidth(testLine, fontSize, type) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapePdfText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022]/g, '*')
    .replace(/[^\x20-\x7E]/g, ' '); // Keep standard printable ASCII
}

class PdfDocument {
  constructor() {
    this.pages = [];
    this.currentPage = null;
    this.currentY = PAGE_HEIGHT - MARGIN_TOP;
    this.newPage();
  }

  newPage() {
    this.currentPage = {
      commands: []
    };
    this.pages.push(this.currentPage);
    this.currentY = PAGE_HEIGHT - MARGIN_TOP - 20; // Room for running header
  }

  checkPageBreak(neededHeight) {
    if (this.currentY - neededHeight < MARGIN_BOTTOM + 20) { // Room for footer
      this.newPage();
    }
  }

  addText(text, fontSize = 10, fontRef = '/F1', x = MARGIN_LEFT, gray = 0) {
    const escaped = escapePdfText(text);
    this.currentPage.commands.push(
      `BT ${fontRef} ${fontSize} Tf ${gray} g ${x.toFixed(2)} ${this.currentY.toFixed(2)} Td (${escaped}) Tj ET`
    );
  }

  addLine(x1, y1, x2, y2, lineWidth = 0.5, gray = 0.7) {
    this.currentPage.commands.push(
      `${gray} G ${lineWidth} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
  }

  addRect(x, y, w, h, fillGray = 0.95, strokeGray = 0.8) {
    this.currentPage.commands.push(
      `${fillGray} g ${strokeGray} G 0.5 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`
    );
  }

  // High level document elements
  addTitle(text) {
    this.checkPageBreak(50);
    this.currentY -= 10;
    const lines = wrapText(text, USABLE_WIDTH, 20, 'bold');
    lines.forEach(l => {
      this.addText(l, 20, '/F2', MARGIN_LEFT, 0.05);
      this.currentY -= 24;
    });
    this.currentY -= 6;
  }

  addHeading1(text) {
    this.checkPageBreak(40);
    this.currentY -= 14;
    const lines = wrapText(text, USABLE_WIDTH, 14, 'bold');
    lines.forEach(l => {
      this.addText(l, 14, '/F2', MARGIN_LEFT, 0.1);
      this.currentY -= 17;
    });
    // Add thin divider under H1
    this.addLine(MARGIN_LEFT, this.currentY + 6, PAGE_WIDTH - MARGIN_RIGHT, this.currentY + 6, 1, 0.75);
    this.currentY -= 8;
  }

  addHeading2(text) {
    this.checkPageBreak(30);
    this.currentY -= 10;
    const lines = wrapText(text, USABLE_WIDTH, 12, 'bold');
    lines.forEach(l => {
      this.addText(l, 12, '/F2', MARGIN_LEFT, 0.15);
      this.currentY -= 15;
    });
    this.currentY -= 4;
  }

  addHeading3(text) {
    this.checkPageBreak(25);
    this.currentY -= 8;
    const lines = wrapText(text, USABLE_WIDTH, 10.5, 'bold');
    lines.forEach(l => {
      this.addText(l, 10.5, '/F2', MARGIN_LEFT, 0.2);
      this.currentY -= 13;
    });
    this.currentY -= 3;
  }

  addParagraph(text) {
    if (!text.trim()) return;
    const lines = wrapText(text, USABLE_WIDTH, 9.5, 'regular');
    this.checkPageBreak(lines.length * 13 + 6);
    lines.forEach(line => {
      this.addText(line, 9.5, '/F1', MARGIN_LEFT, 0.15);
      this.currentY -= 12.5;
    });
    this.currentY -= 4;
  }

  addBullet(text, level = 0) {
    const indent = MARGIN_LEFT + (level * 16) + 12;
    const bulletWidth = USABLE_WIDTH - (level * 16) - 12;
    const lines = wrapText(text, bulletWidth, 9.5, 'regular');
    this.checkPageBreak(lines.length * 13 + 4);

    // Draw bullet symbol
    this.addText('-', 9.5, '/F2', indent - 9, 0.2);

    lines.forEach((line, idx) => {
      this.addText(line, 9.5, '/F1', indent, 0.15);
      this.currentY -= 12.5;
    });
    this.currentY -= 2;
  }

  addCodeBlock(lines) {
    const blockHeight = lines.length * 11 + 14;
    this.checkPageBreak(Math.min(blockHeight, 200));

    const yStart = this.currentY;
    lines.forEach((line, idx) => {
      if (this.currentY < MARGIN_BOTTOM + 25) {
        this.newPage();
      }
      // Subdued background strip
      this.addRect(MARGIN_LEFT, this.currentY - 2, USABLE_WIDTH, 11, 0.96, 0.96);
      this.addText(line.slice(0, 85), 8, '/F3', MARGIN_LEFT + 6, 0.2);
      this.currentY -= 11;
    });
    this.currentY -= 8;
  }

  addTable(headers, rows) {
    const colCount = headers.length;
    const colWidth = USABLE_WIDTH / colCount;
    const rowHeight = 18;

    this.checkPageBreak(rowHeight * (rows.length + 1) + 10);

    // Header row
    this.addRect(MARGIN_LEFT, this.currentY - 4, USABLE_WIDTH, rowHeight, 0.88, 0.7);
    headers.forEach((h, i) => {
      const x = MARGIN_LEFT + (i * colWidth) + 6;
      this.addText(h, 9, '/F2', x, 0.05);
    });
    this.currentY -= rowHeight;

    // Body rows
    rows.forEach((row, rIdx) => {
      this.checkPageBreak(rowHeight + 10);
      const bgGray = rIdx % 2 === 0 ? 0.98 : 0.94;
      this.addRect(MARGIN_LEFT, this.currentY - 4, USABLE_WIDTH, rowHeight, bgGray, 0.85);

      row.forEach((cell, cIdx) => {
        const x = MARGIN_LEFT + (cIdx * colWidth) + 6;
        const cellText = String(cell).slice(0, 32);
        this.addText(cellText, 8.5, '/F1', x, 0.15);
      });
      this.currentY -= rowHeight;
    });

    this.currentY -= 8;
  }

  // Compile final PDF stream with xref table and trailer
  compilePdf() {
    const totalPages = this.pages.length;

    // Stamp running headers and footers onto every page
    this.pages.forEach((page, pIdx) => {
      const pageNum = pIdx + 1;
      // Running Header (except first page)
      if (pageNum > 1) {
        page.commands.unshift(
          `BT /F1 8 Tf 0.4 g ${MARGIN_LEFT} ${PAGE_HEIGHT - MARGIN_TOP + 10} Td (Cloud Computing Project: AI Resume Analysis & ATS Scoring on AWS) Tj ET`,
          `0.8 G 0.5 w ${MARGIN_LEFT} ${PAGE_HEIGHT - MARGIN_TOP + 5} m ${PAGE_WIDTH - MARGIN_RIGHT} ${PAGE_HEIGHT - MARGIN_TOP + 5} l S`
        );
      }

      // Running Footer
      page.commands.push(
        `0.8 G 0.5 w ${MARGIN_LEFT} ${MARGIN_BOTTOM - 5} m ${PAGE_WIDTH - MARGIN_RIGHT} ${MARGIN_BOTTOM - 5} l S`,
        `BT /F1 8 Tf 0.4 g ${MARGIN_LEFT} ${MARGIN_BOTTOM - 16} Td (Department of Computer Science - Cloud Computing Final Submission) Tj ET`,
        `BT /F2 8 Tf 0.4 g ${PAGE_WIDTH - MARGIN_RIGHT - 55} ${MARGIN_BOTTOM - 16} Td (Page ${pageNum} of ${totalPages}) Tj ET`
      );
    });

    let objIndex = 1;
    const objects = [];

    const catalogId = objIndex++;
    const pagesId = objIndex++;
    const fontRegularId = objIndex++;
    const fontBoldId = objIndex++;
    const fontMonoId = objIndex++;

    const pageObjIds = [];
    const contentObjIds = [];

    this.pages.forEach(() => {
      pageObjIds.push(objIndex++);
      contentObjIds.push(objIndex++);
    });

    // 1. Catalog
    objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

    // 2. Pages
    const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
    objects[pagesId] = `<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${totalPages} >>`;

    // 3. Fonts
    objects[fontRegularId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[fontBoldId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;
    objects[fontMonoId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>`;

    // 4. Pages and Content streams
    this.pages.forEach((page, idx) => {
      const pId = pageObjIds[idx];
      const cId = contentObjIds[idx];
      const streamContent = page.commands.join('\n');
      const streamLen = Buffer.byteLength(streamContent, 'utf8');

      objects[pId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [ 0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} ] ` +
        `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontMonoId} 0 R >> >> ` +
        `/Contents ${cId} 0 R >>`;

      objects[cId] = `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`;
    });

    // Build byte-accurate PDF file
    let pdf = '%PDF-1.4\n';
    const offsets = [];

    for (let i = 1; i < objIndex; i++) {
      offsets[i] = Buffer.byteLength(pdf, 'latin1');
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objIndex}\n`;
    pdf += '0000000000 65535 f \n';

    for (let i = 1; i < objIndex; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objIndex} /Root ${catalogId} 0 R >>\n`;
    pdf += `startxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
  }
}

/**
 * Parse Markdown lines from PROJECT_REPORT.md and add to PDF
 */
function markdownToPdf(markdownContent, outputPath) {
  const doc = new PdfDocument();
  const lines = markdownContent.split('\n');

  let inCodeBlock = false;
  let codeLines = [];
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        doc.addCodeBlock(codeLines);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*/g, ''));
      // Divider row
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      doc.addTable(tableHeaders, tableRows);
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    // Empty lines
    if (!line.trim()) {
      doc.currentY -= 6;
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      doc.addLine(MARGIN_LEFT, doc.currentY, PAGE_WIDTH - MARGIN_RIGHT, doc.currentY, 0.75, 0.8);
      doc.currentY -= 10;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      doc.addTitle(line.replace(/^#\s+/, '').replace(/\*\*/g, ''));
    } else if (line.startsWith('## ')) {
      doc.addHeading1(line.replace(/^##\s+/, '').replace(/\*\*/g, ''));
    } else if (line.startsWith('### ')) {
      doc.addHeading2(line.replace(/^###\s+/, '').replace(/\*\*/g, ''));
    } else if (line.startsWith('#### ')) {
      doc.addHeading3(line.replace(/^####\s+/, '').replace(/\*\*/g, ''));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      doc.addBullet(line.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''), 0);
    } else if (/^\d+\.\s+/.test(line)) {
      doc.addBullet(line.replace(/^\d+\.\s+/, '').replace(/\*\*/g, ''), 0);
    } else {
      doc.addParagraph(line.replace(/\*\*/g, ''));
    }
  }

  // Flush trailing table
  if (inTable) {
    doc.addTable(tableHeaders, tableRows);
  }

  const pdfBuffer = doc.compilePdf();
  fs.writeFileSync(outputPath, pdfBuffer);
  return {
    buffer: pdfBuffer,
    pageCount: doc.pages.length,
    sizeBytes: pdfBuffer.length
  };
}

// Generate the PDF
const mdPath = path.join(__dirname, '..', 'PROJECT_REPORT.md');
const outPdfPath = path.join(__dirname, '..', 'PROJECT_REPORT.pdf');

console.log(`Reading ${mdPath}...`);
const markdown = fs.readFileSync(mdPath, 'utf8');

console.log(`Generating PDF to ${outPdfPath}...`);
const result = markdownToPdf(markdown, outPdfPath);
console.log(`Generated PROJECT_REPORT.pdf: ${result.pageCount} pages, ${result.sizeBytes} bytes.`);

// Verify with pdf-parse
pdfParse(result.buffer).then(parsed => {
  console.log(`[Verification] pdf-parse successfully parsed ${parsed.numpages} pages.`);
  console.log(`[Verification] Text length: ${parsed.text.length} characters.`);
}).catch(err => {
  console.error('[Verification Failed]:', err);
});
