#!/usr/bin/env node
/**
 * 知识库处理脚本
 * 用法：node scripts/process-kb.js
 *
 * 功能：
 * 1. 扫描 raw/ 目录，找到未处理的新文件
 * 2. 提取核心概念
 * 3. 生成/更新 wiki 页面（含双向链接）
 * 4. 更新处理日志
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KB_ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(KB_ROOT, 'raw');
const WIKI_DIR = path.join(KB_ROOT, 'wiki');
const LOG_FILE = path.join(KB_ROOT, '.processing-log.md');
const REPORT_FILE = path.join(KB_ROOT, 'output', '处理报告.md');

// ========== 工具函数 ==========

function getFileHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':');
    if (k && v.length) meta[k.trim()] = v.join(':').trim();
  });
  return { meta, body: content.slice(match[0].length).trim() };
}

function getProcessedFiles() {
  if (!fs.existsSync(LOG_FILE)) return new Set();
  const log = fs.readFileSync(LOG_FILE, 'utf-8');
  const set = new Set();
  const regex = /^\|\s*(.+?)\s*\|/gm;
  let m;
  while ((m = regex.exec(log)) !== null) {
    if (!m[1].includes('文件') && !m[1].includes('---')) {
      set.add(m[1].trim());
    }
  }
  return set;
}

function getRawFiles() {
  if (!fs.existsSync(RAW_DIR)) return [];
  return fs.readdirSync(RAW_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();
}

/**
 * 简单概念提取（基于规则，不依赖 AI）
 * 提取标题、加粗文本、列表项中的关键信息
 */
