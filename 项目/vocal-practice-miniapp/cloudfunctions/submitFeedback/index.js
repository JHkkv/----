const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { submissionId, feedback } = event

  const { data: user } = await db.collection('users')
    .where({ _openid: wxContext.OPENID, role: 'teacher' }).get()

  if (!user.length) return { code: -1, msg: '无权限' }

  await db.collection('submissions').doc(submissionId).update({
    data: { teacherFeedback: feedback }
  })

  return { code: 0 }
}
