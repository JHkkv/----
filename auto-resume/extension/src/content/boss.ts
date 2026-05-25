import type { PlatformScript, PlatformSelectors } from './base';

const BOSS_SELECTORS: PlatformSelectors = {
  searchInput: '.search-form input[placeholder*="搜索"]',
  searchButton: '.search-form .btn-search',
  jobList: '.job-list-box',
  jobCard: '.job-card-wrap',
  jobTitle: '.job-name',
  companyName: '.company-name',
  salary: '.salary',
  contactBtn: '.btn-startchat, .op-btn',
  greetingInput: '.chat-input textarea, .input-chat',
  sendBtn: '.btn-send, .send-btn',
  loginIndicator: '.user-nav, .header-login',
};

const bossScript: PlatformScript = {
  name: 'boss',
  selectors: BOSS_SELECTORS,
  checkLogin() {
    const el = document.querySelector(BOSS_SELECTORS.loginIndicator);
    return el !== null;
  },
  async searchJobs(keyword: string, city: string) {
    console.log('[boss] searching:', keyword, city);
  },
  async sendGreeting(greeting: string) {
    console.log('[boss] sending:', greeting);
    return false;
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CHECK_LOGIN') {
    sendResponse({ loggedIn: bossScript.checkLogin() });
  }
  if (msg.type === 'SEND_GREETING') {
    bossScript.sendGreeting(msg.greeting).then(ok => sendResponse({ ok }));
    return true;
  }
});

console.log('[auto-resume] Boss直聘 content script loaded');
