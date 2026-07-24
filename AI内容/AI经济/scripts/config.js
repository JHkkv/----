// config.js — AI+经济采集系统全局配置
// 复用模式: fetch-daily.js + fetch-supplement.js 的配置化设计

const path = require('path');

const PROJECT_ROOT = 'f:/测试工具';
const BASE_DIR = path.join(PROJECT_ROOT, 'AI内容/AI经济');

/** @type {import('./lib/types').Config} */
const CONFIG = {
  // === 项目路径 ===
  BASE_DIR,
  SCRIPTS_DIR: path.join(BASE_DIR, 'scripts'),
  DATA_DIR: path.join(BASE_DIR, 'data/raw'),
  REPORTS_DIR: path.join(BASE_DIR, 'reports'),
  META_DIR: path.join(BASE_DIR, 'meta'),
  LIB_DIR: path.join(BASE_DIR, 'scripts/lib'),

  // === 时间控制 ===
  START_DATE: '2026-07-25',
  END_DATE: '2026-08-24',
  MAX_ROUNDS: 10,
  CYCLE_DAYS: 3,
  DOMESTIC_RATIO: 0.6,
  INTERNATIONAL_RATIO: 0.4,
  CURL_TIMEOUT: 20,
  CURL_CONNECT_TIMEOUT: 15,
  MAX_RETRIES: 2,

  // === 两级关键词过滤 ===
  // 一级: 锁定 "AI" — 标题或摘要必须匹配至少 1 个
  TIER1_AI_KEYWORDS: [
    /AI|人工智能|大模型|LLM|深度学习|机器学习|神经网络|生成式|智能体|Agent|AGI/i,
    /GPU|芯片|算力|数据中心|OpenAI|Claude|DeepSeek|Gemini|GPT/i,
    /Copilot|transformer|diffusion|neural|machine.learning/i,
    /推理|训练|多模态|RAG|向量|嵌入|embedding|fine.?tun/i,
    /人形机器人|自动驾驶|具身智能|量子计算/
  ],

  // 二级: 锁定 "经济" — 标题或摘要必须匹配至少 1 个
  TIER2_ECON_KEYWORDS: [
    // 中文经济关键词
    /融资|投资|估值|IPO|上市|股价|市值|财报|营收|利润|亏损|盈利|净利|毛利率|同比增长|环比/i,
    /GDP|CPI|PMI|PPI|通胀|利率|央行|货币政策|降息|降准|加息|M2|准备金|社融|信贷/i,
    /政策|监管|法规|条例|通知|国务院|工信部|发改委|商务部|网信办/i,
    /就业|失业|劳动力|裁员|招聘|薪资|人才/i,
    /产业|供应链|出口|进口|贸易|制裁|关税|芯片|半导体|新能源|电动车/i,
    /收购|并购|整合|重组|拆分|子公司/i,
    // 英文经济关键词
    /funding|investment|valuation|revenue|market.cap|stock|IPO|economy|regulation/i,
    /policy|employment|layoff|chip.export|semiconductor.ban|tariff|trade.war/i,
    /billion|million.*dollar|raised|series.[A-D]|seed.round|venture/i
  ],

  // === 权威优先级 ===
  AUTHORITY_RANK: {
    domestic: [
      '国家统计局', 'data.stats.gov.cn',
      '中国人民银行', 'chinamoney.com.cn',
      '巨潮资讯', 'cninfo.com.cn',
      '东方财富', 'eastmoney.com',
      '36Kr', '36kr.com',
      '新浪财经', 'finance.sina.com.cn',
      '证券时报', 'STCN.com',
      '财联社', 'cls.cn',
    ],
    international: [
      'arXiv', 'export.arxiv.org',
      'AI HOT', 'aihot.virxact.com',
      'Hacker News', 'news.ycombinator.com',
      'GitHub', 'github.com',
      'Reuters', 'reuters.com',
      'Bloomberg', 'bloomberg.com',
      'Financial Times', 'ft.com',
    ],
  },

  // === 数据源配置 ===
  SOURCES: {
    domestic: {
      '36Kr': {
        url: 'https://36kr.com/feed',
        type: 'rss',
        timeout: 20000,
      },
      eastmoney: {
        url: 'https://push2.eastmoney.com/api/qt/clist/get',
        type: 'json',
        params: 'pn=1&pz=30&fs=m:0+t:6&fields=f2,f3,f4,f12,f14',
        timeout: 20000,
      },
      sinaFinance: {
        url: 'https://hq.sinajs.cn/list=sh688981,sh688256,sh688008,sz002230,sz300474,sh603019,sh688111,sz300033,sh603501,sz002415',
        type: 'text',
        timeout: 15000,
      },
    },
    international: {
      hackerNews: {
        url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
        type: 'json',
        timeout: 25000,
      },
      arxiv: {
        url: 'https://export.arxiv.org/api/query',
        type: 'xml',
        categories: ['cs.AI', 'cs.CL', 'cs.LG', 'q-fin.EC'],
        maxPerCategory: 5,
        timeout: 25000,
      },
      github: {
        url: 'https://api.github.com/search/repositories',
        type: 'json',
        timeout: 20000,
      },
      aihot: {
        url: 'https://aihot.virxact.com/api/public/items',
        type: 'json',
        timeout: 20000,
      },
    },
  },

  // === 汇报分类结构 ===
  REPORT_CATEGORIES: {
    'macro-policy': { label: '宏观经济与AI政策', region: 'domestic', order: 1 },
    'industry-capital': { label: 'AI产业与资本市场', region: 'domestic', order: 2 },
    'concept-stocks': { label: 'AI概念板块行情', region: 'domestic', order: 3 },
    'global-dynamics': { label: '全球AI经济动态', region: 'international', order: 4 },
    'academic-trends': { label: 'AI学术与产业趋势', region: 'international', order: 5 },
    'conflicts': { label: '跨来源冲突记录', region: 'meta', order: 6 },
  },

  // === 重大变化标注符号 ===
  MARKERS: {
    NEW: '🆕',
    HOT: '🔥',
    RISK: '⚠️',
    UP: '📈',
    DOWN: '📉',
    CONFLICT: '⚡',
  },
};

module.exports = CONFIG;
