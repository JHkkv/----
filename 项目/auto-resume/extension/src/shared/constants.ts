import type { PlatformId } from '../../../shared/types';

export const PLATFORM_URLS: Record<PlatformId, string> = {
  boss: 'https://www.zhipin.com',
  wuyou: 'https://we.51job.com',
  liepin: 'https://www.liepin.com',
  zhilian: 'https://www.zhaopin.com',
};

export const WS_URL = 'ws://localhost:9527';

export const PLATFORM_NAMES: Record<PlatformId, string> = {
  boss: 'Boss直聘',
  wuyou: '前程无忧',
  liepin: '猎聘',
  zhilian: '智联招聘',
};
