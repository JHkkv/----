const app = getApp()

Page({
  data: {
    hasRole: false,
    role: '',
    nickName: '',
    inviteCode: '',
    teacherName: '',
    showTeacherModal: false,
    showStudentModal: false,
    teacherNameInput: '',
    studentNameInput: '',
    inviteInput: ''
  },

  onShow() {
    this.loadUser()
  },

  async loadUser() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'getUserInfo' })
      if (result && result.data) {
        const u = result.data
        this.setData({
          hasRole: true,
          role: u.role,
          nickName: u.nickName,
          inviteCode: u.inviteCode || '',
          teacherName: u.teacherName || ''
        })
        app.globalData.userRole = u.role
        app.globalData.teacherId = u.role === 'student' ? u.teacherId : ''
      }
    } catch (err) {
      console.error('loadUser failed:', err)
    }
  },

  showTeacherModal() {
    this.setData({ showTeacherModal: true })
  },

  showStudentModal() {
    this.setData({ showStudentModal: true })
  },

  hideModals() {
    this.setData({ showTeacherModal: false, showStudentModal: false })
  },

  onTeacherNameInput(e) {
    this.setData({ teacherNameInput: e.detail.value })
  },

  onStudentNameInput(e) {
    this.setData({ studentNameInput: e.detail.value })
  },

  onInviteInput(e) {
    this.setData({ inviteInput: e.detail.value })
  },

  async registerTeacher() {
    const name = this.data.teacherNameInput.trim()
    if (!name) {
      wx.showToast({ title: '请输入你的称呼', icon: 'none' })
      return
    }
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'updateUserRole',
        data: { action: 'register_teacher', nickName: name }
      })
      if (result.code === 0) {
        wx.showToast({ title: '注册成功', icon: 'success' })
        this.setData({ showTeacherModal: false, teacherNameInput: '' })
        this.loadUser()
      }
    } catch (err) {
      wx.showToast({ title: '注册失败，请检查网络', icon: 'none' })
    }
  },

  async registerStudent() {
    const name = this.data.studentNameInput.trim()
    const code = this.data.inviteInput.trim()
    if (!name) {
      wx.showToast({ title: '请输入你的称呼', icon: 'none' })
      return
    }
    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'updateUserRole',
        data: { action: 'register_student', nickName: name, inviteCode: code }
      })
      if (result.code === 0) {
        wx.showToast({ title: '绑定成功！老师：' + result.data.teacherName, icon: 'success' })
        this.setData({ showStudentModal: false, studentNameInput: '', inviteInput: '' })
        this.loadUser()
      } else {
        wx.showToast({ title: result.msg || '绑定失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '绑定失败，请检查网络', icon: 'none' })
    }
  },

  goAssignments() { wx.navigateTo({ url: '/pages/student/assignments/assignments' }) },
  goPractice() { wx.navigateTo({ url: '/pages/student/practice/practice' }) },
  goHistory() { wx.navigateTo({ url: '/pages/student/history/history' }) },
  goCreateAssignment() { wx.navigateTo({ url: '/pages/teacher/assignments/assignments' }) },
  goSubmissions() { wx.navigateTo({ url: '/pages/teacher/submissions/submissions' }) },
  goStudents() { wx.navigateTo({ url: '/pages/teacher/students/students' }) }
})
