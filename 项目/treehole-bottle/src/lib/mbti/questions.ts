import type { MbtiDimension } from "@/types";

export interface MbtiQuestion {
  id: string;
  dimension: MbtiDimension;
  text: string;
  options: { label: string; text: string; score: number }[];
}

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // ========== EI dimension (15 questions, id EI-01 to EI-15) ==========
  {
    id: "EI-01",
    dimension: "EI",
    text: "在聚会或社交活动结束后，你通常感觉：",
    options: [
      { label: "A", text: "精力充沛想继续社交", score: 1.0 },
      { label: "B", text: "需要独处恢复精力", score: -1.0 },
      { label: "C", text: "不确定", score: 0 },
    ],
  },
  {
    id: "EI-02",
    dimension: "EI",
    text: "认识新朋友对你来说：",
    options: [
      { label: "A", text: "令人兴奋", score: 1.0 },
      { label: "B", text: "消耗精力", score: -1.0 },
      { label: "C", text: "看情况", score: 0 },
    ],
  },
  {
    id: "EI-03",
    dimension: "EI",
    text: "独处太久后你会：",
    options: [
      { label: "A", text: "感到孤独想找人聊天", score: 1.0 },
      { label: "B", text: "享受独处并不觉得无聊", score: -1.0 },
      { label: "C", text: "两者都有", score: 0 },
    ],
  },
  {
    id: "EI-04",
    dimension: "EI",
    text: "在团队讨论中你通常：",
    options: [
      { label: "A", text: "主动发言分享想法", score: 1.0 },
      { label: "B", text: "先听别人说完再表达", score: -1.0 },
      { label: "C", text: "视情况而定", score: 0 },
    ],
  },
  {
    id: "EI-05",
    dimension: "EI",
    text: "周末你更倾向于：",
    options: [
      { label: "A", text: "约朋友出去聚会", score: 1.0 },
      { label: "B", text: "一个人安静做自己的事", score: -1.0 },
      { label: "C", text: "看心情", score: 0 },
    ],
  },
  {
    id: "EI-06",
    dimension: "EI",
    text: "接电话和发文字消息你更喜欢：",
    options: [
      { label: "A", text: "打电话直接沟通", score: 1.0 },
      { label: "B", text: "发文字有思考时间", score: -1.0 },
      { label: "C", text: "没偏好", score: 0 },
    ],
  },
  {
    id: "EI-07",
    dimension: "EI",
    text: "在人群中你通常感觉：",
    options: [
      { label: "A", text: "充满活力", score: 1.0 },
      { label: "B", text: "想早点离开", score: -1.0 },
      { label: "C", text: "看场合", score: 0 },
    ],
  },
  {
    id: "EI-08",
    dimension: "EI",
    text: "与新同事相处时：",
    options: [
      { label: "A", text: "很快熟络起来", score: 1.0 },
      { label: "B", text: "需要时间慢慢了解", score: -1.0 },
      { label: "C", text: "适中", score: 0 },
    ],
  },
  {
    id: "EI-09",
    dimension: "EI",
    text: "你更喜欢的社交方式是：",
    options: [
      { label: "A", text: "大型聚会热闹的", score: 1.0 },
      { label: "B", text: "三两个好友深聊", score: -1.0 },
      { label: "C", text: "都喜欢", score: 0 },
    ],
  },
  {
    id: "EI-10",
    dimension: "EI",
    text: "别人认为你是：",
    options: [
      { label: "A", text: "外向健谈的人", score: 1.0 },
      { label: "B", text: "安静内敛的人", score: -1.0 },
      { label: "C", text: "不太确定", score: 0 },
    ],
  },
  {
    id: "EI-11",
    dimension: "EI",
    text: "做决定时你更依赖：",
    options: [
      { label: "A", text: "与他人讨论后决定", score: 1.0 },
      { label: "B", text: "自己独立思考", score: -1.0 },
      { label: "C", text: "两者结合", score: 0 },
    ],
  },
  {
    id: "EI-12",
    dimension: "EI",
    text: "在会议上被突然提问：",
    options: [
      { label: "A", text: "当场就能组织语言回答", score: 1.0 },
      { label: "B", text: "需要时间整理思路", score: -1.0 },
      { label: "C", text: "看问题难度", score: 0 },
    ],
  },
  {
    id: "EI-13",
    dimension: "EI",
    text: "你的朋友圈通常是：",
    options: [
      { label: "A", text: "广泛但不太深入", score: 1.0 },
      { label: "B", text: "少而精但关系紧密", score: -1.0 },
      { label: "C", text: "两者都有", score: 0 },
    ],
  },
  {
    id: "EI-14",
    dimension: "EI",
    text: "空闲时的能量来源：",
    options: [
      { label: "A", text: "与人互动让你充电", score: 1.0 },
      { label: "B", text: "独处让你恢复能量", score: -1.0 },
      { label: "C", text: "不一定", score: 0 },
    ],
  },
  {
    id: "EI-15",
    dimension: "EI",
    text: "面对新环境时：",
    options: [
      { label: "A", text: "主动探索与人交流", score: 1.0 },
      { label: "B", text: "先观察再慢慢融入", score: -1.0 },
      { label: "C", text: "看情况", score: 0 },
    ],
  },

  // ========== SN dimension (15 questions, id SN-01 to SN-15) ==========
  {
    id: "SN-01",
    dimension: "SN",
    text: "学习新事物时你更关注：",
    options: [
      { label: "A", text: "具体细节和步骤", score: 1.0 },
      { label: "B", text: "整体概念和可能性", score: -1.0 },
      { label: "C", text: "两者兼顾", score: 0 },
    ],
  },
  {
    id: "SN-02",
    dimension: "SN",
    text: "你更相信：",
    options: [
      { label: "A", text: "亲身经历和事实", score: 1.0 },
      { label: "B", text: "直觉和预感", score: -1.0 },
      { label: "C", text: "都会参考", score: 0 },
    ],
  },
  {
    id: "SN-03",
    dimension: "SN",
    text: "解决一个问题时你倾向于：",
    options: [
      { label: "A", text: "用已知的有效方法", score: 1.0 },
      { label: "B", text: "尝试新的创造性方案", score: -1.0 },
      { label: "C", text: "看具体问题", score: 0 },
    ],
  },
  {
    id: "SN-04",
    dimension: "SN",
    text: "阅读一本书时你更在意：",
    options: [
      { label: "A", text: "情节和细节是否合理", score: 1.0 },
      { label: "B", text: "背后的隐喻和深层含义", score: -1.0 },
      { label: "C", text: "都重要", score: 0 },
    ],
  },
  {
    id: "SN-05",
    dimension: "SN",
    text: "描述一件事时你：",
    options: [
      { label: "A", text: "按时间顺序具体描述", score: 1.0 },
      { label: "B", text: "跳跃式讲大概印象", score: -1.0 },
      { label: "C", text: "两种方式都用", score: 0 },
    ],
  },
  {
    id: "SN-06",
    dimension: "SN",
    text: "你更喜欢的工作是：",
    options: [
      { label: "A", text: "有明确步骤和标准流程的", score: 1.0 },
      { label: "B", text: "需要创意和想象力的", score: -1.0 },
      { label: "C", text: "两者结合", score: 0 },
    ],
  },
  {
    id: "SN-07",
    dimension: "SN",
    text: "对待传统你通常：",
    options: [
      { label: "A", text: "尊重并遵循传统做法", score: 1.0 },
      { label: "B", text: "质疑传统寻找更好的方式", score: -1.0 },
      { label: "C", text: "看具体情况", score: 0 },
    ],
  },
  {
    id: "SN-08",
    dimension: "SN",
    text: "做旅行计划时：",
    options: [
      { label: "A", text: "详细规划每一天行程", score: 1.0 },
      { label: "B", text: "只定大方向随性而行", score: -1.0 },
      { label: "C", text: "折中处理", score: 0 },
    ],
  },
  {
    id: "SN-09",
    dimension: "SN",
    text: "你更擅长记住：",
    options: [
      { label: "A", text: "具体的事实和数据", score: 1.0 },
      { label: "B", text: "抽象的联想和印象", score: -1.0 },
      { label: "C", text: "差不多", score: 0 },
    ],
  },
  {
    id: "SN-10",
    dimension: "SN",
    text: "面对新想法时：",
    options: [
      { label: "A", text: "先看是否实际可行", score: 1.0 },
      { label: "B", text: "被新颖的概念吸引", score: -1.0 },
      { label: "C", text: "都考虑", score: 0 },
    ],
  },
  {
    id: "SN-11",
    dimension: "SN",
    text: "你喜欢的任务类型：",
    options: [
      { label: "A", text: "有明确标准和完成标志的", score: 1.0 },
      { label: "B", text: "开放式的需要探索的", score: -1.0 },
      { label: "C", text: "都可以", score: 0 },
    ],
  },
  {
    id: "SN-12",
    dimension: "SN",
    text: "理解事物时你偏向：",
    options: [
      { label: "A", text: "拆解成具体组成部分", score: 1.0 },
      { label: "B", text: "看整体图景和联系", score: -1.0 },
      { label: "C", text: "两者都用", score: 0 },
    ],
  },
  {
    id: "SN-13",
    dimension: "SN",
    text: "对于规则和流程：",
    options: [
      { label: "A", text: "让你感到安全和高效", score: 1.0 },
      { label: "B", text: "让你感到束缚", score: -1.0 },
      { label: "C", text: "看什么规则", score: 0 },
    ],
  },
  {
    id: "SN-14",
    dimension: "SN",
    text: "你的思维方式更像：",
    options: [
      { label: "A", text: "线性的step by step", score: 1.0 },
      { label: "B", text: "跳跃的发散的", score: -1.0 },
      { label: "C", text: "两者都有", score: 0 },
    ],
  },
  {
    id: "SN-15",
    dimension: "SN",
    text: "面对不确定的未来：",
    options: [
      { label: "A", text: "希望你制定具体计划", score: 1.0 },
      { label: "B", text: "享受各种可能性带来的兴奋", score: -1.0 },
      { label: "C", text: "适度规划", score: 0 },
    ],
  },

  // ========== TF dimension (15 questions, id TF-01 to TF-15) ==========
  {
    id: "TF-01",
    dimension: "TF",
    text: "朋友向你倾诉烦恼时你更倾向于：",
    options: [
      { label: "A", text: "先给予情感安慰", score: 1.0 },
      { label: "B", text: "直接帮忙分析解决方案", score: -1.0 },
      { label: "C", text: "两者都做", score: 0 },
    ],
  },
  {
    id: "TF-02",
    dimension: "TF",
    text: "做重要决定时你更依赖：",
    options: [
      { label: "A", text: "个人价值观和感受", score: 1.0 },
      { label: "B", text: "逻辑分析和客观事实", score: -1.0 },
      { label: "C", text: "综合考虑", score: 0 },
    ],
  },
  {
    id: "TF-03",
    dimension: "TF",
    text: "面对批评时你更在意：",
    options: [
      { label: "A", text: "对方是否照顾了你的感受", score: 1.0 },
      { label: "B", text: "批评的内容是否客观正确", score: -1.0 },
      { label: "C", text: "都重要", score: 0 },
    ],
  },
  {
    id: "TF-04",
    dimension: "TF",
    text: "你认为更重要的是：",
    options: [
      { label: "A", text: "人际关系的和谐", score: 1.0 },
      { label: "B", text: "把事情做对做好", score: -1.0 },
      { label: "C", text: "两者都重要", score: 0 },
    ],
  },
  {
    id: "TF-05",
    dimension: "TF",
    text: "看到不公正的事情时：",
    options: [
      { label: "A", text: "首先感到同情和愤怒", score: 1.0 },
      { label: "B", text: "首先分析原因和解决方案", score: -1.0 },
      { label: "C", text: "两者都有", score: 0 },
    ],
  },
  {
    id: "TF-06",
    dimension: "TF",
    text: "在团队中你更关注：",
    options: [
      { label: "A", text: "每个人的情绪和参与感", score: 1.0 },
      { label: "B", text: "任务的进度和效率", score: -1.0 },
      { label: "C", text: "两者兼顾", score: 0 },
    ],
  },
  {
    id: "TF-07",
    dimension: "TF",
    text: "你认为好的领导者应该：",
    options: [
      { label: "A", text: "关心每个成员的成长", score: 1.0 },
      { label: "B", text: "制定清晰目标推动执行", score: -1.0 },
      { label: "C", text: "两者都要", score: 0 },
    ],
  },
  {
    id: "TF-08",
    dimension: "TF",
    text: "面对冲突时你倾向于：",
    options: [
      { label: "A", text: "寻求妥协维护关系", score: 1.0 },
      { label: "B", text: "直面问题据理力争", score: -1.0 },
      { label: "C", text: "视情况", score: 0 },
    ],
  },
  {
    id: "TF-09",
    dimension: "TF",
    text: "你更容易被什么打动：",
    options: [
      { label: "A", text: "温暖感人的故事", score: 1.0 },
      { label: "B", text: "严密的逻辑论证", score: -1.0 },
      { label: "C", text: "都可以", score: 0 },
    ],
  },
  {
    id: "TF-10",
    dimension: "TF",
    text: "评价一个决策好坏你更看重：",
    options: [
      { label: "A", text: "对相关人员的影响", score: 1.0 },
      { label: "B", text: "是否符合逻辑和效率", score: -1.0 },
      { label: "C", text: "都重要", score: 0 },
    ],
  },
  {
    id: "TF-11",
    dimension: "TF",
    text: "你觉得大多数人：",
    options: [
      { label: "A", text: "本质是善良的值得信任", score: 1.0 },
      { label: "B", text: "需要客观评估不能感情用事", score: -1.0 },
      { label: "C", text: "不确定", score: 0 },
    ],
  },
  {
    id: "TF-12",
    dimension: "TF",
    text: "在工作反馈中你更希望：",
    options: [
      { label: "A", text: "先肯定再提建议", score: 1.0 },
      { label: "B", text: "直接指出问题所在", score: -1.0 },
      { label: "C", text: "都可以", score: 0 },
    ],
  },
  {
    id: "TF-13",
    dimension: "TF",
    text: "当你不同意他人观点时：",
    options: [
      { label: "A", text: "会考虑对方的感受措辞委婉", score: 1.0 },
      { label: "B", text: "直接表达不同意见", score: -1.0 },
      { label: "C", text: "视对象而定", score: 0 },
    ],
  },
  {
    id: "TF-14",
    dimension: "TF",
    text: "你的成就感更多来自：",
    options: [
      { label: "A", text: "帮助他人获得认可", score: 1.0 },
      { label: "B", text: "解决问题达成目标", score: -1.0 },
      { label: "C", text: "两者都有", score: 0 },
    ],
  },
  {
    id: "TF-15",
    dimension: "TF",
    text: "你认为真理是：",
    options: [
      { label: "A", text: "相对的取决于情境和人", score: 1.0 },
      { label: "B", text: "客观的可以被验证的", score: -1.0 },
      { label: "C", text: "不确定", score: 0 },
    ],
  },

  // ========== JP dimension (15 questions, id JP-01 to JP-15) ==========
  {
    id: "JP-01",
    dimension: "JP",
    text: "对待日程安排你倾向于：",
    options: [
      { label: "A", text: "提前计划按部就班", score: 1.0 },
      { label: "B", text: "保持灵活随性应变", score: -1.0 },
      { label: "C", text: "适度计划留有余地", score: 0 },
    ],
  },
  {
    id: "JP-02",
    dimension: "JP",
    text: "面对截止日期你通常：",
    options: [
      { label: "A", text: "提前完成不拖延", score: 1.0 },
      { label: "B", text: "最后期限前效率最高", score: -1.0 },
      { label: "C", text: "两种情况都有", score: 0 },
    ],
  },
  {
    id: "JP-03",
    dimension: "JP",
    text: "你的桌面/房间通常是：",
    options: [
      { label: "A", text: "整洁有序", score: 1.0 },
      { label: "B", text: "创意混乱但我知道东西在哪", score: -1.0 },
      { label: "C", text: "一般", score: 0 },
    ],
  },
  {
    id: "JP-04",
    dimension: "JP",
    text: "做决定时你倾向于：",
    options: [
      { label: "A", text: "尽早决定不再纠结", score: 1.0 },
      { label: "B", text: "保持开放收集更多信息", score: -1.0 },
      { label: "C", text: "看事情重要程度", score: 0 },
    ],
  },
  {
    id: "JP-05",
    dimension: "JP",
    text: "你更喜欢的工作节奏：",
    options: [
      { label: "A", text: "有明确计划和里程碑", score: 1.0 },
      { label: "B", text: "自由探索随时调整", score: -1.0 },
      { label: "C", text: "两者结合", score: 0 },
    ],
  },
  {
    id: "JP-06",
    dimension: "JP",
    text: "突如其来的变化让你：",
    options: [
      { label: "A", text: "感到不安想要重新规划", score: 1.0 },
      { label: "B", text: "觉得刺激乐于适应", score: -1.0 },
      { label: "C", text: "看变化大小", score: 0 },
    ],
  },
  {
    id: "JP-07",
    dimension: "JP",
    text: "购物时你倾向于：",
    options: [
      { label: "A", text: "列出清单按计划购买", score: 1.0 },
      { label: "B", text: "逛逛看看遇到喜欢的就买", score: -1.0 },
      { label: "C", text: "都有", score: 0 },
    ],
  },
  {
    id: "JP-08",
    dimension: "JP",
    text: "对未完成的任务你感到：",
    options: [
      { label: "A", text: "焦虑总想尽快完成", score: 1.0 },
      { label: "B", text: "不急还有时间", score: -1.0 },
      { label: "C", text: "看任务性质", score: 0 },
    ],
  },
  {
    id: "JP-09",
    dimension: "JP",
    text: "你更喜欢的规则是：",
    options: [
      { label: "A", text: "清晰明确让人知道该做什么", score: 1.0 },
      { label: "B", text: "灵活宽松给人自由空间", score: -1.0 },
      { label: "C", text: "适中", score: 0 },
    ],
  },
  {
    id: "JP-10",
    dimension: "JP",
    text: "旅行时你更喜欢：",
    options: [
      { label: "A", text: "按计划打卡每个景点", score: 1.0 },
      { label: "B", text: "随走随停探索未知", score: -1.0 },
      { label: "C", text: "两者结合", score: 0 },
    ],
  },
  {
    id: "JP-11",
    dimension: "JP",
    text: "你的生活态度更像是：",
    options: [
      { label: "A", text: "凡事预则立", score: 1.0 },
      { label: "B", text: "车到山前必有路", score: -1.0 },
      { label: "C", text: "适度规划", score: 0 },
    ],
  },
  {
    id: "JP-12",
    dimension: "JP",
    text: "面对多个任务时：",
    options: [
      { label: "A", text: "列优先级逐个完成", score: 1.0 },
      { label: "B", text: "同时推进哪个顺手做哪个", score: -1.0 },
      { label: "C", text: "看情况", score: 0 },
    ],
  },
  {
    id: "JP-13",
    dimension: "JP",
    text: "等待结果时你会：",
    options: [
      { label: "A", text: "感到焦虑想知道结果", score: 1.0 },
      { label: "B", text: "顺其自然不太焦虑", score: -1.0 },
      { label: "C", text: "看事情重要性", score: 0 },
    ],
  },
  {
    id: "JP-14",
    dimension: "JP",
    text: "你更喜欢的工作环境：",
    options: [
      { label: "A", text: "结构清晰职责分明", score: 1.0 },
      { label: "B", text: "自由灵活可即兴发挥", score: -1.0 },
      { label: "C", text: "适中", score: 0 },
    ],
  },
  {
    id: "JP-15",
    dimension: "JP",
    text: "对于人生规划你：",
    options: [
      { label: "A", text: "有清晰的5年10年目标", score: 1.0 },
      { label: "B", text: "享受即兴的旅程不过多规划", score: -1.0 },
      { label: "C", text: "有大方向但不设细节", score: 0 },
    ],
  },
];

/**
 * Pick `count` questions from the pool, optionally filtered by preferred dimensions.
 * If no dimensions specified, picks evenly across all 4 dimensions.
 * Returns shuffled questions.
 */
export function pickQuestions(
  count: number,
  preferredDimensions?: MbtiDimension[],
): MbtiQuestion[] {
  const dims = preferredDimensions ?? (["EI", "SN", "TF", "JP"] as MbtiDimension[]);

  // Group questions by dimension
  const byDimension = new Map<MbtiDimension, MbtiQuestion[]>();
  for (const q of MBTI_QUESTIONS) {
    const list = byDimension.get(q.dimension) ?? [];
    list.push(q);
    byDimension.set(q.dimension, list);
  }

  // Round-robin pick across dimensions
  const picked: MbtiQuestion[] = [];
  const usedIds = new Set<string>();
  let dimIndex = 0;

  while (picked.length < count) {
    const dim = dims[dimIndex % dims.length];
    const pool = (byDimension.get(dim) ?? []).filter((q) => !usedIds.has(q.id));

    if (pool.length > 0) {
      const question = pool[Math.floor(Math.random() * pool.length)];
      picked.push(question);
      usedIds.add(question.id);
    }

    dimIndex++;
  }

  return picked;
}
