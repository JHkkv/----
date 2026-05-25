import { useState, useEffect, useRef, useCallback } from 'react';
import type { WsMessage, WsResponse } from '../../../shared/types';

interface WsState {
  connected: boolean;
}

export function useWs() {
  const [state, setState] = useState<WsState>({ connected: false });
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const callbacksRef = useRef<Map<string, (data: WsResponse) => void>>(new Map());

  useEffect(() => {
    portRef.current = chrome.runtime.connect({ name: 'popup' });

    const listener = (msg: any) => {
      if (msg.type === 'ws:connected') {
        setState({ connected: true });
      } else if (msg.type === 'ws:message') {
        const data = msg.data as WsResponse;
        if (data.requestId && callbacksRef.current.has(data.requestId)) {
          callbacksRef.current.get(data.requestId)!(data);
          callbacksRef.current.delete(data.requestId);
        }
      } else if (msg.type === 'login:result') {
        // handled by checkLogin promise
      }
    };

    portRef.current.onMessage.addListener(listener);

    portRef.current.onDisconnect.addListener(() => {
      setState({ connected: false });
    });

    return () => {
      portRef.current?.onMessage.removeListener(listener);
      portRef.current?.disconnect();
    };
  }, []);

  const send = useCallback((msg: WsMessage): Promise<WsResponse> => {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const msgWithId = { ...msg, requestId };

      callbacksRef.current.set(requestId, resolve);
      // Timeout after 30s
      setTimeout(() => {
        if (callbacksRef.current.has(requestId)) {
          callbacksRef.current.delete(requestId);
          resolve({ type: msg.type, success: false, error: 'Timeout', requestId });
        }
      }, 30000);

      portRef.current?.postMessage({ type: 'ws:send', data: msgWithId });
    });
  }, []);

  const checkLogin = useCallback(async (platform: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const listener = (msg: any) => {
        if (msg.type === 'login:result' && msg.platform === platform) {
          portRef.current?.onMessage.removeListener(listener);
          resolve(msg.loggedIn);
        }
      };
      portRef.current?.onMessage.addListener(listener);
      portRef.current?.postMessage({ type: 'check:login', platform });
      // Timeout
      setTimeout(() => {
        portRef.current?.onMessage.removeListener(listener);
        resolve(false);
      }, 10000);
    });
  }, []);

  const openPlatform = useCallback((platform: string) => {
    portRef.current?.postMessage({ type: 'open:platform', platform });
  }, []);

  return { connected: state.connected, send, checkLogin, openPlatform };
}
