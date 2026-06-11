// Boss直聘 content script — auto scan + apply

let stopFlag = false;

// —— DOM helpers ——

function safeClick(el: Element | null): boolean {
  if (!el) return false;
  const html = el as HTMLElement;
  html.focus();
  html.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  html.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  html.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  html.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// —— Job scanning ——
// Strategy: find "立即沟通" buttons and walk up to their card container
// This is more robust than CSS class selectors that change with each site update

function findAllContactButtons(): Element[] {
  const results: Element[] = [];
  const all = document.querySelectorAll('button, a, span, div[class*="btn"], div[role="button"]');

  for (const el of all) {
    const text = el.textContent?.trim() || '';
    // Match "立即沟通", "沟通", "聊一聊", "立即联系" etc
    if (text.includes('沟通') || text.includes('聊一聊') || text === '聊') {
      // Filter out obviously wrong matches (menu items, navigation)
      if (text.length <= 10 && !text.includes('面') && !text.includes('线')) {
        results.push(el);
      }
    }
  }
  return results;
}

function findCardFromButton(btn: Element): Element | null {
  // Walk up the DOM tree to find the card container
  // A job card is typically a <li> or <div> with multiple child elements
  let el: Element | null = btn.parentElement;
  let depth = 0;
  while (el && depth < 10) {
    const tag = el.tagName.toLowerCase();
    const cls = el.className || '';
    const html = (el as HTMLElement).outerHTML?.length || 0;

    // Cards are usually: <li> elements, or <div>s with certain traits
    // A card should contain at least 100 chars of HTML (more than just a button)
    if ((tag === 'li' || tag === 'article') && html > 100) return el;
    if (tag === 'div' && html > 200 && depth > 1) return el;
    // If the element has a class that looks like a card
    if (cls && (cls.includes('card') || cls.includes('item') || cls.includes('list') || cls.includes('job')) && html > 100) {
      return el;
    }

    el = el.parentElement;
    depth++;
  }
  // Fallback: return the button's immediate parent's parent
  return btn.parentElement?.parentElement || btn.parentElement;
}

function scanJobs(): Element[] {
  // Strategy 1: Find "沟通" buttons and deduce cards from them
  const buttons = findAllContactButtons();
  if (buttons.length > 0) {
    const cards: Element[] = [];
    const seen = new Set<Element>();
    for (const btn of buttons) {
      const card = findCardFromButton(btn);
      if (card && !seen.has(card)) {
        seen.add(card);
        cards.push(card);
      }
    }
    if (cards.length > 0) return cards;
  }

  // Strategy 2: Fallback CSS class selectors (updated for current Boss直聘)
  const selectors = [
    '.job-card-wrap',
    '.job-primary',
    '[class*="job-card"]',
    '[class*="jobCard"]',
    'li[class*="job"]',
    '.search-job-result > li',
    '.job-list-box > li',
    '.job-list > li',
    '[class*="search-job"] li',
    '[class*="jobList"] li',
    '[class*="jobResult"] > li',
    '[class*="joblist"] > div',
    '.candidate-list > div',
    '.geek-list > div',
  ];

  for (const sel of selectors) {
    const cards = document.querySelectorAll(sel);
    if (cards.length >= 3) return Array.from(cards);
  }

  // Strategy 3: Find any <li> that has "沟通" text inside
  const allLis = document.querySelectorAll('li');
  const liCards: Element[] = [];
  for (const li of allLis) {
    if (li.textContent?.includes('沟通')) {
      const html = (li as HTMLElement).outerHTML?.length || 0;
      if (html > 200) liCards.push(li);
    }
  }
  if (liCards.length > 0) return liCards;

  return [];
}

// —— Per-job apply flow ——

async function applyOneJob(card: Element, greeting: string, index: number, total: number): Promise<boolean> {
  try {
    // Scroll the card into view
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(rand(500, 1000));

    // Find and click the "立即沟通" button within this card
    let contactBtn: Element | null = card.querySelector(
      '.btn-startchat, .op-btn, .btn-chat, [class*="startChat"], [class*="chat-btn"]'
    );

    if (!contactBtn) {
      // Try text-based search within this card only
      const btns = card.querySelectorAll('button, a.btn, .btn, span.btn');
      for (const b of btns) {
        const text = b.textContent?.trim() || '';
        if (text.includes('沟通') || text.includes('立即沟通') || text.includes('聊')) {
          contactBtn = b;
          break;
        }
      }
    }

    if (!contactBtn) {
      console.warn(`[boss] No contact button on card ${index + 1}`);
      return false;
    }

    safeClick(contactBtn);
    await wait(rand(1500, 2500));

    // Look for chat dialog / textarea
    const inputSelectors = [
      'textarea',
      '.chat-input textarea',
      '.dialog-chat textarea',
      '[class*="chat"] textarea',
      '[class*="dialog"] textarea',
      '[class*="input"] textarea',
      '.input-chat textarea',
      'div[contenteditable="true"]',
    ];

    let inputEl: Element | null = null;
    for (const sel of inputSelectors) {
      inputEl = document.querySelector(sel);
      if (inputEl && (inputEl instanceof HTMLInputElement || inputEl instanceof HTMLTextAreaElement || (inputEl as HTMLElement).contentEditable === 'true')) {
        break;
      }
      inputEl = null;
    }

    if (!inputEl) {
      console.warn(`[boss] No chat input found after clicking contact on card ${index + 1}`);
      // Try closing dialog and continue
      closeDialog();
      return false;
    }

    if ((inputEl as HTMLElement).contentEditable === 'true') {
      // contentEditable div
      inputEl.textContent = greeting;
    } else {
      safeType(inputEl, greeting);
    }
    await wait(rand(300, 600));

    // Find send button
    const sendSelectors = [
      '.btn-send',
      '.send-btn',
      '[class*="sendBtn"]',
      '[class*="send-btn"]',
    ];
    let sendBtn: Element | null = null;
    for (const sel of sendSelectors) {
      sendBtn = document.querySelector(sel);
      if (sendBtn) break;
    }
    if (!sendBtn) {
      // Text-based search
      const allBtns = document.querySelectorAll('button, span.btn');
      for (const b of allBtns) {
        if (b.textContent?.trim() === '发送') {
          sendBtn = b;
          break;
        }
      }
    }

    if (sendBtn) {
      safeClick(sendBtn);
      await wait(rand(500, 1000));
    }

    // Close dialog if possible
    closeDialog();
    await wait(rand(200, 500));

    // Record to local server
    try {
      fetch('http://localhost:9527/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'boss',
          company: card.querySelector('.company-name, [class*="companyName"]')?.textContent?.trim() || 'unknown',
          position: card.querySelector('.job-name, [class*="jobName"]')?.textContent?.trim() || 'unknown',
          salary: card.querySelector('.salary, .red')?.textContent?.trim() || '',
          greeting,
          status: 'sent',
        }),
      }).catch(() => {});
    } catch { /* non-critical */ }

    // Report progress
    chrome.runtime.sendMessage({
      type: 'APPLY_PROGRESS',
      done: index + 1,
      total,
    });

    return true;
  } catch (err) {
    console.error(`[boss] Error on card ${index + 1}:`, err);
    return false;
  }
}

