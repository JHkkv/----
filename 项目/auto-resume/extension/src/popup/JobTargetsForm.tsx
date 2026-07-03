import React, { useState, useEffect } from 'react';
import type { JobTarget, PlatformId } from '../../../shared/types';
import { PLATFORM_NAMES } from '../shared/constants';
import { useWs } from './useWs';

const JobTargetsForm: React.FC = () => {
  const { connected, send } = useWs();
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!connected) return;
    send({ type: 'jobtargets:list' }).then(res => {
      if (res.success && res.data) {
        setTargets(res.data as JobTarget[]);
      }
    });
  }, [connected, send]);

  const addTarget = () => {
    setTargets(prev => [...prev, {
      id: Date.now(),
      keywords: [],
      cities: [],
      minSalary: 0,
      maxSalary: 0,
      platforms: ['boss'],
      active: true,
      createdAt: new Date().toISOString(),
    }]);
  };

  const removeTarget = (id: number) => {
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  const updateTarget = (id: number, field: keyof JobTarget, value: unknown) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const togglePlatform = (id: number, platform: PlatformId) => {
    setTargets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const platforms = t.platforms.includes(platform)
        ? t.platforms.filter(p => p !== platform)
        : [...t.platforms, platform];
      return { ...t, platforms };
    }));
  };

  const handleSave = async () => {
    const res = await send({ type: 'jobtargets:save', payload: { targets } });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  const allPlatforms: PlatformId[] = ['boss', 'wuyou', 'liepin', 'zhilian'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">目标职位</h2>
        <button onClick={addTarget} className="text-xs text-brand-600 hover:underline">+ 添加</button>
      </div>

      {targets.map((t, idx) => (
        <div key={t.id} className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">目标 #{idx + 1}</span>
            <button onClick={() => removeTarget(t.id)} className="text-xs text-red-500">删除</button>
          </div>
          <div>
            <label className="text-xs text-gray-500">关键词（逗号分隔）</label>
            <input
              className={inputClass}
              value={t.keywords.join(', ')}
              onChange={e => updateTarget(t.id, 'keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="前端开发, React"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">城市（逗号分隔）</label>
            <input
              className={inputClass}
              value={t.cities.join(', ')}
              onChange={e => updateTarget(t.id, 'cities', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="北京, 上海"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">最低薪资(k)</label>
              <input
                className={inputClass}
                type="number"
                value={t.minSalary}
                onChange={e => updateTarget(t.id, 'minSalary', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">最高薪资(k)</label>
              <input
                className={inputClass}
                type="number"
                value={t.maxSalary}
                onChange={e => updateTarget(t.id, 'maxSalary', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">平台</label>
            <div className="flex gap-1 flex-wrap">
              {allPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(t.id, p)}
                  className={`px-2 py-0.5 rounded text-xs ${
                    t.platforms.includes(p)
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {PLATFORM_NAMES[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {targets.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full bg-brand-600 text-white py-2 rounded font-medium text-sm hover:bg-brand-700 transition-colors"
        >
          {saved ? '已保存' : '保存目标'}
        </button>
      )}
    </div>
  );
};

export default JobTargetsForm;
