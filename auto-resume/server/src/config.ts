export const CONFIG = {
  PORT: 9527,
  DB_PATH: './data/auto-resume.db',

  DEFAULT_PLATFORM_CONFIG: {
    greetTemplate: '${company}您好，我有${workYears}年${skills}经验，做过${projects}，想了解这个岗位的更多细节，方便聊聊吗？',
    workdayOnly: true,
    workHoursStart: 9,
    workHoursEnd: 18,
  },

  PLATFORMS: [
    {
      id: 'boss' as const,
      name: 'Boss直聘',
      loginUrl: 'https://www.zhipin.com/web/user/?ka=header-login',
      searchUrl: 'https://www.zhipin.com/web/geek/job',
      enabled: true,
      dailyLimit: 50,
      minDelayMs: 30000,
      maxDelayMs: 90000,
    },
    {
      id: 'wuyou' as const,
      name: '前程无忧',
      loginUrl: 'https://login.51job.com/',
      searchUrl: 'https://we.51job.com/pc/search',
      enabled: false,
      dailyLimit: 50,
      minDelayMs: 40000,
      maxDelayMs: 100000,
    },
    {
      id: 'liepin' as const,
      name: '猎聘',
      loginUrl: 'https://www.liepin.com/',
      searchUrl: 'https://www.liepin.com/zhaopin/',
      enabled: false,
      dailyLimit: 50,
      minDelayMs: 40000,
      maxDelayMs: 100000,
    },
    {
      id: 'zhilian' as const,
      name: '智联招聘',
      loginUrl: 'https://www.zhaopin.com/',
      searchUrl: 'https://www.zhaopin.com/sou/',
      enabled: false,
      dailyLimit: 50,
      minDelayMs: 40000,
      maxDelayMs: 100000,
    },
  ],
} as const;
