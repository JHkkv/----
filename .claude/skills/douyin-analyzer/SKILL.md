---
name: douyin-analyzer
description: >
  使用豆包（火山引擎 ARK）多模态大模型进行内容感知，再由 Claude 深度分析。
  
  **抖音视频分析**：当用户分享抖音链接（v.douyin.com、douyin.com）、要求分析短视频、
  提到"分析这个视频"、"解读一下"、"这个抖音怎么看"时触发。
  
  **图片分析**：当用户发送图片文件（PNG/JPG/WebP）、截图、海报、图表、
  要求"看看这张图"、"图片里有什么"、"识别这张图"、"分析这张截图"时触发。
  
  **音频分析**：当用户分享音频文件（MP3/WAV/m4a）、语音消息、播客片段、
  要求"听听这段"、"转写这段音频"、"这段说了什么"时触发。
  
  **核心架构**：豆包负责感知层（图像描述/OCR/音频转写）→ Claude 负责推理层（分析/解读/建议）。
  即使链接或文件看起来不完整，只要出现上述内容形态就触发。
---

# 抖音视频分析器

通过浏览器抓取抖音视频页面信息，调用豆包（火山引擎 ARK）大模型进行多维度结构化分析。

## 前置条件

首次使用前，确认以下环境变量已设置（如未设置，先询问用户）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DOUBAO_API_KEY` | 火山引擎 ARK API Key | `ark_xxxx` |
| `DOUBAO_API_ENDPOINT` | API 端点地址 | `https://ark.cn-beijing.volces.com/api/v3/responses` |
| `DOUBAO_MODEL` | 模型 ID | `doubao-seed-2-0-pro-260215` |

如果用户未配置，引导其到火山引擎 ARK 控制台获取：https://console.volcengine.com/ark

## 核心架构原则

**豆包 = 感知层（眼睛/耳朵），Claude = 推理层（大脑）。**

```
用户分享内容 → 豆包提取原始信息(纯描述/转写，不做分析) → Claude 深度分析/解读/建议
              ↑ 感知层                                ↑ 推理层
```

- 豆包的 prompt 必须是**纯提取性的**："描述图片中的文字和元素"、"转写音频内容"，禁止加"分析"、"评价"等推理指令
- 豆包输出原文 → Claude 拿到原文后进行理解、分析、推理、给出建议
- 这确保了分析质量（Claude 推理能力强）和多模态覆盖（豆包感知能力强）

---

## 图片分析工作流

### 触发条件

用户消息中包含图片文件，或分享图片 URL，或要求分析/识别图片内容。

### 第一步：获取图片

- 如果用户在对话中直接上传图片文件，获取文件路径
- 如果是图片 URL，直接使用
- 如果是截图粘贴，保存到临时文件

### 第二步：将图片转为可访问的 URL

豆包 API 需要 HTTP(S) 可访问的图片 URL。处理方式：

1. 如果图片已是公网 URL → 直接使用
2. 如果是本地文件 → 用 Python 临时 HTTP 服务器暴露，或上传到临时图床

```bash
# 本地文件快速 HTTP 服务（在同一台机器上）
python -c "
import http.server, socketserver, threading, os
os.chdir('$(dirname "$IMAGE_PATH")')
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('', 18900), handler) as httpd:
    print(f'Serving at http://localhost:18900/{os.path.basename(\"$IMAGE_PATH\")}')
    httpd.serve_forever()
" &
```

### 第三步：调用豆包提取图片信息

使用 `input_image` 类型，prompt 必须是**纯提取性**的：

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [{
    "role": "user",
    "content": [
      {"type": "input_image", "image_url": "图片URL"},
      {"type": "input_text", "text": "请详细描述这张图片中的所有内容，包括：文字内容（逐字识别）、布局结构、图表数据、人物/物体、颜色。只做客观描述，不做分析和评价。"}
    ]
  }]
}
```

**Prompt 要点**：
- 用"描述"、"识别"、"转写"，不用"分析"、"评价"、"解读"
- 要求逐字识别文字（OCR 效果）
- 如果是图表，要求提取数据点和趋势
- 如果是 UI 截图，要求描述界面元素和布局

### 第四步：Claude 分析

拿到豆包返回的纯描述文本后，**你自己（Claude）**根据用户的原始需求进行分析：

- 用户想了解图片内容 → 整理描述为易懂的说明
- 用户想提取文字 → 格式化输出提取的文本
- 用户想分析数据 → 解读图表趋势和含义
- 用户想评估设计 → 从设计角度分析 UI/海报

## 音频分析工作流

### 触发条件

用户分享音频文件（MP3/WAV/m4a/ogg），或要求转写/分析音频内容。

### 第一步：获取音频

获取音频文件路径或 URL。

### 第二步：提取音频文字

豆包 ARK Responses API 可能支持 `input_audio` 类型。先尝试直接用豆包：

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [{
    "role": "user",
    "content": [
      {"type": "input_audio", "audio_url": "音频URL"},
      {"type": "input_text", "text": "请逐字转写这段音频的内容，包括说话人识别（如有多个说话人）。只做转写，不做总结和分析。"}
    ]
  }]
}
```

如果 ARK API 不支持 `input_audio`，使用备选方案：
- 用本地 Whisper/STT 工具转写
- 或告知用户当前不支持音频，建议先用其他工具转写后再分析文本

### 第三步：Claude 分析

拿到转写文本后，**你（Claude）**根据用户需求进行分析：

- 总结要点
- 提取关键信息
- 评估论证逻辑
- 给出建议

---

## 抖音视频分析工作流（原有）

### 第一步：解析链接

