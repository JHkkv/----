# 豆包（火山引擎 ARK Responses API）参考

## API 概览

火山引擎 ARK 平台提供 **Responses API**（`/api/v3/responses`），
支持文本和图片多模态输入，可直接调用豆包全系列模型。

## 接口地址

```
POST https://ark.cn-beijing.volces.com/api/v3/responses
```

## 认证方式

```
Authorization: Bearer {API_KEY}
```

API Key 格式：`ark-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## 常用模型

| 模型 ID | 类型 | 适用场景 |
|---------|------|----------|
| `doubao-seed-2-0-pro-260215` | Seed 2.0 Pro | 旗舰模型，综合能力最强，支持多模态 |
| `doubao-seed-1-6-lite-250815` | Seed 1.6 Lite | 轻量快速响应 |
| `doubao-pro-32k` | Pro 系列 | 通用对话和分析（Chat Completions） |
| `doubao-pro-128k` | Pro 系列 | 长文本处理（Chat Completions） |
| `ep-xxxxxxxx` | 自定义端点 | 用户创建的推理端点 |

> **注意**：Seed 2.0 系列使用 `/api/v3/responses` 接口，Pro/Lite 系列可能同时支持
> `/api/v3/chat/completions` 和 `/api/v3/responses`。以控制台实际端点为准。

## 请求格式（Responses API）

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "分析提示词内容..."
        }
      ]
    }
  ]
}
```

### 多模态输入（图文混合）

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_image",
          "image_url": "https://example.com/image.png"
        },
        {
          "type": "input_text",
          "text": "描述这张图片"
        }
      ]
    }
  ]
}
```

### content 类型

| type | 说明 | 关键字段 | 用途 |
|------|------|----------|------|
| `input_text` | 文本输入 | `text`: 文本内容 | 提示词、问题 |
| `input_image` | 图片输入 | `image_url`: 图片 HTTP(S) URL | OCR、图像描述、截图识别 |
| `input_audio` | 音频输入 | `audio_url`: 音频 HTTP(S) URL | 语音转写、播客内容提取 |

### 多模态协作架构

豆包负责**感知**（提取原始信息），Claude 负责**推理**（分析解读）：

```
图片/音频 → 豆包提取(纯描述/转写) → 文本输出 → Claude 分析解读
              ↑ 感知层                      ↑ 推理层
```

- 感知模式 prompt 必须是**纯提取性**的（"描述"、"识别"、"转写"），不加"分析"、"评价"
- 豆包输出原始文本 → Claude 拿到后进行深度分析和建议
- 这确保了分析质量和多模态覆盖的兼顾

### 图片输入示例

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [{
    "role": "user",
    "content": [
      {"type": "input_image", "image_url": "https://example.com/chart.png"},
      {"type": "input_text", "text": "请详细描述这张图片中的所有文字和元素，只做客观描述。"}
    ]
  }]
}
```

### 音频输入示例

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [{
    "role": "user",
    "content": [
      {"type": "input_audio", "audio_url": "https://example.com/podcast.mp3"},
      {"type": "input_text", "text": "请逐字转写这段音频，标注说话人切换。"}
    ]
  }]
}
```

## 响应格式

```json
{
  "id": "resp-xxx",
  "model": "doubao-seed-2-0-pro-260215",
  "output": [
    {
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "分析结果文本..."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 500,
    "output_tokens": 800,
    "total_tokens": 1300
  }
}
```

### 提取结果文本

```
result["output"][0]["content"][0]["text"]
```

## 错误码

| HTTP 状态码 | 含义 | 处理建议 |
|-------------|------|----------|
| 200 | 成功 | - |
| 400 | 请求参数错误 | 检查 model 名称、input 格式 |
| 401 | 认证失败 | 检查 API Key 是否正确、是否过期 |
| 429 | 请求频率超限 | 稍等后重试 |
| 500 | 服务端错误 | 重试，持续失败检查控制台 |
| 503 | 服务暂不可用 | 模型可能在升级中，稍后重试 |

## 获取 API Key

1. 登录火山引擎控制台：https://console.volcengine.com/ark
2. 进入「API Key 管理」
3. 创建新的 API Key
4. 复制 Key（只显示一次）

## 参考链接

- ARK 平台文档：https://www.volcengine.com/docs/82379
- 模型列表：https://www.volcengine.com/docs/82379/1330310
