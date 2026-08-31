import React from 'react';
import { LucideIcon, HeartHandshake } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HeartHandshake,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/60 transition-all animate-fade-in',
        className
      )}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200/80 text-rose-600 mb-4 transition-transform hover:scale-105">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
