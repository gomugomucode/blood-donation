import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { donorService } from '../../services/donor.service.js';
import { useDonorOpportunities } from '../../hooks/useOpportunities.js';
import { StatCard } from '../../components/common/StatCard.js';
import { EligibilityCard } from '../../components/donor/EligibilityCard.js';
import { DonorCard } from '../../components/donor/DonorCard.js';
import { Card } from '../../components/common/Card.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { Button } from '../../components/common/Button.js';
import { Droplet, History, User, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';

export const DonorDashboardPage: React.FC = () => {
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: () => donorService.getProfile(),
  });

  const {
    data: donations,
    isLoading: isDonationsLoading,
  } = useQuery({
    queryKey: ['donor', 'donations'],
    queryFn: () => donorService.getDonations(),
  });

  const { data: opportunitiesData } = useDonorOpportunities({ limit: 5 });

  if (isProfileLoading || isDonationsLoading) {
    return <LoadingSpinner label="Loading your donor dashboard..." />;
  }

  if (isProfileError || !profile) {
    return (
      <ErrorState
        title="Could not load donor profile"
        message="Please check your connection and try again."
        onRetry={() => refetchProfile()}
      />
    );
  }

  const totalDonationsCount = donations?.length || 0;
  const activeOpportunities = (opportunitiesData?.items || []).filter(
    (opp) => opp.status === 'PENDING' || opp.status === 'VIEWED'
  );

  return (
    <div className="space-y-6 text-left">
      {/* 1. Warm Healthcare Welcome Banner */}
      <div className="bg-[#FFF7F8] border border-[#FFE4E8] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F2] text-[#D92D45] text-xs font-bold uppercase tracking-wider border border-[#FFE4E8]">
            <HeartHandshake className="w-3.5 h-3.5 text-[#D92D45]" />
            Registered Voluntary Donor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
            Welcome back, {profile.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085]">
            Thank you for being part of the verified regional blood donation network.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link to="/profile" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              leftIcon={<User className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>
          </Link>
          <Link to="/history" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              leftIcon={<History className="w-3.5 h-3.5" />}
            >
              Donation History
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Active Opportunities Alert Card */}
      {activeOpportunities.length > 0 && (
        <Card className="border-[#FFE4E8] bg-white p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D92D45]" />
                <span className="text-sm font-bold text-[#1F2937]">
                  {activeOpportunities.length} Urgent Donation Opportunity Available
                </span>
              </div>
              <p className="text-xs text-[#667085] max-w-xl">
                A verified hospital care team in your region requires {profile.bloodGroup.replace('_', ' ')} blood. Review request details to indicate your availability.
              </p>
            </div>

            <Link to="/dashboard/opportunities">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Review Opportunities
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 3. Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Blood Group"
          value={profile.bloodGroup.replace('_', ' ')}
          subtitle="Registered blood typing"
          icon={Droplet}
          color="crimson"
        />

        <StatCard
          title="Total Lifetime Donations"
          value={totalDonationsCount}
          subtitle={
            totalDonationsCount === 0
              ? 'Ready for first donation'
              : `${totalDonationsCount * 3} potential lives supported`
          }
          icon={History}
          color="emerald"
        />

        <StatCard
          title="Last Recorded Donation"
          value={formatDate(profile.lastDonationAt)}
          subtitle={
            profile.lastDonationAt
              ? 'Standard whole blood collection'
              : 'No prior records on file'
          }
          icon={HeartHandshake}
          color="blue"
        />
      </div>

      {/* 4. Main Grid: Eligibility & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <EligibilityCard eligibility={profile.eligibility} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <DonorCard profile={profile} />
        </div>
      </div>
    </div>
  );
};
