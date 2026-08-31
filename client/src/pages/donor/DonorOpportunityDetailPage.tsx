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
  Info,
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

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
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
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card flex justify-center items-center">
        <LoadingSpinner size="lg" label="Loading opportunity details..." />
      </div>
    );
  }

  if (isError || !opportunity) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">
        <ErrorState
          title="Opportunity not found"
          message={(error as Error)?.message || 'Unable to retrieve the requested donation opportunity.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const req = opportunity.bloodRequest;
  const isActionable = opportunity.status === 'PENDING' || opportunity.status === 'VIEWED';
  const isAccepted = opportunity.status === 'ACCEPTED';
  const isFulfilled = opportunity.status === 'FULFILLED';
  const isDeclined = opportunity.status === 'DECLINED';
  const isExpired = opportunity.status === 'EXPIRED';
  const isCancelled = opportunity.status === 'CANCELLED';

  const handleConfirmAccept = async () => {
    try {
      setErrorMessage(null);
      await acceptMutation.mutateAsync();
      setIsAcceptModalOpen(false);
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
    { value: 'NOT_AVAILABLE', label: 'Not available / Busy during this time window' },
    { value: 'CANNOT_TRAVEL', label: 'Cannot travel to the collection facility' },
    { value: 'RECENTLY_DONATED', label: 'Recently donated elsewhere' },
    { value: 'OTHER', label: 'Other personal reason' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back Link & Title */}
      <div>
        <Link
          to="/dashboard/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Opportunities
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-rose-600 shrink-0" />
              Targeted Donation Opportunity
            </h1>
            <BloodGroupBadge bloodGroup={req.bloodGroup} size="lg" />
            <RequestUrgencyBadge urgency={req.urgency} />
            <OpportunityStatusBadge status={opportunity.status} />
          </div>
        </div>
      </div>

      {/* Medical Screening Disclaimer */}
      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950">Basic Screening Notice: </span>
          This outreach alert is generated from algorithmic compatibility (ABO/Rh match and donation interval). Full medical screening and crossmatching occur on-site prior to blood collection.
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Opportunity Status Hero Banner */}
      {isAccepted && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 text-emerald-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-extrabold text-emerald-950 text-base sm:text-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            Thank you! You have confirmed your availability to donate.
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-2xl">
            The hospital coordination staff has been notified. They will contact you shortly regarding collection guidelines and arrival directions at <strong>{req.hospitalName}</strong>.
          </p>
        </div>
      )}

      {isFulfilled && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 text-emerald-950 space-y-1 shadow-xs">
          <div className="flex items-center gap-2 font-extrabold text-emerald-950 text-base sm:text-lg">
            <Heart className="w-6 h-6 text-rose-600 fill-rose-600 shrink-0" />
            Donation Procedure Completed & Recorded!
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
            Your verified blood donation for this request is officially recorded. Thank you for your voluntary commitment!
          </p>
        </div>
      )}

      {isDeclined && (
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-700 text-xs flex items-center gap-2.5">
          <XCircle className="w-5 h-5 text-slate-500 shrink-0" />
          You declined this opportunity ({opportunity.declineReason || 'Not available'}). We will notify you when other opportunities arise.
        </div>
      )}

      {isExpired && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-xs flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-red-500 shrink-0" />
          This donation opportunity has expired.
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
          This request was cancelled by the clinical coordination center.
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Facility & Transfusion Requirements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Hospital / Facility
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                {req.hospitalName}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Location / Region
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                {req.location}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Needed By Deadline
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-2 font-mono">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                {formatDate(req.requiredBy)}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Match Compatibility
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                Score: {opportunity.matchScore} / 100
              </div>
            </div>
          </div>
        </div>

        {/* Screening Explanation Card */}
        <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 border border-slate-200/80 space-y-1.5">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            Basic Screening & Ranking Criteria
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
              className="w-full sm:w-auto"
            >
              I Can't Help This Time
            </Button>

            <Button
              variant="critical"
              size="lg"
              onClick={() => setIsAcceptModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              I'm Available to Donate
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Availability */}
      <Modal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        title="Confirm Availability to Donate"
        description="Please confirm your intention to assist with this blood request."
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-rose-950">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Before you continue:</strong> Your current basic donation eligibility will be verified again upon acceptance. Accepting this opportunity does not record a donation until collection is completed on-site by authorized medical staff.
            </div>
          </div>

          <p>
            By confirming availability, you grant permission for the hospital coordinator at <strong>{req.hospitalName}</strong> to reach out to coordinate your donation appointment.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAcceptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="critical"
              isLoading={acceptMutation.isPending}
              onClick={handleConfirmAccept}
            >
              Confirm Availability
            </Button>
          </div>
        </div>
      </Modal>

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
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              rows={3}
              placeholder="e.g. Traveling until next week"
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
