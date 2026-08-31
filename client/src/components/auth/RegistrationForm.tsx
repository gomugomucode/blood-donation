import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { User, Calendar, Phone, MapPin, Mail, Lock, AlertCircle, HeartHandshake } from 'lucide-react';
import { registerSchema, RegisterFormValues, bloodGroups } from '../../schemas/auth.schema.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { formatBloodGroup } from '../../lib/utils.js';
import { getApiErrorMessage } from '../../lib/api.js';

export const RegistrationForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      bloodGroup: 'O_POSITIVE',
      contactNumber: '',
      address: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  const bloodGroupOptions = bloodGroups.map((bg) => ({
    value: bg,
    label: `${formatBloodGroup(bg)} (${bg.replace('_', ' ')})`,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Legal Name"
          type="text"
          placeholder="e.g. Jane Doe"
          required
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Date of Birth"
          type="date"
          required
          leftIcon={<Calendar className="w-4 h-4" />}
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
          label="Contact Phone Number"
          type="tel"
          placeholder="+1-555-0199"
          required
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.contactNumber?.message}
          {...register('contactNumber')}
        />
      </div>

      <Input
        label="Residential Address"
        type="text"
        placeholder="Street address, City, State/Province"
        required
        leftIcon={<MapPin className="w-4 h-4" />}
        error={errors.address?.message}
        {...register('address')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="jane.doe@example.com"
        autoComplete="email"
        required
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Create Password"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          required
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          required
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<HeartHandshake className="w-5 h-5" />}
        >
          Create Donor Account
        </Button>
      </div>

      <p className="text-center text-xs text-slate-500 pt-2">
        Already registered as a blood donor?{' '}
        <Link to="/login" className="font-semibold text-crimson-600 hover:text-crimson-700 underline">
          Sign In
        </Link>
      </p>
    </form>
  );
};
