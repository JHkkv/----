Page({
  data: {
    assignmentId: '',
    trackName: '',
    selfReview: '',
    submitting: false,
    recordComplete: false
  },

  onLoad(options) {
    if (options.assignmentId) {
      this.setData({ assignmentId: options.assignmentId })
    }
  },

  onRecordComplete(e) {
    this.setData({ recordComplete: true })
  },

  onTrackInput(e) { this.setData({ trackName: e.detail.value }) },
  onReviewInput(e) { this.setData({ selfReview: e.detail.value }) },

  async submit() {
    if (!this.data.recordComplete) {
      wx.showToast({ title: '请先录制练习音频', icon: 'none' })
      return
    }
    if (!this.data.trackName.trim()) {
      wx.showToast({ title: '请输入练习曲目', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      const recorder = this.selectComponent('#recorder')
      const { fileId, duration } = await recorder.upload()

      await wx.cloud.callFunction({
        name: 'submitPractice',
        data: {
          assignmentId: this.data.assignmentId,
          audioFileId: fileId,
          audioDuration: duration,
          trackName: this.data.trackName,
          selfReview: this.data.selfReview
        }
      })

      wx.showToast({ title: '提交成功！', icon: 'success' })
      setTimeout(() => {
        recorder.reset()
        this.setData({ trackName: '', selfReview: '', submitting: false, recordComplete: false })
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
      this.setData({ submitting: false })
    }
  }
})
