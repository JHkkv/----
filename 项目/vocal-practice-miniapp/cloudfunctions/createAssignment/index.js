const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { title, description, trackName, deadline } = event

  const { data: teacher } = await db.collection('users')
    .where({ _openid: wxContext.OPENID, role: 'teacher' }).get()

  if (!teacher.length) return { code: -1, msg: '无权限' }

  const result = await db.collection('assignments').add({
    data: {
      teacherId: wxContext.OPENID,
      title,
      description: description || '',
      trackName: trackName || '',
      deadline: deadline || '',
      createTime: db.serverDate()
    }
  })

  return { code: 0, data: result }
}
