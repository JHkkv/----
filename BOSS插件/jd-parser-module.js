/**
 * BOSS直聘AI招呼语生成器 - JD（岗位描述）输入与解析模块
 *
 * 功能：
 * 1. JD文本清洗与预处理
 * 2. 结构化JD信息提取
 * 3. 本地规则关键词提取（不使用AI API，省成本）
 * 4. URL链接检测与引导
 * 5. JD质量检测
 *
 * 所有文案使用中文，可直接嵌入 <script> 标签。
 */

(function (global) {
  'use strict';

  // =========================================================================
  // 1. JD文本预处理
  // =========================================================================

  /**
   * 统一标点符号：全角标点转半角，统一换行符
   */
  function normalizePunctuation(text) {
    let result = text;
    // 统一换行符
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // 中文标点转英文（仅影响解析，保留原文另存）
    result = result.replace(/，/g, ',').replace(/；/g, ';');
    result = result.replace(/：/g, ':').replace(/（/g, '(').replace(/）/g, ')');
    result = result.replace(/《/g, '<').replace(/》/g, '>');
    result = result.replace(/［/g, '[').replace(/］/g, ']');
    return result;
  }

  /**
   * 清洗粘贴的JD文本
   * @param {string} raw - 用户粘贴的原始JD文本
   * @returns {{ text: string, warnings: string[] }} 清洗后的文本和警告信息
   */
  function cleanJDText(raw) {
    var warnings = [];
    var text = raw || '';

    if (!text.trim()) {
      return { text: '', warnings: ['请输入JD（岗位描述）文本。'] };
    }

    // 移除开头的空白和零宽字符
    text = text.replace(/^[\s​‌‍⁠﻿]+/, '');

    // 移除 HTML 标签残留（用户可能从网页复制）
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/?[^>]+(>|$)/g, '');
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&quot;/gi, '"');

    // 统一标点符号
    text = normalizePunctuation(text);

    // 合并连续空行（超过2个换行合并为2个）
    text = text.replace(/\n{3,}/g, '\n\n');

    // 移除行首行尾多余空格
    text = text.split('\n').map(function (line) {
      return line.trim();
    }).join('\n');

    // 移除纯分割线行（如 "---", "===", "***"）
    text = text.replace(/^[-=*#_]{3,}$/gm, '');

    // 移除特殊字符（保留中英文、数字、常用标点、换行）
    // 保留：中文、英文、数字、常用标点、换行、空格
    text = text.replace(/[^一-鿿\w\s.,;:!?()\[\]{}@#$%^&+=/\\|<>'"`\-~，。、；：！？（）【】《》「」『』【 】\+\-\*\/·★☆]/g, ' ');

    // 再次合并多余空白
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/ {2,}/g, ' ');

    // 截断过长文本
    var MAX_LENGTH = 3000;
    if (text.length > MAX_LENGTH) {
      text = text.substring(0, MAX_LENGTH);
      warnings.push('JD文本过长，已自动截断至' + MAX_LENGTH + '字。如需完整分析，请精简后重新粘贴。');
    }

    // 去除末尾不完整的行（截断后可能残留）
    var lastNewline = text.lastIndexOf('\n');
    if (lastNewline > 0 && text.length - lastNewline < 3) {
      text = text.substring(0, lastNewline).trim();
    }

    return { text: text.trim(), warnings: warnings };
  }

  // =========================================================================
  // 2. 关键词提取（本地规则，不使用AI API）
  // =========================================================================

  /**
   * 硬技能、专业名词匹配词库
   */
  var SKILL_PATTERNS = [
    // 编程 / 技术
    'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C\\+\\+', 'C#',
    'React', 'Vue\\.?js', 'Angular', 'Node\\.?js', 'Next\\.?js', 'Nuxt',
    'Spring', 'Django', 'Flask', 'FastAPI', 'Express', 'Koa',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'Docker', 'Kubernetes', 'K8s', 'CI/CD', 'Jenkins', 'Git',
    'Linux', 'Shell', 'Nginx', '微服务', '分布式',
    // 数据分析 / AI
    '数据分析', '数据挖掘', '机器学习', '深度学习', 'NLP', 'CV',
    'Excel', 'Power\\s*BI', 'Tableau', 'SPSS', 'SQL',
    'Python', 'R语言', 'Pandas', 'NumPy',
    // 运营 / 市场
    '用户运营', '内容运营', '社群运营', '活动运营', '直播运营', '新媒体运营',
    '短视频运营', '电商运营', '私域运营', '数据运营', '产品运营',
    '用户增长', '增长黑客', 'A/B测试', '转化率优化',
    '付费转化', '用户留存', '用户拉新', '促活', '裂变',
    '内容策划', '话题策划', '热点追踪', '用户洞察', '竞品分析',
    'SOP', 'KPI', 'OKR', 'ROI', 'GMV', 'DAU', 'MAU', 'LTV', 'CAC',
    'KOL对接', 'KOC', 'MCN', '信息流', 'SEO', 'SEM', 'SEO优化', 'ASO',
    // 内容创作
    '文案撰写', '文案策划', '软文撰写', '品牌文案',
    '短视频剪辑', '视频脚本', '直播脚本', '分镜',
    '公众号运营', '小红书运营', '抖音运营', 'B站运营', '快手运营', '知乎运营',
    '微博运营', '今日头条',
    // 设计
    'Photoshop', 'PS', 'Illustrator', 'AI', 'Figma', 'Sketch',
    'Adobe', 'Premiere', 'PR', 'After\\s*Effects', 'AE', '剪映',
    'Canva', '可画', '创客贴', '稿定设计',
    'UI设计', 'UX设计', '交互设计', '视觉设计', '平面设计',
    // 通用职场技能
    '项目管理', '需求分析', '流程优化', '团队管理', '跨部门沟通',
    '数据分析', '数据复盘', '数据看板', '数据可视化',
  ];

  /**
   * 工具 / 平台匹配词库
   */
  var TOOL_PATTERNS = [
    // 办公协作
    '飞书', '钉钉', '企业微信', 'Slack', 'Notion', 'Confluence',
    'Trello', 'Jira', 'Teambition', '石墨文档', '腾讯文档', 'WPS',
    // 内容 / 设计工具
    'Photoshop', 'PS', 'Figma', 'Canva', '剪映', 'PR', 'Premiere',
    'AE', 'After\\s*Effects', 'Final\\s*Cut', '达芬奇',
    // 数据分析工具
    'Excel', 'Google\\s*Analytics', '百度统计', '神策', 'GrowingIO',
    'Tableau', 'Power\\s*BI', 'FineBI', 'DataV',
    // 运营 / 营销工具
    '蝉妈妈', '飞瓜', '新榜', '千瓜', '抖查查', '考古加',
    '有赞', '微盟', '小鹅通', '千聊',
    // 社交媒体平台
    '微信公众号', '抖音', '快手', '小红书', 'B站', '知乎',
    '微博', '今日头条', '西瓜视频', '视频号',
    // 编程 / 开发工具
    'VS\\s*Code', 'JetBrains', 'IntelliJ', 'PyCharm', 'WebStorm',
    'Git', 'GitHub', 'GitLab', 'Postman', 'Swagger',
  ];

  /**
   * 软技能匹配词库
   */
  var SOFT_SKILL_PATTERNS = [
    '沟通能力', '团队协作', '逻辑思维', '学习能力', '抗压能力',
    '执行力', '自驱力', '责任心', '细心', '创新思维',
    '解决问题', '统筹能力', '多任务处理', '时间管理', '领导力',
    '同理心', '表达力', '应变能力', '审美能力', '网感',
    '数据敏感', '结果导向', '用户视角', '产品思维',
  ];

  /**
   * 行业 / 领域匹配词库
   */
  var INDUSTRY_PATTERNS = [
    '电商', '新零售', '教育', '在线教育', '金融', '互联网金融',
    '医疗', '大健康', '游戏', '文娱', '社交', '本地生活',
    'SaaS', 'ToB', 'ToC', 'B2B', 'B2C', 'O2O',
    '人工智能', 'AI', '大数据', '云计算', '区块链', 'Web3',
    '新能源汽车', '智能制造', '芯片', '半导体',
    '消费品', '快消', '美妆', '服饰', '母婴', '宠物',
    '内容社区', '短视频', '直播', 'MCN',
    '房地产', '汽车', '旅游', '餐饮', '酒店',
  ];

  /**
   * 从文本中提取指定模式的关键词及出现频次
   * @param {string} text - 待匹配的文本
   * @param {string[]} patterns - 正则模式数组
   * @returns {{ keyword: string, count: number }[]}
   */
  function matchPatterns(text, patterns) {
    var seen = {};
    var results = [];
    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      // 用分组捕获来获取实际匹配文本
      var regex = new RegExp('(' + pattern + ')', 'gi');
      var matches = text.match(regex);
      if (matches && matches.length > 0) {
        // 取第一个匹配作为规范化形式
        var keyword = matches[0];
        if (!seen[keyword.toLowerCase()]) {
          seen[keyword.toLowerCase()] = true;
          results.push({ keyword: keyword, count: matches.length });
        }
      }
    }
    // 按出现次数降序排列
    results.sort(function (a, b) { return b.count - a.count; });
    return results;
  }

  /**
   * 从JD文本中提取所有类型的关键词
   * @param {string} jdText - JD文本
   * @returns {{ skills: Array, tools: Array, softSkills: Array, industries: Array }}
   */
  function extractKeywords(jdText) {
    if (!jdText || !jdText.trim()) {
      return { skills: [], tools: [], softSkills: [], industries: [] };
    }

    return {
      skills: matchPatterns(jdText, SKILL_PATTERNS),
      tools: matchPatterns(jdText, TOOL_PATTERNS),
      softSkills: matchPatterns(jdText, SOFT_SKILL_PATTERNS),
      industries: matchPatterns(jdText, INDUSTRY_PATTERNS),
    };
  }

  // =========================================================================
  // 3. JD结构化信息提取
  // =========================================================================

  /**
   * 从文本中提取岗位名称
   * 匹配常见JD标题行模式
   */
  function extractJobTitle(text) {
    // 常见标题行模式
    var patterns = [
      // "招聘 XXXX" 或 "诚聘 XXXX"
      /(?:招聘|诚聘|急招|高薪诚聘|高薪招聘)\s*[：:]*\s*([^\n]{2,30})/,
      // "【岗位】XXXX" 或 "【职位】XXXX"
      /【(?:岗位|职位|岗位名称|职位名称)】\s*[：:]*\s*([^\n【】]{2,30})/,
      // "岗位名称：XXXX" 或 "职位名称：XXXX"
      /(?:岗位名称|职位名称|岗位|职位)\s*[：:]\s*([^\n]{2,30})/,
      // 开头第一行短文本（可能是岗位名称）
      /^([^\n]{4,30})$/m,
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i]);
      if (match) {
        var title = match[1].trim();
        // 过滤掉明显不是岗位名的
        if (!/^(公司|企业|工作|有限|科技|集团|入职|福利|薪资|地址|地点|联系|投递|邮箱)/.test(title)) {
          return title;
        }
      }
    }
    return '';
  }

  /**
   * 从文本中提取公司名称
   */
  function extractCompanyName(text) {
    var patterns = [
      /(?:公司名称|企业名称|公司)\s*[：:]\s*([^\n]{2,40})/,
      /【(?:公司|企业)】\s*[：:]*\s*([^\n【】]{2,40})/,
      /([^\n]{2,30}(?:有限公司|科技有限公司|网络科技有限公司|信息技术有限公司|文化传媒有限公司)(?:\n|$))/,
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i]);
      if (match) {
        var name = match[1].trim();
        // 过滤无效匹配
        if (name.length >= 2 && !/^(岗位|职位|工作|联系|投递|邮箱)/.test(name)) {
          return name;
        }
      }
    }
    return '';
  }

  /**
   * 从文本中提取薪资范围
   */
  function extractSalary(text) {
    var patterns = [
      // "薪资：8K-15K" 或 "薪资范围：8000-15000/月"
      /(?:薪资|工资|月薪|薪酬|待遇)\s*[：:，,]*\s*([^\n]{3,40}?(?:元|K|k|万)[^\n]*)/,
      // 直接的数字范围模式 "8K-15K" / "8000-15000元/月"
      /(\d+[Kk]?\s*[-~至到]\s*\d+[Kk]?\s*(?:元\/月|元|/月|K\/月)?)/,
      // "8-15K" / "8k-15k"
      /(\d+\s*[-~至到]\s*\d+\s*[Kk])/,
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i]);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }

  /**
   * 从文本中提取工作地点
   */
  function extractLocation(text) {
    var patterns = [
      /(?:工作地点|工作地址|地点|地址|base|Base|城市)\s*[：:，,]*\s*([^\n]{2,30})/,
      /【(?:工作地点|工作地址|地点)】\s*[：:]*\s*([^\n【】]{2,30})/,
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i]);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }

  /**
   * 从文本中提取任职要求列表
   */
  function extractRequirements(text) {
    var requirements = [];

    // 定位 "任职要求" 或 "岗位要求" 部分
    var sectionPatterns = [
      /(?:任职要求|岗位要求|职位要求|我们需要你|希望你|我们希望你|你需要具备|能力要求|工作要求|任职资格)\s*[：:]*\s*\n?/,
      /【(?:任职要求|岗位要求|职位要求|工作要求|任职资格)】\s*[：:]*\s*\n?/,
    ];

    var reqText = '';
    for (var i = 0; i < sectionPatterns.length; i++) {
      var match = text.match(sectionPatterns[i]);
      if (match) {
        var startIdx = match.index + match[0].length;
        // 找到下一个主要章节的开始位置
        var nextSection = text.substring(startIdx).search(/\n\s*(?:【|（[一-鿿]|岗位职责|任职要求|薪资|福利|联系|公司|工作地点|我们提供)/);
        if (nextSection === -1) {
          reqText = text.substring(startIdx);
        } else {
          reqText = text.substring(startIdx, startIdx + nextSection);
        }
        break;
      }
    }

    if (!reqText) return [];

    // 按行拆分并提取每一条要求
    var lines = reqText.split('\n');
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      if (!line) continue;
      // 移除行首的数字编号或项目符号
      line = line.replace(/^[\d]+[.、．)\s]+/, '');
      line = line.replace(/^[-*•·●◆◇○□■☆★✓✔☑]\s*/, '');
      // 过滤过短或明显不是要求的行
      if (line.length >= 4 && line.length <= 200) {
        // 过滤掉章节标题
        if (!/^【.*】$/.test(line) && !/^[（(].*[）)]$/.test(line)) {
          requirements.push(line);
        }
      }
    }

    return requirements;
  }

  /**
   * 从文本中提取岗位职责列表
   */
  function extractResponsibilities(text) {
    var responsibilities = [];

    var sectionPatterns = [
      /(?:岗位职责|工作职责|工作内容|你需要做|你要做什么|职位描述|JD|工作描述|主要职责|你的工作|职责描述)\s*[：:]*\s*\n?/,
      /【(?:岗位职责|工作职责|工作内容|职位描述|职责描述)】\s*[：:]*\s*\n?/,
      /^(?:岗位职责|工作职责|工作内容|职位描述)[：:]\n?/m,
    ];

    var respText = '';
    for (var i = 0; i < sectionPatterns.length; i++) {
      var match = text.match(sectionPatterns[i]);
      if (match) {
        var startIdx = match.index + match[0].length;
        var nextSection = text.substring(startIdx).search(/\n\s*(?:【|（[一-鿿]|岗位职责|任职要求|薪资|福利|联系|公司|工作地点|我们提供)/);
        if (nextSection === -1) {
          respText = text.substring(startIdx);
        } else {
          respText = text.substring(startIdx, startIdx + nextSection);
        }
        break;
      }
    }

    if (!respText) return [];

    var lines = respText.split('\n');
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      if (!line) continue;
      line = line.replace(/^[\d]+[.、．)\s]+/, '');
      line = line.replace(/^[-*•·●◆◇○□■☆★✓✔☑]\s*/, '');
      if (line.length >= 4 && line.length <= 200) {
        if (!/^【.*】$/.test(line) && !/^[（(].*[）)]$/.test(line)) {
          responsibilities.push(line);
        }
      }
    }

    return responsibilities;
  }

  /**
   * 从粘贴的JD文本中提取结构化信息
   * @param {string} rawText - 用户粘贴的原始JD文本
   * @returns {{
   *   jobTitle: string,
   *   companyName: string,
   *   salary: string,
   *   location: string,
   *   requirements: string[],
   *   responsibilities: string[],
   *   keywords: { skills: Array, tools: Array, softSkills: Array, industries: Array },
   *   rawText: string,
   *   cleanedText: string
   * }}
   */
  function parseJD(rawText) {
    var cleaned = cleanJDText(rawText);
    var text = cleaned.text;

    if (!text) {
      return {
        jobTitle: '',
        companyName: '',
        salary: '',
        location: '',
        requirements: [],
        responsibilities: [],
        keywords: { skills: [], tools: [], softSkills: [], industries: [] },
        rawText: rawText || '',
        cleanedText: '',
        warnings: cleaned.warnings,
      };
    }

    var jobTitle = extractJobTitle(text);
    var companyName = extractCompanyName(text);
    var salary = extractSalary(text);
    var location = extractLocation(text);
    var requirements = extractRequirements(text);
    var responsibilities = extractResponsibilities(text);
    var keywords = extractKeywords(text);

    return {
      jobTitle: jobTitle,
      companyName: companyName,
      salary: salary,
      location: location,
      requirements: requirements,
      responsibilities: responsibilities,
      keywords: keywords,
      rawText: rawText || '',
      cleanedText: text,
      warnings: cleaned.warnings,
    };
  }

  // =========================================================================
  // 4. JD链接处理
  // =========================================================================

  /**
   * 检测输入文本是否为URL
   * @param {string} text - 用户输入
   * @returns {boolean}
   */
  function isURL(text) {
    if (!text || !text.trim()) return false;
    var trimmed = text.trim();
    // 匹配常见URL格式
    var urlPattern = /^https?:\/\/[^\s]{3,}$/i;
    return urlPattern.test(trimmed);
  }

  /**
   * 检测输入中是否包含URL（非纯URL，混合了文字）
   * @param {string} text - 用户输入
   * @returns {string|null} 提取出的URL，没有则返回null
   */
  function extractURL(text) {
    if (!text) return null;
    var match = text.match(/https?:\/\/[^\s]{3,}/i);
    return match ? match[0] : null;
  }

  /**
   * 处理URL输入
   * @param {string} url - 检测到的URL
   * @returns {{ type: string, message: string, url: string }}
   */
  function handleURLInput(url) {
    return {
      type: 'url_detected',
      url: url,
      message: '检测到链接，目前暂不支持自动抓取JD内容。请手动复制岗位描述的文字内容，粘贴到输入框中。自动抓取功能即将上线，敬请期待！',
    };
  }

  /**
   * 综合输入处理：先检测是否为URL，再进行JD解析
   * @param {string} input - 用户输入的表单内容
   * @returns {{ type: string, data: object }}
   */
  function processInput(input) {
    // 去除首尾空白
    var text = (input || '').trim();

    if (!text) {
      return {
        type: 'empty',
        data: { message: '请输入JD（岗位描述）内容。' },
      };
    }

    // 检查是否为纯URL
    if (isURL(text)) {
      return {
        type: 'url',
        data: handleURLInput(text),
      };
    }

    // 检查是否包含URL
    var urlInText = extractURL(text);
    if (urlInText) {
      return {
        type: 'mixed_url',
        data: {
          url: urlInText,
          message: '检测到文本中包含链接。将仅使用文本部分进行解析，链接中的内容不会被自动抓取。',
          jd: parseJD(text.replace(urlInText, '')),
        },
      };
    }

    // 正常JD文本解析
    var jdData = parseJD(text);
    return {
      type: 'jd_text',
      data: jdData,
    };
  }

  // =========================================================================
  // 5. JD质量检测
  // =========================================================================

  /**
   * 检测JD文本质量，计算质量分并返回问题列表
   * @param {string} jdText - JD文本
   * @returns {{ score: number, maxScore: number, level: string, levelText: string, issues: string[], suggestions: string[] }}
   */
  function checkJDQuality(jdText) {
    var text = (jdText || '').trim();
    var issues = [];
    var suggestions = [];
    var score = 0;
    var maxScore = 100;

    if (!text) {
      return {
        score: 0,
        maxScore: maxScore,
        level: 'empty',
        levelText: '无内容',
        issues: ['未检测到任何JD文本内容。'],
        suggestions: ['请将BOSS直聘或前程无忧等平台上的岗位描述复制粘贴到输入框中。'],
      };
    }

    // --- 评分维度 ---

    // 1. 长度检查（20分）
    var length = text.length;
    if (length < 50) {
      issues.push('JD文本过短（' + length + '字），可能缺少详细的任职要求和岗位职责描述。');
      suggestions.push('建议粘贴完整的岗位描述，包含岗位职责和任职要求两部分。');
    } else if (length < 150) {
      score += 5;
      issues.push('JD文本偏短（' + length + '字），信息可能不够全面。');
      suggestions.push('建议补充更多岗位相关信息，如具体工作内容、技能要求等。');
    } else if (length < 500) {
      score += 15;
    } else {
      score += 20;
    }

    // 2. 是否包含任职要求部分（25分）
    var hasRequirements = /(?:任职要求|岗位要求|职位要求|任职资格|工作要求|我们需要你|希望你|你需要具备|能力要求)/.test(text);
    if (!hasRequirements) {
      issues.push('未检测到"任职要求"或"岗位要求"部分，无法准确匹配你的能力与岗位需求的契合点。');
      suggestions.push('请确保粘贴的内容包含"任职要求"相关的描述。');
    } else {
      // 进一步检查要求部分是否有实质性内容
      var reqSection = text.match(/(?:任职要求|岗位要求|职位要求|任职资格|工作要求|我们需要你|希望你|你需要具备|能力要求)\s*[：:]*([\s\S]*?)(?:\n\s*(?:【|岗位职责|薪资|福利|联系|公司|工作地点|我们提供)|\n\n|$)/);
      if (reqSection && reqSection[1]) {
        var reqLen = reqSection[1].trim().length;
        if (reqLen < 30) {
          score += 10;
          issues.push('任职要求部分内容较少，可能缺乏具体的技能和资质要求。');
        } else {
          score += 25;
        }
      } else {
        score += 10;
      }
    }

    // 3. 是否包含岗位职责部分（25分）
    var hasResponsibilities = /(?:岗位职责|工作职责|工作内容|你需要做|你要做什么|职位描述|工作描述|主要职责|职责描述)/.test(text);
    if (!hasResponsibilities) {
      issues.push('未检测到"岗位职责"或"工作内容"描述，不利于理解该岗位的实际工作范围。');
      suggestions.push('建议补充岗位职责或工作内容部分，这样生成的招呼语更能贴合实际工作要求。');
    } else {
      var respSection = text.match(/(?:岗位职责|工作职责|工作内容|你需要做|你要做什么|职位描述|工作描述|主要职责|职责描述)\s*[：:]*([\s\S]*?)(?:\n\s*(?:【|任职要求|薪资|福利|联系|公司|工作地点|我们提供)|\n\n|$)/);
      if (respSection && respSection[1]) {
        var respLen = respSection[1].trim().length;
        if (respLen < 30) {
          score += 10;
          issues.push('岗位职责部分内容偏少，建议补充更详细的工作内容描述。');
        } else {
          score += 25;
        }
      } else {
        score += 10;
      }
    }

    // 4. 是否包含岗位名称（15分）
    var jobTitle = extractJobTitle(text);
    if (!jobTitle) {
      issues.push('未能识别出明确的岗位名称（如"新媒体运营"、"Java开发工程师"等）。');
      suggestions.push('建议在JD开头写明具体的岗位名称，有助于生成更精准的招呼语。');
    } else {
      score += 15;
    }

    // 5. 是否包含薪资信息（5分，加分项）
    if (/薪资|工资|月薪|薪酬/.test(text) && /\d+[Kk元万]/.test(text)) {
      score += 5;
    }

    // 6. 是否提取到关键词（10分）
    var keywords = extractKeywords(text);
    var totalKeywords = keywords.skills.length + keywords.tools.length +
                        keywords.softSkills.length + keywords.industries.length;
    if (totalKeywords === 0) {
      issues.push('未从JD中提取到技能或行业关键词，可能缺少具体的技术或能力要求描述。');
      suggestions.push('建议补充JD中的技能要求（如"Python"、"数据分析"、"社群运营"等），便于生成有针对性的人才匹配内容。');
    } else if (totalKeywords < 3) {
      score += 4;
    } else if (totalKeywords < 8) {
      score += 7;
    } else {
      score += 10;
    }

    // --- 质量等级判定 ---
    var level, levelText;
    if (score >= 80) {
      level = 'excellent';
      levelText = '优';
      suggestions.push('JD质量良好，可以生成高质量的招呼语。');
    } else if (score >= 60) {
      level = 'good';
      levelText = '良';
      suggestions.push('JD质量尚可，建议根据提示补充信息以获得更好的匹配效果。');
    } else if (score >= 40) {
      level = 'fair';
      levelText = '中';
      suggestions.push('JD信息不够完整，建议补充任职要求和岗位职责等内容。');
    } else {
      level = 'poor';
      levelText = '差';
      suggestions.push('JD内容过少，无法生成有效招呼语。请补充完整的岗位描述。');
    }

    // 去重建议
    var uniqueSuggestions = [];
    var seen = {};
    for (var i = 0; i < suggestions.length; i++) {
      if (!seen[suggestions[i]]) {
        seen[suggestions[i]] = true;
        uniqueSuggestions.push(suggestions[i]);
      }
    }

    return {
      score: score,
      maxScore: maxScore,
      level: level,
      levelText: levelText,
      issues: issues,
      suggestions: uniqueSuggestions,
    };
  }

  // =========================================================================
  // 暴露 API
  // =========================================================================

  var JDModule = {
    // 核心功能
    parseJD: parseJD,
    cleanJDText: cleanJDText,
    extractKeywords: extractKeywords,

    // URL处理
    isURL: isURL,
    extractURL: extractURL,
    handleURLInput: handleURLInput,
    processInput: processInput,

    // 质量检测
    checkJDQuality: checkJDQuality,

    // 内部工具（暴露以便测试和调试）
    _internal: {
      extractJobTitle: extractJobTitle,
      extractCompanyName: extractCompanyName,
      extractSalary: extractSalary,
      extractLocation: extractLocation,
      extractRequirements: extractRequirements,
      extractResponsibilities: extractResponsibilities,
      SKILL_PATTERNS: SKILL_PATTERNS,
      TOOL_PATTERNS: TOOL_PATTERNS,
      SOFT_SKILL_PATTERNS: SOFT_SKILL_PATTERNS,
      INDUSTRY_PATTERNS: INDUSTRY_PATTERNS,
    },
  };

  // 支持多种模块加载方式
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = JDModule;
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return JDModule; });
  } else {
    global.JDModule = JDModule;
  }
})(typeof window !== 'undefined' ? window : this);
