
import React from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Layout, 
  Milestone,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'overview', label: 'Proposal Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'strategies', label: 'Monetisation Options', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'demo', label: 'The Archive Demo', icon: <Layout className="w-5 h-5" /> },
    { id: 'roadmap', label: 'Next Steps & Roadmap', icon: <Milestone className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50 
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">SURPLUS</h1>
              <div className="h-0.5 w-8 bg-black"></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between p-4 rounded-xl transition-all
                  ${activeTab === item.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">Draft Version 1.2</p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">LC</div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900">Linda Chen</p>
                <p className="text-[10px] text-slate-500 truncate">Recipient of Proposal</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
