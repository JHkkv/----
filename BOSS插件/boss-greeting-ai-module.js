/**
 * ============================================================================
 * BOSS直聘AI招呼语生成器 — AI API集成模块 + Prompt模板
 * ============================================================================
 *
 * 适用场景：单文件HTML PWA中嵌入使用（放入<script>标签即可）
 * 默认API：DeepSeek API (https://api.deepseek.com/v1/chat/completions)
 * 备选：OpenAI兼容接口（用户可在设置中切换）
 * 流式输出：SSE (Server-Sent Events)
 *
 * 依赖：无外部依赖，仅使用原生 fetch + ReadableStream
 * 最低浏览器要求：Chrome 85+ / Safari 14+ / Firefox 88+（均支持 ReadableStream）
 *
 * @author 罗南杨
 * @date   2026-07-06
 */

// ============================================================================
// 第一部分：常量与默认配置
// ============================================================================

/**
 * 支持的AI Provider列表及其默认参数
 * 用户可在设置界面切换provider，切换时自动读取对应默认值
 */
const PROVIDER_DEFAULTS = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    maxTokens: 1024,
    temperature: 0.8,
    topP: 0.9,
    // DeepSeek 当前价格（2026年）：¥0.5/百万token，约 ¥0.0005/次调用
    estimatedCostPerCall: '≈¥0.001',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.8,
    topP: 0.9,
    estimatedCostPerCall: '≈¥0.015',
  },
  custom: {
    name: '自定义接口',
    baseUrl: '',
    model: '',
    maxTokens: 1024,
    temperature: 0.8,
    topP: 0.9,
    estimatedCostPerCall: '未知',
  },
};

/** API调用超时时间（毫秒） */
const REQUEST_TIMEOUT_MS = 30000;

/** 最大重试次数 */
const MAX_RETRIES = 2;

/** 重试间隔基数（毫秒），实际延迟 = baseMs * (2 ^ retryIndex) */
const RETRY_BASE_DELAY_MS = 1000;

/** localStorage键名 */
const STORAGE_KEYS = {
  CONFIG: 'boss_greeting_ai_config',
  HISTORY: 'boss_greeting_history',
  USER_PROFILE: 'boss_greeting_user_profile',
};

/** 招呼语最大生成字数 */
const MAX_GREETING_LENGTH = 200;

/** 6种钩子策略定义 */
const HOOK_STRATEGIES = [
  {
    id: 'number',
    name: '数字钩子',
    description: '把量化数据放最前面，用具体数字吸引注意',
    example: '"3年运营经验，从0做到月GMV 500万——"',
    instruction:
      '用具体的数字/数据开头，突出量化成果。例如：X年经验、X%增长、月GMV X万、操盘过X个百万级项目等。',
  },
  {
    id: 'match',
    name: '匹配钩子',
    description: 'JD关键词直接对应，展示高度匹配',
    example: '"看到贵司在招XX方向，我的经历高度匹配——"',
    instruction:
      '从JD中提取1-2个核心关键词/技能要求，直接声明自己具备对应经验和能力。',
  },
  {
    id: 'achievement',
    name: '成就钩子',
    description: '最大成就先行，先声夺人',
    example: '"曾帮前司将YY指标提升300%——"',
    instruction:
      '用过去工作中的最大成就/最有说服力的业绩开头，用具体可量化的结果说话。',
  },
  {
    id: 'problem',
    name: '问题钩子',
    description: 'JD中的痛点+你的解决方案',
    example: '"贵司ZZ问题，我在上家刚好解决过——"',
    instruction:
      '从JD中推断该岗位面临的挑战/痛点，指出自己曾经解决过类似问题的具体经验。',
  },
  {
    id: 'relevance',
    name: '关联钩子',
    description: '公司/产品关联，展示长期关注',
    example: '"一直在关注贵司新产品，发现我们在——"',
    instruction:
      '展示你对目标公司/产品的了解和关注，找到你与该公司业务方向上的真正关联点。',
  },
  {
    id: 'antiTemplate',
    name: '反模板钩子',
    description: '打破预期，直接说HR知道你在做什么',
    example: '"我知道您每天收到100+条\'您好\'，所以——"',
    instruction:
      '打破常规招呼语模式，用真诚、幽默或出其不意的方式开头，让HR感受到这不是模板生成的消息。',
  },
];

// ============================================================================
// 第二部分：配置管理模块
// ============================================================================

