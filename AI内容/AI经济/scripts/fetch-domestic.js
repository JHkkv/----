// fetch-domestic.js — 国内 AI+经济 数据采集
// 复用模式: fetch-supplement.js 的 36Kr RSS + 新增东方财富/新浪财经

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { curlRaw, curlJSON, progress, log } = require('./lib/curl-helper');

const CURL = 'curl -s --connect-timeout 15 --max-time 20';

const now = new Date();
const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = beijing.toISOString().slice(0, 10);

/**
 * 读取任务状态获取当前轮次
 * @returns {number}
 */
function getCurrentRound() {
  const statusFile = path.join(CONFIG.META_DIR, 'task-status.json');
  try {
    const s = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
    return (s.currentRound || 0) + 1;
  } catch (_) {
    return 1;
  }
}

// ---- Source 1: 36Kr RSS (AI+经济关键词过滤) ----
function fetch36Kr() {
  log('info', '[36Kr] 拉取 RSS...');
  try {
    const xml = curlRaw('https://36kr.com/feed');
    if (!xml) throw new Error('empty');

    const items = [];
    const itemBlocks = xml.split('<item>').slice(1);

    for (const block of itemBlocks.slice(0, 30)) {
      const titleMatch = block.match(/<title>(.*?)<\/title>/);
      const linkMatch = block.match(/<link>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/link>/);
      const descMatch = block.match(/<description>\s*(?:<!\[CDATA\[)?((?:.|\n)*?)(?:\]\]>)?\s*<\/description>/);
      const dateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch) {
        const title = titleMatch[1].replace(/\s+/g, ' ').trim();
        const url = linkMatch ? linkMatch[1].trim() : '';
        let summary = '';
        if (descMatch) {
          summary = descMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
        }
        items.push({
          title,
          url,
          summary,
          source: '36Kr',
          sourceUrl: 'https://36kr.com/feed',
          publishedAt: dateMatch ? dateMatch[1].trim() : '',
          region: 'domestic',
        });
      }
    }

    // 两级关键词过滤
    const { filterAndRank } = require('./lib/filter-engine');
    const filtered = filterAndRank(items, { topN: 25, minScore: 15 });
    log('info', `  36Kr: ${filtered.length}/${items.length} 条 (AI+经济)`);
    return filtered;
  } catch (e) {
    log('error', `  36Kr 失败: ${e.message}`);
    return [];
  }
}

// ---- Source 2: 东方财富 AI 概念板块 ----
function fetchEastMoney() {
  log('info', '[东方财富] 拉取 AI 概念板块...');
  try {
    const resp = curlJSON(
      'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=30&fs=m:0+t:6&fields=f2,f3,f4,f12,f14&fltt=2&invt=2',
    );
    if (!resp || !resp.data || !resp.data.diff) {
      log('warn', '  东方财富: 无数据');
      return [];
    }

    // diff 是对象 {0: {...}, 1: {...}}，需要转为数组
    const diffArr = Object.values(resp.data.diff);
    const aiConcepts = diffArr.filter(
      /** @param {{f14: string}} d */
      (d) => {
        const name = (d.f14 || '');
        return /AI|人工智能|芯片|算力|大模型|机器人|自动驾驶|半导体|GPU/i.test(name);
      },
    );

    const items = aiConcepts.map(
      /** @param {{f14: string, f2: number, f3: number, f12: string}} d */
      (d) => ({
        title: `AI概念板块: ${d.f14} — 最新价 ${d.f2 ?? '-'} | 涨跌幅 ${d.f3 ?? '-'}%`,
        url: `https://quote.eastmoney.com/bk/${d.f12}.html`,
        summary: `${d.f14}板块行情 — 最新价: ${d.f2 ?? '-'}, 涨跌幅: ${d.f3 ?? '-'}%`,
        source: '东方财富',
        sourceUrl: 'https://push2.eastmoney.com/api/qt/clist/get',
        publishedAt: today,
        dataPoint: { price: d.f2, changePercent: d.f3 },
        region: 'domestic',
        category: 'concept-stocks',
      }),
    );

    log('info', `  东方财富: ${items.length} 个 AI 概念板块`);
    return items;
  } catch (e) {
    log('error', `  东方财富 失败: ${e.message}`);
    return [];
  }
}

