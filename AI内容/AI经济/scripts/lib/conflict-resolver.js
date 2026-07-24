// conflict-resolver.js — 多源冲突按权威优先级裁决

const CONFIG = require('../config');

/**
 * 获取来源的权威等级（数字越小越权威）
 * @param {string} sourceName - 来源名称
 * @param {string} [region='domestic'] - 'domestic' | 'international'
 * @returns {number} 权威排名索引，未识别返回999
 */
function getAuthorityRank(sourceName, region = 'domestic') {
  const ranks = CONFIG.AUTHORITY_RANK[region] || [];
  const lower = (sourceName || '').toLowerCase();

  for (let i = 0; i < ranks.length; i++) {
    if (lower.includes(ranks[i].toLowerCase())) {
      return i;
    }
  }
  return 999;
}

/**
 * 检测同一事件的冲突报道
 * 基于标题标准化后比较，发现不同来源对同一事件的描述差异
 * @param {Array<{title: string, url: string, source: string, summary?: string}>} items
 * @returns {{ groups: Array<{event: string, items: Array, conflict: boolean}> }}
 */
function detectConflicts(items) {
  // 按标准化标题分组
  const { normalizeTitle } = require('./dedup');
  const groups = new Map();

  for (const item of items) {
    // 提取核心事件关键词（取标题前12个字符作为事件标识）
    const norm = normalizeTitle(item.title).slice(0, 12);
    if (!groups.has(norm)) {
      groups.set(norm, []);
    }
    groups.get(norm).push(item);
  }

  const result = [];
  for (const [event, groupItems] of groups) {
    if (groupItems.length < 2) continue;

    // 检查是否来自不同来源
    const sources = new Set(groupItems.map((i) => i.source));
    const hasConflict = sources.size > 1;

    result.push({
      event,
      items: [...groupItems],
      conflict: hasConflict,
    });
  }

  return result;
}

/**
 * 裁决冲突：返回权威版本
 * @param {Array<{title: string, source: string, summary?: string}>} conflictGroup
 * @param {string} [region='domestic']
 * @returns {{ winner: object, losers: object[], note: string }}
 */
function resolveConflict(conflictGroup, region = 'domestic') {
  if (conflictGroup.length === 0) {
    return { winner: null, losers: [], note: '空冲突组' };
  }

  if (conflictGroup.length === 1) {
    return { winner: conflictGroup[0], losers: [], note: '单一来源无需裁决' };
  }

  // 按权威等级排序
  const sorted = [...conflictGroup].sort((a, b) => {
    return getAuthorityRank(a.source, region) - getAuthorityRank(b.source, region);
  });

  const winner = sorted[0];
  const losers = sorted.slice(1);

  const note =
    losers.length > 0
      ? `采用[${winner.source}]（权威等级更高），替代[${losers.map((l) => l.source).join('、')}]`
      : '来源一致无冲突';

  return { winner, losers, note };
}

/**
 * 批量处理所有冲突
 * @param {Array} items
 * @param {string} [region='domestic']
 * @returns {{ resolved: Array, conflicts: Array }}
 */
function resolveAll(items, region = 'domestic') {
  const detected = detectConflicts(items);

  const resolved = [];
  const conflicts = [];

  // 收集所有参与冲突的条目索引
  const conflictedIndices = new Set();
  const seenEvents = new Set();

  for (const group of detected) {
    // 去重：同一事件可能被分到不同组
    const eventKey = group.event.toLowerCase();
    if (seenEvents.has(eventKey)) continue;
    seenEvents.add(eventKey);

    if (group.conflict) {
      const { winner, losers, note } = resolveConflict(group.items, region);
      resolved.push(winner);
      conflicts.push({ event: group.event, winner, losers, note });
    } else {
      // 无冲突（同源），保留第一条
      resolved.push(group.items[0]);
    }

    // 标记已处理的条目
    for (const item of group.items) {
      const idx = items.indexOf(item);
      if (idx >= 0) conflictedIndices.add(idx);
    }
  }

  // 添加未参与冲突的条目
  for (let i = 0; i < items.length; i++) {
    if (!conflictedIndices.has(i)) {
      resolved.push(items[i]);
    }
  }

  return { resolved, conflicts };
}

module.exports = {
  getAuthorityRank,
  detectConflicts,
  resolveConflict,
  resolveAll,
};
