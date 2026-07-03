#!/usr/bin/env node
// fetch-daily.js — 拉取 AI HOT 过去24小时精选，存为每日简报

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = process.argv[2] || 'f:/测试工具/AI公众号/每日简报';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0';

// 北京时间日期
const now = new Date();
const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = beijing.toISOString().slice(0, 10);
const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

const url = `https://aihot.virxact.com/api/public/items?mode=selected&since=${since}&take=50`;

console.log(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 拉取 AI HOT...`);

https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let json;
    try { json = JSON.parse(data); } catch (e) {
      console.error('  JSON 解析失败:', e.message);
      process.exit(1);
    }

    if (!json.items || json.items.length === 0) {
      console.log('  无新条目，跳过生成');
      process.exit(0);
    }

    const count = json.items.length;
    console.log(`  获取到 ${count} 条精选`);

    const categories = {
      'ai-models':  '模型发布/更新',
      'ai-products': '产品发布/更新',
      'industry':    '行业动态',
      'paper':       '论文研究',
      'tip':         '技巧与观点'
    };

    let md = `# AI HOT 每日简报 — ${today}\n\n`;
    md += `> 共 ${count} 条精选 | 数据来源 aihot.virxact.com | 时间窗：过去 24 小时\n\n---\n`;

    let num = 0;
    for (const [catKey, catLabel] of Object.entries(categories)) {
      const items = json.items.filter(i => i.category === catKey);
      if (items.length === 0) continue;
      md += `\n## ${catLabel}\n\n`;
      for (const item of items) {
        num++;
        const source = (item.source || '').replace(/[：:].*/, '').trim();
        let summary = item.summary || '';
        if (summary.length > 120) summary = summary.slice(0, 120) + '...';
        md += `${num}. **${item.title}** — ${source}\n`;
        if (summary) md += `   ${summary}\n`;
        md += `   ${item.url}\n\n`;
      }
    }

    const outFile = path.join(OUTPUT_DIR, `${today}.md`);
    fs.writeFileSync(outFile, md, 'utf-8');
    console.log(`  简报已保存: ${outFile}`);
    console.log(`  共 ${num} 条，${Object.keys(categories).length} 个版块`);

    // 清理超过30天的旧简报
    const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
    let deleted = 0;
    for (const f of files) {
      const filePath = path.join(OUTPUT_DIR, f);
      const stat = fs.statSync(filePath);
      if (now.getTime() - stat.mtimeMs > MAX_AGE) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }
    if (deleted > 0) console.log(`  清理过期简报: ${deleted} 个`);

    // 自动生成 WPS 可编辑的 .docx
    const { execSync } = require('child_process');
    try {
      execSync(`node "${path.join(__dirname, 'convert-to-docx.js')}" "${outFile}" "${outFile.replace(/\.md$/, '.docx')}"`, { stdio: 'pipe', timeout: 20000 });
      console.log(`  DOCX 已同步生成`);
    } catch (_) { console.log('  DOCX 转换跳过 (docx 模块未安装)'); }
  });
}).on('error', (err) => {
  console.error('  API 请求失败:', err.message);
  process.exit(1);
});
