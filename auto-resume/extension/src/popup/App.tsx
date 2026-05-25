import React, { useState } from 'react';
import { useWs } from './useWs';

const tabs = ['仪表盘', '简历', '目标', '记录'] as const;
type Tab = typeof tabs[number];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('仪表盘');
  const { connected } = useWs();

  return (
    <div className="flex flex-col h-[600px] bg-gray-50">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="font-bold text-lg">Auto Resume</h1>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-400'}`} />
      </header>
      <nav className="flex border-b bg-white shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-400 text-center mt-10">组件开发中...</p>
      </main>
    </div>
  );
};

export default App;
