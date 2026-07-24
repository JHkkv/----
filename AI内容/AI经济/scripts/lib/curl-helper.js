// curl-helper.js — 统一 curl 封装
// 复用模式: fetch-supplement.js 的 curlJSON() + 增强重试/超时

const { execSync } = require('child_process');

const DEFAULT_TIMEOUT = 20;
const DEFAULT_CONNECT_TIMEOUT = 15;
const MAX_RETRIES = 2;

/**
 * 执行 curl 命令并返回原始文本
 * @param {string} url - 请求URL
 * @param {object} opts
 * @param {number} [opts.timeout] - 最大等待秒数
 * @param {number} [opts.connectTimeout] - 连接超时秒数
 * @param {string} [opts.userAgent] - 自定义UA
 * @param {string} [opts.referer] - 自定义Referer
 * @param {Record<string,string>} [opts.headers] - 额外HTTP头
 * @returns {string} 响应内容，失败返回空串
 */
function curlRaw(url, opts = {}) {
  const timeout = opts.timeout || DEFAULT_TIMEOUT;
  const connectTimeout = opts.connectTimeout || DEFAULT_CONNECT_TIMEOUT;
  const ua = opts.userAgent || 'ai-economy-fetcher/1.0';

  const parts = [
    'curl -s',
    `--connect-timeout ${connectTimeout}`,
    `--max-time ${timeout}`,
    `--user-agent "${ua}"`,
    '--location',
    '--compressed',
  ];

  if (opts.referer) {
    parts.push(`--referer "${opts.referer}"`);
  }

  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      parts.push(`--header "${k}: ${v}"`);
    }
  }

  parts.push(`"${url}"`);
  const cmd = parts.join(' ');

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const out = execSync(cmd, {
        encoding: 'utf-8',
        timeout: (timeout + 5) * 1000,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return out.trim();
    } catch (_) {
      if (attempt > MAX_RETRIES) return '';
      // Windows 下使用 timeout 命令实现同步等待
      try {
        execSync(`timeout /t ${attempt} /nobreak >nul`, { timeout: (attempt + 2) * 1000, windowsHide: true });
      } catch (_) {}
      // Unix 后备: execSync(`sleep ${attempt}`)
    }
  }
  return '';
}

/**
 * 执行 curl 并解析 JSON
 * @param {string} url
 * @param {object} [opts]
 * @returns {object|null} 解析后的 JSON 对象，失败返回 null
 */
function curlJSON(url, opts = {}) {
  const raw = curlRaw(url, opts);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * 执行 curl 并返回 XML 文本
 * @param {string} url
 * @param {object} [opts]
 * @returns {string}
 */
function curlXML(url, opts = {}) {
  return curlRaw(url, opts);
}

/**
 * 输出进度到 stdout（可被 \r 覆盖）
 * @param {string} msg
 */
function progress(msg) {
  process.stdout.write(`  ${msg}\r`);
}

/**
 * 记录日志（带时间戳）
 * @param {string} level
 * @param {string} msg
 */
function log(level, msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const prefix = `[${ts}]`;
  if (level === 'error') {
    process.stderr.write(`${prefix} ❌ ${msg}\n`);
  } else if (level === 'warn') {
    process.stderr.write(`${prefix} ⚠️ ${msg}\n`);
  } else {
    process.stdout.write(`${prefix} ${msg}\n`);
  }
}

module.exports = { curlRaw, curlJSON, curlXML, progress, log };
