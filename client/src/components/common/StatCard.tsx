import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card.js';
import { cn } from '../../lib/utils.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'crimson' | 'emerald' | 'blue' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'crimson',
}) => {
  const colorMap = {
    crimson: 'bg-crimson-50 text-crimson-600 border-crimson-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <Card className="p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all border border-slate-200/80">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className={cn('p-3.5 rounded-xl border flex items-center justify-center shrink-0', colorMap[color])}>
        <Icon className="w-6 h-6" />
      </div>
    </Card>
  );
};
