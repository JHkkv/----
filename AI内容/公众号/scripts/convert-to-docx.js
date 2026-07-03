// convert-to-docx.js — 将公众号文章 markdown 转为 WPS 可编辑的 .docx
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, ExternalHyperlink, PageBreak
} = require('docx');

const INPUT = process.argv[2] || 'f:/测试工具/AI公众号/发布队列/001-AI时代的写作革命-从零到一的实战复盘.md';
const OUTPUT = process.argv[3] || INPUT.replace(/\.md$/, '.docx');

const md = fs.readFileSync(INPUT, 'utf-8');
const FONT = 'Microsoft YaHei';
const FONT_SIZE = 22;
const BODY_SPACING = { after: 120, line: 360 };

function p(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**'))
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, size: FONT_SIZE }));
      else if (part.startsWith('`') && part.endsWith('`'))
        runs.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: 20, shading: { fill: 'F0F0F0', type: ShadingType.CLEAR } }));
      else
        runs.push(new TextRun({ text: part, font: FONT, size: FONT_SIZE }));
    }
  }
  return new Paragraph({ spacing: BODY_SPACING, alignment: opts.align || AlignmentType.LEFT, ...opts.paragraphOpts, children: runs });
}

function heading(text, level) {
  const sizes = { 1: 36, 2: 28, 3: 24 };
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 360 : 240, after: 160 },
    children: [new TextRun({ text, font: FONT, size: sizes[level] || 24, bold: true })],
  });
}

function hr() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 1 } }, children: [] });
}

function codeBlock(text) {
  return text.split('\n').map(line =>
    new Paragraph({ spacing: { after: 0, line: 280 }, indent: { left: 360 }, shading: { fill: 'F5F5F5', type: ShadingType.CLEAR }, children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 18 })] })
  );
}

function quote(text) {
  return new Paragraph({ spacing: { after: 120, line: 360 }, indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: '2E75B6', space: 8 } }, children: [new TextRun({ text, font: FONT, size: 20, italics: true, color: '555555' })] });
}

const children = [];
const lines = md.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === '' && !line.startsWith('```')) { children.push(new Paragraph({ spacing: { after: 60 }, children: [] })); continue; }
  if (line.trim() === '---') { children.push(hr()); continue; }
  if (line.startsWith('# ')) { children.push(heading(line.slice(2), 1)); continue; }
  if (line.startsWith('## ')) { children.push(heading(line.slice(3), 2)); continue; }
  if (line.startsWith('### ')) { children.push(heading(line.slice(4), 3)); continue; }
  if (line.startsWith('> ')) { children.push(quote(line.slice(2))); continue; }
  if (line.startsWith('```')) { const codeLines = []; i++; while (i < lines.length && !lines[i].startsWith('```')) codeLines.push(lines[i++]); children.push(...codeBlock(codeLines.join('\n'))); continue; }
  if (line.startsWith('|')) {
    const tableLines = []; while (i < lines.length && lines[i].startsWith('|')) tableLines.push(lines[i++]); i--;
    if (tableLines.length >= 2) {
      const headers = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim());
      const dataRows = tableLines.slice(2); const colWidth = Math.floor(9360 / headers.length);
      const tableChildren = [];
      tableChildren.push(new TableRow({ tableHeader: true, children: headers.map(h => new TableCell({ width: { size: colWidth, type: WidthType.DXA }, shading: { fill: '2E75B6', type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, font: FONT, size: 20, bold: true, color: 'FFFFFF' })] })] })) }));
      for (const row of dataRows) {
        const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
        tableChildren.push(new TableRow({ children: headers.map((_, idx) => new TableCell({ width: { size: colWidth, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p(cells[idx] || '', { paragraphOpts: { spacing: { after: 0, line: 300 } } })] })) }));
      }
      children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: headers.map(() => colWidth), rows: tableChildren }));
    }
    continue;
  }
  children.push(p(line));
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: FONT_SIZE } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: FONT }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'AI 日报', font: FONT, size: 18, color: '999999' })] })] }) }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '- ', font: FONT, size: 18, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '999999' }), new TextRun({ text: ' -', font: FONT, size: 18, color: '999999' })] })] }) }, children }],
});

Packer.toBuffer(doc).then(buffer => { fs.writeFileSync(OUTPUT, buffer); console.log('OK: ' + OUTPUT); });
