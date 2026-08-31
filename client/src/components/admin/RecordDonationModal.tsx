import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recordDonationSchema, RecordDonationFormValues } from '../../schemas/auth.schema.js';
import { adminService } from '../../services/admin.service.js';
import { DonorProfile } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Button } from '../common/Button.js';
import { BloodGroupBadge } from '../common/Badge.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { AlertCircle, Droplet, Building2, Calendar } from 'lucide-react';

export interface RecordDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: DonorProfile | null;
  onSuccess: () => void;
}

export const RecordDonationModal: React.FC<RecordDonationModalProps> = ({
  isOpen,
  onClose,
  donor,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordDonationFormValues>({
    resolver: zodResolver(recordDonationSchema),
    defaultValues: {
      location: 'Central Blood Bank — Main Clinic',
      donatedAt: new Date().toISOString().split('T')[0],
      notes: 'Whole blood donation (450ml). Routine procedure with stable post-donation vitals.',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        location: 'Central Blood Bank — Main Clinic',
        donatedAt: new Date().toISOString().split('T')[0],
        notes: 'Whole blood donation (450ml). Routine procedure with stable post-donation vitals.',
      });
      setServerError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: RecordDonationFormValues) => {
    if (!donor) return;
    setServerError(null);
    try {
      await adminService.recordDonation(donor.id, {
        location: data.location,
        donatedAt: data.donatedAt ? new Date(data.donatedAt).toISOString() : new Date().toISOString(),
        notes: data.notes,
      });
      onSuccess();
      onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  if (!isOpen || !donor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Completed Blood Donation"
      description="Log a verified clinical donation session for this donor."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Donor Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson-100 text-crimson-700 flex items-center justify-center font-bold text-xs">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{donor.fullName}</p>
              <p className="text-2xs text-slate-500">{donor.contactNumber}</p>
            </div>
          </div>
          <BloodGroupBadge bloodGroup={donor.bloodGroup} />
        </div>

        <Input
          label="Donation Facility / Center"
          required
          placeholder="e.g. Memorial Hospital Blood Center, Drive Unit 4"
          leftIcon={<Building2 className="w-4 h-4" />}
          error={errors.location?.message}
          {...register('location')}
        />

        <Input
          label="Date of Donation"
          type="date"
          required
          leftIcon={<Calendar className="w-4 h-4" />}
          error={errors.donatedAt?.message}
          {...register('donatedAt')}
        />

        <div className="w-full space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Clinical Observations / Procedure Notes
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="e.g. Whole blood collection, donor was well hydrated..."
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
              {...register('notes')}
            />
          </div>
          {errors.notes?.message && (
            <p className="text-xs text-red-600">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Droplet className="w-4 h-4" />}
          >
            Record Donation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
