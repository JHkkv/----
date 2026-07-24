// fetch-economic-indicators.js — 宏观经济指标 + AI 概念公司公告采集
// 专注于硬经济数据: 央行利率、LPR、M2、统计局数据、上市公司公告

const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { curlRaw, curlJSON, progress, log } = require('./lib/curl-helper');

const now = new Date();
const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = beijing.toISOString().slice(0, 10);

function getCurrentRound() {
  const statusFile = path.join(CONFIG.META_DIR, 'task-status.json');
  try {
    const s = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
    return (s.currentRound || 0) + 1;
  } catch (_) {
    return 1;
  }
}

// ---- 宏观经济日历(东方财富) ----
function fetchMacroCalendar() {
  log('info', '[宏观] 经济日历...');
  const items = [];

  try {
    // 中国宏观经济事件
    const resp = curlJSON(
      'https://datacenter-web.eastmoney.com/api/data/v1/get?' +
      'sortColumns=NOTICE_DATE&sortTypes=-1&pageSize=15&pageNumber=1' +
      '&reportName=RPT_ECONOMIC_CALENDAR&columns=ALL' +
      '&filter=(COUNTRY%3D%22%E4%B8%AD%E5%9B%BD%22)',
    );

    if (resp && resp.result && resp.result.data) {
      for (const row of resp.result.data.slice(0, 10)) {
        const title = row.CONTENT || row.EVENT_NAME || '';
        if (!title) continue;

        // 提取数值型数据
        const actualVal = row.ACTUAL_VALUE || row.ACTUAL || '';
        const prevVal = row.PREVIOUS_VALUE || row.PREVIOUS || '';
        const forecastVal = row.FORECAST_VALUE || row.FORECAST || '';

        let dataPoint = title;
        if (actualVal) dataPoint += ` — 实际: ${actualVal}`;
        if (prevVal) dataPoint += ` | 前值: ${prevVal}`;
        if (forecastVal && actualVal && forecastVal !== actualVal) {
          dataPoint += ` | ⚠️预期: ${forecastVal} (偏离)`;
        }

        items.push({
          title: `中国经济数据: ${title}`,
          url: 'https://data.eastmoney.com/cjsj/',
          summary: dataPoint.slice(0, 250),
          source: '东方财富宏观',
          sourceUrl: 'https://data.eastmoney.com/cjsj/',
          publishedAt: row.NOTICE_DATE || today,
          region: 'domestic',
          category: 'macro-policy',
          importance: row.IMPORTANCE || row.RANK || 'normal',
          dataPoint: {
            actual: actualVal || null,
            previous: prevVal || null,
            forecast: forecastVal || null,
          },
        });
      }
    }
  } catch (e) {
    log('warn', `  宏观日历: ${e.message}`);
  }

  log('info', `  宏观日历: ${items.length} 条`);
  return items;
}

// ---- AI 概念上市公司重大公告(巨潮资讯) ----
function fetchListedCoAnnouncements() {
  log('info', '[巨潮] AI 概念公司公告...');
  const items = [];

  try {
    // 巨潮资讯公开接口: 搜索 AI 相关公告
    // 路径: /new/disclosure 是公开页面, API 端点为 /new/fulltextSearch
    const resp = curlJSON(
      'https://www.cninfo.com.cn/new/hisAnnouncement/query?' +
      'pageNum=1&pageSize=15&' +
      'column=&orgId=&' +
      'announcementType=&' +
      'tabName=fulltext&' +
      'seDate=&' +
      'searchMode=accurate&' +
      'sortName=pubdate&' +
      'sortType=desc&' +
      'stock=' +
      encodeURIComponent('人工智能,AI,芯片,算力,大模型'),
    );

    if (resp && resp.announcements) {
      for (const ann of resp.announcements.slice(0, 15)) {
        const title = ann.announcementTitle || ann.shortTitle || '';
        if (!title) continue;

        items.push({
          title: `${ann.secName || ''}: ${title}`,
          url: `https://www.cninfo.com.cn/new/disclosure/detail?announcementId=${ann.id || ''}`,
          summary: `${ann.secName || ''}(${ann.secCode || ''}) ${ann.announcementType || ''} — ${title}`.slice(0, 250),
          source: '巨潮资讯',
          sourceUrl: 'https://www.cninfo.com.cn/new/disclosure',
          publishedAt: ann.announcementDate || ann.pubdate || today,
          region: 'domestic',
          category: 'industry-capital',
          company: ann.secName || '',
          stockCode: ann.secCode || '',
        });
      }
    }
  } catch (e) {
    log('warn', `  巨潮: ${e.message} (接口可能需要cookie, 跳过)`);
  }

  log('info', `  巨潮: ${items.length} 条公告`);
  return items;
}

// ---- 全球关键经济指标对比 ----
function fetchGlobalIndicators() {
  log('info', '[全球] 国际宏观经济指标...');
  const items = [];

  // 使用公开 API 获取主要经济体利率/指数（通过东方财富全球频道）
  try {
    const resp = curlJSON(
      'https://push2.eastmoney.com/api/qt/ulist.np/get?' +
      'fltt=2&invt=2&fields=f2,f3,f4,f12,f14&' +
      'secids=100.NDX,100.DJIA,100.SPX,100.HSI,100.N225,100.GDAXI',
    );

    const map = {
      '100.NDX': { name: '纳斯达克', label: 'NASDAQ' },
      '100.DJIA': { name: '道琼斯', label: 'DJIA' },
      '100.SPX': { name: '标普500', label: 'S&P 500' },
      '100.HSI': { name: '恒生指数', label: 'HSI' },
      '100.N225': { name: '日经225', label: 'Nikkei 225' },
      '100.GDAXI': { name: '德国DAX', label: 'DAX' },
    };

    if (resp && resp.data && resp.data.diff) {
      for (const d of resp.data.diff) {
        const info = map[d.f12] || { name: d.f12, label: d.f12 };
        const change = d.f3 || 0;
        const marker = Math.abs(change) > 2 ? (change > 0 ? '📈' : '📉') : '';

        items.push({
          title: `${marker}${info.name}: ${d.f2 ?? '-'} | 涨跌 ${change}%`,
          url: 'https://quote.eastmoney.com/',
          summary: `${info.label} 指数: ${d.f2}, 涨跌幅: ${change}%`,
          source: '东方财富全球',
          sourceUrl: 'https://push2.eastmoney.com/api/qt/ulist.np/get',
          publishedAt: today,
          region: 'international',
          category: 'global-dynamics',
          dataPoint: { value: d.f2, changePercent: change },
        });
      }
    }
  } catch (e) {
    log('warn', `  全球指标: ${e.message}`);
  }

  log('info', `  全球指标: ${items.length} 条`);
  return items;
}

// ---- Main ----
(async () => {
  const round = getCurrentRound();
  log('info', `第 ${round} 轮经济指标采集开始\n`);

  const macroItems = fetchMacroCalendar();
  const listedItems = fetchListedCoAnnouncements();
  const globalItems = fetchGlobalIndicators();

  const all = [...macroItems, ...listedItems, ...globalItems];
  log('info', `\n经济指标采集完成: 总计 ${all.length} 条`);
  log('info', `  宏观: ${macroItems.length} | 巨潮: ${listedItems.length} | 全球: ${globalItems.length}`);

  const outFile = path.join(CONFIG.DATA_DIR, `round-${String(round).padStart(2, '0')}-indicators.json`);
  fs.writeFileSync(outFile, JSON.stringify(all, null, 2), 'utf-8');
  log('info', `已保存: ${outFile}`);
})();
