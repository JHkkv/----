// dedup.js — 去重引擎
// 支持 URL 精确去重 + 标题相似度去重 + 跨轮次历史去重

const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');

/**
 * 计算 Levenshtein 距离
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  const alen = a.length;
  const blen = b.length;
  const matrix = [];

  for (let i = 0; i <= alen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= blen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[alen][blen];
}

/**
 * 标准化标题（用于比较）
 * @param {string} title
 * @returns {string}
 */
function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[【】「」『』""''《》（）()\[\]{}]/g, '')
    .replace(/\s+/g, '')
    .replace(/[（(][^)）]*[)）]/g, '')
    .trim();
}

/**
 * URL 精确去重
 * @param {Array<{url: string}>} items
 * @returns {{ unique: Array, duplicates: Array }}
 */
function dedupByURL(items) {
  const seen = new Map();
  const unique = [];
  const duplicates = [];

  for (const item of items) {
    const key = (item.url || '').trim().toLowerCase();
    if (!key) {
      unique.push(item);
      continue;
    }
    if (seen.has(key)) {
      duplicates.push({ ...item, _dupOf: seen.get(key).url });
    } else {
      seen.set(key, item);
      unique.push(item);
    }
  }

  return { unique, duplicates };
}

/**
 * 标题相似度去重（Levenshtein 距离 ≤ threshold）
 * @param {Array<{title: string}>} items
 * @param {number} [threshold=3]
 * @returns {{ unique: Array, duplicates: Array }}
 */
function dedupByTitle(items, threshold = 3) {
  const unique = [];
  const duplicates = [];
  const seen = [];

  for (const item of items) {
    const norm = normalizeTitle(item.title);
    let isDup = false;

    for (const s of seen) {
      const dist = levenshtein(norm, s.norm);
      if (dist <= threshold) {
        duplicates.push({ ...item, _dupOf: s.title });
        isDup = true;
        break;
      }
    }

    if (!isDup) {
      seen.push({ norm, title: item.title });
      unique.push(item);
    }
  }

  return { unique, duplicates };
}

/**
 * 跨轮次去重：对比历史索引
 * @param {Array} items - 本轮条目
 * @param {string} historyFile - history.json 路径
 * @returns {{ newItems: Array, seenItems: Array }}
 */
function crossRoundDedup(items, historyFile) {
  let history = { urls: new Set(), titleNorms: [] };

  if (fs.existsSync(historyFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      history.urls = new Set(raw.urls || []);
      history.titleNorms = raw.titleNorms || [];
    } catch (_) {
      // 文件损坏则从头开始
    }
  }

  const newItems = [];
  const seenItems = [];

  for (const item of items) {
    const urlKey = (item.url || '').trim().toLowerCase();
    const titleNorm = normalizeTitle(item.title);

    // URL 检查
    if (urlKey && history.urls.has(urlKey)) {
      seenItems.push({ ...item, _reason: '历史URL重复' });
      continue;
    }

    // 标题相似度检查
    let isDuplicate = false;
    for (const h of history.titleNorms) {
      if (levenshtein(titleNorm, h) <= 3) {
        seenItems.push({ ...item, _reason: '历史标题相似' });
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    newItems.push(item);
  }

  return { newItems, seenItems };
}

/**
 * 更新历史索引
 * @param {Array} newItems
 * @param {string} historyFile
 */
function updateHistory(newItems, historyFile) {
  let data = { urls: [], titleNorms: [], lastUpdated: '' };

  if (fs.existsSync(historyFile)) {
    try {
      data = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    } catch (_) {}
  }

  const urlSet = new Set(data.urls || []);
  const titleSet = new Set(data.titleNorms || []);

  for (const item of newItems) {
    const urlKey = (item.url || '').trim().toLowerCase();
    if (urlKey) urlSet.add(urlKey);
    titleSet.add(normalizeTitle(item.title));
  }

  const updated = {
    urls: [...urlSet],
    titleNorms: [...titleSet],
    totalTracked: urlSet.size,
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(historyFile, JSON.stringify(updated, null, 2), 'utf-8');
}

module.exports = {
  levenshtein,
  normalizeTitle,
  dedupByURL,
  dedupByTitle,
  crossRoundDedup,
  updateHistory,
};
