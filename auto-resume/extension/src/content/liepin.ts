const LIEPIN_SELECTORS = {
  loginIndicator: '.user-info, .user-name, [class*="user"]',
  searchInput: 'input[name="key"], input[placeholder*="搜索"], .search-input input',
  searchButton: '.search-btn, button:has-text("搜索")',
  jobList: '.job-list-box, .sojob-list, [class*="jobList"]',
  jobCard: '.job-list-item, [class*="jobItem"]',
  jobTitle: '.job-title, .job-name, [class*="jobTitle"] a',
  companyName: '.company-name, [class*="companyName"]',
  salary: '.salary, .text-warning, [class*="salary"]',
  contactBtn: 'a:has-text("立即沟通"), .btn-chat',
  greetingInput: '.dialog-chat textarea, [class*="chatArea"]',
  sendBtn: 'button:has-text("发送"), .send-btn',
};

function checkLogin(): boolean {
  const el = document.querySelector(LIEPIN_SELECTORS.loginIndicator);
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

console.log('[auto-resume] 猎聘 content script loaded');
