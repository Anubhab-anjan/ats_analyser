/**
 * Generates a clean, publication-ready HTML version of the academic report.
 * Includes @media print stylesheet for browser printing / PDF export.
 */

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'PROJECT_REPORT.md');
const outHtmlPath = path.join(__dirname, '..', 'PROJECT_REPORT.html');

const markdown = fs.readFileSync(mdPath, 'utf8');

function simpleMarkdownToHtml(md) {
  let lines = md.split('\n');
  let html = [];
  let inCode = false;
  let codeBuffer = [];
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        html.push('<pre><code>' + escapeHtml(codeBuffer.join('\n')) + '</code></pre>');
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      let cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c))) continue;

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      html.push(renderTable(tableHeader, tableRows));
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }

    if (!line.trim()) continue;

    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      html.push('<hr>');
      continue;
    }

    if (line.startsWith('# ')) {
      html.push('<h1>' + formatInline(line.slice(2)) + '</h1>');
    } else if (line.startsWith('## ')) {
      html.push('<h2>' + formatInline(line.slice(3)) + '</h2>');
    } else if (line.startsWith('### ')) {
      html.push('<h3>' + formatInline(line.slice(4)) + '</h3>');
    } else if (line.startsWith('#### ')) {
      html.push('<h4>' + formatInline(line.slice(5)) + '</h4>');
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      html.push('<ul><li>' + formatInline(line.slice(2)) + '</li></ul>');
    } else if (/^\d+\.\s+/.test(line)) {
      html.push('<ol><li>' + formatInline(line.replace(/^\d+\.\s+/, '')) + '</li></ol>');
    } else {
      html.push('<p>' + formatInline(line) + '</p>');
    }
  }

  if (inTable) {
    html.push(renderTable(tableHeader, tableRows));
  }

  return html.join('\n');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatInline(str) {
  return escapeHtml(str)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

function renderTable(headers, rows) {
  let th = headers.map(h => '<th>' + formatInline(h) + '</th>').join('');
  let tr = rows.map(r => '<tr>' + r.map(c => '<td>' + formatInline(c) + '</td>').join('') + '</tr>').join('');
  return '<div class="table-container"><table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
}

const bodyHtml = simpleMarkdownToHtml(markdown);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cloud Computing Project Report: AI Resume Analysis & ATS Scoring on AWS</title>
  <style>
    @page {
      size: letter;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px;
      background-color: #fff;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #003366;
    }
    .btn-print {
      background-color: #003366;
      color: white;
      border: none;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
    }
    h1 {
      color: #003366;
      font-size: 24px;
      border-bottom: 2px solid #003366;
      padding-bottom: 8px;
      margin-top: 25px;
    }
    h2 {
      color: #104e8b;
      font-size: 18px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 6px;
      margin-top: 22px;
      page-break-after: avoid;
    }
    h3 {
      color: #222;
      font-size: 15px;
      margin-top: 16px;
      page-break-after: avoid;
    }
    p, li {
      font-size: 13.5px;
      color: #2c3e50;
    }
    ul, ol {
      margin: 8px 0;
      padding-left: 24px;
    }
    pre {
      background-color: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 4px;
      padding: 12px;
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 11.5px;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    code {
      background-color: #f1f3f5;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 12px;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12.5px;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f2f5f8;
      font-weight: 700;
      color: #003366;
    }
    tr:nth-child(even) td {
      background-color: #fafbfc;
    }
    hr {
      border: none;
      border-top: 1px solid #e1e4e8;
      margin: 20px 0;
    }
    @media print {
      .print-header { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <span>Academic Project Report (Cloud Computing)</span>
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
  ${bodyHtml}
</body>
</html>`;

fs.writeFileSync(outHtmlPath, fullHtml);
console.log('Generated PROJECT_REPORT.html');
