
import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface StrategyCardProps {
  title: string;
  option: string;
  description: string;
  pros: string[];
  cons: string[];
  risk: string;
  speed: string;
  margin: string;
  icon: React.ReactNode;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({ 
  title, option, description, pros, cons, risk, speed, margin, icon 
}) => {
  const getBadgeColor = (val: string) => {
    if (val === 'High' || val === 'Fast') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (val === 'Low' || val === 'Slow') return 'bg-slate-50 text-slate-700 border-slate-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 text-slate-900 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="space-y-2 mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{option}</span>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="text-center">
          <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Margin</div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${getBadgeColor(margin)}`}>{margin}</span>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Speed</div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${getBadgeColor(speed)}`}>{speed}</span>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Risk</div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${getBadgeColor(risk)}`}>{risk}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pros
          </p>
          <ul className="space-y-1">
            {pros.map((p, i) => (
              <li key={i} className="text-sm font-medium text-slate-700">{p}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-400" /> Cons
          </p>
          <ul className="space-y-1">
            {cons.map((c, i) => (
              <li key={i} className="text-sm font-medium text-slate-400">{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
