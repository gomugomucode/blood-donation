import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { useDonorOpportunities } from '../../hooks/useOpportunities.js';
import { OpportunityStatus } from '../../types/opportunity.js';
import {
  BloodGroupBadge,
  RequestUrgencyBadge,
  OpportunityStatusBadge,
} from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { formatDate } from '../../lib/utils.js';

export const DonorOpportunitiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'ACCEPTED' | 'PAST'>('ACTIVE');

  let statusFilter: OpportunityStatus | undefined;
  if (filterTab === 'ACCEPTED') statusFilter = 'ACCEPTED';

  const { data, isLoading, isError, error, refetch } = useDonorOpportunities({
    page,
    limit: 10,
    status: statusFilter,
  });

  const filteredItems = (data?.items || []).filter((opp) => {
    if (filterTab === 'ACTIVE') {
      return opp.status === 'PENDING' || opp.status === 'VIEWED';
    }
    if (filterTab === 'PAST') {
      return (
        opp.status === 'DECLINED' ||
        opp.status === 'EXPIRED' ||
        opp.status === 'CANCELLED' ||
        opp.status === 'FULFILLED'
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-[#D92D45]" />
            Donation Opportunities
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#667085]">
            Verified hospital blood requests in your region compatible with your blood group.
          </p>
        </div>
      </div>

      {/* Screening Notice Banner */}
      <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] p-4 text-xs text-[#78350F] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#92400E]">Basic Screening Match: </span>
          Opportunities represent potential compatibility matches. Final donor eligibility and crossmatching are performed at the clinical collection facility before donation.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3 overflow-x-auto">
        {(['ACTIVE', 'ACCEPTED', 'PAST', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilterTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
              filterTab === tab
                ? 'bg-[#D92D45] text-white shadow-xs'
                : 'text-[#667085] hover:bg-[#FAF9F7] hover:text-[#1F2937]'
            }`}
          >
            {tab === 'ACTIVE' && 'Active Opportunities'}
            {tab === 'ACCEPTED' && 'Accepted'}
            {tab === 'PAST' && 'Past & Completed'}
            {tab === 'ALL' && 'All Requests'}
          </button>
        ))}
      </div>

      {/* Opportunities List Content */}
      {isLoading ? (
        <Card className="p-12 flex justify-center items-center">
          <LoadingSpinner size="lg" label="Loading donation opportunities..." />
        </Card>
      ) : isError ? (
        <Card className="p-8">
          <ErrorState
            title="Failed to load opportunities"
            message={(error as Error)?.message || 'An error occurred while retrieving opportunities.'}
            onRetry={() => refetch()}
          />
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={HeartHandshake}
            title={
              filterTab === 'ACTIVE'
                ? 'No active opportunities right now'
                : 'No opportunities found in this category'
            }
            description="When a regional hospital or clinic submits a compatible blood request, outreach notifications will appear here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((opp) => {
            const req = opp.bloodRequest;
            const isPendingOrViewed = opp.status === 'PENDING' || opp.status === 'VIEWED';

            return (
              <Card
                key={opp.id}
                className="p-5 hover:border-[#D6D3D1] transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <BloodGroupBadge bloodGroup={req.bloodGroup} />
                      <RequestUrgencyBadge urgency={req.urgency} />
                      <OpportunityStatusBadge status={opp.status} />
                      <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF9F7] text-[#667085] border border-[#E7E5E4] font-mono">
                        Match Score: {opp.matchScore}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#1F2937] group-hover:text-[#D92D45] transition-colors">
                        {req.hospitalName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#667085] mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          {req.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          Needed by {formatDate(req.requiredBy)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          Sent {formatDate(opp.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#667085] bg-[#FAF9F7] p-2.5 rounded-xl border border-[#E7E5E4] max-w-2xl">
                      {opp.matchReason}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E7E5E4]/80">
                    <Link to={`/dashboard/opportunities/${opp.id}`}>
                      <Button
                        variant={isPendingOrViewed ? 'primary' : 'outline'}
                        size="sm"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {isPendingOrViewed ? 'Review Opportunity' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <Card className="p-4">
          <Pagination
            pagination={data.pagination}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
};
