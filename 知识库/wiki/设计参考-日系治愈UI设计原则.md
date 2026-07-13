# 日系治愈UI设计原则

> 「拖延症启动器」设计参考库 - 美学原则与视觉规范

---

## 1. 侘寂(Wabi-sabi)美学在数字产品中的应用

### 1.1 核心理念

侘寂美学接受不完美、无常和不完整。在数字产品中，这意味着：

- **不追求完美对称** — 允许微妙的不对称布局，营造自然感
- **留白即呼吸** — 界面"空"的部分与"满"的部分同等重要
- **克制优于炫技** — 减少视觉噪音，只保留必要的元素
- **柔和的不规则** — 避免过于几何化的线条，引入有机形态

### 1.2 数字侘寂的实践

```
[设计原则映射]

侘寂概念        →  数字产品应用
------------------------------------------
余白(よはく)    →  大量留白，元素间距宽松
間(ま)          →  动画之间的停顿，交互节奏放缓
渋い(しぶい)    →  低饱和度色彩，朴素的视觉语言
無駄の削ぎ落とし →  去除一切非必要装饰
手触り          →  微妙的纹理与质感暗示
```

### 1.3 对拖延症App的特殊意义

拖延症用户常伴随焦虑情绪。侘寂美学通过"接受不完美"传递一种心理暗示：
**不必完美，开始就好。** 界面不应给用户"必须做到最好"的压力，而是传达"做到这里也很好"的温和态度。

---

## 2. 日系App设计特征

### 2.1 留白(余白)策略

日系设计中的留白不是"空"，而是"等待被感知的空间"。

```
[留白比例参考]

区域              推荐比例        说明
-----------------------------------------------
页面边距          24-40px        移动端两侧留白
卡片内边距        20-32px        内容不贴边
段落间距          1.8-2.2em      比西方设计更宽松
模块间距          48-80px        功能区块之间的呼吸空间
标题上方空间      标题高度的2-3倍  标题"漂浮"在留白中
```

### 2.2 柔和性(Softness)

日系UI的柔和体现在三个层面：

**视觉柔和：** 低饱和度色彩、模糊阴影、半透明层叠
**交互柔和：** 缓入缓出动画、无突变状态切换
**语言柔和：** 文案温暖、不催促、不评判

### 2.3 克制(Restraint)

- 每个页面聚焦一个核心动作
- 色彩不超过3-4种
- 字体不超过2种（中文+英文各一种）
- 图标线条纤细(1-1.5px stroke)
- 避免使用感叹号，少用粗体

---

## 3. 治愈系色彩搭配方案

### 3.1 日系治愈色谱

以下色彩均来源于自然界（晨雾、樱花、抹茶、枯叶），具有低饱和、高明度的特征：

```
[基础治愈色]

色名          HEX        HSL              意象
----------------------------------------------------------
晨雾白        #F5F0EB    hsl(30, 20%, 95%)   冬日晨雾
樱花粉        #F2D4D7    hsl(350, 45%, 89%)  四月樱花
薄荷绿        #D4E4D9    hsl(140, 22%, 86%)  新叶初萌
天空蓝        #D1DFE8    hsl(205, 28%, 87%)  晴空高远
抹茶绿        #C3D4C5    hsl(128, 18%, 79%)  抹茶茶汤
米杏色        #E8DDD3    hsl(30, 25%, 87%)   晒暖的棉麻
薰衣草紫      #DDD5E5    hsl(270, 20%, 87%)  薰衣草田
枯叶棕        #C9B99A    hsl(40, 24%, 70%)   秋日枯叶
```

### 3.2 深层色彩

用于强调和交互反馈：

```
[深层色彩]

色名          HEX        HSL              用途
----------------------------------------------------------
墨灰          #5C5C5C    hsl(0, 0%, 36%)     主文字
深褐          #8B7355    hsl(30, 24%, 44%)   标题/强调
柔桃          #E8A0BF    hsl(335, 55%, 77%)  完成态高亮
苔绿          #7B9E6B    hsl(105, 20%, 52%)  正向反馈
雾蓝          #8BA7C4    hsl(210, 28%, 65%)  链接/可交互
```

---

## 4. 日系字体选择(中文适配)

### 4.1 字体栈推荐