/**
 * 从localStorage读取AI配置，若不存在则返回默认值
 *
 * @returns {Object} 当前配置对象
 */
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const saved = JSON.parse(raw);
      // 合并默认值：用saved的值覆盖默认值（兼容旧版本新增字段）
      const defaults = PROVIDER_DEFAULTS[saved.provider] || PROVIDER_DEFAULTS.deepseek;
      return {
        provider: saved.provider || 'deepseek',
        apiKey: decryptApiKey(saved.apiKey || ''),
        baseUrl: saved.baseUrl || defaults.baseUrl,
        model: saved.model || defaults.model,
        maxTokens: saved.maxTokens || defaults.maxTokens,
        temperature: saved.temperature ?? defaults.temperature,
        topP: saved.topP ?? defaults.topP,
        // 非敏感字段直接保存
        preferredStyle: saved.preferredStyle || 'auto',
      };
    }
  } catch (e) {
    console.warn('读取配置失败，使用默认配置', e);
  }
  return getDefaultConfig();
}

/**
 * 获取完全默认的配置（不读取localStorage）
 *
 * @returns {Object} 默认配置对象
 */
function getDefaultConfig() {
  const defaults = PROVIDER_DEFAULTS.deepseek;
  return {
    provider: 'deepseek',
    apiKey: '',
    baseUrl: defaults.baseUrl,
    model: defaults.model,
    maxTokens: defaults.maxTokens,
    temperature: defaults.temperature,
    topP: defaults.topP,
    preferredStyle: 'auto',
  };
}

/**
 * 保存AI配置到localStorage
 * API Key使用简单混淆存储（Base64编码，非加密，仅防止明文泄露）
 *
 * @param {Object} config - 要保存的配置对象
 */
function saveConfig(config) {
  try {
    const toSave = { ...config };
    if (toSave.apiKey) {
      toSave.apiKey = encryptApiKey(toSave.apiKey);
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(toSave));
  } catch (e) {
    console.warn('保存配置失败', e);
  }
}

/**
 * API Key简单混淆编码（Base64 + 固定偏移）
 * 这不是真正的加密，仅用于避免localStorage明文存储。
 * 对于PWA场景足够，因为攻击者拿到localStorage时大概率已经拿到了整个页面上下文。
 *
 * @param {string} key - 明文API Key
 * @returns {string} 混淆后的字符串
 */
function encryptApiKey(key) {
  if (!key) return '';
  try {
    // 步骤1：UTF-8编码 → Base64
    const base64 = btoa(unescape(encodeURIComponent(key)));
    // 步骤2：Base64字符串每个字符偏移1（凯撒偏移），防止直接解码
    return base64
      .split('')
      .map((ch) => String.fromCharCode(ch.charCodeAt(0) + 1))
      .join('');
  } catch (e) {
    // 降级：直接Base64
    return btoa(unescape(encodeURIComponent(key)));
  }
}

/**
 * API Key解密（encryptApiKey的逆操作）
 *
 * @param {string} encrypted - 混淆后的字符串
 * @returns {string} 明文API Key
 */
function decryptApiKey(encrypted) {
  if (!encrypted) return '';
  try {
    // 步骤1：凯撒反向偏移
    const base64 = encrypted
      .split('')
      .map((ch) => String.fromCharCode(ch.charCodeAt(0) - 1))
      .join('');
    // 步骤2：Base64 → UTF-8解码
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    // 兼容旧版本（无偏移，直接Base64）
    try {
      return decodeURIComponent(escape(atob(encrypted)));
    } catch (e2) {
      return '';
    }
  }
}

// ============================================================================
// 第三部分：用户Profile管理模块
// ============================================================================

/**
 * 从localStorage读取用户个人背景
 *
 * @returns {Object} 用户Profile对象
 */
function loadUserProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('读取用户资料失败', e);
  }
  return {
    name: '',
    targetRole: '',
    experience: '',
    highlights: '',
    skills: '',
    updatedAt: null,
  };
}

/**
 * 保存用户个人背景到localStorage
 *
 * @param {Object} profile - 用户Profile对象
 */
function saveUserProfile(profile) {
  try {
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.warn('保存用户资料失败', e);
  }
}

// ============================================================================
// 第四部分：Prompt模板模块（核心资产）
// ============================================================================

/**
 * 组装生成招呼语的完整Prompt
 * 使用6种钩子策略，每种策略生成一个版本的招呼语
 *
 * @param {Object} userProfile - 用户背景信息
 * @param {string} userProfile.name - 用户姓名
 * @param {string} userProfile.targetRole - 目标岗位
 * @param {string} userProfile.experience - 工作经验描述
 * @param {string} userProfile.highlights - 个人亮点/成就
 * @param {string} userProfile.skills - 核心技能
 * @param {string} jdText - 岗位JD原文（用户粘贴的内容）
 * @param {string} [style='auto'] - 风格偏好：'auto' | 'professional' | 'enthusiastic' | 'confident'
 * @returns {{system: string, user: string}} system prompt 和 user prompt
 */
