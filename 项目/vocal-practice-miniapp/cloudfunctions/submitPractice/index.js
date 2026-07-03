const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { assignmentId, audioFileId, audioDuration, trackName, selfReview } = event

  // find student's teacher
  const { data: student } = await db.collection('users')
    .where({ _openid: wxContext.OPENID, role: 'student' }).get()

  if (!student.length) return { code: -1, msg: '未绑定老师' }

  const result = await db.collection('submissions').add({
    data: {
      studentId: wxContext.OPENID,
      teacherId: student[0].teacherId,
      assignmentId: assignmentId || '',
      audioFileId,
      audioDuration: audioDuration || 0,
      trackName: trackName || '',
      selfReview: selfReview || '',
      teacherFeedback: '',
      submitTime: db.serverDate()
    }
  })

  return { code: 0, data: result }
}