```css
/* 日系治愈风字体栈 */
:root {
  /* 中文正文 - 优先思源黑体(更柔和) */
  --font-cn-body: "Noto Sans SC", "PingFang SC", "Microsoft YaHei",
                   "Hiragino Sans GB", sans-serif;

  /* 中文标题 - 可选思源宋体(更文艺) */
  --font-cn-display: "Noto Serif SC", "Source Han Serif SC",
                      "STSong", "SimSun", serif;

  /* 日文辅助 */
  --font-jp: "Noto Sans JP", "Hiragino Kaku Gothic Pro", sans-serif;

  /* 英文/数字 - 圆润无衬线 */
  --font-en: "Nunito", "Quicksand", "Comfortaa", sans-serif;

  /* 等宽(任务编号等) */
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

### 4.2 字号层级

```css
:root {
  --text-xs: 0.75rem;     /* 12px - 辅助文字 */
  --text-sm: 0.875rem;    /* 14px - 次要文字 */
  --text-base: 1rem;      /* 16px - 正文 */
  --text-lg: 1.125rem;    /* 18px - 强调正文 */
  --text-xl: 1.25rem;     /* 20px - 小标题 */
  --text-2xl: 1.5rem;     /* 24px - 标题 */
  --text-3xl: 1.875rem;   /* 30px - 大标题 */
  --text-4xl: 2.25rem;    /* 36px - 页面标题 */

  /* 行高 - 日系偏宽松 */
  --leading-tight: 1.5;
  --leading-normal: 1.8;
  --leading-relaxed: 2.0;
  --leading-loose: 2.4;
}
```

### 4.3 字重使用规范

```
[字重指南]

场景              字重        说明
----------------------------------------------
正文              300-400     轻盈感，不压迫
标题              400-500     适度强调，不用粗体
按钮文字          400         与正文一致即可
辅助/标签         300         更轻的视觉存在感

避免使用：600以上的字重（破坏柔和感）
```

---

## 5. 圆角、阴影、透明度的日系处理

### 5.1 圆角(Rounded Corners)

日系治愈风的圆角不是简单的"大圆角"，而是根据元素大小和重要性有层次地使用：

```css
:root {
  /* 圆角层级 */
  --radius-sm: 8px;       /* 小元素：标签、小按钮 */
  --radius-md: 12px;      /* 中元素：输入框、卡片 */
  --radius-lg: 16px;      /* 大元素：对话框、图片 */
  --radius-xl: 24px;      /* 特大：全屏卡片、底部弹窗 */
  --radius-full: 9999px;  /* 药丸形：胶囊按钮、标签 */

  /* 特殊：不规则圆角(侘寂感) */
  --radius-organic: 12px 4px 16px 8px;  /* 四角不对称 */
}
```

### 5.2 阴影(Shadows)

日系阴影追求"淡淡的投影"，模拟柔和的自然光：

```css
:root {
  /* 阴影层级 - 模拟纸张叠放 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.10);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);

  /* 治愈系特殊阴影 - 带色彩的柔和光晕 */
  --shadow-glow-pink: 0 4px 20px rgba(242, 212, 215, 0.4);
  --shadow-glow-green: 0 4px 20px rgba(212, 228, 217, 0.4);
  --shadow-glow-blue: 0 4px 20px rgba(209, 223, 232, 0.4);

  /* 内阴影 - 凹陷效果 */
  --shadow-inset: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}
