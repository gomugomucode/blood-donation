import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, MapPin, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { profileSchema, ProfileFormValues } from '../../schemas/auth.schema.js';
import { DonorProfile } from '../../types/index.js';
import { donorService } from '../../services/donor.service.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { getApiErrorMessage } from '../../lib/api.js';

export interface ProfileFormProps {
  initialData: DonorProfile;
  onSuccess?: (updated: DonorProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSuccess }) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      contactNumber: initialData.contactNumber,
      address: initialData.address,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      const updated = await donorService.updateProfile(data);
      setSuccessMessage('Donor profile updated successfully!');
      if (onSuccess) {
        onSuccess(updated);
      }
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {successMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Input
        label="Full Legal Name"
        type="text"
        required
        leftIcon={<User className="w-4 h-4" />}
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Input
        label="Contact Phone Number"
        type="tel"
        required
        leftIcon={<Phone className="w-4 h-4" />}
        error={errors.contactNumber?.message}
        {...register('contactNumber')}
      />

      <Input
        label="Current Residential Address"
        type="text"
        required
        leftIcon={<MapPin className="w-4 h-4" />}
        error={errors.address?.message}
        {...register('address')}
      />

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isDirty}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
};
