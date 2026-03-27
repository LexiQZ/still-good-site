
import React from 'react';
import { D2CStore } from './components/D2CStore';

const App: React.FC = () => {
  // 直接渲染 D2C 商店演示页面，保持 UI 结构的稳定性
  return (
    <div className="min-h-screen bg-white">
      <D2CStore onBack={() => {}} />
    </div>
  );
};

export default App;
