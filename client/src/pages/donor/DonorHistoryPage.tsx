import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { donorService } from '../../services/donor.service.js';
import { DonationHistory } from '../../components/donor/DonationHistory.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';

export const DonorHistoryPage: React.FC = () => {
  const {
    data: donations,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['donor', 'donations'],
    queryFn: () => donorService.getDonations(),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading donation history records..." />;
  }

  if (isError || !donations) {
    return (
      <ErrorState
        title="Could not load donations"
        message="Unable to fetch verified donation history."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personal Donation History</h1>
        <p className="text-xs text-slate-500">
          Chronological record of all verified clinical blood donation procedures.
        </p>
      </div>

      <DonationHistory donations={donations} />
    </div>
  );
};
