import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodRequestService } from '../../services/blood-request.service.js';
import { adminService } from '../../services/admin.service.js';
import {
  useBloodRequestOutreach,
  useCreateOpportunitiesBatch,
  useCancelOpportunity,
} from '../../hooks/useOpportunities.js';
import { DonorMatchCandidate } from '../../types/blood-request.js';
import {
  BloodGroupBadge,
  RequestUrgencyBadge,
  RequestStatusBadge,
  OpportunityStatusBadge,
  Badge,
} from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Modal } from '../../components/common/Modal.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Phone,
  User,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Users,
  Eye,
  HeartHandshake,
} from 'lucide-react';
import { formatDate } from '../../lib/utils.js';

export const AdminBloodRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // 1. Fetch Blood Request Details
  const {
    data: request,
    isLoading: isReqLoading,
    isError: isReqError,
    error: reqError,
    refetch: refetchRequest,
  } = useQuery({
    queryKey: ['blood-request', id],
    queryFn: () => (id ? bloodRequestService.getBloodRequestById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });

  // 2. Fetch Ranked Candidates
  const {
    data: matchData,
    isLoading: isMatchLoading,
  } = useQuery({
    queryKey: ['blood-request-matches', id],
    queryFn: () => (id ? bloodRequestService.getMatches(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });

  // 3. Fetch Outreach & Opportunities Data
  const {
    data: outreachData,
    isLoading: isOutreachLoading,
  } = useBloodRequestOutreach(id);

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: () => bloodRequestService.cancelBloodRequest(id!, 'Cancelled by administrator'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', id] });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: (payload: { donorId: string; channel: any; message: string }) =>
      bloodRequestService.notifyCandidate(id!, payload.donorId, payload.channel, payload.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-request-outreach', id] });
    },
  });

  const createBatchMutation = useCreateOpportunitiesBatch(id!);
  const cancelOpportunityMutation = useCancelOpportunity(id);

  const recordDonationMutation = useMutation({
    mutationFn: (data: { donorId: string; location: string; notes?: string }) =>
      adminService.recordDonation(data.donorId, {
        location: data.location,
        bloodRequestId: id,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', id] });
      queryClient.invalidateQueries({ queryKey: ['blood-request-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['blood-request-outreach', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setIsRecordModalOpen(false);
      setSelectedDonorForDonation(null);
      setDonationLocation('');
      setDonationNotes('');
    },
  });

  // Modals & Selection state
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'OUTREACH' | 'DONATIONS'>('OUTREACH');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [oppToCancel, setOppToCancel] = useState<string | null>(null);

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

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
        <LoadingSpinner size="lg" label="Loading blood request details..." />
      </Card>
    );
  }

  if (isReqError || !request) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Blood request not found"
          message={(reqError as Error)?.message || 'The requested blood request could not be loaded.'}
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
    await cancelMutation.mutateAsync();
    setIsCancelModalOpen(false);
  };

  const handleOpenNotify = (cand: DonorMatchCandidate) => {
    setSelectedCandidate(cand);
    setNotifyMessage(
      `URGENT: ${request.bloodGroup.replace('_', ' ')} blood donation required at ${request.hospitalName} (${request.location}). Please confirm your availability.`
    );
    setNotifySuccessMsg(null);
  };

  const handleSendNotification = async () => {
    if (!selectedCandidate) return;
    try {
      await notifyMutation.mutateAsync({
        donorId: selectedCandidate.donorId,
        channel: notifyChannel,
        message: notifyMessage,
      });
      setNotifySuccessMsg('Outreach opportunity successfully dispatched to donor candidate!');
      setTimeout(() => setSelectedCandidate(null), 1500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleCandidate = (donorId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const handleSelectTop = (n: number) => {
    if (!matchData?.candidates) return;
    const topIds = matchData.candidates.slice(0, n).map((c) => c.donorId);
    setSelectedCandidateIds(topIds);
  };

  const handleCreateBatch = async () => {
    if (selectedCandidateIds.length === 0) return;
    try {
      setBatchSuccessMsg(null);
      const res = await createBatchMutation.mutateAsync(selectedCandidateIds);
      setBatchSuccessMsg(`Outreach sent! Created ${res.created} new opportunity alerts (${res.skipped} already notified).`);
      setSelectedCandidateIds([]);
      setActiveTab('OUTREACH');
      setTimeout(() => setBatchSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenRecordDonation = (donor: { id: string; name: string; bloodGroup: string }) => {
    setSelectedDonorForDonation(donor);
    setDonationLocation(request.hospitalName || request.location);
    setDonationNotes('');
    setRecordError(null);
    setIsRecordModalOpen(true);
  };

  const handleRecordDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorForDonation) return;

    if (!donationLocation.trim()) {
      setRecordError('Donation facility/location is required.');
      return;
    }

    try {
      setRecordError(null);
      await recordDonationMutation.mutateAsync({
        donorId: selectedDonorForDonation.id,
        location: donationLocation.trim(),
        notes: donationNotes.trim() || undefined,
      });
    } catch (err: any) {
      setRecordError(
        err.response?.data?.message || err.message || 'Failed to record donation.'
      );
    }
  };

  const stats = outreachData?.stats;
  const opportunities = outreachData?.opportunities || [];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div>
        <Link
          to="/admin/blood-requests"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blood Requests
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Blood Request Coordination
            </h1>
            <BloodGroupBadge bloodGroup={request.bloodGroup} />
            <RequestUrgencyBadge urgency={request.urgency} />
            <RequestStatusBadge status={request.status} />
          </div>

          {canModify && (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancel Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {batchSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {batchSuccessMsg}
        </div>
      )}

      {/* Main Request Information & Fulfillment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Clinical Request Information
            </h2>
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

        {/* Right Col: Fulfillment Progress & Screening Stats */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Fulfillment Progress</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Units Fulfilled</span>
                <span className="text-slate-900">
                  {request.unitsFulfilled} of {request.unitsRequired} units ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentage >= 100
                      ? 'bg-emerald-500'
                      : percentage > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Compatible Blood Groups:</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {matchData?.compatibleGroups?.map((bg) => (
                    <BloodGroupBadge key={bg} bloodGroup={bg} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Matching Candidates:</span>
                <span className="font-bold text-slate-900">
                  {matchData?.totalEligibleCandidates ?? 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Coordination Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('OUTREACH')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'OUTREACH'
              ? 'border-crimson-600 text-crimson-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Donor Outreach & Tracking ({opportunities.length})
        </button>

        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'MATCHES'
              ? 'border-crimson-600 text-crimson-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Find Candidate Donors ({matchData?.candidates?.length ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('DONATIONS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'DONATIONS'
              ? 'border-crimson-600 text-crimson-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Linked Donations ({request.donations?.length ?? 0})
        </button>
      </div>

      {/* TAB 1: OUTREACH & OPPORTUNITY TRACKING */}
      {activeTab === 'OUTREACH' && (
        <div className="space-y-6">
          {/* Outreach Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="p-3 text-center">
              <span className="text-2xs text-slate-400 font-bold uppercase block">Outreach Sent</span>
              <span className="text-xl font-bold text-slate-900">{stats?.totalOpportunities ?? 0}</span>
            </Card>
            <Card className="p-3 text-center">
              <span className="text-2xs text-blue-600 font-bold uppercase block">Pending</span>
              <span className="text-xl font-bold text-blue-600">{stats?.pending ?? 0}</span>
            </Card>
            <Card className="p-3 text-center">
              <span className="text-2xs text-amber-600 font-bold uppercase block">Viewed</span>
              <span className="text-xl font-bold text-amber-600">{stats?.viewed ?? 0}</span>
            </Card>
            <Card className="p-3 text-center">
              <span className="text-2xs text-emerald-600 font-bold uppercase block">Accepted</span>
              <span className="text-xl font-bold text-emerald-600">{stats?.accepted ?? 0}</span>
            </Card>
            <Card className="p-3 text-center">
              <span className="text-2xs text-slate-500 font-bold uppercase block">Declined</span>
              <span className="text-xl font-bold text-slate-600">{stats?.declined ?? 0}</span>
            </Card>
            <Card className="p-3 text-center">
              <span className="text-2xs text-red-500 font-bold uppercase block">Expired</span>
              <span className="text-xl font-bold text-red-600">{stats?.expired ?? 0}</span>
            </Card>
            <Card className="p-3 text-center">
              <span className="text-2xs text-emerald-700 font-bold uppercase block">Fulfilled</span>
              <span className="text-xl font-bold text-emerald-700">{stats?.fulfilled ?? 0}</span>
            </Card>
          </div>

          {/* Opportunities Table */}
          {isOutreachLoading ? (
            <Card className="p-8 flex justify-center items-center">
              <LoadingSpinner size="md" label="Loading outreach records..." />
            </Card>
          ) : opportunities.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No donor outreach dispatched yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Switch to the "Find Candidate Donors" tab to select compatible candidates and create opportunity alerts.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('MATCHES')}
              >
                Find & Outreach Candidates
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Donor Name</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Match Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Responses & Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {opp.donor.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <BloodGroupBadge bloodGroup={opp.donor.bloodGroup} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {opp.donor.contactNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-crimson-600">
                        {opp.matchScore}%
                      </td>
                      <td className="py-3 px-4">
                        <OpportunityStatusBadge status={opp.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {opp.status === 'ACCEPTED' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accepted ({formatDate(opp.respondedAt)})
                          </span>
                        )}
                        {opp.status === 'DECLINED' && (
                          <span className="text-slate-600">
                            Reason: {opp.declineReason} {opp.declineNotes ? `("${opp.declineNotes}")` : ''}
                          </span>
                        )}
                        {opp.status === 'VIEWED' && (
                          <span className="text-amber-700 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            Viewed by donor
                          </span>
                        )}
                        {opp.status === 'PENDING' && (
                          <span className="text-slate-400">Waiting for donor response</span>
                        )}
                        {opp.status === 'FULFILLED' && (
                          <span className="text-emerald-600 font-bold">Donation Collected</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {opp.status === 'ACCEPTED' && canModify && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleOpenRecordDonation({
                                id: opp.donorId,
                                name: opp.donor.fullName,
                                bloodGroup: opp.donor.bloodGroup,
                              })
                            }
                          >
                            Record Donation
                          </Button>
                        )}
                        {(opp.status === 'PENDING' || opp.status === 'VIEWED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOppToCancel(opp.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel Alert
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: CANDIDATE MATCHING & BATCH OUTREACH */}
      {activeTab === 'MATCHES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold">Batch Donor Outreach</h3>
              <p className="text-xs text-slate-300">
                Select candidates to create opportunity alerts (Max 10 per batch).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTop(1)}
                className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs"
              >
                Select Top 1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTop(5)}
                className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs"
              >
                Select Top 5
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTop(10)}
                className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs"
              >
                Select Top 10
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={selectedCandidateIds.length === 0}
                onClick={handleCreateBatch}
                isLoading={createBatchMutation.isPending}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Opportunities ({selectedCandidateIds.length})
              </Button>
            </div>
          </div>

          {isMatchLoading ? (
            <Card className="p-8 flex justify-center items-center">
              <LoadingSpinner size="md" label="Evaluating candidate donors..." />
            </Card>
          ) : !matchData?.candidates || matchData.candidates.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">No matching candidates found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active donors match the required blood group and interval cooldown rules.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {matchData.candidates.map((cand, idx) => {
                const isSelected = selectedCandidateIds.includes(cand.donorId);
                return (
                  <Card
                    key={cand.donorId}
                    className={`p-5 transition-all ${
                      isSelected ? 'border-crimson-500 ring-2 ring-crimson-500/20 bg-crimson-50/20' : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Checkbox & Donor Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCandidate(cand.donorId)}
                          className="mt-1.5 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500 cursor-pointer"
                        />
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-base">{cand.name}</span>
                            <BloodGroupBadge bloodGroup={cand.bloodGroup} />
                            <Badge
                              variant={cand.compatibilityType === 'EXACT' ? 'success' : 'info'}
                              size="sm"
                            >
                              {cand.compatibilityType === 'EXACT' ? 'Exact Match' : 'Compatible'}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {cand.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {cand.contactNumber}
                            </span>
                          </div>

                          {/* Pills */}
                          <div className="flex flex-wrap gap-2 pt-1 text-xs">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {cand.explanation.compatibilityDetails}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                              ✓ {cand.explanation.eligibilityDetails}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              📍 {cand.explanation.locationDetails}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score & Actions */}
                      <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2">
                        <div className="text-right">
                          <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
                            Match Score
                          </span>
                          <span className="text-2xl font-black text-crimson-600">
                            {cand.matchScore}
                            <span className="text-xs text-slate-400 font-normal"> / 100</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenNotify(cand)}
                          >
                            Single Outreach
                          </Button>
                          {canModify && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                handleOpenRecordDonation({
                                  id: cand.donorId,
                                  name: cand.name,
                                  bloodGroup: cand.bloodGroup,
                                })
                              }
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Record
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LINKED DONATIONS */}
      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          {!request.donations || request.donations.length === 0 ? (
            <Card className="p-8 text-center space-y-2">
              <HeartHandshake className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No donations recorded yet</h3>
              <p className="text-xs text-slate-500">
                When an accepted donor completes their collection procedure, record the donation to update fulfillment.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto w-full">
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
                  {request.donations.map((don: any) => (
                    <tr key={don.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">
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
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Notify Candidate Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={`Contact Candidate: ${selectedCandidate?.name}`}
        description="Dispatch an outreach opportunity alert to this candidate."
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
              Send Outreach
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

      {/* Cancel Opportunity Dialog */}
      <ConfirmDialog
        isOpen={!!oppToCancel}
        onClose={() => setOppToCancel(null)}
        onConfirm={async () => {
          if (oppToCancel) {
            await cancelOpportunityMutation.mutateAsync({ id: oppToCancel });
            setOppToCancel(null);
          }
        }}
        title="Cancel Opportunity Alert"
        message="Are you sure you want to cancel this opportunity alert? The donor will no longer be able to accept it."
        confirmLabel="Cancel Alert"
        variant="danger"
        isLoading={cancelOpportunityMutation.isPending}
      />

      {/* Cancel Request Dialog */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelSubmit}
        title="Cancel Blood Request"
        message="Are you sure you want to cancel this blood request? Cancelled requests cannot accept further donations and will be archived."
        confirmLabel="Cancel Request"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