function buildGreetingPrompt(userProfile, jdText, style = 'auto') {
  const styleGuide = buildStyleGuide(style);
  const strategiesForPrompt = HOOK_STRATEGIES.map(
    (s) => `${s.id}（${s.name}）：${s.instruction}`
  ).join('\n');

  const system = `你是一位精通中国招聘市场、特别是BOSS直聘平台社交规则的招聘沟通策略师。你拥有8年招聘顾问经验，深谙HR心理学和求职者沟通策略。

## 你对BOSS直聘平台的理解
- BOSS直聘的聊天列表只显示消息的前20个字符作为预览
- HR每天收到至少100+条打招呼消息，平均花2-3秒决定是否点开
- 前20个字符的"钩子"质量直接决定了HR是否点开对话
- 默认的"您好，我对这个岗位很感兴趣"打开率不到5%
- 个性化、有实质内容的招呼语打开率可达30%以上
- HR最讨厌的是：模板化批量消息、空洞自夸、滥用敬语

## 你的核心任务
根据用户提供的个人背景和岗位JD，生成3个不同钩子策略版本的打招呼语。每个版本都必须严格遵循"**钩子句→价值主张→行动引导**"的三明治结构。

## 六种钩子策略
${strategiesForPrompt}

## 三明治结构要求（每个版本都需遵循）
1. **钩子句**（前20字）：必须包含钩子元素，不能是"您好/你好"开头
2. **价值主张**（中间部分）：将用户经历与JD需求精准对接，用具体数据或案例说话
3. **行动引导**（结尾部分）：自然收尾，产生继续对话的欲望

## 风格指南
${styleGuide}

## 输出格式要求
你必须严格按以下JSON格式输出，不要输出任何其他内容：

\`\`\`json
{
  "greetings": [
    {
      "hook_type": "number",
      "text": "第一条招呼语完整内容",
      "strategy_name": "数字钩子"
    },
    {
      "hook_type": "match",
      "text": "第二条招呼语完整内容",
      "strategy_name": "匹配钩子"
    },
    {
      "hook_type": "achievement",
      "text": "第三条招呼语完整内容",
      "strategy_name": "成就钩子"
    }
  ],
  "best_pick_index": 0,
  "best_pick_reason": "推荐第一条的理由（一句话）"
}
\`\`\`

## 硬约束（绝对禁止，违反即为失败）
1. **禁止**使用"您好"、"你好"、"打扰了"、"冒昧"、"跪求"、"给个机会"等词语作为开头
2. **禁止**任何空洞的自我评价（如"我学习能力强"、"我认真负责"、"我吃苦耐劳"——HR完全不信这些）
3. **禁止**伪造或夸大经历、数据、成就（不要编造用户没有提到的事情）
4. **禁止**任何超过150字的招呼语（HR没有耐心读长消息）
5. **禁止**在招呼语中出现"根据您的JD"、"综上所述"、"AI生成"等暴露AI辅助的词语
6. **禁止**输出不属于JSON格式的内容
7. 每条招呼语必须使用不同钩子策略
8. 对于用户profile中没有提到的技能/项目/数据，用模糊但诚实的表述代替，不要编造

## 加分项
- 如果JD中提到了具体的工具、平台、软件，且用户确实会，一定要点出来
- 如果用户有与目标公司同行业的经验，务必提及
- 招呼语整体给人"这是一个真实的人在认真找工作"的感觉，而非"这是一个AI批量生成的消息"`;

  // Helper function removed — style guide is now built inline below

  const user = `## 我的个人背景
- 姓名：${userProfile.name || '求职者'}
- 目标岗位：${userProfile.targetRole || '见JD'}
- 工作经验：${userProfile.experience || '见简历'}
- 核心亮点：${userProfile.highlights || '见简历'}
- 核心技能：${userProfile.skills || '见简历'}

## 目标岗位JD（贴在下方）
${jdText}

## 生成要求
1. 输出3个版本，分别使用**数字钩子**、**匹配钩子**、**成就钩子**策略
2. 每个版本必须严格遵循"钩子句→价值主张→行动引导"三明治结构
3. 前20字=钩子句（不能以您好/你好开头）
4. 每条字数：80-150字
5. 三个版本的风格差异要明显，不要换个词就算不同版本
6. 只输出JSON，不要有任何额外内容`;

  return { system, user };
}

/**
 * 根据风格偏好构建风格指南文本
 *
 * @param {string} style - 风格偏好
 * @returns {string} 风格指南文本
 */
