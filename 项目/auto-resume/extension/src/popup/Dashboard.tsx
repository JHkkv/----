import React, { useEffect, useState } from 'react';
import type { DeliveryStats, PlatformId } from '../../../shared/types';
import { PLATFORM_NAMES } from '../shared/constants';
import { useWs } from './useWs';

const Dashboard: React.FC = () => {
  const { connected, send, openPlatform } = useWs();
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [running, setRunning] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!connected) return;

    send({ type: 'apps:stats' }).then(res => {
      if (res.success && res.data) {
        setStats(res.data as DeliveryStats);
      }
    });
  }, [connected, send]);

  const handleStart = (platform: string) => {
    setRunning(prev => ({ ...prev, [platform]: true }));
    send({ type: 'task:start', payload: { platform } });
  };

  const handleStop = (platform: string) => {
    setRunning(prev => ({ ...prev, [platform]: false }));
    send({ type: 'task:stop', payload: { platform } });
  };

  const handleOpenPlatform = (platform: string) => {
    openPlatform(platform);
  };

  const platforms: PlatformId[] = ['boss', 'wuyou', 'liepin', 'zhilian'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">
          {connected ? '服务已连接' : '服务未连接'}
        </span>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="今日投递" value={stats.todaySent} color="blue" />
          <StatCard label="总计投递" value={stats.totalSent} color="gray" />
          <StatCard label="已读" value={stats.totalRead} color="green" />
          <StatCard label="回复" value={stats.totalReplied} color="yellow" />
        </div>
      )}

      <div className="bg-white rounded-lg p-3 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">平台投递</h2>
        <div className="space-y-2">
          {platforms.map(p => (
            <div key={p} className="flex items-center justify-between">
              <button
                onClick={() => handleOpenPlatform(p)}
                className="text-sm text-brand-600 hover:underline"
              >
                {PLATFORM_NAMES[p]}
              </button>
              <button
                onClick={() => running[p] ? handleStop(p) : handleStart(p)}
                className={`px-3 py-1 rounded text-xs font-medium text-white ${
                  running[p]
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {running[p] ? '停止' : '开始'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className={`rounded-lg p-3 ${colorMap[color] || colorMap.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
};

export default Dashboard;
