import { WS_URL } from '../shared/constants';
import type { WsMessage, WsResponse } from '../../../shared/types';

let ws: WebSocket | null = null;
let connectedPort: chrome.runtime.Port | null = null;

function connectWs() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[bg] WS connected');
    if (connectedPort) {
      connectedPort.postMessage({ type: 'ws:connected' });
    }
  };

  ws.onmessage = (event) => {
    const msg: WsResponse = JSON.parse(event.data);
    if (connectedPort) {
      connectedPort.postMessage({ type: 'ws:message', data: msg });
    }
  };

  ws.onclose = () => {
    console.log('[bg] WS disconnected, reconnecting in 5s...');
    setTimeout(connectWs, 5000);
  };

  ws.onerror = (err) => {
    console.error('[bg] WS error:', err);
  };
}

function sendWs(msg: WsMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    connectedPort = port;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWs();
    }
    port.onMessage.addListener((msg) => {
      if (msg.type === 'ws:send') {
        sendWs(msg.data as WsMessage);
      } else if (msg.type === 'content:dispatch') {
        const { tabId, command } = msg;
        chrome.tabs.sendMessage(tabId, command, (response) => {
          port.postMessage({ type: 'content:response', tabId, response });
        });
      }
    });
    port.onDisconnect.addListener(() => {
      connectedPort = null;
    });
  }
});
