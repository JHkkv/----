const WUYOU_SELECTORS = {
  loginIndicator: '.us_name, .user-name, [class*="userName"]',
  searchInput: 'input[id*="keyword"], input[name="keyword"], .kwd input',
  searchButton: 'button[id*="search"], .search-btn, button:has-text("搜索")',
  jobList: '.joblist, .e-joblist, [class*="jobList"]',
  jobCard: '.e, .el, [class*="jobItem"]',
  jobTitle: '.jname, .t1 span a, [class*="jobName"] a',
  companyName: '.cname, .t2 a, [class*="companyName"]',
  salary: '.sal, .t3, [class*="salary"]',
  contactBtn: 'a:has-text("立即沟通"), .btn-chat, [class*="chatBtn"]',
  greetingInput: '.chat-input textarea, [class*="chatTextarea"]',
  sendBtn: 'button:has-text("发送"), .btn-send, [class*="sendBtn"]',
};

function safeClick(el: Element | null): boolean {
  if (!el) return false;
  (el as HTMLElement).focus();
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}

function checkLogin(): boolean {
  const el = document.querySelector(WUYOU_SELECTORS.loginIndicator);
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

console.log('[auto-resume] 前程无忧 content script loaded');
