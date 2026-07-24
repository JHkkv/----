// fetch-international.js — 国外 AI+经济 数据采集
// 复用模式: fetch-supplement.js 的 HN + arXiv + GitHub + AI HOT

const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { curlRaw, curlJSON, progress, log } = require('./lib/curl-helper');
const { filterAndRank } = require('./lib/filter-engine');

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

// ---- Source 1: Hacker News (AI 商业/经济相关) ----
function fetchHN() {
  log('info', '[HN] 拉取热门 AI 商业讨论...');
  try {
    const idsStr = curlRaw('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!idsStr) throw new Error('empty');
    const topIds = JSON.parse(idsStr);

    const items = [];
    const batch = topIds.slice(0, 80);
    let done = 0;

    for (const id of batch) {
      const storyStr = curlRaw(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!storyStr) continue;
      try {
        const story = JSON.parse(storyStr);
        if (!story || !story.title) continue;
        const text = story.title + ' ' + (story.url || '');

        // 用两级过滤判断 AI+经济
        const { passesFilter } = require('./lib/filter-engine');
        if (!passesFilter({ title: story.title, summary: text })) continue;

        items.push({
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${id}`,
          summary: `HN Score: ${story.score || 0}, Comments: ${story.descendants || 0}`,
          source: 'Hacker News',
          sourceUrl: `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          score: story.score || 0,
          comments: story.descendants || 0,
          publishedAt: new Date(story.time * 1000).toISOString(),
          region: 'international',
        });
      } catch (_) {}
      done++;
      if (done % 20 === 0) progress(`HN ${done}/${batch.length}...`);
    }
    log('info', `  HN: ${items.length} 条 AI+经济`);
    return items;
  } catch (e) {
    log('error', `  HN 失败: ${e.message}`);
    return [];
  }
}

// ---- Source 2: arXiv (cs.AI + q-fin.EC) ----
function fetchArXiv() {
  log('info', '[arXiv] 拉取 AI 经济学论文...');
  try {
    const cats = ['cs.AI', 'cs.CL', 'cs.LG', 'q-fin.EC', 'econ.GN'];
    const items = [];

    for (const cat of cats) {
      const xml = curlRaw(
        `https://export.arxiv.org/api/query?search_query=cat:${cat}&sortBy=submittedDate&max_results=5`,
      );
      if (!xml) continue;

      const entries = xml.split('<entry>').slice(1);
      for (const entry of entries) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const urlMatch = entry.match(/<id>(.*?)<\/id>/);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/);
        const dateMatch = entry.match(/<published>(.*?)<\/published>/);

        if (titleMatch) {
          const title = titleMatch[1].replace(/\s+/g, ' ').trim();
          const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim().slice(0, 250) : '';

          // q-fin.EC 和 econ.GN 的论文直接纳入(属于经济学范畴)
          // cs.* 论文需要经两级过滤
          if (cat.startsWith('q-fin') || cat.startsWith('econ')) {
            // 经济学论文，只要标题涉及 AI/tech 即纳入
            const aiRelated = /AI|artificial intelligence|machine learning|deep learning|LLM|GPT|transformer|neural|algorithmic|automation|robot/i;
            if (aiRelated.test(title + ' ' + summary)) {
              items.push({
                title,
                url: urlMatch ? urlMatch[1].trim() : '',
                summary,
                source: `arXiv (${cat})`,
                sourceUrl: 'https://export.arxiv.org/api/query',
                publishedAt: dateMatch ? dateMatch[1].trim() : '',
                region: 'international',
                category: 'academic-trends',
              });
            }
          } else {
            items.push({
              title,
              url: urlMatch ? urlMatch[1].trim() : '',
              summary,
              source: `arXiv (${cat})`,
              sourceUrl: 'https://export.arxiv.org/api/query',
              publishedAt: dateMatch ? dateMatch[1].trim() : '',
              region: 'international',
              category: 'academic-trends',
            });
          }
        }
      }
    }

    // 过滤
    const filtered = filterAndRank(items, { topN: 15, minScore: 10 });
    log('info', `  arXiv: ${filtered.length}/${items.length} 篇`);
    return filtered;
  } catch (e) {
    log('error', `  arXiv 失败: ${e.message}`);
    return [];
  }
}

