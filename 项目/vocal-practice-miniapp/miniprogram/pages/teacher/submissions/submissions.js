Page({
  data: { list: [], loading: true },

  onShow() { this.loadSubmissions() },

  async loadSubmissions() {
    this.setData({ loading: true })
    const { result } = await wx.cloud.callFunction({ name: 'getSubmissions' })
    if (result && result.data) {
      const list = result.data.map(item => ({
        ...item,
        _feedbackInput: '',
        submitTimeText: item.submitTime ? new Date(item.submitTime).toLocaleString('zh-CN') : ''
      }))
      this.setData({ list, loading: false })
    }
  },

  onFeedbackInput(e) {
    const id = e.currentTarget.dataset.id
    const idx = this.data.list.findIndex(item => item._id === id)
    if (idx >= 0) {
      this.setData({ [`list[${idx}]._feedbackInput`]: e.detail.value })
    }
  },

  async submitFeedback(e) {
    const id = e.currentTarget.dataset.id
    const idx = e.currentTarget.dataset.idx
    const item = this.data.list[idx]
    if (!item._feedbackInput || !item._feedbackInput.trim()) {
      wx.showToast({ title: '请输入点评内容', icon: 'none' })
      return
    }
    const { result } = await wx.cloud.callFunction({
      name: 'submitFeedback',
      data: { submissionId: id, feedback: item._feedbackInput.trim() }
    })
    if (result.code === 0) {
      wx.showToast({ title: '点评已发送', icon: 'success' })
      this.setData({ [`list[${idx}].teacherFeedback`]: item._feedbackInput.trim(), [`list[${idx}]._feedbackInput`]: '' })
    } else {
      wx.showToast({ title: '发送失败', icon: 'none' })
    }
  }
})
