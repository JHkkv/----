const app = getApp()

Page({
  data: { inviteCode: '', list: [] },

  async onShow() {
    const db = wx.cloud.database()

    // Get teacher's invite code
    const { result } = await wx.cloud.callFunction({ name: 'getUserInfo' })
    if (result && result.data) {
      this.setData({ inviteCode: result.data.inviteCode || '' })
    }

    // Get students
    const { data } = await db.collection('users')
      .where({ role: 'student', teacherId: app.globalData.teacherId || (result && result.data && result.data._openid) })
      .get()

    this.setData({
      list: data.map(s => ({
        ...s,
        avatarText: (s.nickName || '学')[0],
        createTimeText: s.createTime ? new Date(s.createTime).toLocaleDateString('zh-CN') : ''
      }))
    })
  }
})
