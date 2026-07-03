// schedule-permanent.js — 创建永久 Windows 定时任务（绕过 shell 编码问题）
const { execSync } = require('child_process');
const path = require('path');

const TASK_NAME = 'AI-Daily-Fetch';
const SCRIPT_PATH = 'f:\\测试工具\\AI公众号\\scripts\\fetch-daily.js';
const BAT_PATH = 'f:\\测试工具\\AI公众号\\scripts\\fetch-daily.bat';

// 使用 schtasks 创建永久每日任务
const cmd = `schtasks /create /tn "${TASK_NAME}" /tr "cmd /c \\"${BAT_PATH}\\"" /sc daily /st 08:15 /f`;

console.log('创建永久定时任务...');
try {
  const out = execSync(cmd, { encoding: 'utf-8', windowsHide: true });
  console.log(out);
  console.log('任务已创建: 每天 08:15 运行，永不过期');
  console.log('查看: schtasks /query /tn "' + TASK_NAME + '"');
  console.log('删除: schtasks /delete /tn "' + TASK_NAME + '" /f');
} catch (e) {
  console.error('错误:', e.stderr || e.message);
  process.exit(1);
}
