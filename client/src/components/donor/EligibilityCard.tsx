import React from 'react';
import { CheckCircle2, AlertTriangle, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { EligibilityResult } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';

export interface EligibilityCardProps {
  eligibility: EligibilityResult | null | undefined;
  className?: string;
}

export const EligibilityCard: React.FC<EligibilityCardProps> = ({ eligibility, className }) => {
  if (!eligibility) return null;

  const { isEligible, reason, nextEligibleDate, daysUntilEligible, criteria, disclaimer } = eligibility;

  return (
    <div className={`bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E5E4] shadow-card space-y-6 ${className || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7E5E4]/80">
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D92D45]" />
            <h2 className="text-lg font-bold text-[#1F2937] tracking-tight">
              Basic Donation Eligibility
            </h2>
          </div>
          <p className="text-xs text-[#667085]">
            Algorithmic safety screening based on age and interval cooldowns.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase select-none ${
            isEligible
              ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]'
              : 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]'
          }`}
        >
          {isEligible ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
              Basic Screening Passed
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              Cadence Cooldown Active
            </>
          )}
        </span>
      </div>

      <div className="space-y-4 text-left">
        <div
          className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3.5 ${
            isEligible
              ? 'bg-[#F0FDF4]/70 border-[#DCFCE7] text-[#14532D]'
              : 'bg-[#FFFBEB]/70 border-[#FEF3C7] text-[#78350F]'
          }`}
        >
          {isEligible ? (
            <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold leading-snug">{reason}</p>
            {!isEligible && nextEligibleDate && (
              <p className="text-xs text-[#92400E] flex items-center gap-1 font-semibold pt-1">
                <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
                Next projected eligible date:{' '}
                <span className="font-extrabold font-mono text-[#78350F]">{formatDate(nextEligibleDate)}</span>
                {daysUntilEligible !== null && ` (${daysUntilEligible} days remaining)`}
              </p>
            )}
          </div>
        </div>

        {/* Criteria Checklist Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] text-xs">
            <span className="text-[#667085] font-medium">Age Requirement (18–65 yrs)</span>
            <span
              className={`font-bold font-mono ${
                criteria.ageEligible ? 'text-[#15803D]' : 'text-[#B42318]'
              }`}
            >
              {criteria.calculatedAge} yrs {criteria.ageEligible ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] text-xs">
            <span className="text-[#667085] font-medium">Cadence (56+ days)</span>
            <span
              className={`font-bold font-mono ${
                criteria.intervalEligible ? 'text-[#15803D]' : 'text-[#B45309]'
              }`}
            >
              {criteria.daysSinceLastDonation !== null
                ? `${criteria.daysSinceLastDonation} days ago`
                : 'No prior records'}{' '}
              {criteria.intervalEligible ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Mandatory Clinical Disclaimer */}
        <div className="flex items-start gap-2.5 p-3.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-2xl text-2xs text-[#667085] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#667085] shrink-0 mt-0.5" />
          <p>
            <strong>Screening Indicator:</strong> {disclaimer || 'Basic screening indicators are informational only and do not constitute medical clearance or replace certified on-site clinical assessment.'}
          </p>
        </div>
      </div>
    </div>
  );
};
