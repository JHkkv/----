Page({
  data: { list: [], loading: true },

  onShow() {
    this.loadHistory()
  },

  async loadHistory() {
    this.setData({ loading: true })
    const { result } = await wx.cloud.callFunction({ name: 'getSubmissions' })
    if (result && result.data) {
      const list = result.data.map(item => ({
        ...item,
        submitTimeText: item.submitTime ? new Date(item.submitTime).toLocaleString('zh-CN') : ''
      }))
      this.setData({ list, loading: false })
    }
  },

  goPractice() {
    wx.navigateTo({ url: '/pages/student/practice/practice' })
  }
})
