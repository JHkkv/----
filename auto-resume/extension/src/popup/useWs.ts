import { useState, useEffect, useRef, useCallback } from 'react';
import type { WsMessage, WsResponse } from '../../../shared/types';

interface WsState {
  connected: boolean;
}

export function useWs() {
  const [state, setState] = useState<WsState>({ connected: false });
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    portRef.current = chrome.runtime.connect({ name: 'popup' });

    const listener = (msg: any) => {
      if (msg.type === 'ws:connected') {
        setState({ connected: true });
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

  const send = useCallback(async (msg: WsMessage): Promise<WsResponse> => {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      portRef.current?.postMessage({ type: 'ws:send', data: { ...msg, requestId } });
      // Timeout after 30s
      setTimeout(() => resolve({ type: msg.type, success: false, error: 'Timeout', requestId }), 30000);
    });
  }, []);

  const checkLogin = useCallback(async (platform: string): Promise<boolean> => {
    return new Promise((resolve) => {
      portRef.current?.postMessage({ type: 'check:login', platform });
      setTimeout(() => resolve(false), 10000);
    });
  }, []);

  const openPlatform = useCallback((platform: string) => {
    portRef.current?.postMessage({ type: 'open:platform', platform });
  }, []);

  return { connected: state.connected, send, checkLogin, openPlatform };
}
