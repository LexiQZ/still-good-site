
import React from 'react';
import { Clock, TrendingUp, Zap } from 'lucide-react';

export const StrategyMatrix: React.FC = () => {
  const data = [
    {
      label: 'Option A: Marketplace',
      speed: 'Fast',
      margin: 'Medium',
      complexity: 'Low',
      desc: 'Immediate liquidation via eBay/Depop/Vinted to test demand.'
    },
    {
      label: 'Option B: Curated Archive',
      speed: 'Slow',
      margin: 'High',
      complexity: 'High',
      desc: 'Premium D2C platform with style-driven storytelling.'
    },
    {
      label: 'Option C: Hybrid (Recommended)',
      speed: 'Moderate',
      margin: 'Optimized',
      complexity: 'Moderate',
      desc: 'Phase-based approach: Validate on platforms, scale via D2C.'
    }
  ];

  return (
    <div className="overflow-x-auto border border-slate-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">Strategic Pathway</th>
            <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">Liquidity Speed</th>
            <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">Margin Potential</th>
            <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">Strategic Fit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
              <td className="p-5">
                <p className="text-xs font-bold text-slate-900">{row.label}</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-snug">{row.desc}</p>
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span className={`text-[10px] font-bold uppercase ${row.speed === 'Slow' ? 'text-amber-600' : 'text-emerald-600'}`}>{row.speed}</span>
                </div>
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
                  {row.margin}
                </div>
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2">
                  {idx === 2 ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-600 text-white rounded-full">
                      <Zap className="w-2.5 h-2.5" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Recommended</span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">Alternative</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
