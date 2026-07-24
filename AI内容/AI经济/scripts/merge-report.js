// merge-report.js — 合并所有原始数据，经过去重+冲突裁决后生成汇报文件

const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { log } = require('./lib/curl-helper');
const { filterAndRank, countByRegion } = require('./lib/filter-engine');
const { dedupByURL, dedupByTitle, crossRoundDedup, updateHistory } = require('./lib/dedup');
const { resolveAll } = require('./lib/conflict-resolver');

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
  const { detectConflicts } = require('./lib/conflict-resolver');
  const detected = detectConflicts(ranked);
  const hotEvents = detected.filter((g) => g.items.length >= 3);

  // 9. 生成 Markdown
  let md = `# AI+经济情报简报 — 第${round}轮 (${today})\n\n`;
  md += `> 📅 采集时间: ${nowStr}（北京时间）\n`;
  md += `> 📊 本轮: ${finalItems.length} 条 | 国内 ${domestic.length} / 国际 ${international.length} | 去重剔除 ${urlDups.length + titleDups.length + seenItems.length} 条\n`;
  md += `> 📡 数据来源: 36Kr / 东方财富 / 新浪财经 / 巨潮资讯 / HN / arXiv / GitHub / AI HOT\n`;
  md += `> 📍 状态: 第 ${round}/${CONFIG.MAX_ROUNDS} 轮 | 剩余 ${Math.max(0, 10 - round)} 轮 | 截止 ${CONFIG.END_DATE}\n`;
  md += `> 🏷️ 标注: ${CONFIG.MARKERS.NEW}=新事件 ${CONFIG.MARKERS.HOT}=高热度 ${CONFIG.MARKERS.RISK}=风险 ${CONFIG.MARKERS.UP}=上升 ${CONFIG.MARKERS.DOWN}=下降 ${CONFIG.MARKERS.CONFLICT}=来源冲突\n\n`;
  md += `---\n\n`;

  // 9.1 宏观政策与AI
  md += `## 一、宏观经济与AI政策\n\n`;
  const macroItems = ranked.filter((i) => {
    const t = (i.title + i.summary).toLowerCase();
    return /政策|央行|利率|GDP|CPI|PMI|监管|国务院|工信部|LPR|货币|财政/i.test(t);
  });
  if (macroItems.length > 0) {
    md += `| # | 标注 | 标题 | 数据要点 | 来源 | 时间 |\n`;
    md += `|---|------|------|----------|------|------|\n`;
    macroItems.slice(0, 10).forEach((item, idx) => {
      const marker = getMarker(item);
      const dataStr = item.dataPoint
        ? Object.entries(item.dataPoint).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : item.summary?.slice(0, 60) || '';
      md += `| ${idx + 1} | ${marker} | ${item.title.slice(0, 60)} | ${dataStr.slice(0, 80)} | [${item.source}](${item.sourceUrl || item.url}) | ${(item.publishedAt || '').slice(0, 10)} |\n`;
    });
    md += `\n`;
  } else {
    md += `> 本轮无宏观经济相关政策/数据更新。\n\n`;
  }

  // 9.2 AI产业与资本市场
  md += `## 二、AI产业与资本市场\n\n`;
  const capItems = ranked.filter((i) => {
    const t = (i.title + i.summary).toLowerCase();
    return /融资|投资|估值|IPO|上市|收购|并购|财报|营收/i.test(t);
  });
  if (capItems.length > 0) {
    for (const item of capItems.slice(0, 15)) {
      const marker = getMarker(item);
      md += `- ${marker} **${item.title}**\n`;
      if (item.summary) md += `  ${item.summary.slice(0, 150)}\n`;
      md += `  📎 [${item.source}](${item.url}) — ${(item.publishedAt || '').slice(0, 10)}\n\n`;
    }
  } else {
    md += `> 本轮无AI产业/资本市场重要事件。\n\n`;
  }

  // 9.3 AI概念板块行情
  md += `## 三、AI概念板块行情\n\n`;
  const stockItems = ranked.filter((i) => i.category === 'concept-stocks' || i.dataPoint?.price !== undefined);
  if (stockItems.length > 0) {
    md += `| 标题 | 数据 | 来源 |\n`;
    md += `|------|------|------|\n`;
    stockItems.slice(0, 15).forEach((item) => {
      const marker = getMarker(item);
      const dataStr = item.dataPoint
        ? `${item.dataPoint.price ?? '-'} (${item.dataPoint.changePercent ?? '-'}%)`
        : '';
      md += `| ${marker} ${item.title.slice(0, 50)} | ${dataStr} | [${item.source}](${item.url}) |\n`;
    });
    md += `\n`;
  } else {
    md += `> 本轮无AI板块行情数据。\n\n`;
  }

  // 9.4 全球AI经济动态
  md += `## 四、全球AI经济动态\n\n`;
  const globalItems = international.slice(0, 15);
  if (globalItems.length > 0) {
    for (const item of globalItems) {
      md += `- **${item.title}**\n`;
      if (item.summary) md += `  ${item.summary.slice(0, 150)}\n`;
      md += `  📎 [${item.source}](${item.url}) — ${(item.publishedAt || '').slice(0, 10)}\n\n`;
    }
  } else {
    md += `> 本轮无全球AI经济动态。\n\n`;
  }

  // 9.5 学术与趋势
  md += `## 五、AI学术与产业趋势\n\n`;
  const acadItems = ranked.filter((i) => i.source?.includes('arXiv') || i.source?.includes('GitHub'));
  if (acadItems.length > 0) {
    for (const item of acadItems.slice(0, 10)) {
      md += `- **${item.title}**\n`;
      if (item.summary) md += `  ${item.summary.slice(0, 150)}\n`;
      md += `  📎 [${item.source}](${item.url})\n\n`;
    }
  } else {
    md += `> 本轮无相关学术/开源动态。\n\n`;
  }

  // 9.6 跨来源冲突
  md += `## 六、跨来源冲突记录\n\n`;
  if (conflicts.length > 0) {
    md += `| 事件 | 采用来源 | 替代来源 | 说明 |\n`;
    md += `|------|----------|----------|------|\n`;
    for (const c of conflicts) {
      md += `| ${CONFIG.MARKERS.CONFLICT} ${c.event.slice(0, 30)} | ${c.winner?.source || '-'} | ${c.losers.map((l) => l.source).join(', ')} | ${c.note} |\n`;
    }
    md += `\n`;
  } else {
    md += `> 本轮未检测到跨来源冲突。\n\n`;
  }

  // 9.7 高热度事件
  if (hotEvents.length > 0) {
    md += `## 🔥 本轮高热度事件\n\n`;
    for (const h of hotEvents.slice(0, 5)) {
      md += `- **${h.event}** — ${h.items.length} 个来源同时报道\n`;
    }
    md += `\n`;
  }

  // 9.8 统计
  const regions = countByRegion(ranked);
  const sourceCounts = {};
  for (const item of ranked) {
    const s = item.source || '未知';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }

  md += `## 七、本轮统计\n\n`;
  md += `| 维度 | 数据 |\n`;
  md += `|------|------|\n`;
  md += `| 总条目 | ${ranked.length} 条 |\n`;
  md += `| 国内/国际 | ${regions.domestic} / ${regions.international} |\n`;
  md += `| 国内占比 | ${(regions.domestic / Math.max(1, ranked.length) * 100).toFixed(1)}% |\n`;
  md += `| 原始条目(去重前) | ${allItems.length} 条 |\n`;
  md += `| 去重剔除 | ${urlDups.length + titleDups.length + seenItems.length} 条 |\n`;
  md += `| 来源数 | ${Object.keys(sourceCounts).length} 个 |\n`;
  md += `| 冲突事件 | ${conflicts.length} 组 |\n`;
  md += `\n`;

  md += `**来源分布:**\n`;
  for (const [src, cnt] of Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])) {
    md += `- ${src}: ${cnt} 条\n`;
  }
  md += `\n`;

  md += `---\n`;
  md += `> ⚠️ 以上所有信息均可追溯到原始来源URL。信息不可编造，数据冲突已按权威优先级裁决。\n`;
  md += `> 📌 本项目为30天暂行项目（${CONFIG.START_DATE} 至 ${CONFIG.END_DATE}），第 ${round}/${CONFIG.MAX_ROUNDS} 轮。\n`;

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
