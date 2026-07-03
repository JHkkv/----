import React, { useEffect, useState, useCallback } from 'react';
import type { Application, PlatformId } from '../../../shared/types';
import { PLATFORM_NAMES } from '../shared/constants';
import { useWs } from './useWs';

const statusLabels: Record<string, string> = {
  sent: '已投递',
  read: '已读',
  replied: '已回复',
  rejected: '不合适',
  ignored: '无回应',
};

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  read: 'bg-green-100 text-green-700',
  replied: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  ignored: 'bg-gray-100 text-gray-500',
};

const ApplicationsList: React.FC = () => {
  const { connected, send } = useWs();
  const [apps, setApps] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchApps = useCallback(async (p: number) => {
    if (!connected) return;
    const res = await send({ type: 'apps:list', payload: { page: p, limit: 20 } });
    if (res.success && res.data) {
      const data = res.data as any;
      setApps(data.items || []);
      setTotal(data.total || 0);
    }
  }, [connected, send]);

  useEffect(() => {
    fetchApps(page);
  }, [fetchApps, page]);

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm">投递记录 ({total})</h2>

      {apps.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">暂无记录</p>
      ) : (
        apps.map(app => (
          <div key={app.id} className="bg-white rounded-lg p-3 shadow-sm text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium truncate max-w-[200px]">{app.position}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[app.status] || statusColors.sent}`}>
                {statusLabels[app.status] || app.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>{app.company}</span>
              <span>{PLATFORM_NAMES[app.platform as PlatformId] || app.platform}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {app.sentAt}
            </div>
          </div>
        ))
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 text-xs rounded border disabled:opacity-30"
          >
            上一页
          </button>
          <span className="text-xs py-1 text-gray-500">第 {page} 页</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 text-xs rounded border disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