function buildStyleGuide(style) {
  const guides = {
    professional:
      '使用专业、成熟、稳重的语气。避免网络用语和感叹号。展现职业素养和行业理解深度。',
    enthusiastic:
      '使用热情、积极、有感染力的语气。适当使用感叹号（不超过1个/条）。展现对行业和工作的高度热情。',
    confident:
      '使用自信、直接、有力的语气。用数据和事实作为支撑，不绕弯子。展现专业自信但不傲慢。',
    auto:
      '根据JD的语言风格自动选择：技术类岗位偏专业，互联网/创业公司偏热情，管理类岗位偏自信。',
  };
  return guides[style] || guides.auto;
}

/**
 * 从AI返回的JSON文本中提取并解析招呼语数组
 * 兼容各种可能的格式问题（Markdown代码块包裹、JSON前缀、截断等）
 *
 * @param {string} rawText - AI返回的原始文本
 * @returns {{greetings: Array<{hook_type: string, text: string, strategy_name: string}>, bestPickIndex: number, bestPickReason: string}|null}
 *   解析成功返回对象，失败返回null
 */
function parseGreetingResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // 步骤1：尝试提取JSON代码块中的内容
  let jsonText = rawText.trim();

  // 去除Markdown代码块包裹 ```json ... ```
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  // 步骤2：找到JSON对象的起止位置（容错处理：前后可能有额外文字）
  const startBrace = jsonText.indexOf('{');
  const endBrace = jsonText.lastIndexOf('}');
  if (startBrace === -1 || endBrace === -1 || startBrace >= endBrace) {
    return null;
  }
  jsonText = jsonText.substring(startBrace, endBrace + 1);

  // 步骤3：解析JSON
  try {
    const parsed = JSON.parse(jsonText);
    // 验证必要字段
    if (!parsed.greetings || !Array.isArray(parsed.greetings) || parsed.greetings.length === 0) {
      return null;
    }

    return {
      greetings: parsed.greetings.map((g, i) => ({
        hook_type: g.hook_type || 'unknown',
        text: g.text || '',
        strategy_name: g.strategy_name || `策略${i + 1}`,
      })),
      bestPickIndex: typeof parsed.best_pick_index === 'number' ? parsed.best_pick_index : 0,
      bestPickReason: parsed.best_pick_reason || '综合评估最佳',
    };
  } catch (e) {
    // 步骤4：最终降级——尝试手动按行解析（处理半截JSON）
    return fallbackParse(jsonText);
  }
}

/**
 * JSON解析失败时的降级解析：尝试从文本中手动提取3条招呼语
 *
 * @param {string} text - 可能的JSON文本
 * @returns {Object|null} 降级解析结果
 */
function fallbackParse(text) {
  const greetings = [];

  // 尝试匹配 "text": "..." 模式
  const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  const hookTypes = ['number', 'match', 'achievement', 'problem', 'relevance', 'anti_template'];
  let hookIndex = 0;

  while ((match = textRegex.exec(text)) !== null && greetings.length < 3) {
    const greetingText = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    if (greetingText.trim().length > 10) {
      greetings.push({
        hook_type: hookTypes[hookIndex] || 'unknown',
        text: greetingText.trim(),
        strategy_name: HOOK_STRATEGIES[hookIndex]
          ? HOOK_STRATEGIES[hookIndex].name
          : `策略${greetings.length + 1}`,
      });
      hookIndex++;
    }
  }

  if (greetings.length === 0) return null;

  return {
    greetings,
    bestPickIndex: 0,
    bestPickReason: '降级解析，推荐第一条',
  };
}

// ============================================================================
// 第五部分：API调用模块（核心）
// ============================================================================

/**
 * 调用AI API生成招呼语（流式输出版本）
 *
 * 工作流程：
 * 1. 读取用户配置（API Key、model等）
 * 2. 组装system/user prompt
 * 3. 发送POST请求到 /v1/chat/completions（stream: true）
 * 4. 逐行解析SSE流（data: {"choices":[{"delta":{"content":"..."}}]}）
 * 5. 每收到一个token → onToken回调
 * 6. 流结束 → onComplete(fullText)
 * 7. 任何错误 → onError(error)
 *
 * @param {Object} userProfile - 用户个人背景
 * @param {string} jdText - 岗位JD文本
 * @param {string} [style='auto'] - 风格偏好
 * @param {function(string):void} onToken - 每收到一个token时的回调，参数为新收到的文本片段
 * @param {function(string, object):void} onComplete - 流式输出完成时的回调
 *   - 参数1：完整的原始文本
 *   - 参数2：解析后的结构化结果（含greetings数组和bestPick）
 * @param {function(string, string):void} onError - 发生错误时的回调
 *   - 参数1：用户可读的中文错误信息
 *   - 参数2：错误类型代码（'network' | 'auth' | 'quota' | 'timeout' | 'parse' | 'empty' | 'unknown'）
 *
 * @returns {AbortController} 可用于取消请求的控制器
 */
