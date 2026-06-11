Component({
  properties: {},

  data: {
    status: 'idle', // idle | recording | done | playing
    displayTime: '00:00',
    recordDuration: 0,
    timer: null,
    seconds: 0,
    tempFilePath: '',
    uploading: false,
    uploadProgress: 0,
    audioCtx: null
  },

  lifetimes: {
    attached() {
      this.recorder = wx.getRecorderManager()
      this._bindEvents()
    }
  },

  methods: {
    _bindEvents() {
      this.recorder.onStart(() => { /* recording started */ })
      this.recorder.onStop((res) => {
        this._clearTimer()
        this.setData({
          status: 'done',
          tempFilePath: res.tempFilePath,
          recordDuration: Math.round(res.duration / 1000)
        })
        this.triggerEvent('recordComplete', {
          tempFilePath: res.tempFilePath,
          duration: Math.round(res.duration / 1000)
        })
      })
      this.recorder.onError((err) => {
        wx.showToast({ title: '录音失败，请重试', icon: 'none' })
        this.setData({ status: 'idle', displayTime: '00:00' })
        this._clearTimer()
      })
    },

    startRecord() {
      // Stop any playing audio
      if (this.data.audioCtx) {
        this.data.audioCtx.destroy()
        this.data.audioCtx = null
      }

      this.setData({ status: 'recording', seconds: 0, displayTime: '00:00' })
      this.recorder.start({ format: 'mp3', sampleRate: 44100, numberOfChannels: 1, encodeBitRate: 192000 })
      this.data.timer = setInterval(() => {
        const s = this.data.seconds + 1
        const m = Math.floor(s / 60)
        const sec = s % 60
        this.setData({
          seconds: s,
          displayTime: `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        })
      }, 1000)
    },

    stopRecord() {
      this.recorder.stop()
    },

    playRecord() {
      const ctx = wx.createInnerAudioContext()
      ctx.src = this.data.tempFilePath
      ctx.onPlay(() => this.setData({ status: 'playing' }))
      ctx.onEnded(() => this.setData({ status: 'done' }))
      ctx.onStop(() => this.setData({ status: 'done' }))
      ctx.onError(() => {
        wx.showToast({ title: '播放失败', icon: 'none' })
        this.setData({ status: 'done' })
      })
      ctx.play()
      this.data.audioCtx = ctx
    },

    stopPlay() {
      if (this.data.audioCtx) {
        this.data.audioCtx.stop()
        this.data.audioCtx.destroy()
        this.data.audioCtx = null
      }
      this.setData({ status: 'done' })
    },

    reset() {
      this._clearTimer()
      if (this.data.audioCtx) {
        this.data.audioCtx.destroy()
        this.data.audioCtx = null
      }
      this.setData({
        status: 'idle',
        seconds: 0,
        displayTime: '00:00',
        recordDuration: 0,
        tempFilePath: '',
        uploading: false,
        uploadProgress: 0
      })
    },

    upload() {
      return new Promise((resolve, reject) => {
        if (!this.data.tempFilePath) {
          resolve({ fileId: '', duration: 0 })
          return
        }
        this.setData({ uploading: true, uploadProgress: 0 })
        const cloudPath = `recordings/${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
        wx.cloud.uploadFile({
          cloudPath,
          filePath: this.data.tempFilePath,
          success: (res) => {
            this.setData({ uploading: false, uploadProgress: 100 })
            resolve({ fileId: res.fileID, duration: this.data.recordDuration })
          },
          fail: (err) => {
            this.setData({ uploading: false })
            reject(err)
          }
        })
      })
    },

    _clearTimer() {
      if (this.data.timer) {
        clearInterval(this.data.timer)
        this.data.timer = null
      }
    }
  }
})
