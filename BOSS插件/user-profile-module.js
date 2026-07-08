/**
 * ===========================================================================
 * BOSS直聘AI招呼语生成器 — 用户背景管理模块
 * User Profile Management Module
 *
 * 数据安全分级：
 *   P0 (绝不可发送) — name, phone: 仅本地存储，无API调用，无日志输出
 *   P1 (脱敏后可发送) — email, education.school: 脱敏后转化为标签
 *   P2 (可直接发送) — currentRole, targetRoles, coreSkills, keyAchievements, workYears
 *   P3 (公开) — personalStyle, updatedAt 等元数据
 *
 * localStorage key 设计：
 *   'app_profiles'          → Profile[]  所有背景档
 *   'app_active_profile_id'  → string     当前活跃版本ID
 *   'app_settings'           → object     API/模型配置
 *   'app_history'            → object[]   招呼语历史(最近20条)
 *   'app_schema_version'     → number     数据版本号(用于迁移)
 * ===========================================================================
 */

/* ==========================================================================
 * 0. 常量 & 配置
 * ========================================================================== */

/** 当前数据 schema 版本，用于自动迁移检测 */
const CURRENT_SCHEMA_VERSION = 1;

/** localStorage keys */
const STORAGE_KEYS = Object.freeze({
  PROFILES: 'app_profiles',
  ACTIVE_ID: 'app_active_profile_id',
  SETTINGS: 'app_settings',
  HISTORY: 'app_history',
  SCHEMA_VERSION: 'app_schema_version',
});

/** 隐私分级常量 */
const PRIVACY = Object.freeze({
  P0_KEEP_LOCAL: ['name', 'phone'],                    // 绝不出浏览器
  P1_SANITIZE: ['email', 'education'],                  // 脱敏后发送
  P2_CAN_SEND: ['currentRole', 'targetRoles', 'targetCities', 'coreSkills', 'keyAchievements', 'workYears'],
  P3_PUBLIC: ['personalStyle', 'updatedAt', 'createdAt'],
});

/** 表单字段字数上限 */
const FIELD_LIMITS = Object.freeze({
  name: 20,
  currentRole: 30,
  targetRoles: 50,       // 每个角色的字数上限
  targetCities: 20,      // 每个城市的字数上限
  coreSkills: 30,        // 每个技能的字数上限
  workYears: 10,
  personalStyle: 30,
  achievementMetric: 20,
  achievementContext: 30,
  achievementDescription: 100,
});

/** 版本数量上限 */
const MAX_PROFILE_VERSIONS = 10;

/** 历史记录上限 */
const MAX_HISTORY_ITEMS = 20;

/** 保存去抖延迟(ms) */
const SAVE_DEBOUNCE_MS = 500;

/** 简历摘要最大字数 */
const SUMMARY_MAX_CHARS = 150;

/* ==========================================================================
 * 1. 工具函数
 * ========================================================================== */

/**
 * 创建一个深层副本（不可变模式 — 永不修改原对象）
 * @template T
 * @param {T} obj
 * @returns {T}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 生成唯一 ID
 * @returns {string} 如 "pf_1710234567890_a3f2"
 */
function generateId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `pf_${ts}_${rand}`;
}

/**
 * 获取当前时间戳字符串(中文友好格式)
 * @returns {string} 如 "2026-07-06 14:30"
 */
function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 安全地从 localStorage 读取并解析 JSON，失败时返回默认值
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function safeGetJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[ProfileModule] 读取 %s 失败，使用默认值', key, e);
    return fallback;
  }
}

/**
 * 安全写入 localStorage，失败时静默降级
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} 是否写入成功
 */
function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[ProfileModule] 写入 %s 失败，可能存储已满', key, e);
    return false;
  }
}

/* ==========================================================================
 * 2. 默认背景档工厂
 * ========================================================================== */

/**
 * 创建一个全新的空白背景档
 * @param {string} [name='默认背景档'] - 版本名称
 * @returns {object} 新的背景档对象
 */
function createEmptyProfile(name) {
  const nowStr = now();
  return {
    id: generateId(),
    name: name || '默认背景档',
    phone: '',
    email: '',
    currentRole: '',
    targetRoles: [],
    targetCities: [],
    coreSkills: [],
    keyAchievements: [],
    workYears: '',
    education: {
      level: '',
      major: '',
      school: '',
    },
    personalStyle: '',
    createdAt: nowStr,
    updatedAt: nowStr,
  };
}

