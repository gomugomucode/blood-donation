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
    neutral: 'bg-[#FAF9F7] text-[#667085] border-[#E7E5E4]',
    success: 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7] font-medium',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7] font-medium',
    danger: 'bg-[#FEF2F2] text-[#B42318] border-[#FEE2E2] font-medium',
    crimson: 'bg-[#FFF0F2] text-[#D92D45] border-[#FFE4E8] font-semibold',
    info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE] font-medium',
    purple: 'bg-[#FAF5FF] text-[#7E22CE] border-[#F3E8FF] font-medium',
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
        'inline-flex items-center justify-center rounded-lg bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] shadow-2xs font-mono select-none',
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
      <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] mr-0.5" />
      Basic Eligibility Confirmed
    </Badge>
  ) : (
    <Badge variant="warning" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] mr-0.5" />
      Cadence Cooldown Active
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
            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FEF2F2] text-[#B42318] border border-[#FEE2E2] shadow-xs',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-[#B42318] shrink-0" />
          CRITICAL URGENCY
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7] shadow-xs',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
          HIGH PRIORITY
        </span>
      );
    case 'NORMAL':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]',
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
            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-[#FAF9F7] text-[#667085] border border-[#E7E5E4]',
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
