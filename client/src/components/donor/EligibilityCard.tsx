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
    <div className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-6 ${className || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Basic Donation Eligibility
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Algorithmic safety check based on age and previous donation intervals.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${
            isEligible
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
              : 'bg-amber-50 text-amber-900 border-amber-200 shadow-2xs'
          }`}
        >
          {isEligible ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Basic Screening Passed
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Interval Cooldown Active
            </>
          )}
        </span>
      </div>

      <div className="space-y-4">
        <div
          className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3.5 ${
            isEligible
              ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
              : 'bg-amber-50/60 border-amber-100 text-amber-950'
          }`}
        >
          {isEligible ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold leading-snug">{reason}</p>
            {!isEligible && nextEligibleDate && (
              <p className="text-xs text-amber-900 flex items-center gap-1 font-semibold pt-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                Next projected eligible date:{' '}
                <span className="font-extrabold font-mono text-amber-950">{formatDate(nextEligibleDate)}</span>
                {daysUntilEligible !== null && ` (${daysUntilEligible} days cooldown remaining)`}
              </p>
            )}
          </div>
        </div>

        {/* Criteria Checklist Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">Age Requirement (18–65 yrs)</span>
            <span
              className={`font-bold font-mono ${
                criteria.ageEligible ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {criteria.calculatedAge} yrs {criteria.ageEligible ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">Interval (56+ days minimum)</span>
            <span
              className={`font-bold font-mono ${
                criteria.intervalEligible ? 'text-emerald-700' : 'text-amber-800'
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
        <div className="flex items-start gap-2.5 p-3.5 bg-slate-100/70 border border-slate-200/80 rounded-2xl text-2xs text-slate-600 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong>Screening Disclaimer:</strong> {disclaimer || 'Basic screening indicators are informational only and do not constitute medical clearance or replace professional blood-bank screening.'}
          </p>
        </div>
      </div>
    </div>
  );
};