/* ==========================================================================
 * 3. CRUD 操作
 * ========================================================================== */

/**
 * 加载指定ID的背景档
 * @param {string} [id] - 背景档ID，默认加载当前活跃版本
 * @returns {object|null} 背景档对象，不存在则返回 null
 */
function loadProfile(id) {
  const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);

  // 未指定ID时使用活跃版本
  if (!id) {
    const activeId = safeGetJSON(STORAGE_KEYS.ACTIVE_ID, null);
    if (activeId) {
      return profiles.find((p) => p.id === activeId) || null;
    }
    // 无活跃ID时返回第一个，无任何版本时返回 null
    return profiles.length > 0 ? profiles[0] : null;
  }

  return profiles.find((p) => p.id === id) || null;
}

// 保存去抖定时器
let _saveTimer = null;

/**
 * 保存背景档（自动去抖500ms）
 * - 如果背景档已存在则更新，否则追加
 * - P0 字段(name, phone)确认仅存于 localStorage
 *
 * @param {object} profile - 要保存的背景档对象
 * @returns {boolean} 是否保存成功
 */
function saveProfile(profile) {
  // 防御：确保不意外覆盖 id
  if (!profile.id) {
    profile.id = generateId();
  }

  // 更新修改时间
  profile.updatedAt = now();
  if (!profile.createdAt) {
    profile.createdAt = profile.updatedAt;
  }

  // 去抖
  if (_saveTimer) {
    clearTimeout(_saveTimer);
  }

  return new Promise((resolve) => {
    _saveTimer = setTimeout(() => {
      const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);
      const idx = profiles.findIndex((p) => p.id === profile.id);

      if (idx >= 0) {
        // 不可变更新：替换为新对象
        profiles[idx] = deepClone(profile);
      } else {
        profiles.push(deepClone(profile));
      }

      const ok = safeSetJSON(STORAGE_KEYS.PROFILES, profiles);
      if (ok) {
        // 如果是第一个背景档，自动设为活跃
        const activeId = safeGetJSON(STORAGE_KEYS.ACTIVE_ID, null);
        if (!activeId || profiles.length === 1) {
          safeSetJSON(STORAGE_KEYS.ACTIVE_ID, profile.id);
        }
      }
      resolve(ok);
      _saveTimer = null;
    }, SAVE_DEBOUNCE_MS);
  });
}

/**
 * 创建新版本背景档
 * @param {string} name - 版本名称
 * @returns {object|null} 创建成功返回新背景档，版本数超限返回 null
 */
function createProfileVersion(name) {
  const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);

  if (profiles.length >= MAX_PROFILE_VERSIONS) {
    console.warn('[ProfileModule] 版本数量已达上限(%d)', MAX_PROFILE_VERSIONS);
    return null;
  }

  // 如果当前有活跃版本，可复制其内容作为基础（但不复制 P0 敏感字段）
  const active = loadProfile();
  const newProfile = createEmptyProfile(name);

  if (active) {
    newProfile.currentRole = active.currentRole;
    newProfile.targetRoles = deepClone(active.targetRoles);
    newProfile.targetCities = deepClone(active.targetCities);
    newProfile.coreSkills = deepClone(active.coreSkills);
    newProfile.keyAchievements = deepClone(active.keyAchievements);
    newProfile.workYears = active.workYears;
    newProfile.education = deepClone(active.education);
    newProfile.personalStyle = active.personalStyle;
  }

  profiles.push(newProfile);
  safeSetJSON(STORAGE_KEYS.PROFILES, profiles);

  return newProfile;
}

/**
 * 切换活跃背景档版本
 * @param {string} id - 要激活的背景档ID
 * @returns {boolean} 是否切换成功
 */
function switchProfile(id) {
  const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);
  const exists = profiles.some((p) => p.id === id);

  if (!exists) {
    console.warn('[ProfileModule] 背景档不存在: %s', id);
    return false;
  }

  safeSetJSON(STORAGE_KEYS.ACTIVE_ID, id);
  return true;
}

/**
 * 删除指定版本背景档
 * - 不允许删除最后一个版本
 * - 如果删除的是活跃版本，自动切换到剩余的第一个版本
 *
 * @param {string} id - 要删除的背景档ID
 * @returns {{ success: boolean, newActiveId?: string, error?: string }}
 */
