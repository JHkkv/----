const app = getApp()

Page({
  data: { list: [], loading: true },

  onShow() {
    this.loadAssignments()
  },

  async loadAssignments() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    const teacherId = app.globalData.teacherId

    if (!teacherId) {
      const { result } = await wx.cloud.callFunction({ name: 'getUserInfo' })
      if (result && result.data) {
        app.globalData.teacherId = result.data.teacherId || ''
      }
    }

    const { data } = await db.collection('assignments')
      .where({ teacherId: app.globalData.teacherId })
      .orderBy('createTime', 'desc')
      .get()

    const list = data.map(item => ({
      ...item,
      createTimeText: item.createTime ? new Date(item.createTime).toLocaleDateString('zh-CN') : ''
    }))

    this.setData({ list, loading: false })
  },

  goPractice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/student/practice/practice?assignmentId=${id}` })
  }
})
