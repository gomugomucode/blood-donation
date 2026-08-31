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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-crimson-600/30 text-crimson-300 text-2xs font-bold uppercase tracking-wider">
            <HeartHandshake className="w-3.5 h-3.5" />
            Active Voluntary Donor
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile.fullName}
          </h1>
          <p className="text-xs text-slate-300">
            Thank you for being part of the voluntary blood donation network.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link to="/profile" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700"
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

      {/* Active Opportunities Alert Banner */}
      {activeOpportunities.length > 0 && (
        <Card className="border-crimson-200 bg-gradient-to-r from-crimson-50/90 to-rose-50/70 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-crimson-600 animate-bounce" />
                <span className="text-sm font-bold text-crimson-950">
                  {activeOpportunities.length} Urgent Donation Opportunity Available
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                A hospital or patient in your area requires {profile.bloodGroup.replace('_', ' ')} blood. Review the details to confirm if you can help.
              </p>
            </div>

            <Link to="/dashboard/opportunities">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-xs shadow-crimson-600/20"
              >
                Review Opportunities
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Metrics Row */}
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
              : `${totalDonationsCount * 3} potential lives impacted`
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
              : 'No previous donations on record'
          }
          icon={HeartHandshake}
          color="blue"
        />
      </div>

      {/* Main Grid: Eligibility & Profile Summary */}
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