```

### 5.3 透明度(Opacity)

```css
:root {
  /* 透明度层级 */
  --opacity-hover: 0.85;      /* hover微弱变化 */
  --opacity-pressed: 0.70;    /* 按下状态 */
  --opacity-disabled: 0.40;   /* 禁用状态 */
  --opacity-overlay: 0.30;    /* 背景遮罩 */
  --opacity-subtle: 0.60;     /* 次要信息 */

  /* 玻璃态(Glassmorphism) - 日系常用 */
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-blur: blur(12px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## 6. 参考App设计分析

### 6.1 Forest (专注森林)

```
[设计亮点]
- 色彩：以绿色为主调，传递成长与生命力
- 交互：种树动画简单但有成就感
- 反馈：完成后的森林全景展示
- 启发：用可视化生长替代冷冰冰的计时器

[可借鉴]
- 任务完成 → 可视化积累（如小花园成长）
- 时间投入 → 自然意象（花开、云散、日出）
```

### 6.2 潮汐 (Tide)

```
[设计亮点]
- 极简界面，几乎无文字
- 自然音景作为核心体验
- 色彩随场景变化（森林=绿，海洋=蓝，雨天=灰蓝）
- 畐白极多，焦点引导清晰

[可借鉴]
- 首页用场景/氛围而非功能列表
- 操作前的"呼吸"过渡
- 声音作为治愈层叠加
```

### 6.3 小日常

```
[设计亮点]
- 卡片化习惯展示
- 柔和的粉色/米色系
- 完成打卡的满足感动画
- 日历视图不带压迫感

[可借鉴]
- 习惯用卡片而非列表
- 日历用颜色浓淡而非勾叉
- 文案温和：不写"失败"，写"明天再试试"
```

### 6.4 Zenly (已停运，设计仍可参考)

```
[设计亮点]
- 地图界面使用柔和的粉彩色系
- 极度克制的信息密度
- 动画流畅自然，如物理弹簧
- 整体氛围：轻松、无压力、社交但不攀比

[可借鉴]
- 地图/空间感的柔和处理
- 社交元素的去竞争化表达
```

---

## 7. CSS设计系统变量(可直接用于开发)

```css
/* ==========================================
   拖延症启动器 - 日系治愈风设计系统
   ========================================== */

:root {
  /* ---- 色彩：主色板 ---- */
  --color-primary: #D4E4D9;          /* 抹茶绿 - 主色调 */
  --color-primary-light: #E8F0EB;    /* 抹茶绿 - 浅色变体 */
  --color-primary-dark: #A8C4AE;     /* 抹茶绿 - 深色变体 */

  --color-secondary: #F2D4D7;        /* 樱花粉 - 辅助色 */
  --color-secondary-light: #F9EDF0;  /* 樱花粉 - 浅色变体 */

  --color-accent: #D1DFE8;           /* 天空蓝 - 强调色 */
  --color-accent-light: #E8EFF4;     /* 天空蓝 - 浅色变体 */

  --color-warm: #E8DDD3;             /* 米杏色 - 暖色底 */
  --color-lavender: #DDD5E5;         /* 薰衣草紫 - 装饰色 */

  /* ---- 色彩：中性色 ---- */
  --color-bg: #FAFAF7;               /* 页面背景 - 微暖白 */
  --color-surface: #FFFFFF;          /* 卡片表面 */
  --color-surface-warm: #F5F0EB;     /* 温暖表面 */
  --color-border: rgba(0, 0, 0, 0.06);  /* 边框 */
  --color-divider: rgba(0, 0, 0, 0.04); /* 分割线 */

  /* ---- 色彩：文字 ---- */
  --color-text-primary: #4A4A4A;     /* 主文字 - 柔和深灰(非纯黑) */
  --color-text-secondary: #8B8B8B;   /* 次要文字 */
  --color-text-tertiary: #B0B0B0;    /* 辅助文字 */
  --color-text-inverse: #FAFAF7;     /* 反色文字 */

  /* ---- 色彩：语义色 ---- */
  --color-success: #7B9E6B;          /* 正向 - 苔绿 */
  --color-success-light: #D4E4D9;
  --color-warning: #C9B99A;          /* 注意 - 枯叶棕 */
  --color-warning-light: #E8DDD3;
  --color-error: #C48B8B;            /* 错误 - 柔红(非刺眼红) */
  --color-error-light: #F2D4D7;
  --color-info: #8BA7C4;             /* 信息 - 雾蓝 */
  --color-info-light: #D1DFE8;

  /* ---- 圆角 ---- */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* ---- 阴影 ---- */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.10);

  /* ---- 间距 ---- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* ---- 字体 ---- */
  --font-body: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-display: "Noto Serif SC", "STSong", serif;
  --font-en: "Nunito", "Quicksand", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* ---- 字号 ---- */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* ---- 动画时长 ---- */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-breath: 800ms;

  /* ---- 缓动函数 ---- */
  --ease-out-soft: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-breath: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 8. 常用组件样式模板

### 8.1 卡片

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: box-shadow var(--duration-normal) var(--ease-out-soft),
              transform var(--duration-normal) var(--ease-out-soft);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### 8.2 药丸按钮

```css
.btn-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-primary);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 400;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out-soft);
}

.btn-pill:hover {
  background: var(--color-primary-dark);
  box-shadow: var(--shadow-glow-green);
}
```

### 8.3 玻璃态面板

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

---

## 9. 设计禁忌

以下元素与日系治愈风格相悖，应严格避免：

```
[禁忌清单]

x  纯黑(#000000)文字       →  用 #4A4A4A 或更深的暖灰
x  高饱和度色彩             →  降低饱和度 30-50%
x  锐利直角                 →  最小 8px 圆角
x  粗重阴影                 →  阴影透明度不超过 12%
x  密集信息布局             →  每屏核心信息不超过 3 项
x  催促性文案("快！""赶紧！") →  温和引导("慢慢来""试试看")
x  红色警告/错误             →  用柔红或珊瑚色
x  突然的状态切换            →  所有变化加过渡动画
x  对比强烈的色彩组合        →  相邻色差控制在 30% 以内
x  过多装饰元素             →  装饰元素不超过页面 10%
```

---

## 10. 参考资源

- **色彩灵感：** nipponcolors.com (日本传统色)
- **字体推荐：** Google Fonts (Noto系列, Nunito)
- **设计参考：** Dribbble 搜索 "japanese app design", "healing UI", "wellness app"
- **App参考：** Forest, 潮汐, 小日常, Calm, Headspace
- **书籍：** 《设计中的设计》原研哉, 《侘寂》Leonard Koren

---

*本文档为「拖延症启动器」设计参考库的一部分，配合 `color-psychology.md` 和 `micro-interactions.md` 使用。*
