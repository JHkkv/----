// filter-engine.js — AI+经济两级关键词过滤引擎

const CONFIG = require('../config');

/**
 * 测试文本是否匹配关键词数组中的任一正则
 * @param {string} text - 待检测文本
 * @param {RegExp[]} patterns - 正则数组
 * @returns {boolean}
 */
function matchAny(text, patterns) {
  return patterns.some((p) => p.test(text));
}

/**
 * 判断条目是否同时命中一级(AI)和二级(经济)关键词
 * @param {{ title: string, summary?: string, description?: string }} item
 * @returns {boolean}
 */
function passesFilter(item) {
  const text = [
    item.title || '',
    item.summary || '',
    item.description || '',
  ].join(' ');

  const hitsTier1 = matchAny(text, CONFIG.TIER1_AI_KEYWORDS);
  const hitsTier2 = matchAny(text, CONFIG.TIER2_ECON_KEYWORDS);

  return hitsTier1 && hitsTier2;
}

/**
 * 计算条目的 AI+经济 相关度得分 (0-100)
 * @param {{ title: string, summary?: string, description?: string }} item
 * @returns {number}
 */
function scoreRelevance(item) {
  const title = (item.title || '').toLowerCase();
  const body = ((item.summary || '') + ' ' + (item.description || '')).toLowerCase();

  let score = 0;

  // 标题命中一级关键词: +30
  if (matchAny(title, CONFIG.TIER1_AI_KEYWORDS)) score += 30;
  // 标题命中二级关键词: +30
  if (matchAny(title, CONFIG.TIER2_ECON_KEYWORDS)) score += 30;
  // 正文命中一级: +20
  if (matchAny(body, CONFIG.TIER1_AI_KEYWORDS)) score += 20;
  // 正文命中二级: +20
  if (matchAny(body, CONFIG.TIER2_ECON_KEYWORDS)) score += 20;

  // 标题和正文都命中一级+二级 加分
  if (matchAny(title, CONFIG.TIER1_AI_KEYWORDS) && matchAny(title, CONFIG.TIER2_ECON_KEYWORDS)) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * 批量过滤并排序
 * @param {Array<{title: string, summary?: string, description?: string}>} items
 * @param {object} opts
 * @param {number} [opts.topN] - 取前N条
 * @param {number} [opts.minScore] - 最低分阈值
 * @returns {Array<{title: string, summary?: string, description?: string, relevanceScore: number}>}
 */
function filterAndRank(items, opts = {}) {
  const { topN, minScore = 20 } = opts;

  const filtered = items
    .filter((item) => passesFilter(item))
    .map((item) => {
      const newItem = { ...item, relevanceScore: scoreRelevance(item) };
      return newItem;
    })
    .filter((item) => item.relevanceScore >= minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (topN && filtered.length > topN) {
    return filtered.slice(0, topN);
  }
  return filtered;
}

/**
 * 按类别分组统计
 * @param {Array} items
 * @returns {{ total: number, domestic: number, international: number }}
 */
function countByRegion(items) {
  const domesticKeywords = /中国|国内|A股|沪|深|北京|上海|深圳|广州|杭州|证监会|央行|国务院|工信部|统计局/i;
  let domestic = 0;
  let international = 0;

  for (const item of items) {
    // 优先使用显式 region 字段
    if (item.region === 'domestic') {
      domestic++;
    } else if (item.region === 'international') {
      international++;
    } else {
      const text = (item.title || '') + ' ' + (item.source || '');
      if (domesticKeywords.test(text)) {
        domestic++;
      } else {
        international++;
      }
    }
  }

  return { total: items.length, domestic, international };
}

module.exports = { passesFilter, scoreRelevance, filterAndRank, countByRegion, matchAny };
