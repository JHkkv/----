import { useState, useEffect, useRef, useCallback } from 'react';
import type { WsMessage, WsResponse } from '../../../shared/types';

const API_BASE = 'http://localhost:9527';

export function useWs() {
  const [state, setState] = useState<{ connected: boolean }>({ connected: false });
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Health check via REST — fast and reliable, no WebSocket needed
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/resume`);
        if (!cancelled) {
          setState({ connected: res.ok });
        }
      } catch {
        if (!cancelled) {
          setState({ connected: false });
        }
      }
    }

    check();
    const interval = setInterval(check, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Still connect to background SW for platform-related chrome APIs
  useEffect(() => {
    try {
      portRef.current = chrome.runtime.connect({ name: 'popup' });
      portRef.current.onDisconnect.addListener(() => {
        // SW went idle — that's fine, we use REST for data
      });
    } catch {
      // Extension context might not be ready
    }
    return () => {
      try { portRef.current?.disconnect(); } catch { /* ignore */ }
    };
  }, []);

  // Send uses REST API for all data operations
  const send = useCallback(async (msg: WsMessage): Promise<WsResponse> => {
    try {
      switch (msg.type) {
        case 'resume:get': {
          const res = await fetch(`${API_BASE}/api/resume`);
          const json = await res.json();
          return { type: 'resume:get', success: true, data: json.data };
        }
        case 'resume:save': {
          const res = await fetch(`${API_BASE}/api/resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg.payload),
          });
          const json = await res.json();
          return { type: 'resume:save', success: json.success, data: json.data };
        }
        case 'jobtargets:list': {
          const res = await fetch(`${API_BASE}/api/jobs`);
          const json = await res.json();
          return { type: 'jobtargets:list', success: true, data: json.data };
        }
        case 'jobtargets:save': {
          const res = await fetch(`${API_BASE}/api/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg.payload),
          });
          const json = await res.json();
          return { type: 'jobtargets:save', success: json.success, data: json.data };
        }
        case 'apps:list': {
          const p = msg.payload as any || {};
          const res = await fetch(`${API_BASE}/api/applications?page=${p.page || 1}&limit=${p.limit || 20}`);
          const json = await res.json();
          return { type: 'apps:list', success: true, data: { items: json.data, total: json.total } };
        }
        case 'apps:stats': {
          const res = await fetch(`${API_BASE}/api/applications/stats`);
          const json = await res.json();
          return { type: 'apps:stats', success: true, data: json.data };
        }
        case 'task:start':
        case 'task:stop': {
          // These still need WebSocket — forward via background port
          return new Promise((resolve) => {
            const requestId = Math.random().toString(36).slice(2);
            const timeout = setTimeout(() => {
              resolve({ type: msg.type, success: false, error: 'Timeout', requestId });
            }, 10000);

            const listener = (response: any) => {
              if (response.type === 'ws:message' && response.data?.requestId === requestId) {
                clearTimeout(timeout);
                try { portRef.current?.onMessage.removeListener(listener); } catch { /* ignore */ }
                resolve(response.data);
              }
            };

            try {
              portRef.current?.onMessage.addListener(listener);
              portRef.current?.postMessage({ type: 'ws:send', data: { ...msg, requestId } });
            } catch {
              clearTimeout(timeout);
              resolve({ type: msg.type, success: false, error: 'Extension context invalid', requestId });
            }
          });
        }
        default:
          return { type: msg.type, success: false, error: 'Unknown message type' };
      }
    } catch (err) {
      return { type: msg.type, success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }, []);

  const checkLogin = useCallback(async (platform: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!portRef.current) { resolve(false); return; }
      const listener = (msg: any) => {
        if (msg.type === 'login:result' && msg.platform === platform) {
          try { portRef.current?.onMessage.removeListener(listener); } catch { /* ignore */ }
          resolve(msg.loggedIn);
        }
      };
      const timeout = setTimeout(() => {
        try { portRef.current?.onMessage.removeListener(listener); } catch { /* ignore */ }
        resolve(false);
      }, 10000);
      try {
        portRef.current.onMessage.addListener(listener);
        portRef.current.postMessage({ type: 'check:login', platform });
      } catch {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }, []);

  const openPlatform = useCallback((platform: string) => {
    try {
      portRef.current?.postMessage({ type: 'open:platform', platform });
    } catch { /* ignore */ }
  }, []);

  return { connected: state.connected, send, checkLogin, openPlatform };
}
