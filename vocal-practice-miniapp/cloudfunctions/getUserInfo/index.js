const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { data: users } = await db.collection('users')
    .where({ _openid: wxContext.OPENID }).get()

  if (!users.length) return { code: 0, data: null }

  const user = users[0]
  // if student, get teacher name
  if (user.role === 'student' && user.teacherId) {
    const { data: teachers } = await db.collection('users')
      .where({ _openid: user.teacherId }).get()
    user.teacherName = teachers.length ? teachers[0].nickName : ''
  }

  return { code: 0, data: user }
}
