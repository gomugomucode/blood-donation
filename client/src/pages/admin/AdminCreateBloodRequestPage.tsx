import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, HeartPulse, Building2, MapPin, Phone, User, Calendar, AlertCircle } from 'lucide-react';
import { useCreateBloodRequest } from '../../hooks/useBloodRequests.js';
import { BloodGroup } from '../../types/index.js';
import { RequestUrgency } from '../../types/blood-request.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';

const formSchema = z.object({
  bloodGroup: z.nativeEnum(BloodGroup, {
    errorMap: () => ({ message: 'Please select a blood group.' }),
  }),
  unitsRequired: z
    .number({ invalid_type_error: 'Units required must be a number.' })
    .int('Units required must be an integer.')
    .min(1, 'At least 1 unit is required.')
    .max(50, 'Units required cannot exceed 50.'),
  urgency: z.nativeEnum(RequestUrgency),
  hospitalName: z.string().trim().min(2, 'Hospital name must be at least 2 characters.'),
  location: z.string().trim().min(2, 'Location/City is required.'),
  requiredBy: z
    .string()
    .min(1, 'Required-by date is required.')
    .refine(
      (val) => {
        const d = new Date(val);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return d >= now;
      },
      { message: 'Required date cannot be in the past.' }
    ),
  contactName: z.string().trim().min(2, 'Contact person name is required.'),
  contactNumber: z.string().trim().min(6, 'Contact number is required.'),
  patientReference: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

export const AdminCreateBloodRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateBloodRequest();
  const [formError, setFormError] = useState<string | null>(null);

  // Set default requiredBy to 3 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urgency: 'NORMAL',
      unitsRequired: 1,
      requiredBy: defaultDateStr,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setFormError(null);
      const created = await createMutation.mutateAsync({
        ...data,
        requiredBy: new Date(data.requiredBy).toISOString(),
      });
      navigate(`/admin/requests/${created.id}`);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create blood request.');
    }
  };

  const bloodGroupOptions = [
    { value: '', label: 'Select Required Blood Group' },
    { value: 'A_POSITIVE', label: 'A+ (A Positive)' },
    { value: 'A_NEGATIVE', label: 'A- (A Negative)' },
    { value: 'B_POSITIVE', label: 'B+ (B Positive)' },
    { value: 'B_NEGATIVE', label: 'B- (B Negative)' },
    { value: 'AB_POSITIVE', label: 'AB+ (AB Positive)' },
    { value: 'AB_NEGATIVE', label: 'AB- (AB Negative)' },
    { value: 'O_POSITIVE', label: 'O+ (O Positive)' },
    { value: 'O_NEGATIVE', label: 'O- (O Negative)' },
  ];

  const urgencyOptions = [
    { value: 'LOW', label: 'LOW — Standard inventory reserve' },
    { value: 'NORMAL', label: 'NORMAL — Scheduled procedure within 48-72h' },
    { value: 'HIGH', label: 'HIGH — Urgent requirement within 24h' },
    { value: 'CRITICAL', label: 'CRITICAL — Immediate emergency transfusion' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div>
        <Link
          to="/admin/requests"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blood Requests
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HeartPulse className="w-7 h-7 text-crimson-600" />
          Create New Blood Request
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter clinical request details to begin screening and ranking candidate donors.
        </p>
      </div>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{formError}</div>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Clinical Requirements */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Clinical & Quantity Requirements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Blood Group Required *"
                  options={bloodGroupOptions}
                  error={errors.bloodGroup?.message}
                  {...register('bloodGroup')}
                />
              </div>

              <div>
                <Input
                  label="Units Required *"
                  type="number"
                  min={1}
                  max={50}
                  error={errors.unitsRequired?.message}
                  {...register('unitsRequired', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Request Urgency *"
                  options={urgencyOptions}
                  error={errors.urgency?.message}
                  {...register('urgency')}
                />
              </div>

              <div>
                <Input
                  label="Required By (Date) *"
                  type="date"
                  leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
                  error={errors.requiredBy?.message}
                  {...register('requiredBy')}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hospital & Location */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Facility & Regional Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Hospital / Clinic Facility Name *"
                  placeholder="e.g. Butwal General Hospital"
                  leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                  error={errors.hospitalName?.message}
                  {...register('hospitalName')}
                />
              </div>

              <div>
                <Input
                  label="City / Regional Location *"
                  placeholder="e.g. Butwal, Rupandehi"
                  leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                  error={errors.location?.message}
                  {...register('location')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Coordination */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Coordination Contact & Confidential Reference
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Contact Person Name *"
                  placeholder="e.g. Dr. Ramesh Karki"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  error={errors.contactName?.message}
                  {...register('contactName')}
                />
              </div>

              <div>
                <Input
                  label="Contact Phone Number *"
                  placeholder="e.g. +977-9847001122"
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  error={errors.contactNumber?.message}
                  {...register('contactNumber')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Patient Reference Code (Optional)"
                  placeholder="e.g. PAT-98214"
                  error={errors.patientReference?.message}
                  {...register('patientReference')}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Protected reference. Excluded from public views and non-admin queries.
                </p>
              </div>

              <div>
                <Input
                  label="Clinical Notes / Special Requirements (Optional)"
                  placeholder="e.g. ICU Bed 4, pre-op whole blood"
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link to="/admin/requests">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
              className="shadow-md shadow-crimson-600/20"
            >
              Create & Find Donor Matches
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
