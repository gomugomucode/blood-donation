import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  color?: 'crimson' | 'emerald' | 'blue' | 'amber' | 'indigo';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'crimson',
  className,
}) => {
  const colorMap = {
    crimson: 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-500/5',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-500/5',
    blue: 'bg-blue-50 text-blue-700 border-blue-100 shadow-blue-500/5',
    amber: 'bg-amber-50 text-amber-800 border-amber-100 shadow-amber-500/5',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-500/5',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-start justify-between gap-4',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
          {value}
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded-md font-mono',
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div
        className={cn(
          'p-3.5 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105',
          colorMap[color]
        )}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
};
