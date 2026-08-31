import React from 'react';
import { CheckCircle2, AlertTriangle, Calendar, Info, Clock } from 'lucide-react';
import { EligibilityResult } from '../../types/index.js';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card.js';
import { formatDate } from '../../lib/utils.js';

export interface EligibilityCardProps {
  eligibility: EligibilityResult | null | undefined;
  className?: string;
}

export const EligibilityCard: React.FC<EligibilityCardProps> = ({ eligibility, className }) => {
  if (!eligibility) return null;

  const { isEligible, reason, nextEligibleDate, daysUntilEligible, criteria, disclaimer } = eligibility;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson-600" />
            Donation Eligibility Status
          </CardTitle>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
              isEligible
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isEligible ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Eligible to Donate
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Temporarily Ineligible
              </>
            )}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div
          className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
            isEligible
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
              : 'bg-amber-50/50 border-amber-100 text-amber-900'
          }`}
        >
          {isEligible ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">{reason}</p>
            {!isEligible && nextEligibleDate && (
              <p className="mt-1 text-xs text-amber-800 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Next projected eligible date:{' '}
                <span className="font-bold">{formatDate(nextEligibleDate)}</span>
                {daysUntilEligible !== null && ` (${daysUntilEligible} days remaining)`}
              </p>
            )}
          </div>
        </div>

        {/* Criteria Checklist Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">Age Requirement (18–65 yrs)</span>
            <span
              className={`font-semibold ${
                criteria.ageEligible ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {criteria.calculatedAge} yrs {criteria.ageEligible ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">Donation Interval (56+ days)</span>
            <span
              className={`font-semibold ${
                criteria.intervalEligible ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {criteria.daysSinceLastDonation !== null
                ? `${criteria.daysSinceLastDonation} days ago`
                : 'No prior records'}{' '}
              {criteria.intervalEligible ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Prominent Mandatory Clinical Disclaimer */}
        <div className="flex items-start gap-2 p-3 bg-slate-100/70 border border-slate-200/60 rounded-lg text-2xs text-slate-500 leading-normal">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>{disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
};
