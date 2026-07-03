// schedule-weekly.js — 创建每周一永久定时任务
const { execSync } = require('child_process');

const TASK_NAME = 'AI-Weekly-Fetch';
const BAT_PATH = 'f:\\测试工具\\AI公众号\\scripts\\fetch-weekly.bat';

const cmd = `schtasks /create /tn "${TASK_NAME}" /tr "cmd /c \\"${BAT_PATH}\\"" /sc weekly /d MON /st 08:30 /f`;

console.log('创建每周定时任务...');
try {
  const out = execSync(cmd, { encoding: 'utf-8', windowsHide: true });
  console.log(out);
  console.log('任务已创建: 每周一 08:30 运行，永不过期');
  console.log('查看: schtasks /query /tn "' + TASK_NAME + '"');
  console.log('删除: schtasks /delete /tn "' + TASK_NAME + '" /f');
} catch (e) {
  console.error('错误:', e.stderr || e.message);
  process.exit(1);
}
