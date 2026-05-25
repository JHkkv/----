// extension/src/content/boss.ts

const SELECTORS = {
  loginIndicator: '.user-nav, [class*="user"], .header-login-btn, .login-btn',
  searchInput: 'input[name="query"], input[placeholder*="搜索"], .search-input input',
  searchButton: '.search-btn, button:has-text("搜索"), .btn-search',
  jobList: '.job-list-box, .search-job-list, [class*="jobList"]',
  jobCard: '.job-card-wrap, .job-primary, [class*="jobCard"]',
  jobTitle: '.job-name, .job-title, [class*="jobName"] a',
  companyName: '.company-name, .company-text, [class*="companyName"]',
  salary: '.salary, .red, [class*="salary"]',
  contactBtn: '.btn-startchat, .op-btn, .btn-chat, [class*="startChat"]',
  greetingInput: '.chat-input textarea, .input-chat textarea, [class*="chatInput"] textarea',
  sendBtn: '.btn-send, .send-btn, [class*="sendBtn"], button:has-text("发送")',
  nextPage: '.next, .page-next, [class*="next"]',
} as const;

function safeClick(el: Element | null): boolean {
  if (!el) return false;
  (el as HTMLElement).focus();
  el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}

function safeType(el: Element | null, text: string): boolean {
  if (!el || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
  el.focus();
  el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  el.value = '';
  for (const char of text) {
    el.value += char;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: char }));
  }
  el.dispatchEvent(new InputEvent('change', { bubbles: true }));
  return true;
}

function checkLogin(): boolean {
  const isOnLoginPage = window.location.href.includes('/web/user/');
  if (isOnLoginPage) return false;
  const el = document.querySelector(SELECTORS.loginIndicator);
  return el !== null || document.querySelector('.user-info, .header-user') !== null;
}

async function searchJobs(keyword: string): Promise<void> {
  const input = document.querySelector(SELECTORS.searchInput);
  if (!input) {
    console.warn('[boss] search input not found');
    return;
  }

  if (input instanceof HTMLInputElement) {
    input.value = keyword;
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  const btn = document.querySelector(SELECTORS.searchButton);
  if (btn) {
    safeClick(btn);
  } else {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  await new Promise(r => setTimeout(r, 3000));
}

interface JobInfo {
  title: string;
  company: string;
  salary: string;
  link: string;
}

function getJobCards(): Element[] {
  const container = document.querySelector(SELECTORS.jobList);
  if (!container) return [];
  return Array.from(container.querySelectorAll(SELECTORS.jobCard));
}

function parseJobCard(card: Element): JobInfo | null {
  const titleEl = card.querySelector(SELECTORS.jobTitle);
  const companyEl = card.querySelector(SELECTORS.companyName);
  const salaryEl = card.querySelector(SELECTORS.salary);

  if (!titleEl || !companyEl) return null;

  return {
    title: titleEl.textContent?.trim() || '',
    company: companyEl.textContent?.trim() || '',
    salary: salaryEl?.textContent?.trim() || '',
    link: (titleEl as HTMLAnchorElement).href || window.location.href,
  };
}

async function clickContactButton(): Promise<boolean> {
  const btn = document.querySelector(SELECTORS.contactBtn);
  if (!btn) {
    const allBtns = document.querySelectorAll('button, a.btn, .btn');
    for (const b of allBtns) {
      if (b.textContent?.includes('沟通') || b.textContent?.includes('聊')) {
        return safeClick(b);
      }
    }
    return false;
  }
  return safeClick(btn);
}

async function sendGreeting(greeting: string): Promise<boolean> {
  await new Promise(r => setTimeout(r, 1500));

  const input = document.querySelector(SELECTORS.greetingInput);
  if (!input) {
    const dialogInput = document.querySelector('.dialog-chat textarea, .chat-box textarea, [class*="chat"] textarea');
    if (dialogInput && (dialogInput instanceof HTMLInputElement || dialogInput instanceof HTMLTextAreaElement)) {
      return safeType(dialogInput, greeting) && clickSendButton();
    }
    return false;
  }

  if (!safeType(input, greeting)) return false;

  await new Promise(r => setTimeout(r, 500));

  return clickSendButton();
}

function clickSendButton(): boolean {
  const sendBtn = document.querySelector(SELECTORS.sendBtn);
  if (!sendBtn) {
    const allBtns = document.querySelectorAll('button');
    for (const b of allBtns) {
      if (b.textContent?.trim() === '发送') {
        return safeClick(b);
      }
    }
    return false;
  }
  return safeClick(sendBtn);
}

// Listen for commands from background service worker
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'CHECK_LOGIN':
        sendResponse({ loggedIn: checkLogin() });
        break;

      case 'SEARCH_JOBS':
        await searchJobs(msg.keyword);
        const cards = getJobCards();
        const jobs = cards.map(parseJobCard).filter(Boolean);
        sendResponse({ jobs });
        break;

      case 'CLICK_CONTACT':
        sendResponse({ ok: await clickContactButton() });
        break;

      case 'SEND_GREETING':
        sendResponse({ ok: await sendGreeting(msg.greeting) });
        break;

      case 'PING':
        sendResponse({ pong: true });
        break;

      default:
        sendResponse({ error: 'unknown command' });
    }
  })();
  return true; // keep message channel open for async
});

console.log('[auto-resume] Boss直聘 content script loaded');
