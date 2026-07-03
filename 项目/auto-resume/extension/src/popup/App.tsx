import React, { useState, useEffect, useCallback } from 'react';

const platformUrls: Record<string, string> = {
  boss: 'zhipin.com',
  wuyou: '51job.com',
  liepin: 'liepin.com',
  zhilian: 'zhaopin.com',
};

const platformNames: Record<string, string> = {
  boss: 'Boss直聘',
  wuyou: '前程无忧',
  liepin: '猎聘',
  zhilian: '智联招聘',
};

const App: React.FC = () => {
  const [platform, setPlatform] = useState<string | null>(null);
  const [jobCount, setJobCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [greeting, setGreeting] = useState('您好，我对这个岗位很感兴趣，方便聊聊吗？');
  const [connected, setConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Simple health ping to local server
  useEffect(() => {
    const check = () => {
      fetch('http://localhost:9527/api/resume')
        .then(r => setConnected(r.ok))
        .catch(() => setConnected(false));
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  // Detect current platform + scan jobs
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      for (const [key, domain] of Object.entries(platformUrls)) {
        if (url.includes(domain)) {
          setPlatform(key);
          chrome.tabs.sendMessage(tabId, { type: 'SCAN_JOBS' }, (resp) => {
            if (chrome.runtime.lastError) return;
            if (resp?.count) setJobCount(resp.count);
          });
          return;
        }
      }
      setPlatform(null);
      setJobCount(0);
    });
  }, []);

  // Listen for progress from content script
  useEffect(() => {
    const listener = (msg: any, sender: chrome.runtime.MessageSender) => {
      if (msg.type === 'APPLY_PROGRESS') {
        setProgress({ done: msg.done, total: msg.total });
        if (msg.done >= msg.total) {
          setRunning(false);
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleStart = useCallback(() => {
    if (!platform) return;
    setRunning(true);
    setProgress({ done: 0, total: jobCount });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'AUTO_APPLY', greeting, total: jobCount });
      }
    });
  }, [platform, greeting, jobCount]);

  const handleStop = useCallback(() => {
    setRunning(false);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'STOP_APPLY' });
      }
    });
  }, []);

  const handleRescan = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'SCAN_JOBS' }, (resp) => {
          if (chrome.runtime.lastError) return;
          if (resp?.count) setJobCount(resp.count);
        });
      }
    });
  }, []);

  const handleDebug = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'DEBUG_SCAN' }, (resp) => {
          if (chrome.runtime.lastError) return;
          setDebugInfo(JSON.stringify(resp, null, 2));
        });
      }
    });
  }, []);

  const isOnJobSite = platform !== null;

  return (
    <div className="flex flex-col h-[600px] bg-gray-50">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="font-bold text-lg">Auto Resume</h1>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`} />
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isOnJobSite ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">&#128269;</div>
            <p className="text-gray-500 text-sm">请在招聘网站职位列表页打开此插件</p>
            <p className="text-gray-400 text-xs mt-2">
              支持：Boss直聘 / 前程无忧 / 猎聘 / 智联招聘
            </p>
            <button onClick={handleDebug} className="mt-3 text-xs text-gray-400 hover:text-brand-600 underline">
              页面调试
            </button>
            {debugInfo && (
              <pre className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded overflow-auto max-h-40 text-left">
                {debugInfo}
              </pre>
            )}
          </div>
        ) : (
          <>
            {/* Platform indicator */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">当前平台</span>
                  <p className="font-semibold text-sm">{platformNames[platform]}</p>
                </div>
                <button onClick={handleRescan} className="text-xs text-brand-600 hover:underline">
                  重新扫描
                </button>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-brand-600">{jobCount}</span>
                <span className="text-sm text-gray-500">个职位待投递</span>
              </div>
            </div>

            {jobCount === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                未检测到职位卡片。可能原因：页面未加载完成 / Boss直聘更新了页面结构。
                <button onClick={handleDebug} className="ml-2 text-brand-600 underline">点此调试</button>
              </div>
            )}
            {debugInfo && (
              <pre className="text-xs text-gray-500 bg-gray-100 p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap break-all">
                {debugInfo}
              </pre>
            )}

            {/* Greeting */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <label className="text-xs text-gray-500 block mb-1">招呼语</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                disabled={running}
              />
            </div>

            {/* Progress bar */}
            {running && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">自动投递中...</span>
                  <span className="font-bold text-brand-600">{progress.done}/{progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action */}
            {running ? (
              <button
                onClick={handleStop}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-bold text-base hover:bg-red-600 transition-colors"
              >
                停止投递
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={jobCount === 0}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold text-base hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {jobCount === 0 ? '未检测到职位' : `一键投递 ${jobCount} 个职位`}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