function generateGreetingStream(userProfile, jdText, style, onToken, onComplete, onError) {
  const controller = new AbortController();
  const config = loadConfig();

  // 参数校验
  if (!config.apiKey) {
    onError('请先在设置中填入API Key', 'auth');
    return controller;
  }
  if (!jdText || jdText.trim().length < 10) {
    onError('JD文本太短（至少需要10个字），请粘贴完整的岗位描述', 'empty');
    return controller;
  }

  const { system, user } = buildGreetingPrompt(userProfile, jdText, style);
  const apiUrl = `${config.baseUrl}/chat/completions`;

  // 构建请求体（兼容OpenAI格式，DeepSeek完全兼容此格式）
  const requestBody = {
    model: config.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: config.temperature,
    top_p: config.topP,
    max_tokens: config.maxTokens,
    stream: true,
  };

  // 异步执行（不阻塞返回值）
  doStreamFetch(apiUrl, config.apiKey, requestBody, controller, onToken, onComplete, onError, 0);

  return controller;
}

/**
 * 内部函数：执行流式fetch请求，支持自动重试
 *
 * @param {string} url - API地址
 * @param {string} apiKey - API密钥
 * @param {Object} body - 请求体
 * @param {AbortController} controller - 取消控制器
 * @param {Function} onToken - token回调
 * @param {Function} onComplete - 完成回调
 * @param {Function} onError - 错误回调
 * @param {number} retryCount - 当前重试次数
 */
async function doStreamFetch(url, apiKey, body, controller, onToken, onComplete, onError, retryCount) {
  let fullText = '';
  const chunks = [];

  try {
    // 发起请求（带超时控制）
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }, REQUEST_TIMEOUT_MS);

    // 检查HTTP状态码
    if (!response.ok) {
      const httpError = await parseHttpError(response);
      onError(httpError.message, httpError.type);
      return;
    }

    // 检查响应是否为流式
    if (!response.body) {
      onError('当前浏览器不支持流式读取，请更新浏览器或尝试切换为非流式模式', 'network');
      return;
    }

    // 读取流
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      // 检查是否已被取消
      if (controller.signal.aborted) {
        reader.cancel();
        return;
      }

      const { done, value } = await reader.read();

      if (done) {
        // 流结束：处理buffer中剩余的数据
        if (buffer.trim()) {
          processSSELine(buffer, chunks, fullText, onToken, (newFullText) => {
            fullText = newFullText;
          });
        }

        // 检查空响应
        if (!fullText || fullText.trim().length === 0) {
          onError('AI暂时无法生成，请尝试简化JD文本或更换provider重试', 'empty');
          return;
        }

        // 解析最终结果
        const parsed = parseGreetingResponse(fullText);

        if (parsed && parsed.greetings.length > 0) {
          onComplete(fullText, parsed);
        } else {
          // 解析失败：返回原始文本让用户手动参考
          onComplete(fullText, {
            greetings: [
              {
                hook_type: 'unknown',
                text: fullText.trim().substring(0, MAX_GREETING_LENGTH),
                strategy_name: 'AI原始输出',
              },
            ],
            bestPickIndex: 0,
            bestPickReason: 'AI输出格式异常，已显示原始结果',
          });
        }
        return;
      }

      // 解码并追加到buffer
      buffer += decoder.decode(value, { stream: true });

      // 按行处理SSE数据
      const lines = buffer.split('\n');
      // 最后一个元素可能是不完整的行，保留到下次处理
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (controller.signal.aborted) {
          reader.cancel();
          return;
        }
        processSSELine(line, chunks, fullText, onToken, (newFullText) => {
          fullText = newFullText;
        });
      }
    }
  } catch (error) {
    // 如果是用户主动取消，不报错
    if (error.name === 'AbortError') {
      return;
    }

    // 网络错误分类处理
    const errorInfo = classifyNetworkError(error);

    // 自动重试（仅限网络错误，且未超过最大重试次数）
    if (errorInfo.type === 'network' && retryCount < MAX_RETRIES && !controller.signal.aborted) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
      console.log(`网络错误，${delay}ms后第${retryCount + 1}次重试...`);
      await sleep(delay);

      if (!controller.signal.aborted) {
        return doStreamFetch(
          url, apiKey, body, controller,
          onToken, onComplete, onError,
          retryCount + 1
        );
      }
    }

    onError(errorInfo.message, errorInfo.type);
  }
}

