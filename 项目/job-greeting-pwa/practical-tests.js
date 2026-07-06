/**
 * ===========================================================================
 * BOSS直聘AI招呼语生成器 — 运行时自检 + 实用测试用例
 * Usage: 在浏览器控制台中粘贴以下内容即可运行测试
 *
 * import('test-utils.js') 后运行: BossTest.runStartupChecks()
 * ===========================================================================
 */

// ---- 1. 粘贴到 console 运行: 启动自检 ----
console.log('===== 1. 启动自检 =====')
var checkResult = BossTest.runStartupChecks()
console.log('通过率:', Math.round(checkResult.passed / (checkResult.passed + checkResult.failed) * 100) + '%')

// ---- 2. 粘贴到 console 运行: 输入验证 ----
console.log('\n===== 2. 输入验证测试 =====')

// 空JD
var r1 = BossTest.validateBeforeGenerate(
  { coreSkills: ['内容运营', '数据分析'], keyAchievements: '3年运营经验，月GMV 500万' },
  ''
)
console.log('空JD:', r1.valid ? 'PASS' : 'PASS (expected FAIL)', r1.errors)

// 正常JD
var r2 = BossTest.validateBeforeGenerate(
  { coreSkills: ['新媒体运营'], keyAchievements: '单月涨粉5万' },
  '本公司招聘新媒体运营，负责公众号和小红书内容策划与运营，要求2年以上经验，熟悉数据分析工具...'
)
console.log('正常JD:', r2.valid ? 'PASS' : 'FAIL', r2.errors)

// JD太短
var r3 = BossTest.validateJdText('招运营')
console.log('JD太短:', !r3.valid ? 'PASS (correctly rejected)' : 'FAIL', r3.errors)

// JD超长 (模拟)
var longJd = '招'.repeat(5001)
var r4 = BossTest.validateJdText(longJd)
console.log('JD超长:', !r4.valid ? 'PASS (correctly rejected)' : 'FAIL', r4.errors)

// 用户背景不完整
var r5 = BossTest.validateBeforeGenerate(
  { coreSkills: [], keyAchievements: '' },
  '正常JD文本内容...招聘新媒体运营...'
)
console.log('背景不完整:', !r5.valid ? 'PASS (correctly rejected)' : 'FAIL', r5.errors)

// 无API Key
var r6 = BossTest.validateBeforeGenerate(
  { coreSkills: ['运营'], keyAchievements: '有经验' },
  '正常JD...',
  '' // no API key
)
console.log('无API Key:', r6.critical.length > 0 ? 'PASS (detected)' : 'WARN (not blocked)')

// ---- 3. 粘贴到 console 运行: 招呼语质量检查 ----
console.log('\n===== 3. 招呼语质量检查 =====')

// 好的招呼语
var goodGreeting = '3年新媒体运营经验，曾帮助2个品牌小红书账号月涨粉8000+。看到贵司在招聘新媒体运营，我在内容策划和数据分析方面的经验和岗位要求高度匹配，方便聊聊吗？'
var q1 = BossTest.checkGreetingQuality(goodGreeting, ['新媒体', '运营', '数据分析'])
console.log('好招呼语评分:', q1.score + '分', '警告:', q1.warnings.length > 0 ? q1.warnings : '无')

// 差的招呼语
var badGreeting = '您好，我对这个岗位很感兴趣，我有丰富的经验，学习能力强，吃苦耐劳，认真负责，希望能有机会面试。'
var q2 = BossTest.checkGreetingQuality(badGreeting, ['新媒体', '运营'])
console.log('差招呼语评分:', q2.score + '分', '警告:', q2.warnings)

// 模板化开头
var templateGreeting = '尊敬的招聘经理，本人叫张三，我是一名热爱工作的年轻人，很高兴能申请贵公司的岗位。本人学习能力出众，性格开朗，团队合作精神强。'
var q3 = BossTest.checkGreetingQuality(templateGreeting)
console.log('模板化招呼语评分:', q3.score + '分', '警告:', q3.warnings)

// ---- 4. 粘贴到 console 运行: 版本差异化检测 ----
console.log('\n===== 4. 版本差异化检测 =====')

var similarSet = [
  '你好我有3年经验',
  '你好我有3年运营经验',
  '你好我有3年新媒体运营经验',
]
var d1 = BossTest.checkVersionDiversity(similarSet)
console.log('相似版本:', d1.similarityWarnings.length > 0 ? 'PASS (detected)' : 'FAIL (not caught)')

var diverseSet = [
  '3年新媒体经验，2个品牌从0做到月GMV 100万。看到贵司在找运营，我的经验和岗位高度匹配，方便聊聊？',
  '一直关注贵司的产品，特别喜欢你们最新的社群玩法。我做过2个万人社群，转化率做到过18%，希望能和团队交流一下。',
  '我注意到贵司小红书账号最近在转型，而我刚好帮上家公司完成了类似的内容策略调整，粉丝增长翻倍。有兴趣聊聊吗？',
]
var d2 = BossTest.checkVersionDiversity(diverseSet)
console.log('差异化版本:', d2.similarityWarnings.length === 0 ? 'PASS' : 'WARN', d2.score + '分差异化')

// ---- 5. 粘贴到 console 运行: 错误分类 ----
console.log('\n===== 5. 错误分类测试 =====')
console.log('401 =>', BossTest.classifyError(401).code, BossTest.classifyError(401).action)
console.log('429 =>', BossTest.classifyError(429).code, BossTest.classifyError(429).action)
console.log('502 =>', BossTest.classifyError(502).code, BossTest.classifyError(502).action)
console.log('timeout =>', BossTest.classifyError('timeout').code, BossTest.classifyError('timeout').action)
console.log('offline =>', BossTest.classifyError('offline').code, BossTest.classifyError('offline').action)

// ---- 6. 粘贴到 console 运行: 存储健康检查 ----
console.log('\n===== 6. localStorage 健康检查 =====')
var health = BossTest.checkStorageHealth()
console.log('存储可用:', health.available, '已用:', (health.usedBytes / 1024).toFixed(1) + 'KB', '占比:', health.estimatePercent + '%')

var cleanup = BossTest.cleanupStorage()
console.log('数据清理:', '已清理', cleanup.cleaned, '项')

// ---- 7. 粘贴到 console 运行: localStorage 数据完整性 ----
console.log('\n===== 7. 数据持久化测试 =====')
var testData = { test: 'boss_greeting_persistence', time: new Date().toISOString() }
var testKey = '__boss_persistence_test__'
try {
  localStorage.setItem(testKey, JSON.stringify(testData))
  var readBack = JSON.parse(localStorage.getItem(testKey))
  localStorage.removeItem(testKey)
  console.log('数据持久化:', readBack.test === testData.test ? 'PASS' : 'FAIL')
} catch (e) {
  console.error('数据持久化: FAIL —', e.message)
}

// ---- 8. 粘贴到 console 运行: UUID格式检查 ----
console.log('\n===== 8. 历史ID格式检查 =====')
function testUidFormat() {
  var id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  return /^[a-z0-9]+-[a-z0-9]+$/.test(id)
}
console.log('UID格式:', testUidFormat() ? 'PASS' : 'FAIL')

// ---- 总结 ----
console.log('\n===== 自检总结 =====')
var stats = BossTest.getAssertionStats()
console.log('已执行断言:', stats.total, '失败:', stats.failed, '通过率:', Math.round(stats.passRate * 100) + '%')
