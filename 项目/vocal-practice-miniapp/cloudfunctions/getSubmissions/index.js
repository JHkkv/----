const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { role, assignmentId, studentId } = event

  const { data: user } = await db.collection('users')
    .where({ _openid: wxContext.OPENID }).get()

  if (!user.length) return { code: -1, msg: '用户不存在' }

  let query = {}
  if (user[0].role === 'teacher') {
    query.teacherId = wxContext.OPENID
    if (assignmentId) query.assignmentId = assignmentId
    if (studentId) query.studentId = studentId
  } else {
    query.studentId = wxContext.OPENID
  }

  const { data: submissions } = await db.collection('submissions')
    .where(query)
    .orderBy('submitTime', 'desc')
    .get()

  // Get audio temp URLs
  for (let sub of submissions) {
    if (sub.audioFileId) {
      const res = await cloud.getTempFileURL({ fileList: [sub.audioFileId] })
      if (res.fileList[0]) sub.audioUrl = res.fileList[0].tempFileURL
    }
  }

  // Get student nicknames for teacher view
  if (user[0].role === 'teacher') {
    const studentIds = [...new Set(submissions.map(s => s.studentId))]
    if (studentIds.length) {
      const { data: students } = await db.collection('users')
        .where({ _openid: db.command.in(studentIds) }).get()
      const nameMap = {}
      students.forEach(s => { nameMap[s._openid] = s.nickName })
      submissions.forEach(s => { s.studentName = nameMap[s.studentId] || '未知' })
    }
  }

  return { code: 0, data: submissions }
}
