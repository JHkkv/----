const ZHILIAN_SELECTORS = {
  loginIndicator: '.userinfo, .user-name, [class*="userName"]',
  searchInput: 'input[name="kw"], input[placeholder*="搜索"], .search-box input',
  searchButton: '.btn-search, button:has-text("搜索")',
  jobList: '.positionlist, .job-list, [class*="positionList"]',
  jobCard: '.joblist-item, [class*="jobItem"]',
  jobTitle: '.job-title, .job-name, [class*="jobTitle"] a',
  companyName: '.company-name, [class*="companyName"]',
  salary: '.salary, [class*="salary"]',
  contactBtn: 'a:has-text("立即沟通"), .btn-chat',
  greetingInput: '.dialog-content textarea, [class*="chatTextarea"]',
  sendBtn: 'button:has-text("发送"), .send-btn',
};

function checkLogin(): boolean {
  const el = document.querySelector(ZHILIAN_SELECTORS.loginIndicator);
  return el !== null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'CHECK_LOGIN':
        sendResponse({ loggedIn: checkLogin() });
        break;
      case 'PING':
        sendResponse({ pong: true });
        break;
      default:
        sendResponse({ error: 'not implemented' });
    }
  })();
  return true;
});

console.log('[auto-resume] 智联招聘 content script loaded');
