import React from 'react';
import { cn, formatBloodGroup } from '../../lib/utils.js';
import { BloodGroup } from '../../types/index.js';
import { RequestStatus, RequestUrgency } from '../../types/blood-request.js';
import { OpportunityStatus } from '../../types/opportunity.js';
import { AlertCircle, Clock, CheckCircle2, XCircle, Eye, Check, Bell } from 'lucide-react';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'crimson' | 'info' | 'purple';
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
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80 font-medium',
    danger: 'bg-red-50 text-red-800 border-red-200/80 font-medium',
    crimson: 'bg-rose-50 text-rose-800 border-rose-200/80 font-semibold',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80 font-medium',
    purple: 'bg-indigo-50 text-indigo-800 border-indigo-200/80 font-medium',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const BloodGroupBadge: React.FC<{ bloodGroup?: BloodGroup | string | null; className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  bloodGroup,
  className,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-bold',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3.5 py-1.5 text-sm font-extrabold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-rose-50 text-rose-800 border border-rose-200/90 shadow-2xs font-mono select-none',
        sizeStyles[size],
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
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5 animate-pulse" />
      Eligible
    </Badge>
  ) : (
    <Badge variant="warning" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />
      Not Eligible
    </Badge>
  );
};

export const RequestUrgencyBadge: React.FC<{ urgency: RequestUrgency; className?: string }> = ({
  urgency,
  className,
}) => {
  switch (urgency) {
    case 'CRITICAL':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-900 border border-red-300 shadow-xs animate-pulse-subtle',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          CRITICAL URGENCY
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 shadow-xs',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          HIGH
        </span>
      );
    case 'NORMAL':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-800 border border-blue-200/90',
            className
          )}
        >
          NORMAL
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200/90',
            className
          )}
        >
          LOW
        </span>
      );
  }
};

export const RequestStatusBadge: React.FC<{ status: RequestStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'OPEN':
      return (
        <Badge variant="info" className={className}>
          <Clock className="w-3 h-3 mr-0.5" />
          Open
        </Badge>
      );
    case 'PARTIALLY_FULFILLED':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="w-3 h-3 mr-0.5" />
          Partially Fulfilled
        </Badge>
      );
    case 'FULFILLED':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3 h-3 mr-0.5" />
          Fulfilled
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="neutral" className={className}>
          <XCircle className="w-3 h-3 mr-0.5" />
          Cancelled
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="danger" className={className}>
          <Clock className="w-3 h-3 mr-0.5" />
          Expired
        </Badge>
      );
    default:
      return <Badge className={className}>{status}</Badge>;
  }
};

export const OpportunityStatusBadge: React.FC<{ status: OpportunityStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="info" className={className}>
          <Clock className="w-3 h-3 mr-0.5" />
          Pending Review
        </Badge>
      );
    case 'VIEWED':
      return (
        <Badge variant="warning" className={className}>
          <Eye className="w-3 h-3 mr-0.5" />
          Viewed
        </Badge>
      );
    case 'ACCEPTED':
      return (
        <Badge variant="success" className={className}>
          <Check className="w-3 h-3 mr-0.5" />
          Accepted (Available)
        </Badge>
      );
    case 'DECLINED':
      return (
        <Badge variant="neutral" className={className}>
          <XCircle className="w-3 h-3 mr-0.5" />
          Declined
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="danger" className={className}>
          <Clock className="w-3 h-3 mr-0.5" />
          Expired
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="neutral" className={className}>
          <XCircle className="w-3 h-3 mr-0.5" />
          Cancelled
        </Badge>
      );
    case 'FULFILLED':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3 h-3 mr-0.5" />
          Donation Completed
        </Badge>
      );
    default:
      return <Badge className={className}>{status}</Badge>;
  }
};

export const NotificationStatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'READ':
      return (
        <Badge variant="neutral" className={className}>
          <Check className="w-3 h-3 mr-0.5" />
          Read
        </Badge>
      );
    case 'SENT':
      return (
        <Badge variant="info" className={className}>
          <Bell className="w-3 h-3 mr-0.5" />
          Delivered
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="danger" className={className}>
          <AlertCircle className="w-3 h-3 mr-0.5" />
          Failed
        </Badge>
      );
    default:
      return <Badge className={className}>{status}</Badge>;
  }
};
