// fetch-supplement.js — 多源 AI 资讯聚合：HN + arXiv + GitHub + 36Kr
// 使用 curl 管道以避免 Node.js http 模块在 Windows 下的 IPv6 兼容问题
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = process.argv[2] || 'f:/测试工具/AI公众号/每日简报';
const CURL = 'curl -s --connect-timeout 15 --max-time 20';

const now = new Date();
const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = beijing.toISOString().slice(0, 10);

function curlJSON(url) {
  try {
    const out = execSync(`${CURL} "${url}"`, { encoding: 'utf-8', timeout: 25000, windowsHide: true });
    return out.trim();
  } catch (_) { return ''; }
}

// ---- Source 1: Hacker News ----
function fetchHN() {
  console.log('  [HN] 拉取热门...');
  try {
    const idsStr = curlJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!idsStr) throw new Error('empty');
    const topIds = JSON.parse(idsStr);
    const aiKeywords = /ai|llm|gpt|claude|openai|anthropic|deepseek|model|transformer|neural|machine.learning|agent|copilot|fine.?tun|rag|embedding|vector|diffusion|text.to|image.gen|chatbot|prompt/i;
    const items = [];
    const batch = topIds.slice(0, 80);
    let done = 0;
    for (const id of batch) {
      const storyStr = curlJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!storyStr) continue;
      try {
        const story = JSON.parse(storyStr);
        if (!story || !story.title) continue;
        const text = story.title + ' ' + (story.url || '');
        if (aiKeywords.test(text)) {
          items.push({
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${id}`,
            source: 'Hacker News',
            score: story.score || 0,
            comments: story.descendants || 0,
            publishedAt: new Date(story.time * 1000).toISOString(),
          });
        }
      } catch (_) {}
      done++;
      if (done % 20 === 0) process.stdout.write(`  HN ${done}/${batch.length}...\r`);
    }
    console.log(`  HN: ${items.length} 条 AI 相关                    `);
    return items;
  } catch (e) {
    console.error('    HN 失败:', e.message);
    return [];
  }
}

// ---- Source 2: arXiv recent papers ----
function fetchArXiv() {
  console.log('  [arXiv] 拉取论文...');
  try {
    const cats = ['cs.AI', 'cs.CL', 'cs.LG'];
    const items = [];
    for (const cat of cats) {
      const xml = curlJSON(`https://export.arxiv.org/api/query?search_query=cat:${cat}&sortBy=submittedDate&max_results=5`);
      if (!xml) continue;
      const entries = xml.split('<entry>').slice(1);
      for (const entry of entries) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const urlMatch = entry.match(/<id>(.*?)<\/id>/);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/);
        const dateMatch = entry.match(/<published>(.*?)<\/published>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/\s+/g, ' ').trim();
          const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim().slice(0, 200) : '';
          items.push({ title, url: urlMatch ? urlMatch[1].trim() : '', summary, source: `arXiv (${cat})`, publishedAt: dateMatch ? dateMatch[1].trim() : '' });
        }
      }
    }
    console.log(`  arXiv: ${items.length} 篇`);
    return items;
  } catch (e) {
    console.error('    arXiv 失败:', e.message);
    return [];
  }
}

// ---- Source 3: GitHub search (anonymous REST API, 10 req/min) ----
function fetchGitHub() {
  console.log('  [GitHub] 搜索 AI 仓库...');
  try {
    const nowStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const q = encodeURIComponent('ai OR llm OR machine-learning');
    const resp = curlJSON(`https://api.github.com/search/repositories?q=${q}+pushed:>${nowStr}&sort=stars&order=desc&per_page=10`);
    if (!resp) throw new Error('empty');
    const data = JSON.parse(resp);
    if (!data.items) throw new Error('no items');
    const items = data.items.map(r => ({
      title: `${r.full_name} — ⭐ ${r.stargazers_count}`,
      url: r.html_url,
      summary: r.description || '',
      source: 'GitHub Trending',
      publishedAt: r.updated_at,
    }));
    console.log(`  GitHub: ${items.length} 个`);
    return items;
  } catch (e) {
    if (e.message.includes('API rate limit')) {
      console.log('  GitHub: 匿名 API 限流，跳过');
    } else {
      console.error('    GitHub 失败:', e.message);
    }
    return [];
  }
}

// ---- Source 4: 36Kr (36氪 RSS) ----
function fetch36Kr() {
  console.log('  [36Kr] 拉取 RSS...');
  try {
    const xml = curlJSON('https://36kr.com/feed');
    if (!xml) throw new Error('empty');
    const items = [];
    const itemBlocks = xml.split('<item>').slice(1);
    for (const block of itemBlocks.slice(0, 20)) {
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
        items.push({ title, url, summary, source: '36Kr', publishedAt: dateMatch ? dateMatch[1].trim() : '' });
      }
    }
    // 过滤 AI 相关
    const aiKeywords = /AI|大模型|LLM|Agent|prompt|智能体|生成式|机器学习|深度学习|开源|Claude|OpenAI|DeepSeek|GPT|chatbot|机器人|RAG|多模态|推理|训练/i;
    const filtered = items.filter(i => aiKeywords.test(i.title) || aiKeywords.test(i.summary));
    console.log(`  36Kr: ${filtered.length}/${items.length} 条 (AI 过滤)`);
    return filtered;
  } catch (e) {
    console.error('    36Kr 失败:', e.message);
    return [];
  }
}

// ---- Main ----
(async () => {
  console.log(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 多源聚合采集中...\n`);

  const hnItems = fetchHN();
  const arxivItems = fetchArXiv();
  const ghItems = fetchGitHub();
  const krItems = fetch36Kr();

  const all = [...hnItems, ...arxivItems, ...ghItems, ...krItems];
  console.log(`\n  总计: ${all.length} 条补充资讯\n`);

  let md = `# 多源补充简报 — ${today}\n\n`;
  md += `> HN ${hnItems.length} 条 | arXiv ${arxivItems.length} 篇 | GitHub ${ghItems.length} 个 | 36Kr ${krItems.length} 条\n\n---\n\n`;

  if (hnItems.length > 0) {
    md += `## Hacker News 热门 AI 讨论\n\n`;
    hnItems.sort((a, b) => b.score - a.score);
    for (const item of hnItems.slice(0, 10)) {
      md += `- **${item.title}** (↑${item.score} 💬${item.comments})\n  ${item.url}\n`;
    }
    md += '\n';
  }

  if (arxivItems.length > 0) {
    md += `## 最新 AI 论文\n\n`;
    for (const item of arxivItems.slice(0, 10)) {
      md += `- **${item.title}** — ${item.source}\n`;
      if (item.summary) md += `  ${item.summary}\n`;
      md += `  ${item.url}\n`;
    }
    md += '\n';
  }

  if (ghItems.length > 0) {
    md += `## GitHub AI 热门项目\n\n`;
    for (const item of ghItems.slice(0, 10)) {
      md += `- **${item.title}**\n`;
      if (item.summary) md += `  ${item.summary}\n`;
      md += `  ${item.url}\n`;
    }
    md += '\n';
  }

  if (krItems.length > 0) {
    md += `## 36Kr AI 相关快讯\n\n`;
    for (const item of krItems.slice(0, 20)) {
      md += `- **${item.title}**\n`;
      if (item.summary) md += `  ${item.summary}\n`;
      md += `  ${item.url}\n`;
    }
    md += '\n';
  }

  const outFile = path.join(OUTPUT_DIR, `补充-${today}.md`);
  fs.writeFileSync(outFile, md, 'utf-8');
  console.log(`  已保存: ${outFile}`);
})();
