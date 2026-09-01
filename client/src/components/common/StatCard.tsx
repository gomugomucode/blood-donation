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
    crimson: 'bg-[#FFF0F2] text-[#D92D45] border-[#FFE4E8]',
    emerald: 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]',
    blue: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]',
    amber: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]',
    indigo: 'bg-[#FAF5FF] text-[#7E22CE] border-[#F3E8FF]',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-card hover:shadow-card-hover transition-all duration-200 flex items-start justify-between gap-4',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider truncate">
          {title}
        </p>
        <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight font-mono tabular-nums">
          {value}
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-md font-mono',
                trend.isPositive ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FFF0F2] text-[#D92D45]'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-[#667085] font-medium truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div
        className={cn(
          'p-3.5 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200',
          colorMap[color]
        )}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
};