function deleteProfile(id) {
  let profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);

  if (profiles.length <= 1) {
    return { success: false, error: '至少保留一个背景档版本' };
  }

  const target = profiles.find((p) => p.id === id);
  if (!target) {
    return { success: false, error: '未找到要删除的背景档' };
  }

  // 不可变：过滤掉要删除的
  profiles = profiles.filter((p) => p.id !== id);
  safeSetJSON(STORAGE_KEYS.PROFILES, profiles);

  const activeId = safeGetJSON(STORAGE_KEYS.ACTIVE_ID, null);
  let newActiveId = null;

  if (activeId === id) {
    // 切换到剩余的第一个
    newActiveId = profiles[0].id;
    safeSetJSON(STORAGE_KEYS.ACTIVE_ID, newActiveId);
  }

  return { success: true, newActiveId };
}

/**
 * 列出所有背景档版本概览（不含敏感字段的摘要版）
 * @returns {Array<{id: string, name: string, updatedAt: string, isActive: boolean, itemCount: number}>}
 */
function listProfiles() {
  const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);
  const activeId = safeGetJSON(STORAGE_KEYS.ACTIVE_ID, null);

  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    updatedAt: p.updatedAt,
    isActive: p.id === activeId,
    itemCount: (p.targetRoles || []).length + (p.coreSkills || []).length,
  }));
}

/* ==========================================================================
 * 4. 隐私脱敏引擎
 * ========================================================================== */

/**
 * 学校名称到学历标签的映射（用于脱敏）
 * 实际项目可从配置或数据库中获取
 */
const SCHOOL_CATEGORY_MAP = {
  // 可扩展更多映射
  _default: '[%LEVEL%-综合类]',
};

/**
 * 公司/项目名称到行业标签的映射（用于脱敏）
 */
const COMPANY_CATEGORY_MAP = {
  // 关键词 → 标签
  _patterns: [
    { match: /直播|抖音|快手|视频号|荔枝|B站|bilibili|小红书|TikTok/i, label: '[直播/短视频平台]' },
    { match: /电商|淘宝|京东|拼多多|美团|饿了么/i, label: '[电商平台]' },
    { match: /游戏|腾讯|网易|米哈游|莉莉丝/i, label: '[游戏公司]' },
    { match: /教育|培训|新东方|好未来|学而思/i, label: '[教育机构]' },
    { match: /金融|银行|证券|保险|基金/i, label: '[金融机构]' },
    { match: /医疗|医院|制药|药明/i, label: '[医疗健康]' },
    { match: /汽车|新能源|比亚迪|蔚来|小鹏|理想/i, label: '[汽车/新能源]' },
    { match: /AI|人工智能|机器学习|算法|大模型|LLM/i, label: '[AI/科技公司]' },
  ],
};

/**
 * 将学校名称脱敏为学历标签
 * @param {string} schoolName - 原始学校名
 * @param {string} level - 学历级别
 * @returns {string} 脱敏标签，如 "[本科-综合类]"
 */
function sanitizeSchool(schoolName, level) {
  if (!schoolName || !schoolName.trim()) return level || '未知学历';

  const levelText = level || '未知学历';
  // 尝试匹配已知学校分类
  for (const [key, template] of Object.entries(SCHOOL_CATEGORY_MAP)) {
    if (key === '_default') continue;
    if (schoolName.includes(key)) {
      return template.replace('%LEVEL%', levelText);
    }
  }
  return `[${levelText}-综合类]`;
}

/**
 * 将公司/项目名脱敏为行业标签
 * @param {string} context - 原始上下文描述（可能包含公司名）
 * @returns {string} 脱敏后的上下文描述
 */
function sanitizeCompanyContext(context) {
  if (!context || !context.trim()) return context || '';

  let sanitized = context;
  for (const pattern of COMPANY_CATEGORY_MAP._patterns) {
    if (pattern.match.test(sanitized)) {
      return pattern.label;
    }
  }
  // 未匹配时使用泛化标签
  return '[某企业]';
}

/**
 * 用于发送到 AI API 前的脱敏处理
 *
 * 脱敏规则：
 *   - name → 完全移除
 *   - phone → 完全移除
 *   - email → 完全移除
 *   - education.school → 替换为学历标签如 "[本科-综合类]"
 *   - keyAchievements 中的公司名 → 替换为行业标签如 "[直播平台]"
 *   - education.major → 保留（泛化后不涉及具体学校）
 *
 * @param {object} profile - 完整背景档
 * @returns {object} 干净的、可安全发送到 AI API 的副本
 */