/**
 * 处理单行SSE数据
 * SSE格式：data: {"choices":[{"delta":{"content":"..."}}]}
 *          data: [DONE]
 *
 * @param {string} line - 单行SSE数据
 * @param {Array} chunks - 累积的chunk数组（用于调试）
 * @param {string} currentFullText - 当前累积的完整文本
 * @param {Function} onToken - token回调
 * @param {Function} setFullText - 更新完整文本的函数
 */
function processSSELine(line, chunks, currentFullText, onToken, setFullText) {
  const trimmed = line.trim();

  // 跳过空行、注释行、以及[DONE]标记
  if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') {
    return;
  }

  // 检查是否为有效的数据行
  if (!trimmed.startsWith('data: ')) {
    return;
  }

  const jsonStr = trimmed.substring(6); // 去掉 'data: ' 前缀

  try {
    const parsed = JSON.parse(jsonStr);
    const choices = parsed.choices;

    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      return;
    }

    const delta = choices[0].delta;
    if (!delta || !delta.content) {
      return; // 没有content字段（可能是role设定或结束标记）
    }

    const token = delta.content;
    chunks.push(token);

    const newFullText = currentFullText + token;
    setFullText(newFullText);

    // 回调：通知UI层更新
    if (typeof onToken === 'function') {
      try {
        onToken(token);
      } catch (e) {
        // onToken回调异常不影响流式处理
        console.warn('onToken回调异常', e);
      }
    }
  } catch (e) {
    // 解析失败的行静默跳过（SSE协议允许非JSON行）
    // 常见原因：JSON被分割跨行（buffer机制处理）、服务端发送心跳注释
  }
}

/**
 * 带超时的fetch封装
 *
 * @param {string} url - 请求URL
 * @param {Object} options - fetch选项
 * @param {number} timeoutMs - 超时毫秒数
 * @returns {Promise<Response>} fetch响应
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller.signal;

  const timeoutId = setTimeout(() => {
    if (controller) controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 解析HTTP错误响应，返回用户友好的错误信息
 *
 * @param {Response} response - fetch响应对象
 * @returns {Promise<{message: string, type: string}>} 错误信息
 */
async function parseHttpError(response) {
  const status = response.status;

  // 尝试从响应体中读取更详细的错误信息
  let body = '';
  try {
    body = await response.text();
  } catch (e) {
    // 忽略body读取失败
  }

  // 按HTTP状态码分类
  if (status === 401) {
    return {
      message: 'API Key无效或已过期，请检查设置中的API Key是否正确',
      type: 'auth',
    };
  }
  if (status === 402 || status === 429) {
    return {
      message: 'API额度已用完或请求过于频繁，请稍后重试或切换到其他provider',
      type: 'quota',
    };
  }
  if (status === 403) {
    return {
      message: `API访问被拒绝（${status}），请检查API Key权限或联系provider`,
      type: 'auth',
    };
  }
  if (status >= 500) {
    return {
      message: `AI服务暂时不可用（服务器错误 ${status}），请稍后重试`,
      type: 'network',
    };
  }
  if (status >= 400) {
    // 尝试提取错误detail
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.error?.message || parsed.message || body;
    } catch (e) {
      // body可能不是JSON
    }
    return {
      message: `API请求失败（${status}）：${detail}`,
      type: status === 404 ? 'network' : 'unknown',
    };
  }

  return {
    message: `未知HTTP错误（${status}），请稍后重试`,
    type: 'unknown',
  };
}

/**
 * 分类和处理网络层面的异常
 *
 * @param {Error} error - 捕获到的错误对象
 * @returns {{message: string, type: string}} 分类后的错误信息
 */
function classifyNetworkError(error) {
  const name = error.name || '';
  const message = error.message || '';

  if (name === 'AbortError') {
    // 确认是超时还是用户取消
    if (message.includes('timeout') || message.includes('Timeout')) {
      return {
        message: '请求超时（30秒），请检查网络连接后重试',
        type: 'timeout',
      };
    }
    return {
      message: '请求已取消',
      type: 'network',
    };
  }

  if (name === 'TypeError' && message.includes('Failed to fetch')) {
    return {
      message: '网络连接失败，请检查网络状态或API地址是否正确',
      type: 'network',
    };
  }

  if (name === 'TypeError' && message.includes('NetworkError')) {
    return {
      message: '网络错误，请检查网络连接',
      type: 'network',
    };
  }

  return {
    message: `请求异常：${message}`,
    type: 'unknown',
  };
}

