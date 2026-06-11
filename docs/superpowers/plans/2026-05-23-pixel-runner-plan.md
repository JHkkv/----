# Pixel Runner 像素跑酷游戏 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个像素风横版跑酷游戏，角色自动向右跑，玩家跳跃躲避障碍并收集金币，支持本地排行榜。

**Architecture:** 单个 `index.html` 文件，包含所有 HTML/CSS/JS。使用 Canvas 2D 渲染像素风画面，localStorage 存储排行榜，requestAnimationFrame 驱动游戏循环。

**Tech Stack:** HTML5 + CSS3 + Vanilla JavaScript (Canvas 2D API)

---

## 文件结构

```
pixel-runner/
└── index.html    # 唯一文件，约 500 行
```

代码在 index.html 内按以下模块顺序排列：
1. CSS 样式（页面布局、像素字体）
2. HTML 结构（Canvas + UI 层）
3. JS：常量配置
4. JS：游戏状态
5. JS：背景渲染
6. JS：角色逻辑
7. JS：障碍物逻辑
8. JS：金币逻辑
9. JS：碰撞检测
10. JS：输入处理
11. JS：UI 与排行榜
12. JS：游戏循环

---

### Task 1: 创建项目骨架

**Files:**
- Create: `pixel-runner/index.html`

- [ ] **Step 1: 创建目录和基础 HTML**

```bash
mkdir -p pixel-runner
```

- [ ] **Step 2: 写入 HTML 骨架**

创建 `pixel-runner/index.html`，包含：
- 视口设置（适配手机）
- 一个 `<canvas>` 元素作为游戏画布
- 一个覆盖层 `<div>` 用于显示开始/结束画面和排行榜
- 内联 CSS 设定页面居中黑色背景

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Pixel Runner</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    font-family: 'Courier New', monospace;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  #game-container { position: relative; }
  canvas {
    display: block;
    image-rendering: pixelated;
    border: 2px solid #333;
  }
  #overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
    pointer-events: none;
  }
  #overlay.active { pointer-events: auto; }
  #overlay h1 { font-size: 28px; margin-bottom: 10px; color: #ffcc00; }
  #overlay p { font-size: 14px; margin: 6px 0; }
  #overlay button {
    margin-top: 12px;
    padding: 10px 28px;
    font-size: 16px;
    font-family: inherit;
    background: #ffcc00;
    color: #1a1a2e;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }
  #overlay button:active { background: #e6b800; }
  #leaderboard { margin-top: 14px; font-size: 12px; text-align: left; max-height: 200px; overflow-y: auto; }
  #leaderboard h2 { text-align: center; font-size: 16px; color: #ffcc00; margin-bottom: 6px; }
  #leaderboard ol { padding-left: 24px; }
  #leaderboard li { margin: 2px 0; }
  #name-input { margin-top: 8px; padding: 6px 10px; font-size: 14px; font-family: inherit; border: none; text-align: center; }
</style>
</head>
<body>
<div id="game-container">
  <canvas id="game"></canvas>
  <div id="overlay" class="active">
    <h1>PIXEL RUNNER</h1>
    <p>按空格键或点击屏幕跳跃</p>
    <p>躲避障碍，收集金币</p>
    <button id="start-btn">开始游戏</button>
    <div id="leaderboard"></div>
  </div>
</div>
<script>
// ===== 所有 JS 代码将在这里 =====
</script>
</body>
</html>
```

- [ ] **Step 3: 初始化 Canvas 并验证**

在 `<script>` 标签内添加：

```javascript
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = 800;
const H = 400;
canvas.width = W;
canvas.height = H;
// 手机端缩放适配
const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
canvas.style.width = (W * scale) + 'px';
canvas.style.height = (H * scale) + 'px';
```

- [ ] **Step 4: 在浏览器打开验证**

用浏览器打开 `pixel-runner/index.html`，确认：
- 页面居中显示黑色背景
- Canvas 区域可见，带边框
- 标题、按钮可见
- 手机端也能正常缩放

---

### Task 2: 游戏常量与颜色板

**Files:**
- Modify: `pixel-runner/index.html`（在 `<script>` 顶部添加常量块）

- [ ] **Step 1: 添加常量配置**

在 Canvas 初始化代码之后添加：

```javascript
// ===== 常量配置 =====
const COLORS = {
  sky: '#6185f8',
  cloud: '#ffffff',
  grass: '#38b000',
  dirt: '#8b5e3c',
  playerBody: '#e63946',
  playerSkin: '#ffcdb2',
  playerHat: '#e63946',
  obstacle: '#4a3728',
  spike: '#c0c0c0',
  coin: '#ffcc00',
  coinShine: '#fff7bf',
};

