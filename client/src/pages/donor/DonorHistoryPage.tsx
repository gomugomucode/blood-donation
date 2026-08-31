import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { donorService } from '../../services/donor.service.js';
import { DonationHistory } from '../../components/donor/DonationHistory.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { History, Award } from 'lucide-react';

export const DonorHistoryPage: React.FC = () => {
  const { data: donations, isLoading, isError, refetch } = useQuery({
    queryKey: ['donor', 'donations'],
    queryFn: () => donorService.getDonations(),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card flex justify-center items-center">
        <LoadingSpinner label="Loading donation history records..." />
      </div>
    );
  }

  if (isError || !donations) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">
        <ErrorState
          title="Could not load donation history"
          message="Failed to retrieve verified donation logs."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-rose-600 shrink-0" />
            Verified Donation History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Immutable log of all on-site blood donation procedures verified by clinical staff.
          </p>
        </div>

        {donations.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs font-mono">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{donations.length * 3} Lives Impacted</span>
          </div>
        )}
      </div>

      <DonationHistory donations={donations} />
    </div>
  );
};
