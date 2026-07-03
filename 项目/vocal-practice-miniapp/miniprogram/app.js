App({
  onLaunch() {
    wx.cloud.init({ env: 'cloud1-d7g58rj8o2f4ffec4', traceUser: true })
  },

  globalData: {
    userInfo: null,
    userRole: '',
    teacherId: ''
  }
})