const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const BASE_SPEED = 4;
const MAX_SPEED = 10;
const SPEED_INCREMENT = 0.002;
const GROUND_Y = 340;       // 地面线 y 坐标
const PLAYER_X = 100;       // 角色固定 x 位置
const PLAYER_SIZE = 28;     // 角色绘制大小
const PLAYER_HITBOX = 20;   // 实际碰撞体积

const OBSTACLE_MIN_GAP = 90;  // 障碍物最小间隔（帧数）
const OBSTACLE_MAX_GAP = 180;
const COIN_MIN_GAP = 40;
const COIN_MAX_GAP = 120;
```

- [ ] **Step 2: 刷新浏览器确认无 JS 报错**

---

### Task 3: 游戏状态管理

**Files:**
- Modify: `pixel-runner/index.html`（在常量块之后添加）

- [ ] **Step 1: 添加游戏状态对象和辅助函数**

```javascript
// ===== 游戏状态 =====
const STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  OVER: 'over',
};

let gameState = STATE.IDLE;
let score = 0;
let highScore = 0;
let speed = BASE_SPEED;
let frameCount = 0;

function resetGame() {
  score = 0;
  speed = BASE_SPEED;
  frameCount = 0;
  player.vy = 0;
  player.y = GROUND_Y - PLAYER_SIZE;
  player.onGround = true;
  player.frame = 0;
  obstacles = [];
  coins = [];
  clouds = initClouds();
  nextObstacleFrame = 60;
  nextCoinFrame = 30;
}
```

- [ ] **Step 2: 刷新确认无报错**

---

### Task 4: 背景渲染

**Files:**
- Modify: `pixel-runner/index.html`（在状态块之后添加）

- [ ] **Step 1: 添加云朵初始化和背景绘制函数**

```javascript
// ===== 背景 =====
function initClouds() {
  const arr = [];
  for (let i = 0; i < 4; i++) {
    arr.push({
      x: Math.random() * W,
      y: 20 + Math.random() * 80,
      w: 40 + Math.random() * 40,
      speed: 0.3 + Math.random() * 0.4,
    });
  }
  return arr;
}

let clouds = initClouds();

function drawBackground() {
  // 天空
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // 云朵
  ctx.fillStyle = COLORS.cloud;
  for (const c of clouds) {
    // 像素化云朵：几个方块拼成
    const cx = Math.round(c.x);
    const cy = Math.round(c.y);
    ctx.fillRect(cx, cy, c.w, 12);
    ctx.fillRect(cx + 8, cy - 6, c.w - 16, 8);
    ctx.fillRect(cx + 4, cy + 6, c.w - 8, 6);
  }

  // 地面
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, GROUND_Y, W, 12);
  ctx.fillStyle = COLORS.dirt;
  ctx.fillRect(0, GROUND_Y + 12, W, H - GROUND_Y - 12);

  // 地面像素纹理（草叶）
  ctx.fillStyle = '#2dc653';
  for (let x = 0; x < W; x += 8) {
    if ((x / 8 + Math.floor(frameCount / 30)) % 3 === 0) {
      ctx.fillRect(x, GROUND_Y - 4, 4, 4);
    }
  }
}
```

- [ ] **Step 2: 添加更新云朵位置的函数**

```javascript
function updateBackground() {
  for (const c of clouds) {
    c.x -= c.speed;
    if (c.x + c.w < 0) {
      c.x = W + 20;
      c.y = 20 + Math.random() * 80;
    }
  }
}
```

- [ ] **Step 3: 临时在游戏循环中调用以验证**

在后续任务中会集成游戏循环。目前仅确保函数存在无语法错误。

---

### Task 5: 角色系统

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加玩家对象和绘制函数**

```javascript
// ===== 角色 =====
const player = {
  y: GROUND_Y - PLAYER_SIZE,
  vy: 0,
  onGround: true,
  frame: 0,        // 动画帧 0/1 切换
  frameTimer: 0,
};

