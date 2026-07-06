/**
 * ===========================================================================
 * BOSS直聘AI招呼语生成器 — 运行时测试工具模块
 * Runtime Test Utilities & Self-Checks
 *
 * 零依赖，可直接嵌入 <script> 标签使用
 * 包含：启动自检、运行时断言、输入验证、错误分类
 * ===========================================================================
 * @version 1.0.0
 */

;(function () {
  'use strict'

  // =========================================================================
  // 0. 常量
  // =========================================================================

  /** JD文本长度限制 */
  var JD_MIN_LENGTH = 20
  var JD_MAX_LENGTH = 5000

  /** 招呼语长度限制 */
  var GREETING_MIN_LENGTH = 50
  var GREETING_MAX_LENGTH = 200

  /** 历史记录最大条数 */
  var MAX_HISTORY = 20

  /** API 调用超时时间 (ms) */
  var API_TIMEOUT = 30000

  // =========================================================================
  // 1. 启动自检（应用初始化时运行）
  // =========================================================================

  /**
   * 运行所有启动检查项，结果输出到 console
   * @returns {{passed: number, failed: number, results: Array}}
   */
  function runStartupChecks() {
    var checks = [
      {
        name: 'localStorage 可用',
        fn: function () {
          var key = '__boss_test__'
          localStorage.setItem(key, 't')
          localStorage.removeItem(key)
          return true
        },
      },
      {
        name: 'Clipboard API 可用',
        fn: function () {
          return 'clipboard' in navigator
        },
      },
      {
        name: 'Service Worker 支持',
        fn: function () {
          return 'serviceWorker' in navigator
        },
      },
      {
        name: 'Fetch API 可用',
        fn: function () {
          return 'fetch' in window
        },
      },
      {
        name: 'CSS Grid 支持',
        fn: function () {
          return CSS.supports('display', 'grid')
        },
      },
      {
        name: 'CSS 自定义属性支持',
        fn: function () {
          return CSS.supports('--test', '0')
        },
      },
      {
        name: 'ES6 Promise 可用',
        fn: function () {
          return 'Promise' in window
        },
      },
      {
        name: 'JSON 解析可用',
        fn: function () {
          var obj = JSON.parse('{"a":1}')
          return obj.a === 1
        },
      },
      {
        name: 'Array.from 可用',
        fn: function () {
          return typeof Array.from === 'function'
        },
      },
      {
        name: 'Object.assign 可用',
        fn: function () {
          return typeof Object.assign === 'function'
        },
      },
    ]

    var passed = 0
    var failed = 0
    var results = []

    checks.forEach(function (check) {
      try {
        var ok = check.fn()
        results.push({
          name: check.name,
          passed: ok,
          message: ok ? 'OK' : 'NOT_SUPPORTED',
        })
        if (ok) {
          passed++
          console.log('[自检] ✅ ' + check.name)
        } else {
          failed++
          console.warn('[自检] ❌ ' + check.name + ' — 功能不可用')
        }
      } catch (e) {
        failed++
        results.push({
          name: check.name,
          passed: false,
          message: e.message,
        })
        console.error('[自检] ❌ ' + check.name + ': ' + e.message)
      }
    })

    console.log(
      '[自检] 完成 — ' +
        passed +
        ' 通过, ' +
        failed +
        ' 失败 (共 ' +
        (passed + failed) +
        ' 项)'
    )
    return { passed: passed, failed: failed, results: results }
  }

  // =========================================================================
  // 2. 运行时断言（开发/调试模式使用）
  // =========================================================================

  var assertionsFailed = 0
  var assertionsTotal = 0

  /**
   * 断言条件为真，失败时打印错误并计数
   * @param {boolean} condition
   * @param {string} message — 失败时的描述
   * @returns {boolean}
   */
  function assert(condition, message) {
    assertionsTotal++
    if (!condition) {
      assertionsFailed++
      console.error('[断言失败] #' + assertionsTotal + ': ' + (message || 'unknown'))
    }
    return condition
  }

  /**
   * 断言两个值相等
   * @param {*} actual
   * @param {*} expected
   * @param {string} message
   * @returns {boolean}
   */
  function assertEquals(actual, expected, message) {
    var ok = actual === expected
    if (!ok) {
      console.error(
        '[断言失败] ' +
          (message || '') +
          '\n  期望: ' +
          JSON.stringify(expected) +
          '\n  实际: ' +
          JSON.stringify(actual)
      )
    }
    assertionsTotal++
    if (!ok) assertionsFailed++
    return ok
  }

  /**
   * 断言对象包含指定字段
   * @param {Object} obj
   * @param {string[]} keys
   * @param {string} message
   * @returns {boolean}
   */
  function assertHasKeys(obj, keys, message) {
    assertionsTotal++
    var missing = keys.filter(function (k) {
      return !(k in obj)
    })
    if (missing.length > 0) {
      assertionsFailed++
      console.error(
        '[断言失败] ' +
          (message || '') +
          '\n  缺少字段: ' +
          missing.join(', ')
      )
      return false
    }
    return true
  }

  /**
   * 获取断言统计
   * @returns {{total: number, failed: number, passRate: number}}
   */
  function getAssertionStats() {
    return {
      total: assertionsTotal,
      failed: assertionsFailed,
      passRate: assertionsTotal > 0 ? (assertionsTotal - assertionsFailed) / assertionsTotal : 1,
    }
  }

  /**
   * 重置断言计数
   */
  function resetAssertions() {
    assertionsTotal = 0
    assertionsFailed = 0
  }

  // =========================================================================
  // 3. 用户输入验证（页面表单提交前调用）
  // =========================================================================

  /**
   * 验证用户背景表单
   * @param {{coreSkills: string[], keyAchievements: string, targetRole: string}} profile
   * @returns {{valid: boolean, errors: string[]}}
   */
  function validateUserProfile(profile) {
    var errors = []

    if (!profile.coreSkills || profile.coreSkills.length === 0) {
      errors.push('请至少填写 1 项核心技能')
    }
    if (!profile.keyAchievements || profile.keyAchievements.trim().length === 0) {
      errors.push('请填写关键经历数据（如工作年限、项目成果等）')
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    }
  }

  /**
   * 验证 JD 文本
   * @param {string} jdText
   * @returns {{valid: boolean, errors: string[]}}
   */
  function validateJdText(jdText) {
    var errors = []

    if (!jdText || jdText.trim().length === 0) {
      errors.push('请粘贴岗位JD文本')
    } else if (jdText.trim().length < JD_MIN_LENGTH) {
      errors.push('JD文本太短（至少' + JD_MIN_LENGTH + '字），请粘贴完整的岗位描述')
    }

    if (jdText && jdText.length > JD_MAX_LENGTH) {
      errors.push('JD文本过长（超过' + JD_MAX_LENGTH + '字），请精简后重试')
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    }
  }

  /**
   * 生成前的完整验证（用户背景 + JD）
   * @param {{coreSkills: string[], keyAchievements: string, targetRole: string}} profile
   * @param {string} jdText
   * @param {string} [apiKey] — 可选，检查API Key是否配置
   * @returns {{valid: boolean, errors: string[], critical: string[]}}
   */
  function validateBeforeGenerate(profile, jdText, apiKey) {
    var errors = []
    var critical = []

    // 用户背景验证
    var profileResult = validateUserProfile(profile)
    errors = errors.concat(profileResult.errors)

    // JD 验证
    var jdResult = validateJdText(jdText)
    errors = errors.concat(jdResult.errors)

    // API Key 检查
    if (apiKey !== undefined && apiKey.trim().length === 0) {
      critical.push('请先在设置中配置API Key')
    }

    return {
      valid: errors.length === 0 && critical.length === 0,
      errors: errors,
      critical: critical,
    }
  }

  // =========================================================================
  // 4. 招呼语质量即时检查（规则引擎，非AI评估）
  // =========================================================================

  /**
   * 检查单条招呼语质量
   * @param {string} text — 招呼语全文
   * @param {string[]} [jdKeywords] — 从JD提取的关键词
   * @returns {{score: number, failures: string[], warnings: string[]}}
   */
  function checkGreetingQuality(text, jdKeywords) {
    var failures = []
    var warnings = []

    if (!text || text.trim().length === 0) {
      return { score: 0, failures: ['招呼语为空'], warnings: [] }
    }

    // 1. 前20字检查（决定HR是否点开）
    var first20 = text.slice(0, 20)
    var templateStarts = [
      '您好', '尊敬的', '你好', '本人', '我叫', '我是',
      '打扰了', '冒昧', '很高兴', '感谢您',
    ]
    var hasTemplateStart = templateStarts.some(function (t) {
      return text.startsWith(t)
    })
    if (hasTemplateStart) {
      warnings.push('开头为模板句，HR可能跳过。建议用数字或JD关键词开头')
    }

    // 2. 数字/量化数据检查
    if (!/\d+/.test(text)) {
      warnings.push('缺少具体数字或量化数据，说服力不足')
    }

    // 3. 长度检查
    if (text.length < GREETING_MIN_LENGTH) {
      warnings.push('招呼语过短（' + text.length + '字），信息量不足')
    }
    if (text.length > GREETING_MAX_LENGTH) {
      warnings.push('招呼语过长（' + text.length + '字），HR可能读不完')
    }

    // 4. 空话检测
    var emptyPhrases = ['学习能力强', '吃苦耐劳', '认真负责', '性格开朗', '团队合作精神']
    var foundEmpty = emptyPhrases.filter(function (p) {
      return text.includes(p)
    })
    if (foundEmpty.length >= 2) {
      warnings.push('包含过多空话套话（' + foundEmpty.join(', ') + '），建议用具体实例代替')
    }

    // 5. JD关键词命中
    if (jdKeywords && jdKeywords.length > 0) {
      var hitCount = jdKeywords.filter(function (kw) {
        return text.indexOf(kw) !== -1
      }).length
      if (hitCount === 0) {
        warnings.push('未包含JD中的关键词，建议融入岗位描述中的具体术语')
      }
    }

    // 6. 结尾检查（是否包含行动引导）
    var hasCallToAction =
      /聊聊|交流|了解|面试|进一步|详谈/.test(text.slice(-20))
    if (!hasCallToAction) {
      warnings.push('结尾缺少行动引导，建议以"方便聊聊吗"等结尾')
    }

    // 评分：100 - 每项警告扣分
    var baseScore = 100
    var deductPerWarning = 15
    var deductPerFailure = 30
    var score = baseScore - warnings.length * deductPerWarning - failures.length * deductPerFailure
    score = Math.max(0, Math.min(100, score))

    return {
      score: score,
      failures: failures,
      warnings: warnings,
    }
  }

  /**
   * 批量检查3个版本的差异化程度
   * @param {string[]} greetings — 3个版本的招呼语
   * @returns {{score: number, similarityWarnings: string[]}}
   */
  function checkVersionDiversity(greetings) {
    if (!greetings || greetings.length < 2) {
      return { score: 100, similarityWarnings: [] }
    }

    var warnings = []
    var pairs = []

    for (var i = 0; i < greetings.length; i++) {
      for (var j = i + 1; j < greetings.length; j++) {
        var sim = simpleSimilarity(greetings[i], greetings[j])
        pairs.push({ i: i, j: j, similarity: sim })
        if (sim > 0.7) {
          warnings.push(
            '版本' + (i + 1) + '和版本' + (j + 1) + '过于相似（' +
            Math.round(sim * 100) + '%），风格差异不明显'
          )
        }
      }
    }

    var avgSim =
      pairs.length > 0
        ? pairs.reduce(function (s, p) { return s + p.similarity }, 0) / pairs.length
        : 0
    var score = Math.round((1 - avgSim) * 100)

    return {
      score: score,
      similarityWarnings: warnings,
    }
  }

  /**
   * 简单的文本相似度（基于 Jaccard 系数，用于快速检测）
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  function simpleSimilarity(a, b) {
    if (!a || !b) return 1
    var setA = wordSet(a)
    var setB = wordSet(b)
    var intersection = 0
    var union = Object.keys(setA).length + Object.keys(setB).length

    for (var key in setA) {
      if (setA.hasOwnProperty(key) && setB[key]) {
        intersection++
      }
    }

    var actualUnion = union - intersection
    if (actualUnion === 0) return 1
    return intersection / actualUnion
  }

  /**
   * 将文本转为词集合
   * @param {string} text
   * @returns {Object}
   */
  function wordSet(text) {
    var set = {}
    // 用2字滑动窗口提取词组
    for (var i = 0; i < text.length - 1; i++) {
      var bigram = text.slice(i, i + 2)
      set[bigram] = true
    }
    return set
  }

  // =========================================================================
  // 5. 错误处理分类器
  // =========================================================================

  /**
   * 所有可能的错误状态及其处理方式
   */
  var ERROR_HANDLERS = {
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络后重试',
      action: 'retry',
      icon: '📶',
    },
    API_KEY_MISSING: {
      code: 'API_KEY_MISSING',
      message: '请先在设置中配置API Key',
      action: 'goToSettings',
      icon: '🔑',
    },
    API_KEY_INVALID: {
      code: 'API_KEY_INVALID',
      message: 'API Key无效（401），请检查后重试',
      action: 'goToSettings',
      icon: '🔑',
    },
    API_RATE_LIMIT: {
      code: 'API_RATE_LIMIT',
      message: 'API调用频率过高（429），请稍后重试',
      action: 'wait',
      icon: '⏳',
    },
    API_QUOTA_EXCEEDED: {
      code: 'API_QUOTA_EXCEEDED',
      message: 'API余额不足，请充值或切换Provider',
      action: 'goToSettings',
      icon: '💰',
    },
    API_SERVER_ERROR: {
      code: 'API_SERVER_ERROR',
      message: 'API服务异常，请稍后重试',
      action: 'retry',
      icon: '🛠️',
    },
    EMPTY_RESPONSE: {
      code: 'EMPTY_RESPONSE',
      message: 'AI返回内容为空，请尝试精简JD文本后重试',
      action: 'retry',
      icon: '❓',
    },
    PARSE_ERROR: {
      code: 'PARSE_ERROR',
      message: 'AI响应格式异常，无法解析招呼语，请重试',
      action: 'retry',
      icon: '⚠️',
    },
    TIMEOUT: {
      code: 'TIMEOUT',
      message: '生成超时（超过' + (API_TIMEOUT / 1000) + '秒），请检查网络后重试',
      action: 'retry',
      icon: '⏰',
    },
    STORAGE_FULL: {
      code: 'STORAGE_FULL',
      message: '本地存储空间不足，请清理历史记录后重试',
      action: 'clearHistory',
      icon: '📁',
    },
    OFFLINE: {
      code: 'OFFLINE',
      message: '当前处于离线模式，无法生成新招呼语',
      action: 'retry',
      icon: '📴',
    },
    JD_TOO_SHORT: {
      code: 'JD_TOO_SHORT',
      message: 'JD文本太短（至少' + JD_MIN_LENGTH + '字），请粘贴完整的岗位描述',
      action: 'fixInput',
      icon: '📝',
    },
    JD_TOO_LONG: {
      code: 'JD_TOO_LONG',
      message: 'JD文本过长（超过' + JD_MAX_LENGTH + '字），请精简后重试',
      action: 'fixInput',
      icon: '📝',
    },
    PROFILE_INCOMPLETE: {
      code: 'PROFILE_INCOMPLETE',
      message: '请补充完整个人背景信息后再生成',
      action: 'fixInput',
      icon: '👤',
    },
  }

  /**
   * 根据 HTTP 状态码或错误类型返回对应的错误信息
   * @param {number|string} statusOrCode — HTTP状态码 或 'timeout'/'parse'/'offline'/'empty'
   * @returns {{code: string, message: string, action: string, icon: string}}
   */
  function classifyError(statusOrCode) {
    if (statusOrCode === 401) return ERROR_HANDLERS.API_KEY_INVALID
    if (statusOrCode === 429) return ERROR_HANDLERS.API_RATE_LIMIT
    if (statusOrCode === 402) return ERROR_HANDLERS.API_QUOTA_EXCEEDED
    if (statusOrCode >= 500) return ERROR_HANDLERS.API_SERVER_ERROR
    if (statusOrCode === 'timeout' || statusOrCode === 408) return ERROR_HANDLERS.TIMEOUT
    if (statusOrCode === 'parse') return ERROR_HANDLERS.PARSE_ERROR
    if (statusOrCode === 'offline') return ERROR_HANDLERS.OFFLINE
    if (statusOrCode === 'empty') return ERROR_HANDLERS.EMPTY_RESPONSE
    if (statusOrCode === 'storage_full') return ERROR_HANDLERS.STORAGE_FULL
    if (statusOrCode === 'key_missing') return ERROR_HANDLERS.API_KEY_MISSING
    // Default: network error
    return ERROR_HANDLERS.NETWORK_ERROR
  }

  /**
   * 包装 fetch 调用，添加超时和错误处理
   * @param {string} url
   * @param {Object} options
   * @param {number} [timeout=API_TIMEOUT]
   * @returns {Promise<Response>}
   */
  function fetchWithTimeout(url, options, timeout) {
    timeout = timeout || API_TIMEOUT

    return new Promise(function (resolve, reject) {
      var controller = new AbortController()
      var signal = controller.signal

      // 合并信号
      var mergedOptions = Object.assign({}, options, { signal: signal })

      var fetchPromise = fetch(url, mergedOptions)

      var timeoutId = setTimeout(function () {
        controller.abort()
        reject(new Error('timeout'))
      }, timeout)

      fetchPromise
        .then(function (response) {
          clearTimeout(timeoutId)
          resolve(response)
        })
        .catch(function (err) {
          clearTimeout(timeoutId)
          if (err.name === 'AbortError') {
            reject(new Error('timeout'))
          } else if (err instanceof TypeError) {
            reject(new Error('offline'))
          } else {
            reject(err)
          }
        })
    })
  }

  // =========================================================================
  // 6. localStorage 健康检查
  // =========================================================================

  /**
   * 检查 localStorage 使用情况
   * @returns {{available: boolean, usedBytes: number, estimatePercent: number}}
   */
  function checkStorageHealth() {
    var result = { available: true, usedBytes: 0, estimatePercent: 0 }

    try {
      var total = ''
      for (var i = 0; i < Object.keys(localStorage).length; i++) {
        var key = Object.keys(localStorage)[i]
        total += key + localStorage.getItem(key)
      }
      result.usedBytes = total.length * 2 // UTF-16, ~2 bytes per char

      // 估算：大多数浏览器限制 5MB
      var ESTIMATED_LIMIT = 5 * 1024 * 1024
      result.estimatePercent = Math.round((result.usedBytes / ESTIMATED_LIMIT) * 100)
    } catch (e) {
      result.available = false
    }

    return result
  }

  /**
   * 清理 local storage 中的孤立或损坏数据
   * @returns {{cleaned: number, errors: string[]}}
   */
  function cleanupStorage() {
    var cleaned = 0
    var errors = []

    var knownKeys = [
      'app_profiles',
      'app_active_profile_id',
      'app_settings',
      'app_history',
      'app_schema_version',
      'boss_greeting_history',
    ]

    // 检查已知key的JSON有效性
    knownKeys.forEach(function (key) {
      try {
        var raw = localStorage.getItem(key)
        if (raw) {
          JSON.parse(raw)
        }
      } catch (e) {
        // 损坏数据，尝试移除
        try {
          localStorage.removeItem(key)
          cleaned++
          errors.push('已清理损坏数据: ' + key)
        } catch (e2) {
          errors.push('无法清理: ' + key)
        }
      }
    })

    return { cleaned: cleaned, errors: errors }
  }

  // =========================================================================
  // 7. 导出到全局
  // =========================================================================

  var api = {
    // 启动自检
    runStartupChecks: runStartupChecks,

    // 断言
    assert: assert,
    assertEquals: assertEquals,
    assertHasKeys: assertHasKeys,
    getAssertionStats: getAssertionStats,
    resetAssertions: resetAssertions,

    // 验证
    validateUserProfile: validateUserProfile,
    validateJdText: validateJdText,
    validateBeforeGenerate: validateBeforeGenerate,

    // 质量检查
    checkGreetingQuality: checkGreetingQuality,
    checkVersionDiversity: checkVersionDiversity,

    // 错误处理
    ERROR_HANDLERS: ERROR_HANDLERS,
    classifyError: classifyError,
    fetchWithTimeout: fetchWithTimeout,

    // 存储
    checkStorageHealth: checkStorageHealth,
    cleanupStorage: cleanupStorage,

    // 常量
    JD_MIN_LENGTH: JD_MIN_LENGTH,
    JD_MAX_LENGTH: JD_MAX_LENGTH,
    GREETING_MIN_LENGTH: GREETING_MIN_LENGTH,
    GREETING_MAX_LENGTH: GREETING_MAX_LENGTH,
    MAX_HISTORY: MAX_HISTORY,
    API_TIMEOUT: API_TIMEOUT,
  }

  // 挂载到 window
  if (typeof window !== 'undefined') {
    window.BossTest = api
  }

  // 同时支持 CommonJS 和 ES Module
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api
  }
})()
