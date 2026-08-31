import React from 'react';
import { cn, formatBloodGroup } from '../../lib/utils.js';
import { BloodGroup } from '../../types/index.js';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'crimson' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className,
}) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    crimson: 'bg-crimson-50 text-crimson-700 border-crimson-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const BloodGroupBadge: React.FC<{ bloodGroup?: BloodGroup | string | null; className?: string }> = ({
  bloodGroup,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold px-2.5 py-0.5 text-xs rounded-md bg-crimson-50 text-crimson-700 border border-crimson-200 shadow-2xs',
        className
      )}
    >
      {formatBloodGroup(bloodGroup)}
    </span>
  );
};

export const EligibilityBadge: React.FC<{ isEligible: boolean; className?: string }> = ({
  isEligible,
  className,
}) => {
  return isEligible ? (
    <Badge variant="success" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5" />
      Eligible
    </Badge>
  ) : (
    <Badge variant="warning" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />
      Ineligible
    </Badge>
  );
};
