export {};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CHECK_LOGIN') {
    sendResponse({ loggedIn: false });
  }
  if (msg.type === 'PING') {
    sendResponse({ pong: true });
  }
});

console.log('[auto-resume] 前程无忧 content script loaded');
