/**
 * BOSS直聘AI招呼语生成器 — 招呼语展示、复制、历史记录模块
 * 可直接嵌入 <script> 标签，无外部依赖
 * @version 1.0.0
 */

;(function () {
  'use strict'

  // =========================================================================
  // 常量
  // =========================================================================

  /** 历史记录最大条数 */
  var MAX_HISTORY = 20

  /** localStorage 键名 */
  var STORAGE_KEY = 'boss_greeting_history'

  /** 复制成功提示恢复延时 (ms) */
  var COPY_FEEDBACK_DURATION = 1500

  /** 流式渲染 token 累积阈值（减少 DOM 操作频率） */
  var STREAM_FLUSH_INTERVAL = 80

  /** 招呼语长度限制 */
  var MIN_LENGTH = 50
  var MAX_LENGTH = 200

  // =========================================================================
  // 工具函数
  // =========================================================================

  /**
   * 安全解析 JSON，失败返回 fallback
   * @param {string} str
   * @param {*} fallback
   * @returns {*}
   */
  function safeParse(str, fallback) {
    try {
      return JSON.parse(str)
    } catch (_) {
      return fallback
    }
  }

  /**
   * 生成简短唯一 ID
   * @returns {string}
   */
  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  }

  /**
   * 截断文本并添加省略号
   * @param {string} text
   * @param {number} maxLen
   * @returns {string}
   */
  function truncate(text, maxLen) {
    if (!text) return ''
    return text.length <= maxLen ? text : text.slice(0, maxLen) + '...'
  }

  /**
   * 格式化 ISO 时间为可读中文
   * @param {string} isoString
   * @returns {string}
   */
  function formatTime(isoString) {
    var d = new Date(isoString)
    var pad = function (n) {
      return n < 10 ? '0' + n : '' + n
    }
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    )
  }

  // =========================================================================
  // 1. 招呼语渲染
  // =========================================================================

  /**
   * 策略对应的颜色主题
   */
  var STRATEGY_THEMES = {
    数字钩子: { bg: '#eef2ff', text: '#4338ca', icon: '#' },
    匹配钩子: { bg: '#ecfdf5', text: '#047857', icon: '' },
    反模板钩子: { bg: '#fef9c3', text: '#a16207', icon: '' },
    痛点钩子: { bg: '#fce7f3', text: '#be185d', icon: '' },
    成果钩子: { bg: '#e0f2fe', text: '#0369a1', icon: '' },
    默认: { bg: '#f3f4f6', text: '#374151', icon: '' },
  }

  /**
   * 获取策略主题（找不到时回退到默认）
   * @param {string} strategy
   * @returns {{bg:string, text:string, icon:string}}
   */
  function getStrategyTheme(strategy) {
    return STRATEGY_THEMES[strategy] || STRATEGY_THEMES['默认']
  }

  /**
   * 将 AI 生成的 3 个版本招呼语渲染为卡片
   * @param {Array} greetings — [{version, strategy, text, strategyDesc}]
   * @param {HTMLElement} container — 渲染目标容器
   */
  function renderGreetings(greetings, container) {
    if (!container) {
      console.error('[招呼语渲染] container 不存在')
      return
    }

    // 清空容器
    container.innerHTML = ''

    if (!greetings || greetings.length === 0) {
      container.innerHTML =
        '<p class="greeting-empty">暂无生成的招呼语，请先填写岗位信息并点击生成</p>'
      return
    }

    greetings.forEach(function (g, index) {
      var card = buildGreetingCard(g, index)
      container.appendChild(card)
      // 错开入场动画
      card.style.animationDelay = index * 0.1 + 's'
    })
  }

  /**
   * 构建单张招呼语卡片
   * @param {Object} greeting
   * @param {number} index
   * @returns {HTMLElement}
   */
  function buildGreetingCard(greeting, index) {
    var theme = getStrategyTheme(greeting.strategy)

    var card = document.createElement('div')
    card.className = 'greeting-card fade-in'
    card.setAttribute('data-version', greeting.version)

    // 卡片头部：版本编号 + 策略标签
    var header = document.createElement('div')
    header.className = 'greeting-card__header'

    var versionBadge = document.createElement('span')
    versionBadge.className = 'greeting-card__version'
    versionBadge.textContent = '版本 ' + greeting.version
    header.appendChild(versionBadge)

    var strategyTag = document.createElement('span')
    strategyTag.className = 'greeting-card__strategy'
    strategyTag.textContent = greeting.strategy
    strategyTag.style.backgroundColor = theme.bg
    strategyTag.style.color = theme.text
    header.appendChild(strategyTag)

    card.appendChild(header)

    // 策略说明
    if (greeting.strategyDesc) {
      var strategyDesc = document.createElement('p')
      strategyDesc.className = 'greeting-card__strategy-desc'
      strategyDesc.textContent = greeting.strategyDesc
      card.appendChild(strategyDesc)
    }

    // 招呼语文案
    var body = document.createElement('div')
    body.className = 'greeting-card__body'
    var textEl = document.createElement('p')
    textEl.className = 'greeting-card__text'
    textEl.textContent = greeting.text
    body.appendChild(textEl)
    card.appendChild(body)

    // 底部操作栏
    var footer = document.createElement('div')
    footer.className = 'greeting-card__footer'

    // 质量评分
    var quality = checkGreetingQuality(greeting.text, greeting.jdKeywords || [])
    var scoreEl = document.createElement('span')
    scoreEl.className = 'greeting-card__score'
    scoreEl.textContent =
      '质量评分 ' + Math.round(quality.score * 100) + '分'
    scoreEl.title = quality.suggestion
    footer.appendChild(scoreEl)

    // 复制按钮
    var copyBtn = document.createElement('button')
    copyBtn.className = 'greeting-card__copy-btn'
    copyBtn.textContent = '复制文案'
    copyBtn.type = 'button'
    copyBtn.addEventListener('click', function () {
      copyToClipboard(greeting.text, copyBtn)
    })
    footer.appendChild(copyBtn)

    card.appendChild(footer)

    return card
  }

  // =========================================================================
  // 2. 复制到剪贴板
  // =========================================================================

  /**
   * 复制文本到剪贴板（现代 API + execCommand 降级）
   * @param {string} text — 要复制的文本
   * @param {HTMLElement} buttonElement — 触发按钮（用于反馈状态切换）
   */
  function copyToClipboard(text, buttonElement) {
    if (!text) return

    var fallbackCopy = function () {
      var textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.top = '-9999px'
      textarea.style.left = '-9999px'
      textarea.style.opacity = '0'
      textarea.setAttribute('readonly', '')
      document.body.appendChild(textarea)

      // iOS 兼容：选中范围
      textarea.contentEditable = 'true'
      textarea.readOnly = false

      var range = document.createRange()
      range.selectNodeContents(textarea)

      var selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
      textarea.setSelectionRange(0, text.length)

      var success = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (success) {
        updateCopyButton(buttonElement, 'success')
      } else {
        updateCopyButton(buttonElement, 'fail')
      }
    }

    // 方案 1：navigator.clipboard（需要安全上下文）
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          updateCopyButton(buttonElement, 'success')
        })
        .catch(function () {
          fallbackCopy()
        })
    } else {
      fallbackCopy()
    }
  }

  /**
   * 更新复制按钮反馈状态
   * @param {HTMLElement} btn
   * @param {'success'|'fail'} state
   */
  function updateCopyButton(btn, state) {
    if (!btn) return

    // 如果已有定时器则清除（防止重复点击冲突）
    var existingTimer = btn.getAttribute('data-copy-timer')
    if (existingTimer) {
      clearTimeout(parseInt(existingTimer, 10))
    }

    var originalText = btn.getAttribute('data-original-text') || '复制文案'
    // 首次记录原始文案
    if (!btn.getAttribute('data-original-text')) {
      btn.setAttribute('data-original-text', btn.textContent)
    }

    if (state === 'success') {
      btn.textContent = '已复制 ✓'
      btn.classList.add('greeting-card__copy-btn--success')
      btn.disabled = true

      var timer = setTimeout(function () {
        btn.textContent = originalText
        btn.classList.remove('greeting-card__copy-btn--success')
        btn.disabled = false
        btn.removeAttribute('data-copy-timer')
      }, COPY_FEEDBACK_DURATION)

      btn.setAttribute('data-copy-timer', '' + timer)
    } else {
      btn.textContent = '复制失败，请手动选择'
      btn.classList.add('greeting-card__copy-btn--fail')

      var failTimer = setTimeout(function () {
        btn.textContent = originalText
        btn.classList.remove('greeting-card__copy-btn--fail')
        btn.disabled = false
        btn.removeAttribute('data-copy-timer')
      }, COPY_FEEDBACK_DURATION)

      btn.setAttribute('data-copy-timer', '' + failTimer)
    }
  }

  // =========================================================================
  // 3. 历史记录管理
  // =========================================================================

  /**
   * 从 localStorage 读取历史记录
   * @returns {Array}
   */
  function getHistory() {
    var raw = localStorage.getItem(STORAGE_KEY)
    return safeParse(raw, [])
  }

  /**
   * 将历史记录写入 localStorage
   * @param {Array} history
   */
  function saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (e) {
      console.warn('[历史记录] localStorage 写入失败，可能已满', e)
      // 空间不足时移除最旧记录再试一次
      if (e.name === 'QuotaExceededError' && history.length > 1) {
        history.pop()
        saveHistory(history)
      }
    }
  }

  /**
   * 添加一条生成记录到历史
   * @param {Object} record
   * @param {string} record.id — 时间戳 ID
   * @param {Array}  record.greetings — 生成的招呼语数组
   * @param {string} record.jdPreview — 岗位描述前50字
   * @param {string} record.profileName — 使用的个人档案名
   * @param {string} record.timestamp — ISO 时间字符串
   * @param {string} record.provider — AI 供应商 (deepseek/openai/qwen)
   * @param {string} [record.jdKeywords] — 提取的JD关键词
   */
  function addToHistory(record) {
    if (!record || !record.greetings) {
      console.warn('[历史记录] 无效记录，跳过')
      return
    }

    var history = getHistory()

    // 添加必要字段的默认值
    var entry = {
      id: record.id || uid(),
      greetings: record.greetings || [],
      jdPreview: truncate(record.jdPreview || '', 50),
      profileName: record.profileName || '默认',
      timestamp: record.timestamp || new Date().toISOString(),
      provider: record.provider || 'unknown',
      jdKeywords: record.jdKeywords || [],
    }

    // 前置插入（最新在前）
    history.unshift(entry)

    // 超出上限则裁剪
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY)
    }

    saveHistory(history)
  }

  /**
   * 删除指定 ID 的历史记录
   * @param {string} id
   */
  function deleteHistoryItem(id) {
    if (!id) return
    var history = getHistory()
    var filtered = history.filter(function (item) {
      return item.id !== id
    })
    if (filtered.length !== history.length) {
      saveHistory(filtered)
    }
  }

  /**
   * 清空全部历史记录
   */
  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 渲染历史记录面板
   * @param {HTMLElement} container
   */
  function renderHistory(container) {
    if (!container) {
      console.error('[历史记录] container 不存在')
      return
    }

    var history = getHistory()

    // 清空
    container.innerHTML = ''

    if (history.length === 0) {
      container.innerHTML =
        '<p class="history-empty">暂无历史记录<br><small>生成招呼语后会自动保存在这里</small></p>'
      return
    }

    // 工具栏
    var toolbar = document.createElement('div')
    toolbar.className = 'history-toolbar'

    var countLabel = document.createElement('span')
    countLabel.className = 'history-toolbar__count'
    countLabel.textContent = '共 ' + history.length + ' 条记录'
    toolbar.appendChild(countLabel)

    var clearBtn = document.createElement('button')
    clearBtn.className = 'history-toolbar__clear-btn'
    clearBtn.textContent = '清空历史'
    clearBtn.type = 'button'
    clearBtn.addEventListener('click', function () {
      if (confirm('确定清空全部历史记录？此操作不可撤销。')) {
        clearHistory()
        renderHistory(container)
      }
    })
    toolbar.appendChild(clearBtn)

    container.appendChild(toolbar)

    // 列表
    var list = document.createElement('ul')
    list.className = 'history-list'

    history.forEach(function (record) {
      var item = buildHistoryItem(record)
      list.appendChild(item)
    })

    container.appendChild(list)
  }

  /**
   * 构建单条历史记录 DOM
   * @param {Object} record
   * @returns {HTMLElement}
   */
  function buildHistoryItem(record) {
    var li = document.createElement('li')
    li.className = 'history-item'
    li.setAttribute('data-id', record.id)

    // 摘要行（始终可见）
    var summaryRow = document.createElement('div')
    summaryRow.className = 'history-item__summary'

    var meta = document.createElement('div')
    meta.className = 'history-item__meta'

    var timeSpan = document.createElement('span')
    timeSpan.className = 'history-item__time'
    timeSpan.textContent = formatTime(record.timestamp)
    meta.appendChild(timeSpan)

    var profileSpan = document.createElement('span')
    profileSpan.className = 'history-item__profile'
    profileSpan.textContent = '档案: ' + record.profileName
    meta.appendChild(profileSpan)

    var providerSpan = document.createElement('span')
    providerSpan.className = 'history-item__provider'
    providerSpan.textContent = record.provider
    meta.appendChild(providerSpan)

    summaryRow.appendChild(meta)

    var jdPreviewEl = document.createElement('p')
    jdPreviewEl.className = 'history-item__jd-preview'
    jdPreviewEl.textContent = 'JD: ' + record.jdPreview
    summaryRow.appendChild(jdPreviewEl)

    // 展开/收起按钮
    var toggleBtn = document.createElement('button')
    toggleBtn.className = 'history-item__toggle'
    toggleBtn.textContent = '展开'
    toggleBtn.type = 'button'
    summaryRow.appendChild(toggleBtn)

    li.appendChild(summaryRow)

    // 详情区域（默认折叠）
    var detail = document.createElement('div')
    detail.className = 'history-item__detail'
    detail.style.display = 'none'

    record.greetings.forEach(function (g) {
      var block = document.createElement('div')
      block.className = 'history-item__greeting'

      var header = document.createElement('div')
      header.className = 'history-item__greeting-header'

      var versionSpan = document.createElement('span')
      versionSpan.textContent = 'v' + g.version + ' ' + g.strategy
      header.appendChild(versionSpan)

      var recopyBtn = document.createElement('button')
      recopyBtn.className = 'history-item__recopy-btn'
      recopyBtn.textContent = '复制'
      recopyBtn.type = 'button'
      recopyBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        copyToClipboard(g.text, recopyBtn)
      })
      header.appendChild(recopyBtn)

      block.appendChild(header)

      var textP = document.createElement('p')
      textP.className = 'history-item__greeting-text'
      textP.textContent = g.text
      block.appendChild(textP)

      detail.appendChild(block)
    })

    // 删除按钮
    var deleteBtn = document.createElement('button')
    deleteBtn.className = 'history-item__delete-btn'
    deleteBtn.textContent = '删除此记录'
    deleteBtn.type = 'button'
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation()
      if (confirm('确定删除这条记录？')) {
        deleteHistoryItem(record.id)
        li.style.transition = 'opacity 0.25s, transform 0.25s'
        li.style.opacity = '0'
        li.style.transform = 'translateX(20px)'
        setTimeout(function () {
          li.remove()
          // 如果删光了，重新渲染以显示空状态
          if (getHistory().length === 0) {
            var container = li.closest('.history-container')
            if (container) renderHistory(container)
          }
          // 更新计数
          var countEl = document.querySelector('.history-toolbar__count')
          if (countEl) {
            countEl.textContent = '共 ' + getHistory().length + ' 条记录'
          }
        }, 260)
      }
    })
    detail.appendChild(deleteBtn)

    li.appendChild(detail)

    // 展开/收起逻辑
    var isExpanded = false
    toggleBtn.addEventListener('click', function () {
      isExpanded = !isExpanded
      detail.style.display = isExpanded ? 'block' : 'none'
      toggleBtn.textContent = isExpanded ? '收起' : '展开'
      li.classList.toggle('history-item--expanded', isExpanded)
    })

    return li
  }

  // =========================================================================
  // 4. 招呼语质量即时反馈
  // =========================================================================

  /**
   * 检查招呼语质量并给出评分与建议
   * @param {string} text — 招呼语全文
   * @param {string[]} [jdKeywords] — JD 中提取的关键词
   * @returns {{score:number, checks:Object, suggestion:string}}
   */
  function checkGreetingQuality(text, jdKeywords) {
    if (!text) {
      return {
        score: 0,
        checks: {},
        suggestion: '无法检测空招呼语',
      }
    }

    var keywords = jdKeywords || []

    // 前 20 字是否包含钩子开头
    var first20 = text.slice(0, 20)
    var hasHook =
      /^\d/.test(first20) ||
      /看到贵司|曾帮|一直|我知道|注意|恭喜|发现/.test(first20)

    // 是否包含数字
    var hasNumber = /\d+/.test(text)

    // 避免模板化开头
    var noTemplateStart =
      !text.startsWith('您好') &&
      !text.startsWith('尊敬的') &&
      !text.startsWith('你好') &&
      !text.startsWith('本人')

    // 长度适中
    var withinLength = text.length >= MIN_LENGTH && text.length <= MAX_LENGTH

    // JD 关键词命中（如果有的话）
    var hasJDKeyword = true
    var hitCount = 0
    if (keywords.length > 0) {
      hitCount = keywords.filter(function (kw) {
        return text.indexOf(kw) !== -1
      }).length
      hasJDKeyword = hitCount >= Math.min(1, Math.floor(keywords.length * 0.3))
    }

    var checks = {
      hasHook: hasHook,
      hasNumber: hasNumber,
      noTemplateStart: noTemplateStart,
      withinLength: withinLength,
      hasJDKeyword: hasJDKeyword,
      keywordHitCount: hitCount,
    }

    // 加权评分
    var weights = {
      hasHook: 0.3,
      hasNumber: 0.15,
      noTemplateStart: 0.25,
      withinLength: 0.15,
      hasJDKeyword: 0.15,
    }
    var score = 0
    Object.keys(weights).forEach(function (key) {
      if (checks[key]) score += weights[key]
    })

    return {
      score: Math.min(score, 1),
      checks: checks,
      suggestion: generateSuggestion(checks),
    }
  }

  /**
   * 根据检查结果生成中文优化建议
   * @param {Object} checks
   * @returns {string}
   */
  function generateSuggestion(checks) {
    if (!checks.hasHook) {
      return '前20字可以更有冲击力，试试把数字或亮点放在最前面'
    }
    if (!checks.hasNumber) {
      return '加入具体数字会更有说服力，比如"帮3个品牌从0做到月销100万"'
    }
    if (!checks.noTemplateStart) {
      return '避免用"您好""尊敬的"开头，HR每天看到太多这种开头了'
    }
    if (!checks.withinLength) {
      return '建议控制在50-200字之间，太短没信息量，太长HR看不完'
    }
    if (!checks.hasJDKeyword) {
      return '试试融入岗位描述中的关键词，让HR觉得你认真看过JD'
    }
    return '招呼语质量良好，可以直接使用'
  }

  // =========================================================================
  // 5. 流式显示（打字机效果）
  // =========================================================================

  /**
   * 流式显示 AI 生成的文本
   * @constructor
   * @param {HTMLElement} container — 显示容器
   */
  function StreamingDisplay(container) {
    this.container = container
    this.buffer = ''
    this.renderedLength = 0
    this.lastFlushTime = 0
    this.timer = null
    this.isRunning = false
    this._cursorEl = null
  }

  /**
   * 追加一个 token 到缓冲区
   * @param {string} token
   */
  StreamingDisplay.prototype.appendToken = function (token) {
    if (!this.isRunning) return

    this.buffer += token
    var now = Date.now()

    // 节流：每隔 STREAM_FLUSH_INTERVAL ms 才更新一次 DOM
    if (now - this.lastFlushTime >= STREAM_FLUSH_INTERVAL) {
      this._flush()
      this.lastFlushTime = now
    }
  }

  /**
   * 将缓冲区内容写入 DOM
   */
  StreamingDisplay.prototype._flush = function () {
    if (!this.container || this.buffer.length <= this.renderedLength) return

    var newText = this.buffer.slice(this.renderedLength)
    this.renderedLength = this.buffer.length

    // 追加到容器（使用 textContent 防止 XSS）
    var fragment = document.createDocumentFragment()
    var span = document.createElement('span')
    span.textContent = newText
    fragment.appendChild(span)

    // 保持光标在末尾
    if (this._cursorEl) {
      this.container.insertBefore(fragment, this._cursorEl)
    } else {
      this.container.appendChild(fragment)
    }
  }

  /**
   * 开始流式显示
   */
  StreamingDisplay.prototype.start = function () {
    if (this.isRunning) return

    this.isRunning = true
    this.buffer = ''
    this.renderedLength = 0
    this.lastFlushTime = 0

    if (this.container) {
      this.container.innerHTML = ''

      // 添加闪烁光标
      var cursor = document.createElement('span')
      cursor.className = 'streaming-cursor'
      cursor.textContent = '|'
      this._cursorEl = cursor
      this.container.appendChild(cursor)
    }
  }

  /**
   * 流式完成，展示完整结果
   * 返回组装好的完整文本
   * @returns {string}
   */
  StreamingDisplay.prototype.finalize = function () {
    this.isRunning = false

    // 最后 flush 一次确保所有内容都显示
    this._flush()

    // 移除光标
    if (this._cursorEl) {
      this._cursorEl.remove()
      this._cursorEl = null
    }

    return this.buffer
  }

  /**
   * 中断流式显示
   */
  StreamingDisplay.prototype.abort = function () {
    this.isRunning = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this._cursorEl) {
      this._cursorEl.remove()
      this._cursorEl = null
    }
  }

  // =========================================================================
  // 导出到全局
  // =========================================================================

  var api = {
    // 渲染
    renderGreetings: renderGreetings,

    // 复制
    copyToClipboard: copyToClipboard,

    // 历史
    getHistory: getHistory,
    addToHistory: addToHistory,
    deleteHistoryItem: deleteHistoryItem,
    clearHistory: clearHistory,
    renderHistory: renderHistory,

    // 质量
    checkGreetingQuality: checkGreetingQuality,

    // 流式
    StreamingDisplay: StreamingDisplay,

    // 常量
    MAX_HISTORY: MAX_HISTORY,
  }

  // 挂载到 window
  if (typeof window !== 'undefined') {
    window.BossGreeting = api
  }

  // 同时支持 CommonJS 和 ES Module
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api
  }
})()
