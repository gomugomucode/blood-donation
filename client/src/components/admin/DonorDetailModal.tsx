import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service.js';
import { Modal } from '../common/Modal.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { ErrorState } from '../common/ErrorState.js';
import { BloodGroupBadge, EligibilityBadge } from '../common/Badge.js';
import { formatDate, calculateAge } from '../../lib/utils.js';
import { Calendar, Phone, MapPin, Mail, Droplet, Clock, ShieldCheck } from 'lucide-react';

export interface DonorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorId: string | null;
}

export const DonorDetailModal: React.FC<DonorDetailModalProps> = ({
  isOpen,
  onClose,
  donorId,
}) => {
  const {
    data: donor,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'donor', donorId],
    queryFn: () => (donorId ? adminService.getDonorById(donorId) : Promise.reject('No ID')),
    enabled: Boolean(isOpen && donorId),
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Donor Clinical Record"
      description="Comprehensive donor profile, contact information, and verified donation history."
      maxWidth="xl"
    >
      {isLoading ? (
        <LoadingSpinner label="Loading donor records..." />
      ) : isError || !donor ? (
        <ErrorState message="Could not retrieve donor record." onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-crimson-600 text-white font-extrabold flex items-center justify-center text-lg shadow-xs">
                {donor.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{donor.fullName}</h3>
                  <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {donor.user?.email}
                </p>
              </div>
            </div>

            {donor.eligibility && (
              <EligibilityBadge isEligible={donor.eligibility.isEligible} />
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" /> Date of Birth & Age
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {formatDate(donor.dateOfBirth)} ({calculateAge(donor.dateOfBirth)} years old)
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5" /> Contact Phone
              </span>
              <p className="font-bold text-slate-800 text-sm font-mono">{donor.contactNumber}</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" /> Last Recorded Donation
              </span>
              <p className="font-bold text-slate-800 text-sm">{formatDate(donor.lastDonationAt)}</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-white space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5" /> Residential Address
              </span>
              <p className="font-bold text-slate-800 text-sm truncate" title={donor.address}>
                {donor.address}
              </p>
            </div>
          </div>

          {/* Eligibility Breakdown */}
          {donor.eligibility && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Eligibility Indicator Breakdown
              </h4>
              <p className="text-xs text-slate-600">{donor.eligibility.reason}</p>
            </div>
          )}

          {/* Donation Records */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-crimson-600" />
              Donation History ({donor.donations?.length || 0})
            </h4>

            {donor.donations && donor.donations.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {donor.donations.map((donation) => (
                  <div key={donation.id} className="p-3 text-xs flex items-start justify-between bg-white hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-crimson-500" />
                        {donation.location}
                      </p>
                      {donation.notes && (
                        <p className="text-2xs text-slate-500 mt-0.5">{donation.notes}</p>
                      )}
                    </div>
                    <span className="text-2xs font-mono text-slate-600">
                      {formatDate(donation.donatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No blood donation procedures recorded for this donor yet.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
