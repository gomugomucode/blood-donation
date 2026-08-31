import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';
import { loginSchema, LoginFormValues } from '../../schemas/auth.schema.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { getApiErrorMessage } from '../../lib/api.js';

interface LoginFormProps {
  isAdmin?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isAdmin = false }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(data);
      if (isAdmin && user.role !== 'ADMIN') {
        setServerError('Access denied: This portal is strictly restricted to administrator accounts.');
        return;
      }
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

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

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        className="w-full mt-2"
        isLoading={isSubmitting}
        leftIcon={<LogIn className="w-4 h-4" />}
      >
        {isAdmin ? 'Sign in to Admin Console' : 'Sign In'}
      </Button>

      {!isAdmin && (
        <p className="text-center text-xs text-slate-500 pt-2">
          Don't have a donor account yet?{' '}
          <Link to="/register" className="font-semibold text-crimson-600 hover:text-crimson-700 underline">
            Register as a Donor
          </Link>
        </p>
      )}
    </form>
  );
};
