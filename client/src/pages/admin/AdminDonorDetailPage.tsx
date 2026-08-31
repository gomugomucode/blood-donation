import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service.js';
import { BloodGroupBadge, EligibilityBadge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card.js';
import { EditDonorModal } from '../../components/admin/EditDonorModal.js';
import { RecordDonationModal } from '../../components/admin/RecordDonationModal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { formatDate, calculateAge } from '../../lib/utils.js';
import {
  ArrowLeft,
  Calendar,
  Phone,
  MapPin,
  Mail,
  Droplet,
  Clock,
  ShieldCheck,
  Edit,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export const AdminDonorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const {
    data: donor,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'donor', id],
    queryFn: () => (id ? adminService.getDonorById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });

  const deactivateMutation = useMutation({
    mutationFn: (donorId: string) => adminService.deactivateDonor(donorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donor', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'donors'] });
      setIsDeactivateOpen(false);
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading donor clinical record..." />;
  }

  if (isError || !donor) {
    return (
      <ErrorState
        title="Could not find donor record"
        message="The requested donor record could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const isDeactivated = Boolean(donor.deletedAt);
  const age = calculateAge(donor.dateOfBirth);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/donors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Donor Directory
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            leftIcon={<Edit className="w-3.5 h-3.5" />}
          >
            Edit Record
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={isDeactivated}
            onClick={() => setIsDonationOpen(true)}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Record Donation
          </Button>

          {!isDeactivated && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeactivateOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {/* Main Donor Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-crimson-600 text-white font-black flex items-center justify-center text-xl shadow-xs">
              {donor.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{donor.fullName}</h1>
                <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                {isDeactivated && (
                  <span className="px-2 py-0.5 text-2xs font-bold uppercase rounded bg-red-100 text-red-700">
                    Deactivated
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {donor.user?.email || 'Registered Donor'}
              </p>
            </div>
          </div>

          {donor.eligibility && (
            <EligibilityBadge isEligible={donor.eligibility.isEligible} />
          )}
        </div>

        {/* Clinical Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Date of Birth & Age
            </span>
            <p className="font-bold text-slate-800 text-sm">
              {formatDate(donor.dateOfBirth)} ({age} yrs)
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Phone className="w-3.5 h-3.5" /> Contact Number
            </span>
            <p className="font-bold text-slate-800 text-sm font-mono">{donor.contactNumber}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Last Donation
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatDate(donor.lastDonationAt)}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5" /> Location Address
            </span>
            <p className="font-bold text-slate-800 text-sm truncate" title={donor.address}>
              {donor.address}
            </p>
          </div>
        </div>
      </Card>

      {/* Eligibility Indicator Section */}
      {donor.eligibility && (
        <Card className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Eligibility Assessment
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{donor.eligibility.reason}</p>
        </Card>
      )}

      {/* Donation History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplet className="w-4 h-4 text-crimson-600" />
            Lifetime Donation History ({donor.donations?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {donor.donations && donor.donations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {donor.donations.map((donation, idx) => (
                <div key={donation.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-crimson-500" />
                      {donation.location}
                    </span>
                    {donation.notes && (
                      <p className="text-2xs text-slate-500 mt-1">{donation.notes}</p>
                    )}
                  </div>
                  <span className="font-mono text-2xs text-slate-600">
                    {formatDate(donation.donatedAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-xs text-slate-500 italic">
              No previous donation records logged for this donor.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EditDonorModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        donor={donor}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'donor', id] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'donors'] });
        }}
      />

      <RecordDonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        donor={donor}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'donor', id] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'donors'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        }}
      />

      <ConfirmDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={() => id && deactivateMutation.mutate(id)}
        isLoading={deactivateMutation.isPending}
        title="Deactivate Donor Profile"
        message={`Are you sure you want to deactivate ${donor.fullName}'s profile? The donor will be archived from active queries.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
};
