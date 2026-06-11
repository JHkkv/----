// 前程无忧 content script
let stopFlag = false;

function scanJobs(): Element[] {
  const selectors = ['.e', '.el', '[class*="jobItem"]', '.joblist-item'];
  for (const sel of selectors) {
    const cards = document.querySelectorAll(sel);
    if (cards.length > 0) return Array.from(cards);
  }
  return [];
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'SCAN_JOBS':
      sendResponse({ count: scanJobs().length });
      break;
    case 'AUTO_APPLY':
      sendResponse({ ok: true, note: '完整版开发中' });
      break;
    case 'STOP_APPLY':
      stopFlag = true;
      sendResponse({ ok: true });
      break;
    case 'CHECK_LOGIN':
      sendResponse({ loggedIn: document.querySelector('.us_name, .user-name, [class*="userName"]') !== null });
      break;
    // default: don't respond — let other content scripts handle it
  }
});