function sanitizeForAI(profile) {
  if (!profile) return null;

  // 不可变：创建副本
  const clean = deepClone(profile);

  // P0: 完全移除
  PRIVACY.P0_KEEP_LOCAL.forEach((field) => {
    delete clean[field];
  });

  // P1: 脱敏处理
  if (clean.education) {
    clean.education.school = sanitizeSchool(clean.education.school, clean.education.level);
    // 移除邮箱（P1 但不需要发送）
    delete clean.email;
  }

  // keyAchievements 上下文脱敏
  if (Array.isArray(clean.keyAchievements)) {
    clean.keyAchievements = clean.keyAchievements.map((ach) => {
      const sanitized = { ...ach };
      // 保留量化数据和描述，泛化上下文中的公司名
      if (sanitized.context) {
        sanitized.context = sanitizeCompanyContext(sanitized.context);
      }
      return sanitized;
    });
  }

  // 移除元数据（不需要发送给AI）
  delete clean.id;
  delete clean.name;
  delete clean.createdAt;
  delete clean.updatedAt;

  return clean;
}

/* ==========================================================================
 * 5. 表单验证
 * ========================================================================== */

/**
 * 验证背景档字段合法性
 * @param {object} profile - 要验证的背景档
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateProfile(profile) {
  const errors = [];

  if (!profile) {
    return { valid: false, errors: [{ field: '_root', message: '背景档为空' }] };
  }

  // 必填项检查
  if (!profile.currentRole || !profile.currentRole.trim()) {
    errors.push({ field: 'currentRole', message: '请填写您的求职方向' });
  }

  if (!Array.isArray(profile.coreSkills) || profile.coreSkills.length === 0) {
    errors.push({ field: 'coreSkills', message: '请至少填写一项核心技能' });
  }

  if (!Array.isArray(profile.targetRoles) || profile.targetRoles.length === 0) {
    errors.push({ field: 'targetRoles', message: '请至少填写一个目标岗位' });
  }

  if (!Array.isArray(profile.keyAchievements) || profile.keyAchievements.length === 0) {
    errors.push({ field: 'keyAchievements', message: '请至少填写一项关键成就' });
  }

  if (!profile.workYears || !profile.workYears.trim()) {
    errors.push({ field: 'workYears', message: '请填写工作经验年限' });
  }

  // 成就内容检查
  if (Array.isArray(profile.keyAchievements)) {
    profile.keyAchievements.forEach((ach, i) => {
      if (!ach.metric || !ach.metric.trim()) {
        errors.push({ field: `keyAchievements[${i}].metric`, message: `成就 #${i + 1}: 请填写量化数据` });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 检查各字段字数是否超限
 * @param {object} profile - 背景档
 * @returns {{ withinLimit: boolean, violations: Array<{field: string, current: number, limit: number}> }}
 */
function checkLimits(profile) {
  const violations = [];

  const check = (field, value, limit) => {
    if (value && typeof value === 'string' && value.length > limit) {
      violations.push({ field, current: value.length, limit });
    }
  };

  check('name', profile.name, FIELD_LIMITS.name);
  check('currentRole', profile.currentRole, FIELD_LIMITS.currentRole);
  check('workYears', profile.workYears, FIELD_LIMITS.workYears);
  check('personalStyle', profile.personalStyle, FIELD_LIMITS.personalStyle);

  if (Array.isArray(profile.coreSkills)) {
    profile.coreSkills.forEach((s, i) => {
      check(`coreSkills[${i}]`, s, FIELD_LIMITS.coreSkills);
    });
  }

  if (Array.isArray(profile.targetRoles)) {
    profile.targetRoles.forEach((r, i) => {
      check(`targetRoles[${i}]`, r, FIELD_LIMITS.targetRoles);
    });
  }

  if (Array.isArray(profile.targetCities)) {
    profile.targetCities.forEach((c, i) => {
      check(`targetCities[${i}]`, c, FIELD_LIMITS.targetCities);
    });
  }

  if (Array.isArray(profile.keyAchievements)) {
    profile.keyAchievements.forEach((ach, i) => {
      check(`keyAchievements[${i}].metric`, ach.metric, FIELD_LIMITS.achievementMetric);
      check(`keyAchievements[${i}].context`, ach.context, FIELD_LIMITS.achievementContext);
      check(`keyAchievements[${i}].description`, ach.description, FIELD_LIMITS.achievementDescription);
    });
  }

  return { withinLimit: violations.length === 0, violations };
}

