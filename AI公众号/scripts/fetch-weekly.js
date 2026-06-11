// fetch-weekly.js — 拉取过去7天AI HOT全量数据，聚合为周报素材
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = process.argv[2] || 'f:/测试工具/AI公众号/周报';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0';

const now = new Date();
const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

// 找到本周一的日期作为周报标识
const dayOfWeek = beijing.getUTCDay();
const monday = new Date(beijing.getTime());
monday.setUTCDate(beijing.getUTCDate() - ((dayOfWeek + 6) % 7));
const weekLabel = monday.toISOString().slice(0, 10);

// 拉全部条目（含未精选的有趣内容）
const url = `https://aihot.virxact.com/api/public/items?mode=all&since=${since}&take=100`;

const fetchPage = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
  }).on('error', reject);
});

console.log(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 拉取本周 AI HOT 全量数据...`);

(async () => {
  let allItems = [];
  let page1 = await fetchPage(url);
  allItems = page1.items || [];

  // 如果需要翻页
  if (page1.hasNext && page1.nextCursor) {
    const page2Url = url + '&cursor=' + page1.nextCursor;
    let page2 = await fetchPage(page2Url);
    allItems = allItems.concat(page2.items || []);
  }

  console.log(`  获取到 ${allItems.length} 条（含精选和非精选）`);

  const categories = {
    'ai-models':  '模型发布/更新',
    'ai-products': '产品发布/更新',
    'industry':    '行业动态',
    'paper':       '论文研究',
    'tip':         '技巧与观点'
  };

  // 按精选/非精选分开
  const selected = allItems.filter(i => true); // 全量池里AI HOT没有精选标记,先全保留
  // actually the API response might not have an aiSelected field in all mode
  // 按 category 分组

  const byCategory = {};
  for (const cat of Object.keys(categories)) {
    byCategory[cat] = allItems.filter(i => i.category === cat);
  }

  // 识别潜在"有趣"条目：summary 中含特定信号词（幽默/奇怪/争议/意外）
  const funSignals = ['有趣', '奇', '首次', '突破', '争议', '秘密', '泄露', '惊人', '没想到', '反转'];
  const funItems = allItems.filter(i => {
    const text = (i.title + (i.summary || '')).toLowerCase();
    return funSignals.some(s => text.includes(s));
  });

  // 按热度简单排序（暂用 publishedAt 越新越靠前）
  allItems.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

  // 生成素材
  let md = `# AI 周报素材 — ${weekLabel} 周\n\n`;
  md += `> 聚合过去 7 天 ${allItems.length} 条 AI 动态 | 含全量池 ### 用于人工精选编写周报\n\n`;
  md += `---\n\n`;

  md += `## 本周统计\n\n`;
  md += `| 类别 | 条数 |\n|---|---|\n`;
  for (const [cat, label] of Object.entries(categories)) {
    md += `| ${label} | ${byCategory[cat]?.length || 0} |\n`;
  }
  md += `| **合计** | **${allItems.length}** |\n\n`;
  md += `---\n\n`;

  // 各分类 TOP 条目
  for (const [cat, label] of Object.entries(categories)) {
    const items = byCategory[cat];
    if (!items || items.length === 0) continue;
    md += `## ${label} (${items.length}条)\n\n`;
    for (const item of items.slice(0, 15)) {
      const source = (item.source || '').replace(/[：:].*/, '').trim();
      let summary = item.summary || '';
      if (summary.length > 150) summary = summary.slice(0, 150) + '...';
      md += `- **${item.title}** — ${source}\n`;
      if (summary) md += `  ${summary}\n`;
      md += `  ${item.url}\n`;
    }
    md += '\n';
  }

  // 潜在有趣条目
  md += `---\n\n## 潜在有趣条目 (${funItems.length}条，供"有趣但不重要"栏目挑选)\n\n`;
  for (const item of funItems.slice(0, 20)) {
    const source = (item.source || '').replace(/[：:].*/, '').trim();
    md += `- **${item.title}** — ${source}\n  ${item.url}\n`;
  }

  const outFile = path.join(OUTPUT_DIR, `素材-${weekLabel}.md`);
  fs.writeFileSync(outFile, md, 'utf-8');
  console.log(`  周报素材已保存: ${outFile}`);
  console.log(`  ${allItems.length} 条全量 → 请在素材基础上编写正式周报`);
})();