function extractConcepts(content) {
  const { meta, body } = parseFrontmatter(content);
  const concepts = [];

  // 1. 提取主标题
  const titleMatch = body.match(/^# (.+)$/m);
  if (titleMatch) {
    concepts.push({
      name: titleMatch[1].trim(),
      definition: '',
      type: '主概念',
    });
  }

  // 2. 提取二级标题作为细分概念
  const h2Matches = body.matchAll(/^## (.+)$/gm);
  for (const m of h2Matches) {
    const name = m[1].trim();
    if (!concepts.find(c => c.name === name)) {
      concepts.push({ name, definition: '', type: '细分概念' });
    }
  }

  // 3. 提取加粗的关键词
  const boldMatches = body.matchAll(/\*\*(.+?)\*\*/g);
  for (const m of boldMatches) {
    const name = m[1].trim();
    if (name.length <= 20 && name.length >= 2 && !concepts.find(c => c.name === name)) {
      concepts.push({ name, definition: '', type: '关键词' });
    }
  }

  // 4. 为每个概念提取一句话定义
  for (const c of concepts) {
    const idx = body.indexOf(c.name);
    if (idx > 0) {
      const context = body.slice(Math.max(0, idx - 50), idx + 200);
      const sentenceMatch = context.match(new RegExp(`${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^。.\\n]*[。.]`));
      if (sentenceMatch) {
        c.definition = sentenceMatch[0].trim();
      }
    }
  }

  return concepts;
}

function getExistingConcepts() {
  if (!fs.existsSync(WIKI_DIR)) return [];
  return fs.readdirSync(WIKI_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .map(f => ({
      filename: f,
      name: f.replace('.md', ''),
      path: path.join(WIKI_DIR, f),
    }));
}

/**
 * 匹配已有关联概念（基于名称关键词匹配）
 */
function findRelated(existing, conceptName) {
  const related = [];
  const keywords = conceptName.split(/[，,\s]+/).filter(k => k.length >= 2);
  for (const ex of existing) {
    for (const kw of keywords) {
      if (ex.name.includes(kw) || kw.includes(ex.name)) {
        if (!related.find(r => r.name === ex.name)) {
          related.push({ name: ex.name, relation: '#延伸' });
        }
      }
    }
  }
  return related;
}

// ========== 主流程 ==========

function main() {
  console.log('🔍 扫描 raw/ 目录...\n');

  const processed = getProcessedFiles();
  const rawFiles = getRawFiles();
  const existingConcepts = getExistingConcepts();

  const newFiles = rawFiles.filter(f => !processed.has(f));

  if (newFiles.length === 0) {
    console.log('✅ 没有新文件需要处理。');
    return { processed: 0, newConcepts: 0, related: 0 };
  }

  console.log(`📄 发现 ${newFiles.length} 个新文件：`);
  newFiles.forEach(f => console.log(`   - ${f}`));
  console.log('');

  let totalConcepts = 0;
  let totalRelated = 0;
  const reportData = [];

  for (const filename of newFiles) {
    const filePath = path.join(RAW_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { meta } = parseFrontmatter(content);

    console.log(`📖 处理中：${filename}`);

    // 1. 提取概念
    const concepts = extractConcepts(content);
    console.log(`   提取了 ${concepts.length} 个概念`);

    // 2. 生成 Wiki 页面
    const createdPages = [];
    for (const c of concepts) {
      const safeName = c.name.replace(/[/\\?%*:|"<>]/g, '-');
      const wikiPath = path.join(WIKI_DIR, `${safeName}.md`);

      // 找关联概念
      const related = findRelated(existingConcepts, c.name);
      const existingNames = new Set(existingConcepts.map(e => e.name));
      const relatedStr = related.length > 0
        ? related.map(r => `- [[${r.name}]] ${r.relation}`).join('\n')
        : '';

      // 检查是否已有
      if (existingNames.has(safeName)) {
        console.log(`   ⚠ ${safeName} 已存在，跳过`);
        continue;
      }

      const wikiContent = `---
aliases: []
tags: [${meta.tags || ''}]
source: "[[../raw/${filename}]]"
created: ${new Date().toISOString().slice(0, 10)}
---

# ${c.name}

## 定义
${c.definition || '（待补充定义）'}

## 来源
> 来自 [[../raw/${filename}]]

## 关联概念
${relatedStr || '- （待关联）'}

## 我的思考
（后续补充）
`;

      fs.writeFileSync(wikiPath, wikiContent, 'utf-8');
      createdPages.push({ name: safeName, related: related.length });
      existingConcepts.push({ filename: `${safeName}.md`, name: safeName, path: wikiPath });
    }

    // 3. 更新处理日志
    const hash = getFileHash(content);
    const logEntry = `| ${filename} | ${hash} | ${new Date().toISOString().slice(0, 10)} | ${concepts.length} | done |\n`;
    fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');

    console.log(`   ✅ 创建了 ${createdPages.length} 个新概念页，新增 ${createdPages.reduce((s,p) => s + p.related, 0)} 个关联`);

    reportData.push({
      file: filename,
      conceptsTotal: concepts.length,
      conceptsNew: createdPages.length,
      relations: createdPages.reduce((s,p) => s + p.related, 0),
    });

    totalConcepts += createdPages.length;
    totalRelated += createdPages.reduce((s,p) => s + p.related, 0);
  }

  // 4. 生成处理报告
  const report = `---
type: output
created: ${new Date().toISOString().slice(0, 10)}
---

# 知识库处理报告

## 概况
- 处理时间：${new Date().toLocaleString('zh-CN')}
- 处理文件数：${newFiles.length}
- 新增概念数：${totalConcepts}
- 建立关联数：${totalRelated}

## 详细
${reportData.map(r => `- **${r.file}**：${r.conceptsNew} 个新概念，${r.relations} 个关联`).join('\n')}
`;
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');

  console.log(`\n📊 报告已保存到 output/处理报告.md`);
  console.log(`🎉 完成！处理 ${newFiles.length} 个文件，新增 ${totalConcepts} 个概念，${totalRelated} 个关联`);

  return { processed: newFiles.length, newConcepts: totalConcepts, related: totalRelated };
}

main();