/* ==========================================================================
 * 6. 简历摘要生成
 * ========================================================================== */

/**
 * 从背景档自动生成简历摘要（用于注入招呼语 Prompt）
 *
 * 格式："{currentRole}，{workYears}经验。核心技能：{skills}。主要成就：{achievement1}，{achievement2}"
 * 目标：150字以内
 *
 * @param {object} profile - 脱敏后的背景档 (sanitizeForAI 的输出)
 * @returns {string} 简历摘要文本
 */
function generateSummary(profile) {
  if (!profile) return '';

  const parts = [];

  // 第一句：求职方向 + 经验
  const role = profile.currentRole || '求职者';
  const years = profile.workYears || '';
  parts.push(years ? `${role}，${years}经验` : role);

  // 第二句：核心技能（最多取前5个）
  if (Array.isArray(profile.coreSkills) && profile.coreSkills.length > 0) {
    const skills = profile.coreSkills.slice(0, 5).join('、');
    parts.push(`核心技能：${skills}`);
  }

  // 第三句：主要成就（最多取前3个，每个截断到30字）
  if (Array.isArray(profile.keyAchievements) && profile.keyAchievements.length > 0) {
    const achievements = profile.keyAchievements
      .slice(0, 3)
      .map((ach) => {
        const metric = ach.metric || '';
        const context = ach.context || '';
        // 组合: "量化数据(上下文)"
        const text = context ? `${metric}（${context}）` : metric;
        return text.length > 40 ? text.substring(0, 40) + '...' : text;
      });
    parts.push(`主要成就：${achievements.join('，')}`);
  }

  // 拼接并截断到字数上限
  let summary = parts.join('。');
  if (summary.length > SUMMARY_MAX_CHARS) {
    summary = summary.substring(0, SUMMARY_MAX_CHARS - 1) + '…';
  }

  return summary;
}

/* ==========================================================================
 * 7. localStorage 管理
 * ========================================================================== */

/**
 * 数据迁移：检测旧版本并升级到当前 schema
 *
 * 迁移历史：
 *   v0 → v1: 首次版本化存储，将散落的旧数据整合到标准格式
 *
 * @returns {{ migrated: boolean, fromVersion: number|null, toVersion: number }}
 */
function migrateStorage() {
  const storedVersion = safeGetJSON(STORAGE_KEYS.SCHEMA_VERSION, 0);

  if (storedVersion >= CURRENT_SCHEMA_VERSION) {
    return { migrated: false, fromVersion: storedVersion, toVersion: storedVersion };
  }

  let migrated = false;

  // v0 → v1: 首次迁移
  if (storedVersion < 1) {
    // 检查是否有旧版单独存储的 key（如 "user_profile", "profile" 等）
    const legacyKeys = ['user_profile', 'profile', 'userProfile', 'boss_profile'];
    let legacyProfile = null;

    for (const key of legacyKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          legacyProfile = JSON.parse(raw);
          // 如果找到旧数据，迁移后清除旧key
          localStorage.removeItem(key);
          break;
        } catch (e) {
          // 忽略解析失败的旧数据
        }
      }
    }

    if (legacyProfile) {
      // 包装成标准格式
      const normalized = createEmptyProfile('从旧版迁移');
      normalized.id = 'default'; // 使用固定id确保唯一
      normalized.currentRole = legacyProfile.currentRole || legacyProfile.role || '';
      normalized.targetRoles = legacyProfile.targetRoles || [];
      normalized.targetCities = legacyProfile.targetCities || [];
      normalized.coreSkills = legacyProfile.coreSkills || legacyProfile.skills || [];
      normalized.workYears = legacyProfile.workYears || legacyProfile.experience || '';

      if (legacyProfile.achievements) {
        normalized.keyAchievements = legacyProfile.achievements.map((a) => ({
          metric: typeof a === 'string' ? a : a.metric || a.title || '',
          context: typeof a === 'object' ? a.context || '' : '',
          description: typeof a === 'object' ? a.description || '' : '',
        }));
      }

      normalized.education = legacyProfile.education || { level: '', major: '', school: '' };
      normalized.personalStyle = legacyProfile.personalStyle || legacyProfile.style || '';

      safeSetJSON(STORAGE_KEYS.PROFILES, [normalized]);
      safeSetJSON(STORAGE_KEYS.ACTIVE_ID, 'default');
      migrated = true;
    }

    // 如果完全没有 profile 数据，确保存储至少有空数组
    const existing = safeGetJSON(STORAGE_KEYS.PROFILES, null);
    if (existing === null) {
      safeSetJSON(STORAGE_KEYS.PROFILES, []);
    }
  }

  // 更新版本号
  safeSetJSON(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);

  return { migrated, fromVersion: storedVersion, toVersion: CURRENT_SCHEMA_VERSION };
}

