// auto-push.js — 将本轮采集结果自动推送到 GitHub 私有仓库

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { log } = require('./lib/curl-helper');

// REPO_PATH = f:/测试工具
const REPO_PATH = 'f:/测试工具';
const AI_ECON_PATH = 'AI内容/AI经济';

function getCurrentRound() {
  const statusFile = path.join(CONFIG.META_DIR, 'task-status.json');
  try {
    const s = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
    return s.currentRound || 0;
  } catch (_) {
    return 0;
  }
}

function cwd() {
  return { cwd: REPO_PATH, encoding: 'utf-8', windowsHide: true };
}

function exec(cmd) {
  try {
    return execSync(cmd, cwd());
  } catch (e) {
    log('error', `命令失败: ${cmd}\n${e.stderr || e.message}`);
    throw e;
  }
}

// ---- 敏感信息扫描 ----
function scanForSecrets(fileList) {
  log('info', '扫描敏感信息...');
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/,      // OpenAI API key
    /ghp_[a-zA-Z0-9]{36}/,       // GitHub personal access token
    /AKIA[0-9A-Z]{16}/,          // AWS Access Key
    /-----BEGIN (RSA|EC) PRIVATE KEY-----/, // Private keys
    /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i,
    /password\s*[:=]\s*['"][^'"]+['"]/i,
  ];

  for (const file of fileList) {
    const fullPath = path.join(REPO_PATH, file);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          log('error', `检测到敏感信息: ${file}`);
          return false;
        }
      }
    } catch (_) {}
  }
  log('info', '安全扫描通过');
  return true;
}

// ---- Main ----
function push() {
  const round = getCurrentRound();
  const nowStr = new Date().toISOString().slice(0, 10);

  log('info', '=== Git 自动推送 ===');

  // 1. 只推送 AI经济 目录的特定子目录
  const paths = [
    `${AI_ECON_PATH}/reports/`,
    `${AI_ECON_PATH}/data/raw/`,
    `${AI_ECON_PATH}/meta/`,
    `${AI_ECON_PATH}/README.md`,
  ];

  // 2. 确认待推送文件
  try {
    const stagedOutput = execSync(`git diff --cached --name-only`, cwd()).trim();
    if (stagedOutput) {
      log('warn', `工作区有未提交的暂存文件，先取消暂存: ${stagedOutput}`);
      exec('git reset');
    }
  } catch (_) {}

  // 3. git add
  log('info', 'git add ...');
  for (const p of paths) {
    try {
      exec(`git add "${p}"`);
    } catch (_) {
      // 忽略不存在路径的错误
    }
  }

  // 4. 确认有变更
  let diff;
  try {
    diff = execSync('git diff --cached --name-only', cwd()).trim();
  } catch (_) {
    diff = '';
  }

  if (!diff) {
    log('info', '无变更，跳过推送。');
    return;
  }

  log('info', `待推送文件:\n${diff}`);

  // 5. 安全扫描
  const fileList = diff.split('\n').filter(Boolean);
  if (!scanForSecrets(fileList)) {
    log('error', '安全扫描失败，取消推送！');
    exec('git reset');
    process.exit(1);
  }

  // 6. 提交
  const commitMsg = `AI经济: 第${round}轮采集 (${nowStr})`;
  log('info', `git commit: "${commitMsg}"`);
  exec(`git commit -m "${commitMsg}"`);

  // 7. 推送
  log('info', 'git push origin main...');
  try {
    exec('git push origin main');
    log('info', '推送成功 ✅');
  } catch (e) {
    log('error', `推送失败: ${e.message}`);
    log('warn', '请检查网络连接和远程仓库权限。');
    process.exit(1);
  }
}

// 执行
try {
  push();
} catch (e) {
  log('error', `推送流程异常: ${e.message}`);
  process.exit(1);
}
