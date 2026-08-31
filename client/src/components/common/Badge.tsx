import React from 'react';
import { cn, formatBloodGroup } from '../../lib/utils.js';
import { BloodGroup } from '../../types/index.js';
import { RequestStatus, RequestUrgency } from '../../types/blood-request.js';
import { OpportunityStatus } from '../../types/opportunity.js';
import { AlertCircle, Clock, CheckCircle2, XCircle, Eye, Check } from 'lucide-react';

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

export const RequestUrgencyBadge: React.FC<{ urgency: RequestUrgency; className?: string }> = ({
  urgency,
  className,
}) => {
  switch (urgency) {
    case 'CRITICAL':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-md bg-red-100 text-red-800 border border-red-300 animate-pulse',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          HIGH
        </span>
      );
    case 'NORMAL':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200',
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
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200',
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
          Partial
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
          Pending
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
          Accepted
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
          Fulfilled
        </Badge>
      );
    default:
      return <Badge className={className}>{status}</Badge>;
  }
};
