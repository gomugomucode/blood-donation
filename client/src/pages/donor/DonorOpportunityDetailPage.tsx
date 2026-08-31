import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Heart,
  HelpCircle,
} from 'lucide-react';
import {
  useDonorOpportunity,
  useAcceptOpportunity,
  useDeclineOpportunity,
} from '../../hooks/useOpportunities.js';
import { opportunityService } from '../../services/opportunity.service.js';
import { DeclineReason } from '../../types/opportunity.js';
import {
  BloodGroupBadge,
  RequestUrgencyBadge,
  OpportunityStatusBadge,
} from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Modal } from '../../components/common/Modal.js';
import { Select } from '../../components/common/Select.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { formatDate } from '../../lib/utils.js';

export const DonorOpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: opportunity, isLoading, isError, error, refetch } = useDonorOpportunity(id);
  const acceptMutation = useAcceptOpportunity(id!);
  const declineMutation = useDeclineOpportunity(id!);

  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState<DeclineReason>('NOT_AVAILABLE');
  const [declineNotes, setDeclineNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-mark as viewed on initial load if pending
  useEffect(() => {
    if (opportunity && opportunity.status === 'PENDING' && id) {
      opportunityService.viewOpportunity(id).catch(console.error);
    }
  }, [opportunity?.status, id]);

  if (isLoading) {
    return (
      <Card className="p-12 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Loading opportunity details..." />
      </Card>
    );
  }

  if (isError || !opportunity) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Opportunity not found"
          message={(error as Error)?.message || 'Unable to retrieve the requested donation opportunity.'}
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  const req = opportunity.bloodRequest;
  const isActionable = opportunity.status === 'PENDING' || opportunity.status === 'VIEWED';
  const isAccepted = opportunity.status === 'ACCEPTED';
  const isFulfilled = opportunity.status === 'FULFILLED';
  const isDeclined = opportunity.status === 'DECLINED';
  const isExpired = opportunity.status === 'EXPIRED';
  const isCancelled = opportunity.status === 'CANCELLED';

  const handleAccept = async () => {
    try {
      setErrorMessage(null);
      await acceptMutation.mutateAsync();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to accept opportunity.'
      );
    }
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      await declineMutation.mutateAsync({
        reason: declineReason,
        notes: declineNotes || undefined,
      });
      setIsDeclineModalOpen(false);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to decline opportunity.'
      );
    }
  };

  const declineOptions = [
    { value: 'NOT_AVAILABLE', label: 'Not available / Busy during this time' },
    { value: 'CANNOT_TRAVEL', label: 'Cannot travel to the collection facility' },
    { value: 'RECENTLY_DONATED', label: 'Recently donated elsewhere' },
    { value: 'OTHER', label: 'Other personal reason' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link & Title */}
      <div>
        <Link
          to="/dashboard/opportunities"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Opportunities
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-crimson-600" />
              Donation Opportunity
            </h1>
            <BloodGroupBadge bloodGroup={req.bloodGroup} />
            <RequestUrgencyBadge urgency={req.urgency} />
            <OpportunityStatusBadge status={opportunity.status} />
          </div>
        </div>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Basic Screening Notice: </span>
          This alert is based on application-level blood group compatibility and donation interval guidelines. Final eligibility confirmation and blood safety screening are conducted at the facility prior to donation.
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Opportunity Status Hero Banner */}
      {isAccepted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-base">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            Thank you! You have accepted this donation opportunity.
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">
            The clinical coordination team has been notified. They will contact you via your registered contact number to confirm appointment timing and arrival guidelines at <strong>{req.hospitalName}</strong>.
          </p>
        </div>
      )}

      {isFulfilled && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-base">
            <Heart className="w-6 h-6 text-crimson-600 fill-crimson-600 shrink-0" />
            Donation Procedure Completed & Request Fulfilled!
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Your verified blood donation for this request has been recorded. Thank you for saving lives!
          </p>
        </div>
      )}

      {isDeclined && (
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-700 text-xs flex items-center gap-2">
          <XCircle className="w-5 h-5 text-slate-500 shrink-0" />
          You declined this opportunity ({opportunity.declineReason || 'Not available'}). We will notify you when other opportunities arise.
        </div>
      )}

      {isExpired && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-xs flex items-center gap-2">
          <Clock className="w-5 h-5 text-red-500 shrink-0" />
          This donation opportunity has expired.
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
          This request was cancelled by the clinical coordination center.
        </div>
      )}

      {/* Main Details Card */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Facility & Requirement Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Hospital / Facility</span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {req.hospitalName}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Location / City</span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {req.location}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Needed By Deadline</span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formatDate(req.requiredBy)}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Match Compatibility</span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Match Score: {opportunity.matchScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Screening Explanation Card */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-1.5">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Match Screening Breakdown
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {opportunity.matchReason}
          </p>
        </div>

        {/* Action Buttons */}
        {isActionable && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeclineModalOpen(true)}
              className="w-full sm:w-auto text-slate-600 hover:text-slate-900"
            >
              I Can't Help This Time
            </Button>

            <Button
              variant="primary"
              onClick={handleAccept}
              isLoading={acceptMutation.isPending}
              className="w-full sm:w-auto shadow-md shadow-crimson-600/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              I'm Available to Donate
            </Button>
          </div>
        )}
      </Card>

      {/* Decline Reason Modal */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        title="Decline Opportunity"
        description="Let the coordinators know why you cannot donate for this request (optional)."
      >
        <form onSubmit={handleDeclineSubmit} className="space-y-4">
          <div>
            <Select
              label="Reason for Declining"
              options={declineOptions}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value as DeclineReason)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Optional Note (Non-sensitive)
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-500"
              rows={3}
              placeholder="e.g. Traveling until Friday"
              value={declineNotes}
              onChange={(e) => setDeclineNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeclineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={declineMutation.isPending}
            >
              Confirm Decline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
