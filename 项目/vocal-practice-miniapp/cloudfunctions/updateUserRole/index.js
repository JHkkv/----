const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, nickName, inviteCode } = event

  const { data: existing } = await db.collection('users')
    .where({ _openid: wxContext.OPENID }).get()

  if (action === 'register_teacher') {
    const code = wxContext.OPENID.substring(0, 8).toUpperCase()
    const userData = {
      _openid: wxContext.OPENID,
      nickName: nickName || '老师',
      role: 'teacher',
      inviteCode: code,
      createTime: db.serverDate()
    }
    if (existing.length) {
      await db.collection('users').where({ _openid: wxContext.OPENID }).update({ data: userData })
    } else {
      await db.collection('users').add({ data: userData })
    }
    return { code: 0, data: { inviteCode: code } }
  }

  if (action === 'register_student') {
    // find teacher by invite code
    const { data: teachers } = await db.collection('users')
      .where({ inviteCode: inviteCode.toUpperCase(), role: 'teacher' }).get()

    if (!teachers.length) return { code: -1, msg: '邀请码无效，请检查后重试' }

    const userData = {
      _openid: wxContext.OPENID,
      nickName: nickName || '学生',
      role: 'student',
      teacherId: teachers[0]._openid,
      createTime: db.serverDate()
    }
    if (existing.length) {
      await db.collection('users').where({ _openid: wxContext.OPENID }).update({ data: userData })
    } else {
      await db.collection('users').add({ data: userData })
    }
    return { code: 0, data: { teacherName: teachers[0].nickName } }
  }

  return { code: -1, msg: '无效操作' }
}