function drawPlayer() {
  const px = PLAYER_X;
  const py = Math.round(player.y);
  const s = PLAYER_SIZE;

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(px - 2, GROUND_Y, s + 4, 4);

  // 腿（跑步动画：两帧交替）
  ctx.fillStyle = '#6b4c3b';
  if (player.frame === 0) {
    ctx.fillRect(px + 6, py + 18, 5, 8);
    ctx.fillRect(px + 17, py + 18, 5, 8);
  } else {
    ctx.fillRect(px + 4, py + 18, 5, 8);
    ctx.fillRect(px + 19, py + 18, 5, 8);
  }

  // 身体
  ctx.fillStyle = COLORS.playerBody;
  ctx.fillRect(px + 6, py + 8, 16, 12);

  // 头
  ctx.fillStyle = COLORS.playerSkin;
  ctx.fillRect(px + 6, py, 16, 10);

  // 帽子
  ctx.fillStyle = COLORS.playerHat;
  ctx.fillRect(px + 4, py - 4, 20, 6);
  ctx.fillRect(px + 2, py, 24, 4);

  // 眼睛
  ctx.fillStyle = '#000';
  ctx.fillRect(px + 16, py + 2, 3, 3);
  ctx.fillRect(px + 18, py + 2, 2, 2);
}

function updatePlayer() {
  // 重力
  player.vy += GRAVITY;
  player.y += player.vy;

  // 落地
  if (player.y >= GROUND_Y - PLAYER_SIZE) {
    player.y = GROUND_Y - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
  }

  // 跑步动画帧切换
  if (player.onGround && gameState === STATE.RUNNING) {
    player.frameTimer++;
    if (player.frameTimer > 8) {
      player.frameTimer = 0;
      player.frame = player.frame === 0 ? 1 : 0;
    }
  }

  // 失足掉出屏幕底部
  if (player.y > H + 50) {
    endGame();
  }
}

function jump() {
  if (player.onGround && gameState === STATE.RUNNING) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}
```

- [ ] **Step 2: 确认无语法错误**

---

### Task 6: 障碍物系统

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加障碍物数组、生成和绘制函数**

```javascript
// ===== 障碍物 =====
let obstacles = [];
let nextObstacleFrame = 60;

function spawnObstacle() {
  const w = 16 + Math.floor(Math.random() * 12); // 宽 16-28
  const h = 20 + Math.floor(Math.random() * 16); // 高 20-36
  obstacles.push({
    x: W,
    y: GROUND_Y - h,
    w,
    h,
  });
}

function drawObstacles() {
  for (const obs of obstacles) {
    const ox = Math.round(obs.x);
    const oy = Math.round(obs.y);

    // 主体
    ctx.fillStyle = COLORS.obstacle;
    ctx.fillRect(ox, oy, obs.w, obs.h);

    // 尖刺（顶部三角形用像素表现）
    ctx.fillStyle = COLORS.spike;
    const spikeH = 8;
    for (let row = 0; row < spikeH; row++) {
      const indent = Math.floor(row * 0.6);
      ctx.fillRect(ox + indent, oy - spikeH + row, obs.w - indent * 2, 1);
    }

    // 眼睛（让障碍物看起来有点邪恶）
    ctx.fillStyle = '#fff';
    ctx.fillRect(ox + 3, oy + 4, 4, 4);
    ctx.fillRect(ox + obs.w - 7, oy + 4, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(ox + 4, oy + 5, 2, 2);
    ctx.fillRect(ox + obs.w - 6, oy + 5, 2, 2);
  }
}

function updateObstacles() {
  if (gameState !== STATE.RUNNING) return;

  if (frameCount >= nextObstacleFrame) {
    spawnObstacle();
    nextObstacleFrame = frameCount + OBSTACLE_MIN_GAP +
      Math.floor(Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP));
  }

  for (const obs of obstacles) {
    obs.x -= speed;
  }

  // 移除屏幕外的障碍物
  obstacles = obstacles.filter(obs => obs.x + obs.w > -50);
}
```

- [ ] **Step 2: 确认无语法错误**

---

### Task 7: 金币系统

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加金币数组、生成和绘制函数**

```javascript
// ===== 金币 =====
let coins = [];
let nextCoinFrame = 30;
let coinAnimFrame = 0;

function spawnCoin() {
  coins.push({
    x: W,
    y: GROUND_Y - 60 - Math.random() * 100, // 高度随机
    size: 12,
    collected: false,
  });
}