// ---- Source 3: GitHub AI 商业项目 ----
function fetchGitHub() {
  log('info', '[GitHub] 搜索 AI 商业/经济项目...');
  try {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // 多维度搜索: AI + 经济相关 topic
    const queries = [
      'ai-economy',
      'fintech+machine-learning',
      'quantitative-trading',
      'crypto-trading-bot',
      'ai-business',
    ];

    const allItems = [];

    for (const q of queries) {
      const resp = curlJSON(
        `https://api.github.com/search/repositories?q=${q}+pushed:>${weekAgo}&sort=stars&order=desc&per_page=5`,
      );
      if (!resp || !resp.items) continue;

      for (const r of resp.items) {
        allItems.push({
          title: `${r.full_name} — ⭐ ${r.stargazers_count}`,
          url: r.html_url,
          summary: r.description || '',
          source: 'GitHub',
          sourceUrl: `https://api.github.com/search/repositories?q=${q}`,
          stars: r.stargazers_count,
          language: r.language,
          publishedAt: r.updated_at,
          region: 'international',
          category: 'academic-trends',
        });
      }
    }

    // 去重后过滤
    const { dedupByURL } = require('./lib/dedup');
    const { unique } = dedupByURL(allItems);
    const filtered = filterAndRank(unique, { topN: 10, minScore: 10 });

    log('info', `  GitHub: ${filtered.length} 个项目`);
    return filtered;
  } catch (e) {
    if (e.message && e.message.includes('API rate limit')) {
      log('warn', '  GitHub: 匿名 API 限流，跳过');
    } else {
      log('error', `  GitHub 失败: ${e.message}`);
    }
    return [];
  }
}

// ---- Source 4: AI HOT API (AI 商业动态) ----
function fetchAIHOT() {
  log('info', '[AI HOT] 拉取 AI 商业精选...');
  try {
    const since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const resp = curlJSON(
      `https://aihot.virxact.com/api/public/items?mode=selected&since=${since}&take=50`,
      { userAgent: 'ai-economy-fetcher/1.0' },
    );
    if (!resp || !resp.items) {
      log('warn', '  AI HOT: 无数据');
      return [];
    }

    const items = resp.items.map(
      /** @param {{title: string, url: string, summary: string, source: string, publishedAt: string}} it */
      (it) => ({
        title: it.title,
        url: it.url,
        summary: it.summary || '',
        source: `AI HOT (${it.source || '精选'})`,
        sourceUrl: 'https://aihot.virxact.com/api/public/items',
        publishedAt: it.publishedAt || '',
        region: 'international',
      }),
    );

    // 用二级经济关键词筛选
    const filtered = filterAndRank(items, { topN: 15, minScore: 10 });
    log('info', `  AI HOT: ${filtered.length}/${items.length} 条 (经济相关)`);
    return filtered;
  } catch (e) {
    log('error', `  AI HOT 失败: ${e.message}`);
    return [];
  }
}

// ---- Main ----
(async () => {
  const round = getCurrentRound();
  log('info', `第 ${round} 轮国际采集开始\n`);

  const hnItems = fetchHN();
  const arxivItems = fetchArXiv();
  const ghItems = fetchGitHub();
  const aihotItems = fetchAIHOT();

  const all = [...hnItems, ...arxivItems, ...ghItems, ...aihotItems];
  log('info', `\n国际采集完成: 总计 ${all.length} 条`);
  log('info', `  HN: ${hnItems.length} | arXiv: ${arxivItems.length} | GitHub: ${ghItems.length} | AIHOT: ${aihotItems.length}`);

  const outFile = path.join(CONFIG.DATA_DIR, `round-${String(round).padStart(2, '0')}-international.json`);
  fs.writeFileSync(outFile, JSON.stringify(all, null, 2), 'utf-8');
  log('info', `已保存: ${outFile}`);
})();
