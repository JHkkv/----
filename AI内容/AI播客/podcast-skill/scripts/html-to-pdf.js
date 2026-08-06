// html-to-pdf.js — 用 puppeteer-core 驱动本机 Edge(CDP) 把 HTML 转 PDF
// 用法: node html-to-pdf.js <input.html> <output.pdf>
const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) { console.error('用法: node html-to-pdf.js <input.html> <output.pdf>'); process.exit(1); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--user-data-dir=' + path.join(process.env.TEMP, 'edge_pdf_profile')],
  });
  try {
    const page = await browser.newPage();
    const abs = path.resolve(input);
    await page.goto('file://' + abs.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500)); // 等分页 JS 跑完
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    });
    console.log('PDF OK: ' + output);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