function drawCoins() {
  coinAnimFrame++;
  for (const coin of coins) {
    if (coin.collected) continue;
    const cx = Math.round(coin.x);
    const cy = Math.round(coin.y);
    const s = coin.size;

    // 闪烁效果
    const bright = Math.sin(coinAnimFrame * 0.1 + coin.x) > 0;
    ctx.fillStyle = bright ? COLORS.coinShine : COLORS.coin;
    ctx.fillRect(cx, cy, s, s);
    // 中心高光
    ctx.fillStyle = bright ? COLORS.coin : COLORS.coinShine;
    ctx.fillRect(cx + 3, cy + 3, s - 6, s - 6);
  }
}

function updateCoins() {
  if (gameState !== STATE.RUNNING) return;

  if (frameCount >= nextCoinFrame) {
    spawnCoin();
    nextCoinFrame = frameCount + COIN_MIN_GAP +
      Math.floor(Math.random() * (COIN_MAX_GAP - COIN_MIN_GAP));
  }

  for (const coin of coins) {
    coin.x -= speed;
  }

  coins = coins.filter(coin => !coin.collected && coin.x + coin.size > -20);
}
```

- [ ] **Step 2: 确认无语法错误**

---

### Task 8: 碰撞检测

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加矩形碰撞检测和游戏结束/收集逻辑**

```javascript
// ===== 碰撞检测 =====
function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkCollisions() {
  const px = PLAYER_X + (PLAYER_SIZE - PLAYER_HITBOX) / 2;
  const py = player.y + (PLAYER_SIZE - PLAYER_HITBOX) / 2;
  const pw = PLAYER_HITBOX;
  const ph = PLAYER_HITBOX;

  // 碰撞障碍物
  for (const obs of obstacles) {
    if (rectCollide(px, py, pw, ph, obs.x, obs.y, obs.w, obs.h)) {
      endGame();
      return;
    }
  }

  // 收集金币
  for (const coin of coins) {
    if (coin.collected) continue;
    if (rectCollide(px, py, pw, ph, coin.x, coin.y, coin.size, coin.size)) {
      coin.collected = true;
      score += 50;
    }
  }
}
```

- [ ] **Step 2: 确认无语法错误**

---

### Task 9: 输入处理

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加键盘和触摸事件监听**

```javascript
// ===== 输入处理 =====
function setupInput() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState === STATE.IDLE) {
        startGame();
      } else if (gameState === STATE.RUNNING) {
        jump();
      } else if (gameState === STATE.OVER) {
        restartGame();
      }
    }
  });

  // 触摸/点击
  canvas.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState === STATE.IDLE) {
      startGame();
    } else if (gameState === STATE.RUNNING) {
      jump();
    } else if (gameState === STATE.OVER) {
      restartGame();
    }
  });

  // 手机触摸
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === STATE.IDLE) {
      startGame();
    } else if (gameState === STATE.RUNNING) {
      jump();
    } else if (gameState === STATE.OVER) {
      restartGame();
    }
  });
}
```

- [ ] **Step 2: 确认无语法错误**

---

### Task 10: UI 与排行榜系统

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加覆盖层控制、开始/结束逻辑、排行榜函数**

```javascript
// ===== UI & 排行榜 =====
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const leaderboardDiv = document.getElementById('leaderboard');

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

function showOverlay(show) {
  if (show) {
    overlay.classList.add('active');
    overlay.style.display = 'flex';
  } else {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
  }
}

function startGame() {
  resetGame();
  gameState = STATE.RUNNING;
  showOverlay(false);
}

function endGame() {
  gameState = STATE.OVER;
  speed = 0;
  saveScore();
  renderLeaderboard();
  showOverlay(true);
  overlay.innerHTML = `
    <h1>游戏结束</h1>
    <p>得分: ${score}</p>
    <input id="name-input" type="text" maxlength="10" placeholder="输入你的名字" />
    <button id="restart-btn">再来一次</button>
    <div id="leaderboard"></div>
  `;
  document.getElementById('restart-btn').addEventListener('click', restartGame);
  document.getElementById('name-input').addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.stopPropagation();
  });
}

function restartGame() {
  saveScore();
  resetGame();
  gameState = STATE.RUNNING;
  showOverlay(false);
}

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('pixelRunnerScores') || '[]');
  } catch {
    return [];
  }
}

function saveScore() {
  const nameInput = document.getElementById('name-input');
  const name = (nameInput && nameInput.value.trim()) || '无名玩家';
  const records = getLeaderboard();
  records.push({
    name,
    score,
    date: new Date().toLocaleDateString('zh-CN'),
  });
  records.sort((a, b) => b.score - a.score);
  localStorage.setItem('pixelRunnerScores', JSON.stringify(records.slice(0, 10)));
}

