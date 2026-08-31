import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminEditDonorSchema, AdminEditDonorFormValues, bloodGroups } from '../../schemas/auth.schema.js';
import { adminService } from '../../services/admin.service.js';
import { DonorProfile } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Button } from '../common/Button.js';
import { formatBloodGroup } from '../../lib/utils.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { AlertCircle, Save } from 'lucide-react';

export interface EditDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: DonorProfile | null;
  onSuccess: () => void;
}

export const EditDonorModal: React.FC<EditDonorModalProps> = ({
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
  } = useForm<AdminEditDonorFormValues>({
    resolver: zodResolver(adminEditDonorSchema),
  });

  useEffect(() => {
    if (donor) {
      const dobFormatted = donor.dateOfBirth
        ? new Date(donor.dateOfBirth).toISOString().split('T')[0]
        : '';

      reset({
        fullName: donor.fullName,
        dateOfBirth: dobFormatted,
        bloodGroup: donor.bloodGroup,
        contactNumber: donor.contactNumber,
        address: donor.address,
      });
      setServerError(null);
    }
  }, [donor, reset]);

  const onSubmit = async (data: AdminEditDonorFormValues) => {
    if (!donor) return;
    setServerError(null);
    try {
      await adminService.updateDonor(donor.id, data);
      onSuccess();
      onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  const bloodGroupOptions = bloodGroups.map((bg) => ({
    value: bg,
    label: `${formatBloodGroup(bg)} (${bg.replace('_', ' ')})`,
  }));

  if (!isOpen || !donor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Donor Information"
      description={`Update clinical and contact details for ${donor.fullName}`}
      maxWidth="lg"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Date of Birth"
            type="date"
            required
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Blood Group"
            required
            options={bloodGroupOptions}
            error={errors.bloodGroup?.message}
            {...register('bloodGroup')}
          />

          <Input
            label="Contact Phone"
            type="tel"
            required
            error={errors.contactNumber?.message}
            {...register('contactNumber')}
          />
        </div>

        <Input
          label="Address"
          required
          error={errors.address?.message}
          {...register('address')}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