识别用户消息中的抖音链接，支持以下格式：
- `https://v.douyin.com/xxxxx/` — 短链接（最常见）
- `https://www.douyin.com/video/xxxxx` — 完整视频链接
- `https://www.douyin.com/user/xxxxx` — 用户主页
- 分享口令文本中含 `https://v.douyin.com/`

### 第二步：抓取视频信息

调用 **web-access** skill，用真实浏览器打开抖音链接，从页面中提取：

**必须提取：**
- 视频标题/文案
- 作者昵称
- 点赞数、评论数、分享数、收藏数
- 话题标签（hashtags）
- 发布时间

**可选提取（如果页面可获取）：**
- 视频时长
- 作者粉丝数
- 置顶热门评论（前 5 条）
- 视频简介/话题描述

**反爬/登录墙处理：**
如果 web-access 遇到验证码或登录页面，改为：
1. 尝试用 `https://www.iesdouyin.com/share/video/{video_id}` 这个分享页
2. 如果仍失败，请用户手动粘贴：视频标题、作者、文案、互动数据

### 第三步：构建分析提示词

将抓取到的信息组装为分析提示词。**必须使用以下模板**：

```
请分析以下抖音视频内容：

【视频标题/文案】{title}
【作者】{author}（粉丝：{followers}）
【发布时间】{publish_time}
【互动数据】点赞：{likes} | 评论：{comments} | 分享：{shares} | 收藏：{saves}
【话题标签】{hashtags}
【视频时长】{duration}
【视频简介】{description}

【热门评论】
{top_comments}

请从以下 6 个维度进行全面分析：

1. **内容概要** — 用 2-3 句话概括视频的核心主题和叙事主线
2. **文案拆解** — 标题和视频文案的吸引力要素：开头钩子、情绪调动、信息密度、结尾引导
3. **运营策略** — 发布时间选择、话题标签策略、互动引导手法（评论区引导、投票、提问等）、可能的投放痕迹
4. **爆款潜力分析** — 基于互动数据（点赞/评论/分享比）评估该视频表现，分析其传播逻辑
5. **用户画像与反馈** — 从评论内容推断目标受众特征、用户情绪倾向、争议点
6. **可复用方法论** — 如果要做类似内容的创作者，可以借鉴的 3-5 条具体操作建议

【输出要求】
- 每个维度用标题分隔，内容充实但不冗余
- 关键数据用 **粗体** 标注
- 最后用一段「一句话总结」收尾
```

### 第四步：调用豆包 API

使用 curl 调用火山引擎 ARK Responses API：

```bash
# 先将分析提示词写入临时文件，避免 shell 转义问题
cat > /tmp/douyin_prompt.txt << 'PROMPT_EOF'
<分析提示词内容>
PROMPT_EOF

PROMPT=$(cat /tmp/douyin_prompt.txt)
SYSTEM_PROMPT="你是一位资深短视频内容分析师和运营策略专家，擅长拆解抖音爆款视频的内容结构、叙事技巧和传播逻辑。你的分析既有数据支撑，又能给出可操作的创作建议。"

# 调用 API（Responses 接口，input 格式）
curl -s "$DOUBAO_API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOUBAO_API_KEY" \
  -d "$(jq -n \
    --arg model "$DOUBAO_MODEL" \
    --arg system "$SYSTEM_PROMPT" \
    --arg prompt "$PROMPT" \
    '{
      model: $model,
      input: [
        {
          role: "user",
          content: [
            {type: "input_text", text: "\($system)\n\n---\n\n\($prompt)"}
          ]
        }
      ]
    }')"
```

**Windows 环境（推荐用 Python 脚本）：**

```bash
# 将分析提示词保存后调用脚本
python3 scripts/call_doubao.py "$(cat /tmp/douyin_prompt.txt)"
```

脚本位置：`<skill目录>/scripts/call_doubao.py`

### 第五步：格式化呈现

解析 API 返回的 `output[0].content[0].text`，以清晰 Markdown 格式呈现。

在报告末尾附加：

```markdown
---
📊 **数据来源**：[原视频]({douyin_url})  
🤖 **分析引擎**：豆包（{model_name}）  
⏰ **分析时间**：{current_timestamp}
```

## 错误处理

| 错误 | 处理方式 |
|------|----------|
| 网页打不开/被拦截 | 尝试分享页 URL，或让用户手动粘贴视频信息 |
| API Key 无效 | 引导用户到火山引擎控制台检查 Key 状态 |
| API 返回超限 | 减少评论数量或截断过长的描述文本 |
| 模型不存在 | 确认 `DOUBAO_MODEL` 是否正确，列出可用模型 |
| 抓取内容为空 | 让用户确认链接是否有效，或直接粘贴视频文案 |

## 安全注意事项

- **绝不硬编码** API Key — 始终从环境变量读取
- 分析提示词写入临时文件后，用完后清理 `rm /tmp/douyin_prompt.txt`
- 不在报告外泄露视频作者的隐私信息（手机号、地址等）
- 如果抓取到敏感内容，仅做中性分析，不传播不实信息

## 补充说明

**为什么用 web-access 而不是直接 curl 抓抖音页面：**
抖音页面是动态渲染的（React/Vue），直接 curl 只能拿到空壳 HTML 和 JS bundle，
无法获取视频标题、互动数据等实际内容。web-access 用真实浏览器渲染后再提取 DOM 内容，成功率最高。

**分析维度可按需调整：**
如果用户只关心某个维度（如"只看运营策略"），跳过其他维度的输出。
如果用户指定的分析角度不在这 6 个维度中，按用户要求调整。