// ---- Source 3: 新浪财经 AI 个股行情 ----
function fetchSinaStocks() {
  log('info', '[新浪财经] 拉取 AI 个股...');
  try {
    // AI 概念代表性个股（科创板+创业板+主板）
    const stockCodes = [
      'sh688981', // 中芯国际
      'sh688256', // 寒武纪
      'sh688008', // 澜起科技
      'sz002230', // 科大讯飞
      'sz300474', // 景嘉微
      'sh603019', // 中科曙光
      'sh688111', // 金山办公
      'sz300033', // 同花顺
      'sz002415', // 海康威视
      'sh603501', // 韦尔股份
      'sz300502', // 新易盛
      'sz300308', // 中际旭创
    ];

    const raw = curlRaw(`https://hq.sinajs.cn/list=${stockCodes.join(',')}`, {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referer: 'https://finance.sina.com.cn/',
    });

    if (!raw) throw new Error('empty');

    const items = [];
    const lines = raw.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const match = line.match(/var hq_str_(\w+)="([^"]+)"/);
      if (!match) continue;

      const code = match[1];
      const fields = match[2].split(',');
      if (fields.length < 10) continue;

      const name = fields[0];
      const open = parseFloat(fields[1]);
      const close = parseFloat(fields[2]);
      const current = parseFloat(fields[3]);
      const change = ((current - close) / close * 100).toFixed(2);

      items.push({
        title: `${name}(${code}) — 现价 ${current} | 涨跌 ${change}%`,
        url: `https://finance.sina.com.cn/realstock/company/${code}/nc.shtml`,
        summary: `${name} 日行情: 开盘 ${open}, 昨收 ${close}, 现价 ${current}, 涨跌 ${change}%`,
        source: '新浪财经',
        sourceUrl: `https://hq.sinajs.cn/list=${code}`,
        publishedAt: today,
        dataPoint: { price: current, changePercent: change },
        region: 'domestic',
        category: 'concept-stocks',
      });
    }

    log('info', `  新浪财经: ${items.length} 只 AI 个股`);
    return items;
  } catch (e) {
    log('error', `  新浪财经 失败: ${e.message}`);
    return [];
  }
}

// ---- 经济指标（统计局/央行公开数据） ----
function fetchEconIndicators() {
  log('info', '[经济指标] 采集宏观数据...');
  const items = [];

  // 注: 统计局和央行 API 需要特定参数格式，部分可能因跨域/反爬限制无法直接 curl 获取。
  // 这些数据源的设计是通过 Claude Agent 的 WebSearch 工具补充搜索，
  // 脚本层先尝试抓取可公开访问的 JSON 接口，失败不影响整体流程。

  // 尝试从东方财富获取宏观经济日历（LPR等）
  try {
    const macroData = curlJSON(
      'https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=NOTICE_DATE&sortTypes=-1&pageSize=10&pageNumber=1&reportName=RPT_ECONOMIC_CALENDAR&columns=ALL&filter=(COUNTRY%3D%22%E4%B8%AD%E5%9B%BD%22)',
    );
    if (macroData && macroData.result && macroData.result.data) {
      for (const row of macroData.result.data.slice(0, 5)) {
        items.push({
          title: `宏观经济事件: ${row.EVENT_NAME || row.CONTENT || '经济数据发布'}`,
          url: 'https://data.eastmoney.com/cjsj/',
          summary: `${row.NOTICE_DATE || ''} ${row.COUNTRY || '中国'} — ${row.CONTENT || row.EVENT_NAME || ''}`.slice(0, 200),
          source: '东方财富宏观',
          sourceUrl: 'https://data.eastmoney.com/cjsj/',
          publishedAt: row.NOTICE_DATE || today,
          region: 'domestic',
          category: 'macro-policy',
        });
      }
    }
  } catch (_) {}

  log('info', `  经济指标: ${items.length} 条`);
  return items;
}

// ---- Main ----
(async () => {
  const round = getCurrentRound();
  log('info', `第 ${round} 轮国内采集开始\n`);

  const krItems = fetch36Kr();
  const emItems = fetchEastMoney();
  const sinaItems = fetchSinaStocks();
  const econItems = fetchEconIndicators();

  const all = [...krItems, ...emItems, ...sinaItems, ...econItems];
  log('info', `\n国内采集完成: 总计 ${all.length} 条`);
  log('info', `  36Kr: ${krItems.length} | 东方财富: ${emItems.length} | 新浪: ${sinaItems.length} | 宏观: ${econItems.length}`);

  // 输出 JSON
  const outFile = path.join(CONFIG.DATA_DIR, `round-${String(round).padStart(2, '0')}-domestic.json`);
  fs.writeFileSync(outFile, JSON.stringify(all, null, 2), 'utf-8');
  log('info', `已保存: ${outFile}`);
})();
