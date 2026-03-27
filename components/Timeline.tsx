
import React from 'react';

interface Phase {
  number: number;
  title: string;
  items: string[];
  duration: string;
}

export const Timeline: React.FC<{ phases: Phase[] }> = ({ phases }) => {
  return (
    <div className="space-y-16">
      {phases.map((phase, idx) => (
        <div key={idx} className="flex gap-12 group">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-black flex items-center justify-center font-bold text-sm bg-white group-hover:bg-black group-hover:text-white transition-colors duration-500">
              {phase.number}
            </div>
            {idx !== phases.length - 1 && (
              <div className="w-px h-full bg-slate-100 my-4"></div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-baseline justify-between border-b pb-2">
              <h3 className="text-xl font-bold">{phase.title}</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{phase.duration}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {phase.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-300"></div>
                  <span className="text-sm text-slate-600 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
