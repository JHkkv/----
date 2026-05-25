import { WS_URL } from '../shared/constants';
import type { WsMessage, WsResponse, PlatformId } from '../../../shared/types';

let ws: WebSocket | null = null;
let connectedPort: chrome.runtime.Port | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connectWs() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[bg] WS connected');
    connectedPort?.postMessage({ type: 'ws:connected' });
  };

  ws.onmessage = (event) => {
    try {
      const msg: WsResponse = JSON.parse(event.data);
      connectedPort?.postMessage({ type: 'ws:message', data: msg });
      handleWsTask(msg);
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    console.log('[bg] WS disconnected, reconnecting in 5s');
    reconnectTimer = setTimeout(connectWs, 5000);
  };

  ws.onerror = () => {
    // onclose will fire after this
  };
}

function sendWs(msg: WsMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

async function sendGreetingToTab(platform: PlatformId, greeting: string): Promise<boolean> {
  const urlPatterns: Record<PlatformId, string> = {
    boss: 'zhipin.com',
    wuyou: '51job.com',
    liepin: 'liepin.com',
    zhilian: 'zhaopin.com',
  };

  const tabs = await chrome.tabs.query({ url: `*://*.${urlPatterns[platform]}/*` });
  if (tabs.length === 0 || !tabs[0].id) {
    console.log(`[bg] No active tab for ${platform}`);
    return false;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabs[0].id!, { type: 'SEND_GREETING', greeting }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[bg] Tab message error:', chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(response?.ok ?? false);
      }
    });
  });
}

function handleWsTask(msg: WsResponse) {
  if (msg.type === 'task:progress' && msg.data) {
    const { platform, greeting } = msg.data as any;
    if (greeting && platform) {
      sendGreetingToTab(platform as PlatformId, greeting as string);
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    connectedPort = port;
    connectWs();

    port.onMessage.addListener((msg) => {
      switch (msg.type) {
        case 'ws:send':
          sendWs(msg.data as WsMessage);
          break;

        case 'check:login': {
          const { platform } = msg;
          const urlPatterns: Record<string, string> = {
            boss: 'zhipin.com',
            wuyou: '51job.com',
            liepin: 'liepin.com',
            zhilian: 'zhaopin.com',
          };
          chrome.tabs.query({ url: `*://*.${urlPatterns[platform]}/*` }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id!, { type: 'CHECK_LOGIN' }, (response) => {
                port.postMessage({ type: 'login:result', platform, loggedIn: response?.loggedIn ?? false });
              });
            } else {
              port.postMessage({ type: 'login:result', platform, loggedIn: false });
            }
          });
          break;
        }

        case 'open:platform': {
          const { platform } = msg;
          const urls: Record<string, string> = {
            boss: 'https://www.zhipin.com/web/geek/job',
            wuyou: 'https://we.51job.com/pc/search',
            liepin: 'https://www.liepin.com/zhaopin/',
            zhilian: 'https://www.zhaopin.com/sou/',
          };
          chrome.tabs.create({ url: urls[platform] });
          break;
        }
      }
    });

    port.onDisconnect.addListener(() => {
      connectedPort = null;
    });
  }
});
