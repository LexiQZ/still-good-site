
import React from 'react';
import { FileText, X } from 'lucide-react';

interface TOCProps {
  scrollToSection: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const TableOfContents: React.FC<TOCProps> = ({ scrollToSection, isOpen, setIsOpen }) => {
  const links = [
    { id: 'cover', label: 'Cover Page', page: '01' },
    { id: 'summary', label: 'Executive Summary', page: '02' },
    { id: 'structure', label: 'Inventory Analysis', page: '03' },
    { id: 'constraints', label: 'Strategic Constraints', page: '04' },
    { id: 'options', label: 'Strategic Options', page: '05' },
    { id: 'benchmark', label: 'Benchmark Context', page: '07' },
    { id: 'risks', label: 'Risk Assessment', page: '08' },
    { id: 'roadmap', label: 'Roadmap & Execution', page: '09' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      <aside className={`
        fixed left-0 top-0 h-full w-72 bg-[#F8FAFC] border-r z-50 transition-transform duration-500
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-blue-600"></div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-900">Index</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-10">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="group w-full flex items-baseline justify-between text-left"
              >
                <div className="space-y-0.5">
                  <span className="block text-[8px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-[0.2em]">0{link.page.startsWith('0') ? link.page.substring(1) : link.page}</span>
                  <span className="block text-xs font-bold text-slate-600 group-hover:text-black transition-colors">{link.label}</span>
                </div>
                <div className="h-px bg-slate-100 flex-1 mx-4 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[9px] font-mono text-slate-300 group-hover:text-black">{link.page}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-6 pt-10 border-t text-[9px] font-bold tracking-widest uppercase text-slate-400">
            <div className="flex flex-col gap-1">
              <p className="text-[7px] text-slate-300">Originating Brand</p>
              <p className="text-slate-900">Still Good Archive</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[7px] text-slate-300">Strategic Ref</p>
              <p className="text-slate-900">Internal Use Only</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
