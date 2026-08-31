import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  HeartPulse,
  Building2,
  MapPin,
  Calendar,
  Phone,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Bell,
  Plus,
  ShieldCheck,
  Send,
  Droplet,
} from 'lucide-react';
import {
  useBloodRequest,
  useBloodRequestMatches,
  useCancelBloodRequest,
  useNotifyDonorCandidate,
} from '../../hooks/useBloodRequests.js';
import { useRecordDonation } from '../../hooks/useAdmin.js';
import { DonorMatchCandidate } from '../../types/blood-request.js';
import {
  BloodGroupBadge,
  RequestStatusBadge,
  RequestUrgencyBadge,
  Badge,
} from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { formatDate } from '../../lib/utils.js';

export const AdminBloodRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: request,
    isLoading: isReqLoading,
    isError: isReqError,
    error: reqError,
    refetch: refetchRequest,
  } = useBloodRequest(id);

  const {
    data: matchData,
    isLoading: isMatchLoading,
  } = useBloodRequestMatches(id);

  const cancelMutation = useCancelBloodRequest(id!);
  const notifyMutation = useNotifyDonorCandidate(id!);
  const recordDonationMutation = useRecordDonation();

  // Modals state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [selectedCandidate, setSelectedCandidate] = useState<DonorMatchCandidate | null>(null);
  const [notifyChannel, setNotifyChannel] = useState<'IN_APP' | 'SMS' | 'EMAIL'>('IN_APP');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifySuccessMsg, setNotifySuccessMsg] = useState<string | null>(null);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDonorForDonation, setSelectedDonorForDonation] = useState<{
    id: string;
    name: string;
    bloodGroup: string;
  } | null>(null);
  const [donationLocation, setDonationLocation] = useState('');
  const [donationNotes, setDonationNotes] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);

  if (isReqLoading) {
    return (
      <Card className="p-12 flex justify-center items-center">
        <LoadingSpinner size="lg" text="Loading blood request and candidate matches..." />
      </Card>
    );
  }

  if (isReqError || !request) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Blood request not found"
          description={(reqError as Error)?.message || 'The requested blood request could not be loaded.'}
          onRetry={() => refetchRequest()}
        />
      </Card>
    );
  }

  const percentage = Math.min(
    100,
    Math.round((request.unitsFulfilled / request.unitsRequired) * 100)
  );

  const isFulfilled = request.status === 'FULFILLED';
  const isCancelled = request.status === 'CANCELLED';
  const isExpired = request.status === 'EXPIRED';
  const canModify = !isFulfilled && !isCancelled && !isExpired;

  const handleCancelSubmit = async () => {
    await cancelMutation.mutateAsync(cancelReason || undefined);
    setIsCancelModalOpen(false);
  };

  const handleOpenNotify = (candidate: DonorMatchCandidate) => {
    setSelectedCandidate(candidate);
    setNotifyMessage(
      `Urgent request for ${request.bloodGroup.replace('_', '+')} blood at ${request.hospitalName} (${request.location}). Please contact us if available.`
    );
    setNotifySuccessMsg(null);
  };

  const handleSendNotification = async () => {
    if (!selectedCandidate) return;
    try {
      const res = await notifyMutation.mutateAsync({
        donorId: selectedCandidate.donorId,
        channel: notifyChannel,
        message: notifyMessage,
      });
      setNotifySuccessMsg(`Coordination alert recorded via ${res.channel}.`);
      setTimeout(() => {
        setSelectedCandidate(null);
        setNotifySuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch notification.');
    }
  };

  const handleOpenRecordDonation = (candidate?: DonorMatchCandidate) => {
    if (candidate) {
      setSelectedDonorForDonation({
        id: candidate.donorId,
        name: candidate.name,
        bloodGroup: candidate.bloodGroup,
      });
    } else {
      setSelectedDonorForDonation(null);
    }
    setDonationLocation(request.hospitalName || request.location);
    setDonationNotes(`Fulfilled for Blood Request #${request.id.substring(0, 8)} (${request.bloodGroup.replace('_', '+')})`);
    setRecordError(null);
    setIsRecordModalOpen(true);
  };

  const handleRecordDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorForDonation) {
      setRecordError('Please select a donor.');
      return;
    }

    try {
      setRecordError(null);
      await recordDonationMutation.mutateAsync({
        donorId: selectedDonorForDonation.id,
        data: {
          location: donationLocation,
          bloodRequestId: request.id,
          notes: donationNotes,
        },
      });
      setIsRecordModalOpen(false);
      refetchRequest();
    } catch (err: any) {
      setRecordError(err.response?.data?.message || 'Failed to record donation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="w-7 h-7 text-crimson-600" />
              Request #{request.id.substring(0, 8)}
            </h1>
            <BloodGroupBadge bloodGroup={request.bloodGroup} />
            <RequestUrgencyBadge urgency={request.urgency} />
            <RequestStatusBadge status={request.status} />
          </div>
        </div>

        {canModify && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-red-700 hover:bg-red-50 hover:border-red-200"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel Request
            </Button>
          </div>
        )}
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Basic Screening Notice: </span>
          The candidate list below represents potential donor matches based on red-cell compatibility and interval guidelines. Final donor eligibility and crossmatching must be verified at the clinical collection facility.
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clinical & Fulfillment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Fulfillment Status</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {request.unitsFulfilled} of {request.unitsRequired} Units Collected
              </span>
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Progress</span>
                <span className={isFulfilled ? 'text-emerald-600' : 'text-crimson-600'}>
                  {percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFulfilled
                      ? 'bg-emerald-500'
                      : percentage > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {isFulfilled && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                This blood request has been fully fulfilled and closed.
              </div>
            )}
          </Card>

          {/* Details Card */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Request Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Hospital / Facility</span>
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {request.hospitalName}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Location / City</span>
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {request.location}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Required By</span>
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(request.requiredBy)}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Patient Reference</span>
                <div className="font-mono text-slate-800">
                  {request.patientReference || 'N/A'}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Contact Person</span>
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {request.contactName}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Contact Phone</span>
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {request.contactNumber}
                </div>
              </div>
            </div>

            {request.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">Clinical Notes</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {request.notes}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Coordination Stats */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Screening Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Recipient Blood Group:</span>
                <BloodGroupBadge bloodGroup={request.bloodGroup} />
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Compatible Groups:</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {matchData?.compatibleGroups?.map((bg) => (
                    <BloodGroupBadge key={bg} bloodGroup={bg} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Eligible Candidates:</span>
                <span className="font-bold text-slate-900">
                  {matchData?.totalEligibleCandidates ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Created:</span>
                <span className="text-slate-700">{formatDate(request.createdAt)}</span>
              </div>
              {request.createdBy?.email && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Coordinator:</span>
                  <span className="text-slate-700 truncate max-w-[140px]">
                    {request.createdBy.email}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Ranked Candidate Donors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Droplet className="w-5 h-5 text-crimson-600" />
              Ranked Potential Donor Candidates ({matchData?.candidates?.length ?? 0})
            </h2>
            <p className="text-xs text-slate-500">
              Ranked deterministically by compatibility (40%), eligibility (25%), location (20%), donation history (10%), and recency (5%).
            </p>
          </div>
        </div>

        {isMatchLoading ? (
          <Card className="p-8 flex justify-center items-center">
            <LoadingSpinner size="md" text="Evaluating and ranking candidate donors..." />
          </Card>
        ) : !matchData?.candidates || matchData.candidates.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No active eligible candidates found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              There are currently no active registered donors with compatible blood groups who meet interval cooldown requirements.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {matchData.candidates.map((cand, idx) => (
              <Card key={cand.donorId} className="p-5 hover:border-slate-300 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Donor Info & Score */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{cand.name}</span>
                          <BloodGroupBadge bloodGroup={cand.bloodGroup} />
                          <Badge
                            variant={cand.compatibilityType === 'EXACT' ? 'success' : 'info'}
                            size="sm"
                          >
                            {cand.compatibilityType === 'EXACT' ? 'Exact Match' : 'Compatible Donor'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {cand.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {cand.contactNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Breakdown Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                        {cand.explanation.compatibilityDetails}
                      </span>
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✓ {cand.explanation.eligibilityDetails}
                      </span>
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                        📍 {cand.explanation.locationDetails}
                      </span>
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                        🩸 {cand.explanation.donationHistory}
                      </span>
                    </div>
                  </div>

                  {/* Score & Actions */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Match Score
                      </div>
                      <div className="text-2xl font-black text-crimson-600">
                        {cand.matchScore}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenNotify(cand)}
                        className="hover:bg-slate-50"
                      >
                        <Bell className="w-3.5 h-3.5 mr-1" />
                        Contact
                      </Button>

                      {canModify && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenRecordDonation(cand)}
                          className="shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Record Donation
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Linked Donations History */}
      {request.donations && request.donations.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Linked Donations for this Request ({request.donations.length})
          </h2>
          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Donation Date</th>
                  <th className="py-3 px-4">Collection Facility</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.donations.map((don) => (
                  <tr key={don.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {don.donor.fullName}
                    </td>
                    <td className="py-3 px-4">
                      <BloodGroupBadge bloodGroup={don.donor.bloodGroup} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {formatDate(don.donatedAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{don.location}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 italic">
                      {don.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Notify Candidate Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={`Contact Candidate: ${selectedCandidate?.name}`}
        description="Dispatch a coordination alert to this potential donor."
      >
        <div className="space-y-4">
          {notifySuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {notifySuccessMsg}
            </div>
          )}

          <div>
            <Select
              label="Notification Channel"
              options={[
                { value: 'IN_APP', label: 'In-App Alert' },
                { value: 'SMS', label: 'SMS Coordination Alert' },
                { value: 'EMAIL', label: 'Email Notification' },
              ]}
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value as any)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Message Content
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-500"
              rows={4}
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendNotification}
              isLoading={notifyMutation.isPending}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send Alert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Donation Linked to Request Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Linked Blood Donation"
        description={`Record a unit collected for Blood Request #${request.id.substring(0, 8)}.`}
      >
        <form onSubmit={handleRecordDonationSubmit} className="space-y-4">
          {recordError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              {recordError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Donor
            </label>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 flex items-center justify-between">
              <span>{selectedDonorForDonation?.name || 'Selected Candidate'}</span>
              {selectedDonorForDonation?.bloodGroup && (
                <BloodGroupBadge bloodGroup={selectedDonorForDonation.bloodGroup} />
              )}
            </div>
          </div>

          <div>
            <Input
              label="Donation Facility / Location *"
              placeholder="e.g. Butwal General Hospital"
              value={donationLocation}
              onChange={(e) => setDonationLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Clinical Notes (Optional)"
              placeholder="e.g. 450ml whole blood collection"
              value={donationNotes}
              onChange={(e) => setDonationNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={recordDonationMutation.isPending}
            >
              Record & Update Fulfillment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Request Dialog */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelSubmit}
        title="Cancel Blood Request"
        description="Are you sure you want to cancel this blood request? Cancelled requests cannot accept further donations and will be archived."
        confirmText="Cancel Request"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