/**
 * 获取当前 localStorage 使用情况
 * @returns {{ used: number, total: number, percentUsed: number, unit: string }}
 */
function getStorageUsage() {
  let used = 0;
  // 估算：每个字符约2字节(UTF-16)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      used += key.length + (localStorage.getItem(key) || '').length;
    }
  }
  // 大多数浏览器 localStorage 上限约 5MB (5,242,880 bytes)
  const total = 5 * 1024 * 1024;
  const usedBytes = used * 2; // UTF-16 → bytes 估算
  const percentUsed = Math.round((usedBytes / total) * 10000) / 100;

  return {
    used: Math.round(usedBytes / 1024 * 100) / 100, // KB
    total: Math.round(total / 1024),                 // KB
    percentUsed,
    unit: 'KB',
  };
}

/**
 * 清除所有应用数据
 * 注意：此操作不可逆，调用前应二次确认
 * @param {{ keepSettings?: boolean }} [options] - keepSettings=true 保留API配置
 * @returns {string[]} 被清除的 key 列表
 */
function clearAllData(options) {
  const opts = { keepSettings: false, ...options };
  const cleared = [];

  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    if (opts.keepSettings && name === 'SETTINGS') continue;
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      cleared.push(key);
    }
  }

  return cleared;
}

/**
 * 导出所有用户数据为 JSON 字符串（用于备份）
 * 注意：P0 字段包含在导出中，用户需自行保管导出文件
 *
 * @returns {string} JSON 字符串
 */