function renderLeaderboard() {
  const records = getLeaderboard();
  const div = document.getElementById('leaderboard');
  if (!div) return;
  let html = '<h2>排行榜 TOP 10</h2>';
  if (records.length === 0) {
    html += '<p style="text-align:center">暂无记录</p>';
  } else {
    html += '<ol>';
    for (const r of records) {
      html += `<li>${r.name} — ${r.score} 分 (${r.date})</li>`;
    }
    html += '</ol>';
  }
  html += '<button id="clear-btn" style="font-size:11px;padding:4px 12px;margin-top:4px;background:#555;color:#fff;">清空排行榜</button>';
  div.innerHTML = html;
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem('pixelRunnerScores');
      renderLeaderboard();
    });
  }
}

function updateScore() {
  if (gameState !== STATE.RUNNING) return;
  score = Math.floor(frameCount * speed * 0.5);
}
```

- [ ] **Step 2: 确认无语法错误**

---

### Task 11: 游戏循环与渲染整合

**Files:**
- Modify: `pixel-runner/index.html`

- [ ] **Step 1: 添加住渲染循环**

```javascript
// ===== 游戏循环 =====
function gameLoop() {
  frameCount++;

  // 逐渐加速
  if (gameState === STATE.RUNNING && speed < MAX_SPEED) {
    speed += SPEED_INCREMENT;
  }

  updateBackground();
  updatePlayer();
  updateObstacles();
  updateCoins();
  checkCollisions();
  updateScore();

  // 渲染
  drawBackground();
  drawCoins();
  drawObstacles();
  drawPlayer();

  // 实时分数（左上角）
  if (gameState === STATE.RUNNING) {
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('SCORE: ' + score, 12, 30);
  }

  requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 2: 页面初始化代码**

在 `<script>` 末尾、在所有函数定义之后，添加初始化调用：

```javascript
// ===== 初始化 =====
function init() {
  setupInput();
  showOverlay(true);
  renderLeaderboard();
  gameLoop();
}

init();
```

- [ ] **Step 3: 确认所有函数调用链正确**

核心调用链：
- `init()` → `setupInput()`, `showOverlay(true)`, `renderLeaderboard()`, `gameLoop()`
- `gameLoop()` → `updateBackground()`, `updatePlayer()`, `updateObstacles()`, `updateCoins()`, `checkCollisions()`, `updateScore()`
- `startGame()` → `resetGame()`, `showOverlay(false)`
- `endGame()` → `saveScore()`, `renderLeaderboard()`, `showOverlay(true)`
- `restartGame()` → `saveScore()`, `resetGame()`, `showOverlay(false)`

---

### Task 12: 测试与修复

- [ ] **Step 1: 验证游戏完整可玩**

用浏览器打开 `pixel-runner/index.html`，按以下清单逐项测试：

**开始画面：**
- [ ] 显示标题 "PIXEL RUNNER"
- [ ] 显示操作提示
- [ ] 显示排行榜（首次为空）
- [ ] 点击"开始游戏"按钮能进入游戏

**游戏进行中：**
- [ ] 角色自动向右跑（地面向左移动的效果）
- [ ] 按空格键能跳跃
- [ ] 点击/触摸 Canvas 能跳跃
- [ ] 速度逐渐加快
- [ ] 左上角实时显示分数
- [ ] 障碍物随机出现
- [ ] 金币随机出现
- [ ] 吃到金币加分

**游戏结束：**
- [ ] 碰到障碍物游戏结束
- [ ] 显示得分
- [ ] 可以输入名字
- [ ] 排行榜显示历史记录
- [ ] 点击"再来一次"能重开
- [ ] 退出画面时掉出屏幕底部也会触发结束

**排行榜：**
- [ ] 多玩几次后排行榜正确排序
- [ ] "清空排行榜"按钮有效
- [ ] 关闭浏览器再打开，数据还在

**手机端：**
- [ ] 手机浏览器打开能玩
- [ ] 触摸跳跃正常
- [ ] Canvas 缩放适配屏幕

- [ ] **Step 2: 修复发现的问题**

常见潜在问题：
- 双跳（空中还能再跳一次）→ 检查 `onGround` 状态
- 障碍物太密无法通过 → 调整 `OBSTACLE_MIN_GAP`
- 手机端 Canvas 太小 → 调整缩放计算
- 排行榜数据损坏 → `getLeaderboard()` 里已有 try/catch

- [ ] **Step 3: 最终确认**

完成所有测试项，修复所有问题后，游戏即为可交付状态。
