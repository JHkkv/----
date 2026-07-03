Page({
  data: {
    title: '', trackName: '', description: '', deadline: '',
    creating: false, list: []
  },

  onShow() { this.loadList() },

  onTitle(e) { this.setData({ title: e.detail.value }) },
  onTrack(e) { this.setData({ trackName: e.detail.value }) },
  onDesc(e) { this.setData({ description: e.detail.value }) },
  onDeadline(e) { this.setData({ deadline: e.detail.value }) },

  async create() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入作业标题', icon: 'none' })
      return
    }
    this.setData({ creating: true })
    const { result } = await wx.cloud.callFunction({
      name: 'createAssignment',
      data: {
        title: this.data.title,
        trackName: this.data.trackName,
        description: this.data.description,
        deadline: this.data.deadline
      }
    })
    if (result.code === 0) {
      wx.showToast({ title: '发布成功', icon: 'success' })
      this.setData({ title: '', trackName: '', description: '', deadline: '', creating: false })
      this.loadList()
    } else {
      wx.showToast({ title: result.msg || '发布失败', icon: 'none' })
      this.setData({ creating: false })
    }
  },

  async loadList() {
    const db = wx.cloud.database()
    const { data } = await db.collection('assignments').orderBy('createTime', 'desc').get()
    this.setData({
      list: data.map(item => ({
        ...item,
        createTimeText: item.createTime ? new Date(item.createTime).toLocaleDateString('zh-CN') : ''
      }))
    })
  }
})
