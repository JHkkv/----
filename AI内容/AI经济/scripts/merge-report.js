// merge-report.js — 合并所有原始数据，经过去重+冲突裁决后生成汇报文件

const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { log } = require('./lib/curl-helper');
const { filterAndRank, countByRegion } = require('./lib/filter-engine');
const { dedupByURL, dedupByTitle, crossRoundDedup, updateHistory } = require('./lib/dedup');
const { resolveAll, detectConflicts } = require('./lib/conflict-resolver');

const now = new Date();
const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = beijing.toISOString().slice(0, 10);
const nowStr = beijing.toLocaleString('zh-CN', { hour12: false });

function getCurrentRound() {
  const statusFile = path.join(CONFIG.META_DIR, 'task-status.json');
  try {
    const s = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
    return (s.currentRound || 0) + 1;
  } catch (_) {
    return 1;
  }
}

function readStatus() {
  const statusFile = path.join(CONFIG.META_DIR, 'task-status.json');
  try {
    return JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
  } catch (_) {
    return { currentRound: 0, rounds: [], status: 'active', startDate: CONFIG.START_DATE, endDate: CONFIG.END_DATE };
  }
}

function pad(n) { return String(n).padStart(2, '0'); }

// ---- Main ----
(async () => {
  const status = readStatus();
  const round = status.currentRound + 1;

  // 检查是否到期
  const todayDate = beijing.toISOString().slice(0, 10);
  if (round > CONFIG.MAX_ROUNDS || todayDate > CONFIG.END_DATE) {
    log('warn', `项目已到期 (第 ${status.currentRound} 轮 / ${CONFIG.END_DATE})，停止采集。`);
    status.status = 'expired';
    fs.writeFileSync(path.join(CONFIG.META_DIR, 'task-status.json'), JSON.stringify(status, null, 2), 'utf-8');
    process.exit(0);
  }

  log('info', `=== 第 ${round}/${CONFIG.MAX_ROUNDS} 轮 合并汇报生成 ===\n`);

  // 1. 读取本轮所有原始数据
  const prefix = `round-${pad(round)}`;
  const dataDir = CONFIG.DATA_DIR;
  const rawFiles = [
    path.join(dataDir, `${prefix}-domestic.json`),
    path.join(dataDir, `${prefix}-international.json`),
    path.join(dataDir, `${prefix}-indicators.json`),
    path.join(dataDir, `${prefix}-websearch.json`),
  ];

  let allItems = [];
  for (const f of rawFiles) {
    if (fs.existsSync(f)) {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
        log('info', `读取 ${path.basename(f)}: ${data.length} 条`);
        allItems = [...allItems, ...data];
      } catch (e) {
        log('warn', `无法读取 ${f}: ${e.message}`);
      }
    } else {
      log('warn', `文件不存在: ${f}`);
    }
  }

  if (allItems.length === 0) {
    log('warn', '本轮无数据，跳过报告生成。');
    process.exit(0);
  }

  log('info', `原始总计: ${allItems.length} 条`);

  // 2. URL 去重
  const { unique: afterURL, duplicates: urlDups } = dedupByURL(allItems);
  log('info', `URL去重后: ${afterURL.length} 条 (剔除 ${urlDups.length})`);

  // 3. 标题相似度去重
  const { unique: afterTitle, duplicates: titleDups } = dedupByTitle(afterURL, 3);
  log('info', `标题去重后: ${afterTitle.length} 条 (剔除 ${titleDups.length})`);

  // 4. 跨轮次去重
  const historyFile = path.join(CONFIG.META_DIR, 'history.json');
  const { newItems, seenItems } = crossRoundDedup(afterTitle, historyFile);
  log('info', `跨轮去重后: ${newItems.length} 条 (已见 ${seenItems.length})`);

  // 5. 冲突检测与裁决
  const { resolved: finalItems, conflicts } = resolveAll(newItems, 'domestic');
  log('info', `冲突裁决后: ${finalItems.length} 条 (冲突 ${conflicts.length} 组)`);

  // 6. 最终过滤排序
  const ranked = filterAndRank(finalItems, { minScore: 10 });
  log('info', `最终精选: ${ranked.length} 条`);

  // 7. 按分类分组
  const categorized = {
    'macro-policy': ranked.filter((i) => i.category === 'macro-policy' || i.region === 'domestic'),
    'industry-capital': ranked.filter((i) => i.category === 'industry-capital'),
    'concept-stocks': ranked.filter((i) => i.category === 'concept-stocks'),
    'global-dynamics': ranked.filter((i) => i.region === 'international' || i.category === 'global-dynamics'),
    'academic-trends': ranked.filter((i) => i.category === 'academic-trends' || i.source?.includes('arXiv')),
  };

  // 单独分离国内/国际统计
  const domestic = ranked.filter((i) => i.region === 'domestic');
  const international = ranked.filter((i) => i.region === 'international');

  // 8. 检测重大变化标记
  function getMarker(item) {
    // 检查前一轮数据来确定趋势
    // 这里简化处理: 如果有 dataPoint 且包含涨跌幅，根据值标注
    if (item.dataPoint && item.dataPoint.changePercent !== undefined) {
      const pct = parseFloat(item.dataPoint.changePercent);
      if (pct > 3) return CONFIG.MARKERS.UP;
      if (pct < -3) return CONFIG.MARKERS.DOWN;
    }
    return '';
  }

  // 高热度检测: 同一事件多来源报道
  const { detectConflicts: detectConflictsLocal } = require('./lib/conflict-resolver');
  const detected2 = detectConflictsLocal(ranked);
  const hotEvents = detected2.filter((g) => g.items.length >= 3);

  // 9. 卡片式 Markdown 生成
  const domPct = ranked.length > 0 ? (domestic.length / ranked.length * 100).toFixed(1) : '0';
  const dedupTotal = urlDups.length + titleDups.length + seenItems.length;

  let md = '';
  // ---- 顶部标签栏 ----
  md += `# 🤖 AI+经济情报 · 第${round}轮\n\n`;
  md += `\`\`\`\n`;
  md += `📅 ${today}  ⏰ ${nowStr.slice(-8)}  📡 36Kr/新浪/HN/arXiv/GitHub/AIHOT/WebSearch\n`;
  md += `📊 ${ranked.length}条精选  🇨🇳${domestic.length}条 / 🌍${international.length}条  (原始${allItems.length}条 → 去重${dedupTotal}条)  🔄${round}/${CONFIG.MAX_ROUNDS}轮\n`;
  md += `🆕新  🔥热  ⚠️风险  📈↑  📉↓  ⚡冲突\n`;
  md += `\`\`\`\n\n`;

  // ---- 辅助函数 ----
  function shortDate(d) { return (d || '').slice(0, 10).replace(/^2026-/, ''); }
  function shortSrc(item) {
    const s = (item.source || '').replace(/WebSearch|AI HOT \(|公众号：|X：|IT之家|TechCrunch|Hacker News/g, '');
    return s.length > 15 ? s.slice(0, 14) + '…' : s;
  }
  function shortDomain(item) {
    try { return (new URL(item.url || '')).hostname.replace('www.', ''); } catch (_) { return ''; }
  }
  // 大变化检测: 金额+政策+管制类自动标注
  function getMarker(item) {
    const t = (item.title + (item.summary || '')).toLowerCase();
    if (/管制|制裁|出口限制|ban|curb|restrict|第三轮|收紧|警告/i.test(t)) return '🔴';
    if (/融资|投资|估值|ipo|上市|收购|并购|募资|亿|billion|million.*dollar|raised|series/i.test(t)) return '🟡';
    if (/政策|措施|方案|规划|国务院|工信部|发改委|regulation|act\s*2/i.test(t)) return '🟢';
    if (/财报|营收|利润|亏损|增速|增长|revenue|profit|earning/i.test(t)) return '🔵';
    if (/风险|泡沫|警告|跌|下滑|裁员|layoff/i.test(t)) return '🔴';
    return '';
  }
  // 提取数值亮点
  function extractMetric(item) {
    const t = item.title + ' ' + (item.summary || '');
    const patterns = [
      /(\d+[\d,.]*\s*亿[美中]?元?)/,
      /(\d+[\d,.]*\s*亿)/,
      /(\d+[\d,.]*\s*万亿)/,
      /(\$\d+[\d,.]*\s*[BMK]i?l?l?i?o?n?)/i,
      /(\d+[\d,.]*%\s*(?:增长|增速|上涨|下跌)?)/,
      /((?:增长|增速|同比|环比)\s*\d+[\d,.]*%)/,
    ];
    for (const p of patterns) {
      const m = t.match(p);
      if (m) return m[1];
    }
    return '';
  }

  // ---- 第一步: 构建分类归组 ----
  // 分组定义: { label, emoji, keywords, items }
  const GROUPS = [
    { label: '宏观政策', emoji: '📋', kws: /政策|措施|方案|法规|监管|管制|export.curb|restrict|sanction|国务院|工信部|发改委|商务部|芯片.*出口|半导体.*禁/i },
    { label: '资本市场', emoji: '💰', kws: /融资|投资|估值|IPO|上市|收购|并购|财报|营收|利润|revenue|earning|funding|investment|valuation|raised|series|billion|million.*dollar|季报|Q[1234]\b/i },
    { label: '行情数据', emoji: '📈', kws: /行情|涨跌|指数|板块|股价|市值|价\b.*\d|%|概念股|纳斯达克|道琼斯|标普|恒生|日经|DAX/i },
    { label: '全球动态', emoji: '🌍', kws: /AI.*economy|芯片.*战|贸易|关税|Chips Act|华尔街|银行.*AI|央行|LPR|利率|通胀/i },
    { label: '学术开源', emoji: '🔬', kws: /arXiv|GitHub|论文|research|paper|开源|paper|模型.*开源|⭐\s*\d/i },
  ];

  function matchGroup(item) {
    const t = item.title + ' ' + (item.summary || '');
    for (const g of GROUPS) {
      if (g.kws.test(t)) return g;
    }
    // 默认: 国内→宏观政策, 国外→全球动态
    if ((item.region || '') === 'domestic') return GROUPS[0];
    return GROUPS[3];
  }

  // 分组归类 (去重: 同一条目只出现在第一个匹配组)
  const assigned = new Set();
  const groupBuckets = {};
  for (const g of GROUPS) groupBuckets[g.label] = [];

  for (const item of ranked) {
    const g = matchGroup(item);
    groupBuckets[g.label].push(item);
  }

  // 合并"行情数据"太少时并入"资本市场"
  if (groupBuckets['行情数据'].length < 3) {
    groupBuckets['资本市场'] = [...groupBuckets['资本市场'], ...groupBuckets['行情数据']];
    groupBuckets['行情数据'] = [];
  }

  // 实际输出的组
  const activeGroups = GROUPS.filter(g => groupBuckets[g.label].length > 0);

  // ---- 第二步: 逐组渲染 ----
  for (const g of activeGroups) {
    const items = groupBuckets[g.label].slice(0, 15);
    md += `---\n`;
    md += `## ${g.emoji} ${g.label} · ${items.length}条\n\n`;

    for (const item of items) {
      const marker = getMarker(item);
      const metric = extractMetric(item);
      const dateStr = shortDate(item.publishedAt);
      const domain = shortDomain(item);

      // 标题行: 标记 + 粗体标题 + 数值亮点
      md += `**${marker} ${item.title}**`;
      if (metric) md += `  \`${metric}\``;
      md += `\n`;

      // 摘要行(截断80字)
      const summary = (item.summary || '').replace(/\s+/g, ' ').trim();
      if (summary.length > 5) {
        md += `> ${summary.slice(0, 100)}${summary.length > 100 ? '…' : ''}\n`;
      }

      // 来源行
      md += `→ ${item.source} · [${domain}](${item.url})`;
      if (dateStr) md += ` · ${dateStr}`;
      md += `\n\n`;
    }
  }

  // ---- 第三步: 冲突记录 ----
  if (conflicts.length > 0) {
    md += `---\n`;
    md += `## ⚡ 来源冲突 · ${conflicts.length}组\n\n`;
    for (const c of conflicts) {
      md += `- **${c.event.slice(0, 40)}** → 采用 ${c.winner?.source || '-'}，替代 ${c.losers.map(l => l.source).join('、')}\n`;
    }
    md += `\n`;
  }

  // ---- 第四步: 热门事件 ----
  const detected3 = detectConflicts(ranked);
  const hotEvents3 = detected3.filter((g) => g.items.length >= 3);
  if (hotEvents3.length > 0) {
    md += `---\n`;
    md += `## 🔥 高热度事件 · ≥3来源\n\n`;
    for (const h of hotEvents3.slice(0, 5)) {
      md += `- **${h.event.slice(0, 50)}** — ${h.items.length}个来源同时报道\n`;
    }
    md += `\n`;
  }

  // ---- 第五步: 统计面板 ----
  const regions = countByRegion(ranked);
  const sourceCounts = {};
  for (const item of ranked) {
    const s = item.source || '未知';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }

  md += `---\n`;
  md += `## 📊 统计面板\n\n`;
  md += `\`\`\`\n`;
  md += `总条目 ${ranked.length}    国内 ${regions.domestic} (${(regions.domestic/Math.max(1,ranked.length)*100).toFixed(1)}%)    国际 ${regions.international}\n`;
  md += `原始 ${allItems.length}  →  URL去重${urlDups.length}  +  标题去重${titleDups.length}  +  跨轮去重${seenItems.length}  =  精选${ranked.length}\n`;
  md += `来源 ${Object.keys(sourceCounts).length}个  ·  冲突 ${conflicts.length}组  ·  高热度 ${hotEvents.length}个\n`;
  md += `\`\`\`\n\n`;
  md += `**来源分布:** `;
  md += Object.entries(sourceCounts).sort((a,b) => b[1]-a[1]).map(([s,c]) => `${s}×${c}`).join(' · ');
  md += `\n\n`;

  md += `---\n`;
  md += `> ⚠️ 全部信息可追溯原始URL。数据冲突按权威优先级裁决。不可编造。\n`;
  md += `> 📌 ${CONFIG.START_DATE} → ${CONFIG.END_DATE} · ${round}/${CONFIG.MAX_ROUNDS}轮 · 到期自动停止\n`;

  // 10. 写汇报文件
  const reportFile = path.join(CONFIG.REPORTS_DIR, `轮次${pad(round)}-${today}.md`);
  fs.writeFileSync(reportFile, md, 'utf-8');
  log('info', `汇报已生成: ${reportFile}`);

  // 11. 更新状态
  status.currentRound = round;
  status.rounds = status.rounds || [];
  status.rounds.push({
    round,
    date: today,
    rawCount: allItems.length,
    finalCount: ranked.length,
    domestic: regions.domestic,
    international: regions.international,
    conflicts: conflicts.length,
    sources: Object.keys(sourceCounts).length,
  });
  status.lastRun = new Date().toISOString();

  // 检查是否最后一轮
  if (round >= CONFIG.MAX_ROUNDS || todayDate >= CONFIG.END_DATE) {
    status.status = 'review_needed';
    log('info', '🎯 已达最后一轮，标记为待复盘状态。');
  }

  fs.writeFileSync(
    path.join(CONFIG.META_DIR, 'task-status.json'),
    JSON.stringify(status, null, 2),
    'utf-8',
  );

  // 12. 更新历史索引
  updateHistory(ranked, historyFile);
  log('info', `历史索引已更新: ${ranked.length} 条新URL/title`);

  log('info', `\n=== 第 ${round} 轮汇报完成 ===`);
  log('info', `文件: ${reportFile}`);
  log('info', `条数: ${ranked.length} (原始 ${allItems.length}, 去重后 ${finalItems.length})`);
})();
