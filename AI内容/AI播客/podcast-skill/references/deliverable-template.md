# 台本交付模板（Deliverable Template）

> P6 交付时的 Markdown 结构和 **docx + PDF 双格式**生成规范。
> 文件保存：默认 `F:\测试工具\AI内容\AI播客\<标题>.md` / `.docx` / `.pdf`；若该路径不存在或跨机使用，改为用户当前工作目录或询问确认（**首次使用需确认输出目录是否存在**）。
> **PDF 生成**：docx 生成后，经两步转换得到 PDF（officecli 渲染 HTML → puppeteer-core 驱动本机 Edge 打印 PDF），见下文"PDF 转换"。无需 officecli PDF 插件、无需 Word。

## 一、Markdown 结构

```markdown
# 《<标题>》双人播客台本

> 版本：v2.0 终稿（已通过内容审查）
> 制作日期：YYYY-MM-DD
> 类型：双人对话式播客台本（AI 配音 / 真人录制两用）
> 时长：约 X 分钟（含留白，处于 3–5 分钟目标区间）
> 发布平台：抖音短视频

## 一、节目信息卡
| 项目 | 内容 |
|------|------|
| 节目主题 | ... |
| 角色设定 | 甲＝吐槽担当；乙＝打气担当 |
| 内容板块 | ①→②→③→④ |
| 情绪曲线 | V 字型：共鸣→干货→希望 |
| 内容定位 | 生活感悟 / 社会观察（非持牌财经分析） |
| 目标观众 | ... |
| 时长目标 | ... |
| 发布平台 | ... |

## 二、制作与合规说明
合规结论 + 全程生效约束（数据锚定/敏感模糊化/不制造焦虑/无隐私诱导）
+ 台本数据来源索引表（数据 | 来源）

## 三、最终台本
### 【开场钩子】约 0:00–0:24
**甲**：（动作+语气）台词
**乙**：（动作）台词
> 分镜：场景/画面/字幕要点

### 【切入主题】【板块一】...【板块四】【结尾 CTA】...（同上结构）

## 四、分镜 / 字幕速查表
| 时间段 | 场景 | 画面 | 数据/金句大字卡 |

## 五、金句速览（可截图金句 × N）
1. ...

## 六、发布前自查清单
- [ ] 无具体理财产品/收益率/收益承诺
- [ ] 无绝对化用语（所有人/最/百分百/唯一）
- [ ] 关键数据均带权威出处口播锚定
- [ ] 无高危词（躺平/暴雷/崩盘/佛系）
- [ ] 无假设性裁员/失业场景预设
- [ ] 无中日经济类比定调
- [ ] 结尾不诱导晒个人财务隐私
- [ ] 竖屏 9:16；字幕单行 ≤12 字；数据卡醒目
- [ ] 封面文案钩子建议
- [ ] 发布时勾选"作品声明—生活记录/观点"分类
```

## 二、docx 生成规范（officecli）

### 文件命名

`<标题>.docx`，与 md 同名，存同一目录。

### 结构映射

| 内容 | officecli 操作 |
|------|---------------|
| 标题+版本+日期+时长 | `paragraph`（Heading1 + Normal，居中对齐） |
| 一、节目信息卡 | `paragraph`(H1) + `table`(rows=8, cols=2) |
| 二、合规说明+来源表 | `paragraph`(H1) + `paragraph` + `table`(rows=N, cols=2) |
| 三、最终台本 | `paragraph`(H1) + 每段 `paragraph`(H2) + 对话 `paragraph` + 分镜 `paragraph`(italic, 10.5pt) |
| 四、分镜速查表 | `paragraph`(H1) + `table`(rows=N, cols=4) |
| 五、金句速览 | `paragraph`(H1) + `paragraph` 列表 |
| 六、发布前自查清单 | `paragraph`(H1) + `paragraph`(□ 项) |
| 页脚页码 | `footer` + `field=page` |

### 关键命令（已验证）

```bash
FILE="<标题>.docx"
officecli create "$FILE" && officecli open "$FILE"

# 样式（首次需定义 Heading，新建文档只有 Normal）
officecli add "$FILE" /styles --type style --prop id=Heading1 --prop type=paragraph \
  --prop basedOn=Normal --prop size=18pt --prop bold=true --prop font="Cambria" \
  --prop font.ea="宋体" --prop color=1F3864 --prop spaceBefore=14pt --prop spaceAfter=8pt
officecli add "$FILE" /styles --type style --prop id=Heading2 --prop type=paragraph \
  --prop basedOn=Normal --prop size=14pt --prop bold=true --prop font="Cambria" \
  --prop font.ea="宋体" --prop color=2E5395 --prop spaceBefore=10pt --prop spaceAfter=6pt

# 批量加段落（batch 支持 heredoc JSON）
officecli batch "$FILE" --json <<'EOF'
[{"command":"add","path":"/body","type":"paragraph","props":{"text":"...","style":"Heading1"}}]
EOF

# 表格填充（c1/c2 简写）
officecli set "$FILE" "/body/tbl[1]/tr[1]" --prop c1="节目主题" --prop c2="..."

# 页脚页码
officecli add "$FILE" / --type footer --prop type=default --prop size=9pt --prop text="Page " --prop field=page

# QA
officecli validate "$FILE"
officecli view "$FILE" outline
officecli save "$FILE" && officecli close "$FILE"
```

### QA 要点

- `validate` 返回 `no errors found`
- `view outline` 确认 H1/H2 层级完整（≥3 个 H1 需考虑 TOC）
- issue 分两类：C 类（CJK/Latin 混排标点，提示级，中文文档可接受）和 F 类（字号/间距格式提示）。以 `view issues` 输出为准，重点排查结构性错误（缺失内容、占位符泄漏、截断文本），格式提示可忽略
- 中英文标点用弯引号 `''""`，破折号用 `—`，区间用 `–`
- 正文 11-12pt，行距 1.15-1.5x，标题字号：H1≥18pt / H2=14pt

### PDF 转换（docx → PDF，两步）

> **前置**：无需 officecli PDF 插件、无需 Word。需要 Node.js（≥18）+ puppeteer-core（`scripts/package.json` 已声明依赖）+ 本机 Edge（`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`，其他路径改脚本常量）。

```bash
# ① officecli 把 docx 渲染为 HTML
officecli view "<标题>.docx" html -o "<标题>.html"

# ② puppeteer-core 驱动本机 Edge(CDP) 打印 PDF
cd scripts
npm install --no-save puppeteer-core   # 首次运行装依赖（约 29M）
node html-to-pdf.js "<标题>.html" "<标题>.pdf"
```

验证：`html-to-pdf.js` 成功输出 `PDF OK: <路径>`，`<标题>.pdf` 含文本层（可用 Python 检查 `/Font`、`/Text` 标记）。

> **已知边界**（2026-08 实测）：
> - 裸 `msedge --headless --print-to-pdf` 在本机**不可用**（渲染器报错），必须走 CDP（puppeteer-core），已验证通过。
> - officecli `view pdf` 需要 exporter 插件（本机未装），且本机无 Word；两步法绕开两者。
> - 换机器时改 `html-to-pdf.js` 顶部的 `EDGE` 常量为本机浏览器路径即可。

## 三、交付前自检

- [ ] 三个文件同目录同名（.md + .docx + .pdf）
- [ ] docx validate 通过
- [ ] PDF 转换成功（含文本层，非空）
- [ ] 分镜速查表时间段覆盖全篇
- [ ] 金句速览数量与实际一致
- [ ] 发布前自查清单覆盖全部合规红线