function exportAllData() {
  const data = {
    exportedAt: now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profiles: safeGetJSON(STORAGE_KEYS.PROFILES, []),
    activeProfileId: safeGetJSON(STORAGE_KEYS.ACTIVE_ID, null),
    settings: safeGetJSON(STORAGE_KEYS.SETTINGS, {}),
    // 历史记录可选择是否导出
    history: safeGetJSON(STORAGE_KEYS.HISTORY, []),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * 从备份 JSON 导入数据
 * @param {string} jsonString - exportAllData 产生的 JSON
 * @param {{ overwrite?: boolean }} [options] - overwrite=true 完全覆盖现有数据
 * @returns {{ success: boolean, error?: string, importedProfiles?: number }}
 */
function importAllData(jsonString, options) {
  const opts = { overwrite: false, ...options };

  try {
    const data = JSON.parse(jsonString);

    // 基本校验
    if (!data.profiles || !Array.isArray(data.profiles)) {
      return { success: false, error: '无效的备份文件格式：缺少 profiles 数组' };
    }

    if (opts.overwrite) {
      safeSetJSON(STORAGE_KEYS.PROFILES, data.profiles);
      safeSetJSON(STORAGE_KEYS.ACTIVE_ID, data.activeProfileId || null);
      if (data.settings) safeSetJSON(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.history) safeSetJSON(STORAGE_KEYS.HISTORY, data.history);
    } else {
      // 合并模式：追加不冲突的 profile，保留现有活跃版本
      const existing = safeGetJSON(STORAGE_KEYS.PROFILES, []);
      const existingIds = new Set(existing.map((p) => p.id));
      const newProfiles = data.profiles.filter((p) => !existingIds.has(p.id));
      safeSetJSON(STORAGE_KEYS.PROFILES, [...existing, ...newProfiles]);
    }

    return { success: true, importedProfiles: data.profiles.length };
  } catch (e) {
    return { success: false, error: `JSON 解析失败: ${e.message}` };
  }
}

/* ==========================================================================
 * 8. 历史记录管理
 * ========================================================================== */

/**
 * 添加一条招呼语生成历史
 * @param {{ greeting: string, jd: string, profileId: string, provider?: string, model?: string }} entry
 * @returns {boolean}
 */
function addHistory(entry) {
  const history = safeGetJSON(STORAGE_KEYS.HISTORY, []);
  const newEntry = {
    ...entry,
    timestamp: now(),
    id: generateId(),
  };

  // 不可变：构建新数组
  const updated = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);

  return safeSetJSON(STORAGE_KEYS.HISTORY, updated);
}

/**
 * 获取招呼语生成历史
 * @param {number} [limit=20] - 返回条数上限
 * @returns {object[]}
 */
function getHistory(limit) {
  const history = safeGetJSON(STORAGE_KEYS.HISTORY, []);
  return history.slice(0, limit || MAX_HISTORY_ITEMS);
}

/**
 * 清除所有历史记录
 * @returns {boolean}
 */
function clearHistory() {
  safeSetJSON(STORAGE_KEYS.HISTORY, []);
  return true;
}

/* ==========================================================================
 * 9. 设置管理
 * ========================================================================== */

/**
 * 获取应用设置
 * @returns {{ provider: string, apiKey: string, model: string, temperature: number, maxTokens: number }}
 */
function getSettings() {
  return safeGetJSON(STORAGE_KEYS.SETTINGS, {
    provider: 'anthropic',     // 'anthropic' | 'openai' | 'deepseek' | 'custom'
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 2048,
  });
}

/**
 * 保存应用设置
 * @param {object} settings - 部分或完整设置对象
 * @returns {boolean}
 */
function saveSettings(settings) {
  const current = getSettings();
  // 不可变：合并而不是修改
  const updated = { ...current, ...settings };
  return safeSetJSON(STORAGE_KEYS.SETTINGS, updated);
}

/* ==========================================================================
 * 10. 初始化
 * ========================================================================== */

/**
 * 应用启动时调用：运行迁移、确保数据模型就绪
 * @returns {{ profiles: object[], activeProfile: object|null, migrationResult: object }}
 */
function initProfileModule() {
  // 1. 运行数据迁移
  const migrationResult = migrateStorage();

  // 2. 确保至少有一个空数组
  const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);

  // 3. 如果没有背景档，创建默认的
  if (profiles.length === 0) {
    const defaultProfile = createEmptyProfile('默认背景档');
    defaultProfile.id = 'default'; // 使用固定id
    safeSetJSON(STORAGE_KEYS.PROFILES, [defaultProfile]);
    safeSetJSON(STORAGE_KEYS.ACTIVE_ID, 'default');
  }

  // 4. 确保活跃版本有效
  const activeId = safeGetJSON(STORAGE_KEYS.ACTIVE_ID, null);
  if (!activeId || !profiles.some((p) => p.id === activeId)) {
    safeSetJSON(STORAGE_KEYS.ACTIVE_ID, profiles[0].id);
  }

  const activeProfile = loadProfile();

  return {
    profiles: profiles.map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt })),
    activeProfile,
    migrationResult,
  };
}

/* ==========================================================================
 * 11. 模块导出（用于单文件HTML中的模块化引用）
 * ========================================================================== */

// 对外暴露全局 API
window.ProfileModule = {
  // 初始化
  init: initProfileModule,
  migrateStorage,

  // CRUD
  loadProfile,
  saveProfile,
  createProfileVersion,
  switchProfile,
  deleteProfile,
  listProfiles,
  createEmptyProfile,

  // 隐私
  sanitizeForAI,
  PRIVACY,

  // 验证
  validateProfile,
  checkLimits,
  FIELD_LIMITS,

  // 摘要
  generateSummary,

  // 存储管理
  getStorageUsage,
  clearAllData,
  exportAllData,
  importAllData,

  // 历史
  addHistory,
  getHistory,
  clearHistory,

  // 设置
  getSettings,
  saveSettings,

  // 常量
  STORAGE_KEYS,
  MAX_PROFILE_VERSIONS,
  MAX_HISTORY_ITEMS,
  CURRENT_SCHEMA_VERSION,
};

// 控制台友好提示
console.log(
  '%c[ProfileModule] %c已就绪 %cv' + CURRENT_SCHEMA_VERSION +
  ' %c| %cP0字段(name/phone)绝不会离开浏览器',
  'font-weight:bold;color:#4CAF50',
  'color:#888',
  'color:#888',
  'color:#888',
  'color:#FF9800'
);
