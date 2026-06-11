#!/usr/bin/env node
/**
 * CDP 页面抓取器 — 通过 Edge/Chrome DevTools Protocol 加载页面并提取内容。
 * 用法: node cdp-fetch.mjs <url>
 * 前置: Edge 开启 --remote-debugging-port=9222
 * 要求: Node.js 22+（原生 WebSocket）
 */

const CDP = "http://localhost:9222";
const TIMEOUT = 60000;

let _idCounter = 1;
function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = _idCounter++;
    const timer = setTimeout(() => {
      ws.removeEventListener("message", handler);
      reject(new Error(`Timeout: ${method}`));
    }, TIMEOUT);

    function handler(event) {
      const msg = JSON.parse(event.data.toString());
      if (msg.id === id) {
        clearTimeout(timer);
        ws.removeEventListener("message", handler);
        if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
        else resolve(msg.result);
      }
    }
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function fetchJSON(u) {
  const r = await fetch(u);
  const text = await r.text();
  try { return JSON.parse(text); } catch {
    console.error(`[WARN] Non-JSON from ${u}: ${text.substring(0, 200)}`);
    return null;
  }
}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error("用法: node cdp-fetch.mjs <url>"); process.exit(1); }

  // 1. 创建新页面（Edge 要求 PUT）
  console.error("[CDP] Creating new page...");
  const r = await fetch(`${CDP}/json/new?url=about:blank`, { method: "PUT" });
  const text = await r.text();
  let pageTarget;
  try { pageTarget = JSON.parse(text); } catch {
    console.error("[WARN] PUT /json/new failed:", text.substring(0, 100));
  }

  if (!pageTarget) {
    // fallback: use first available page
    const targets = await fetchJSON(`${CDP}/json`);
    pageTarget = targets?.find(t => t.type === "page");
  }

  if (!pageTarget) {
    console.error("No page target available");
    process.exit(1);
  }

  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.error(`[CDP] Target: ${pageTarget.id}`);

  // 2. WebSocket 连接
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("WS connect timeout")), 10000);
    ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
    ws.addEventListener("error", (e) => { clearTimeout(t); reject(e); }, { once: true });
  });
  console.error("[CDP] Connected");

  // 3. 启用 domains
  await cdpSend(ws, "Page.enable");
  await cdpSend(ws, "Runtime.enable");

  // 4. 导航
  console.error(`[CDP] Navigating: ${url}`);
  await cdpSend(ws, "Page.navigate", { url });

  // 5. 等待 SPA 渲染完成
  console.error("[CDP] Waiting render...");
  let ready = false;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1200));
    try {
      const r = await cdpSend(ws, "Runtime.evaluate", {
        expression: "document.readyState",
        returnByValue: true,
      });
      if (r.result?.value === "complete") {
        ready = true;
        console.error(`[CDP] Ready (${((i + 1) * 1.2).toFixed(1)}s)`);
        break;
      }
    } catch {}
  }
  if (!ready) console.error("[CDP] May not be fully loaded");

  // 额外等 2s
  await new Promise(r => setTimeout(r, 2000));

  // 6. 提取数据
  console.error("[CDP] Extracting...");

  const extractScript = `
  (function() {
    var d = {};
    d.title = document.title || '';
    var md = document.querySelector('meta[name="description"]');
    d.metaDesc = md ? md.content : '';
    var ogTitle = document.querySelector('meta[property="og:title"]');
    d.ogTitle = ogTitle ? ogTitle.content : '';
    var ogDesc = document.querySelector('meta[property="og:description"]');
    d.ogDesc = ogDesc ? ogDesc.content : '';
    d.bodyText = (document.body?.innerText || '').substring(0, 5000);

    // Douyin-specific selectors
    var nickEl = document.querySelector('[data-e2e="user-info"]') ||
                 document.querySelector('[class*="nickname"]') ||
                 document.querySelector('[class*="author"]');
    if (nickEl) d.authorName = (nickEl.innerText || nickEl.textContent || '').trim();

    var descEl = document.querySelector('[data-e2e="video-desc"]') ||
                 document.querySelector('[class*="desc"]') ||
                 document.querySelector('[class*="video-info"]');
    if (descEl) d.videoDesc = (descEl.innerText || descEl.textContent || '').trim();

    var stats = [];
    document.querySelectorAll('[data-e2e*="count"], [class*="count"]').forEach(function(el) {
      var t = (el.innerText || el.textContent || '').trim();
      if (t && /[0-9]/.test(t)) stats.push(t);
    });
    d.statsTexts = stats.slice(0, 10);

    var tags = [];
    document.querySelectorAll('[data-e2e="hashtag"], a[href*="/tag/"], [class*="hashtag"]').forEach(function(el) {
      tags.push((el.innerText || el.textContent || '').trim());
    });
    d.hashtags = tags.slice(0, 15);

    var music = document.querySelector('[class*="music"]');
    if (music) d.music = (music.innerText || music.textContent || '').trim().substring(0, 200);

    // Try RENDER_DATA
    var rd = document.getElementById('RENDER_DATA');
    if (rd && rd.textContent) {
      try { d.renderData = decodeURIComponent(rd.textContent).substring(0, 3000); } catch(e) {}
    }

    return JSON.stringify(d);
  })();
  `;

  const result = await cdpSend(ws, "Runtime.evaluate", {
    expression: extractScript,
    returnByValue: true,
  });

  let pageData;
  try {
    pageData = JSON.parse(result.result?.value || "{}");
  } catch {
    pageData = { raw: result.result?.value?.substring?.(0, 2000) || String(result) };
  }

  // Screenshot
  try {
    const shot = await cdpSend(ws, "Page.captureScreenshot", { format: "jpeg", quality: 50 });
    pageData._screenshot = shot.data?.substring(0, 100) + "...";
    console.error("[CDP] Screenshot ok");
  } catch {}

  const output = { url, timestamp: new Date().toISOString(), ...pageData };
  console.log(JSON.stringify(output, null, 2));

  ws.close();
  console.error("[CDP] Done");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