// ============================================================================
// 第六部分：历史记录管理
// ============================================================================

/**
 * 历史记录条目结构
 * @typedef {Object} HistoryEntry
 * @property {string} id - 唯一ID
 * @property {string} jdPreview - JD前50字预览
 * @property {Array<{hook_type: string, text: string, strategy_name: string}>} greetings - 生成的招呼语
 * @property {number} bestPickIndex - 推荐的最佳招呼语索引
 * @property {string} createdAt - ISO 8601时间戳
 */

/**
 * 保存生成记录到历史
 *
 * @param {string} jdText - 原始JD文本
 * @param {Object} result - 解析后的生成结果
 */
function saveToHistory(jdText, result) {
  try {
    const history = loadHistory();
    const entry = {
      id: generateId(),
      jdPreview: jdText.trim().substring(0, 50) + (jdText.trim().length > 50 ? '...' : ''),
      jdText: jdText.trim(), // 保存完整JD用于重新生成
      greetings: result.greetings,
      bestPickIndex: result.bestPickIndex,
      createdAt: new Date().toISOString(),
    };

    // 新记录插入到最前面
    history.unshift(entry);

    // 最多保留50条历史
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('保存历史记录失败', e);
  }
}

/**
 * 从localStorage读取历史记录
 *
 * @returns {Array<HistoryEntry>} 历史记录数组（按时间倒序）
 */
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('读取历史记录失败', e);
  }
  return [];
}

/**
 * 清空所有历史记录
 */
function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.warn('清空历史记录失败', e);
  }
}

/**
 * 删除单条历史记录
 *
 * @param {string} id - 要删除的记录ID
 */
function deleteHistoryEntry(id) {
  try {
    const history = loadHistory();
    const filtered = history.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('删除历史记录失败', e);
  }
}

// ============================================================================
// 第七部分：工具函数
// ============================================================================

/**
 * 生成简单的唯一ID（当前时间戳 + 随机字符串）
 *
 * @returns {string} 唯一ID
 */
function generateId() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * 异步sleep
 *
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 验证API Key格式（基础检查，不保证可用性）
 *
 * @param {string} apiKey - API Key
 * @param {string} provider - Provider名称
 * @returns {{valid: boolean, message: string}} 验证结果
 */
function validateApiKey(apiKey, provider) {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, message: 'API Key不能为空' };
  }

  const key = apiKey.trim();

  switch (provider) {
    case 'deepseek':
      if (!key.startsWith('sk-')) {
        return { valid: false, message: 'DeepSeek API Key应以 sk- 开头' };
      }
      if (key.length < 20) {
        return { valid: false, message: 'API Key格式不正确（长度不足）' };
      }
      break;
    case 'openai':
      if (!key.startsWith('sk-')) {
        return { valid: false, message: 'OpenAI API Key应以 sk- 开头' };
      }
      if (key.length < 30) {
        return { valid: false, message: 'API Key格式不正确（长度不足）' };
      }
      break;
    case 'custom':
      if (key.length < 10) {
        return { valid: false, message: '自定义API Key格式不正确（长度不足）' };
      }
      break;
    // 不做default判断，未知provider也接受
  }

  return { valid: true, message: '格式检查通过' };
}

// ============================================================================
// 第八部分：Provider切换逻辑
// ============================================================================

/**
 * 切换AI Provider并自动更新相关配置
 *
 * @param {string} newProvider - 目标provider：'deepseek' | 'openai' | 'custom'
 * @returns {Object} 更新后的完整配置
 */
function switchProvider(newProvider) {
  const defaults = PROVIDER_DEFAULTS[newProvider];
  if (!defaults) {
    console.warn(`未知的Provider: ${newProvider}，回退到DeepSeek`);
    return switchProvider('deepseek');
  }

  const currentConfig = loadConfig();

  // 构建新配置：保留API Key（用户可能需要重新输入），更新其他默认值
  const newConfig = {
    ...currentConfig,
    provider: newProvider,
    baseUrl: defaults.baseUrl,
    model: defaults.model,
    maxTokens: defaults.maxTokens,
    temperature: defaults.temperature,
    topP: defaults.topP,
    // API Key 不自动清除——如果用户之前填过同provider的key，保留
    // 如果是不同provider，用户需要手动更新
  };

  saveConfig(newConfig);
  return newConfig;
}

/**
 * 获取当前Provider的显示信息
 *
 * @returns {{name: string, modelName: string, estimatedCost: string}}
 */