function closeDialog(): void {
  const closeSelectors = [
    '.dialog-close',
    '.chat-close',
    '[class*="close"]',
    '.icon-close',
    'svg[class*="close"]',
  ];
  for (const sel of closeSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      safeClick(el);
      return;
    }
  }
  // Esc key as fallback
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

// —— Auto-apply orchestrator ——

async function autoApply(greeting: string, total: number): Promise<void> {
  stopFlag = false;
  const cards = scanJobs();
  const toProcess = cards.slice(0, total);

  for (let i = 0; i < toProcess.length; i++) {
    if (stopFlag) break;

    const ok = await applyOneJob(toProcess[i], greeting, i, toProcess.length);

    // Random delay between applications: 3-8 seconds
    if (i < toProcess.length - 1 && !stopFlag) {
      const delay = ok ? rand(3000, 8000) : rand(1500, 3000);
      await wait(delay);
    }
  }
}

// —— Message handler ——

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'SCAN_JOBS': {
      const cards = scanJobs();
      sendResponse({ count: cards.length });
      break;
    }

    case 'AUTO_APPLY': {
      sendResponse({ ok: true });
      autoApply(msg.greeting, msg.total);
      break;
    }

    case 'STOP_APPLY': {
      stopFlag = true;
      sendResponse({ ok: true });
      break;
    }

    case 'CHECK_LOGIN': {
      const isLoginPage = window.location.href.includes('/web/user/');
      const hasUserEl = document.querySelector('.user-nav, .user-info, .header-user, [class*="user"]') !== null;
      sendResponse({ loggedIn: !isLoginPage && hasUserEl });
      break;
    }

    case 'DEBUG_SCAN': {
      const debug: any = {
        url: window.location.href,
        allLis: document.querySelectorAll('li').length,
        lisWithChat: 0,
        contactButtons: findAllContactButtons().length,
        classHints: [] as string[],
        sampleHTML: '',
      };

      // Find any li containing "沟通"
      document.querySelectorAll('li').forEach(li => {
        if (li.textContent?.includes('沟通')) {
          debug.lisWithChat++;
          const cls = li.className?.toString() || '';
          if (cls && !debug.classHints.includes(cls)) {
            debug.classHints.push(cls);
          }
        }
      });

      // Also check divs
      document.querySelectorAll('div').forEach(div => {
        const cls = div.className?.toString() || '';
        if (cls && (cls.includes('job') || cls.includes('card') || cls.includes('item') || cls.includes('list')) && !debug.classHints.includes(cls)) {
          debug.classHints.push(cls);
        }
      });

      // Sample HTML of first contact button
      const btns = findAllContactButtons();
      if (btns.length > 0) {
        const btn = btns[0];
        debug.sampleHTML = (btn as HTMLElement).outerHTML?.substring(0, 300);
        // Also show parent hierarchy
        let p = btn.parentElement;
        debug.parents = [];
        for (let i = 0; i < 5 && p; i++) {
          debug.parents.push({
            tag: p.tagName,
            class: p.className?.toString()?.substring(0, 100) || '(none)',
          });
          p = p.parentElement;
        }
      }

      console.table(debug);
      sendResponse(debug);
      break;
    }
  }
});
