Component({
  properties: {
    src: { type: String, value: '' },
    label: { type: String, value: '录音回放' },
    autoPlay: { type: Boolean, value: false }
  },

  data: {
    playing: false,
    duration: 0,
    current: 0,
    progress: 0,
    durationText: '00:00',
    currentText: '00:00',
    ctx: null
  },

  lifetimes: {
    attached() {
      this._createCtx()
    },
    detached() {
      if (this.data.ctx) this.data.ctx.destroy()
    }
  },

  observers: {
    src(val) {
      if (val && this.data.ctx) {
        this.data.ctx.src = val
        this.setData({ playing: false, current: 0, progress: 0, currentText: '00:00' })
      }
    }
  },

  methods: {
    _createCtx() {
      const ctx = wx.createInnerAudioContext()
      ctx.onPlay(() => this.setData({ playing: true }))
      ctx.onPause(() => this.setData({ playing: false }))
      ctx.onStop(() => this.setData({ playing: false, current: 0, progress: 0, currentText: '00:00' }))
      ctx.onEnded(() => this.setData({ playing: false, current: 0, progress: 0, currentText: '00:00' }))
      ctx.onTimeUpdate(() => {
        const d = ctx.duration || 0
        const c = ctx.currentTime || 0
        this.setData({
          duration: d,
          current: c,
          progress: d > 0 ? (c / d) * 100 : 0,
          durationText: this._fmt(d),
          currentText: this._fmt(c)
        })
      })
      ctx.onCanplay(() => {
        this.setData({ durationText: this._fmt(ctx.duration || 0) })
      })
      if (this.data.src) ctx.src = this.data.src
      this.data.ctx = ctx
    },

    togglePlay() {
      if (!this.data.ctx || !this.data.src) return
      if (this.data.playing) {
        this.data.ctx.pause()
      } else {
        this.data.ctx.play()
      }
    },

    _fmt(sec) {
      const m = Math.floor(sec / 60)
      const s = Math.floor(sec % 60)
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    }
  }
})