function getCurrentProviderInfo() {
  const config = loadConfig();
  const defaults = PROVIDER_DEFAULTS[config.provider] || PROVIDER_DEFAULTS.deepseek;
  return {
    name: defaults.name,
    modelName: config.model || defaults.model,
    estimatedCost: defaults.estimatedCostPerCall,
  };
}

// ============================================================================
// 第九部分：UI辅助函数（供HTML页面调用）
// ============================================================================

/**
 * 根据错误类型获取对应的用户操作建议
 *
 * @param {string} errorType - 错误类型代码
 * @returns {{title: string, suggestions: string[]}} 建议信息
 */
function getErrorSuggestions(errorType) {
  const suggestions = {
    auth: {
      title: 'API Key问题',
      suggestions: [
        '检查API Key是否填写正确（注意前后不要有空格）',
        '确认API Key未过期（DeepSeek注册即送500万token）',
        '如果刚注册，等待几分钟后再试',
        '尝试在设置中切换为其他Provider',
      ],
    },
    quota: {
      title: '额度问题',
      suggestions: [
        '当前Provider的API额度已用完',
        '切换到其他Provider（如从OpenAI切换到DeepSeek）',
        'DeepSeek注册即送500万token，足够长期使用',
        '如果是自定义接口，请联系接口提供方充值',
      ],
    },
    network: {
      title: '网络问题',
      suggestions: [
        '检查手机/电脑的网络连接是否正常',
        '尝试切换WiFi/移动数据',
        '检查API地址是否正确（设置 → API地址）',
        '如果使用自定义接口，确认服务器是否在线',
      ],
    },
    timeout: {
      title: '请求超时',
      suggestions: [
        'AI服务响应较慢，可以重新生成一次',
        '尝试缩短JD文本（只保留核心要求部分）',
        '切换网络环境后重试（WiFi ↔ 移动数据）',
        '如果持续超时，考虑切换到更快的Provider',
      ],
    },
    parse: {
      title: 'AI响应格式异常',
      suggestions: [
        'AI返回了非预期格式的内容，请手动参考返回的文本',
        '重新生成一次（每次AI输出有随机性）',
        '检查JD文本是否包含不相关或格式混乱的内容',
        '如果持续出现，可能需要调整Prompt（升级版本）',
      ],
    },
    empty: {
      title: 'AI未返回有效内容',
      suggestions: [
        'JD文本可能太短或内容不完整，请确认已粘贴有效的岗位描述',
        '尝试简化用户背景信息，避免过于复杂的输入',
        '更换Provider重试',
        '如果多次出现，可以在设置中增大maxTokens值',
      ],
    },
    unknown: {
      title: '未知错误',
      suggestions: [
        '请先重试一次',
        '如果问题持续，请在设置中切换到其他Provider',
        '检查浏览器控制台（F12）是否有更多错误信息',
        '如果所有Provider都失败，请联系开发者',
      ],
    },
  };

  return (
    suggestions[errorType] || {
      title: '出错了',
      suggestions: ['请重试一次', '如持续出现此问题，请联系开发者'],
    }
  );
}

/**
 * 初始化模块：在页面加载时调用，验证现有配置
 *
 * @returns {{configured: boolean, provider: string, hasApiKey: boolean}} 初始化状态
 */
function initAIModule() {
  const config = loadConfig();
  const providerInfo = getCurrentProviderInfo();

  return {
    configured: !!(config.apiKey && config.apiKey.length > 10),
    provider: providerInfo.name,
    model: providerInfo.modelName,
    hasApiKey: !!config.apiKey,
    providerId: config.provider,
  };
}

// ============================================================================
// 第十部分：导出（用于模块化引用，单文件使用时这些会挂在window上）
// ============================================================================

// 如果是ES模块环境，导出以下接口
// 如果是单文件<script>环境，这些已经挂在全局作用域

const BossGreetingAI = {
  // 核心API
  generateGreetingStream,
  buildGreetingPrompt,
  parseGreetingResponse,

  // 配置管理
  loadConfig,
  saveConfig,
  getDefaultConfig,
  switchProvider,
  getCurrentProviderInfo,
  validateApiKey,

  // 用户资料
  loadUserProfile,
  saveUserProfile,

  // 历史记录
  saveToHistory,
  loadHistory,
  clearHistory,
  deleteHistoryEntry,

  // 工具函数
  initAIModule,
  getErrorSuggestions,

  // 常量
  PROVIDER_DEFAULTS,
  HOOK_STRATEGIES,
  STORAGE_KEYS,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  MAX_GREETING_LENGTH,
};

// 挂到全局作用域，方便HTML中直接调用
if (typeof window !== 'undefined') {
  window.BossGreetingAI = BossGreetingAI;
}
