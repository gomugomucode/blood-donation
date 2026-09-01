import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service.js';
import { DonorProfile, DonorFilters as DonorFiltersType } from '../../types/index.js';
import { DonorFilters } from '../../components/admin/DonorFilters.js';
import { DonorTable } from '../../components/admin/DonorTable.js';
import { DonorDetailModal } from '../../components/admin/DonorDetailModal.js';
import { EditDonorModal } from '../../components/admin/EditDonorModal.js';
import { RecordDonationModal } from '../../components/admin/RecordDonationModal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { UserX, AlertCircle, CheckCircle, Users } from 'lucide-react';

export const AdminDonorsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [filters, setFilters] = useState<DonorFiltersType>({
    page: 1,
    limit: 10,
    search: '',
    bloodGroup: '',
    includeDeactivated: false,
  });

  // Modals state
  const [viewDonorId, setViewDonorId] = useState<string | null>(null);
  const [editingDonor, setEditingDonor] = useState<DonorProfile | null>(null);
  const [donatingDonor, setDonatingDonor] = useState<DonorProfile | null>(null);
  const [deactivatingDonor, setDeactivatingDonor] = useState<DonorProfile | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch paginated donors
  const {
    data: donorData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'donors', filters],
    queryFn: () => adminService.getDonors(filters),
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminService.deactivateDonor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setDeactivatingDonor(null);
      setNotification({ type: 'success', message: 'Donor record deactivated successfully.' });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Failed to deactivate donor.' });
    },
  });

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      bloodGroup: '',
      includeDeactivated: false,
    });
  };

  const handleMutationSuccess = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'donors'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    setNotification({ type: 'success', message: msg });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-8 h-8 text-rose-600 shrink-0" />
          Voluntary Donor Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Search, filter, manage voluntary donors, log procedures, and maintain basic donation eligibility records.
        </p>
      </div>

      {/* Action Notification */}
      {notification && (
        <div
          role="alert"
          className={`flex items-center gap-2 p-3.5 text-xs font-semibold rounded-2xl border animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <DonorFilters
        filters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
        onReset={handleResetFilters}
      />

      {/* Donor Content */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card flex justify-center items-center">
          <LoadingSpinner label="Loading donor directory records..." />
        </div>
      ) : isError || !donorData ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">
          <ErrorState
            title="Could not load donors"
            message="Failed to retrieve donor records from database."
            onRetry={() => refetch()}
          />
        </div>
      ) : donorData.items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card">
          <EmptyState
            icon={UserX}
            title="No Donors Found"
            description="No donor records matched your search query or blood group filter. Try adjusting your search criteria."
            action={
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Clear All Filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <DonorTable
            donors={donorData.items}
            onView={(donor) => setViewDonorId(donor.id)}
            onEdit={(donor) => setEditingDonor(donor)}
            onRecordDonation={(donor) => setDonatingDonor(donor)}
            onDeactivate={(donor) => setDeactivatingDonor(donor)}
          />

          <Pagination
            pagination={donorData.pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Detail Modal */}
      <DonorDetailModal
        isOpen={Boolean(viewDonorId)}
        onClose={() => setViewDonorId(null)}
        donorId={viewDonorId}
      />

      {/* Edit Donor Modal */}
      <EditDonorModal
        isOpen={Boolean(editingDonor)}
        onClose={() => setEditingDonor(null)}
        donor={editingDonor}
        onSuccess={() => handleMutationSuccess('Donor information updated successfully.')}
      />

      {/* Record Donation Modal */}
      <RecordDonationModal
        isOpen={Boolean(donatingDonor)}
        onClose={() => setDonatingDonor(null)}
        donor={donatingDonor}
        onSuccess={() => handleMutationSuccess('Donation procedure recorded and last donation updated.')}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingDonor)}
        onClose={() => setDeactivatingDonor(null)}
        onConfirm={() => deactivatingDonor && deactivateMutation.mutate(deactivatingDonor.id)}
        isLoading={deactivateMutation.isPending}
        title="Deactivate Donor Profile"
        message={`Are you sure you want to deactivate ${deactivatingDonor?.fullName}'s profile? The donor will be archived and excluded from active donation drives while historical records are preserved.`}
        confirmLabel="Deactivate Donor"
        variant="danger"
      />
    </div>
  );
};
