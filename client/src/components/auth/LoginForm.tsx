import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';
import { loginSchema, LoginFormValues } from '../../schemas/auth.schema.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { getApiErrorMessage } from '../../lib/api.js';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const sanitizeReturnPath = (rawPath: string | null | undefined, role: 'ADMIN' | 'DONOR'): string => {
    if (!rawPath) return role === 'ADMIN' ? '/admin' : '/dashboard';
    const trimmed = rawPath.trim();
    // Security: Only allow safe, internal paths starting with a single '/'
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes(':') || trimmed.includes('\\')) {
      return role === 'ADMIN' ? '/admin' : '/dashboard';
    }
    // Role boundary: A donor cannot be redirected to any /admin paths
    if (role === 'DONOR' && trimmed.startsWith('/admin')) {
      return '/dashboard';
    }
    return trimmed;
  };

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(data);
      const searchParams = new URLSearchParams(location.search);
      const rawReturnTo = searchParams.get('returnTo') || (location.state as any)?.from?.pathname;
      const targetDestination = sanitizeReturnPath(rawReturnTo, user.role);

      navigate(targetDestination, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 text-xs text-[#B42318] bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <span className="font-medium">{serverError}</span>
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="e.g. yourname@example.org"
        autoComplete="email"
        required
        leftIcon={<Mail className="w-4 h-4 text-[#9CA3AF]" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="space-y-1">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          leftIcon={<Lock className="w-4 h-4 text-[#9CA3AF]" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end pt-1">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-[#D92D45] hover:text-[#B42318] hover:underline transition"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2 min-h-[44px]"
        isLoading={isSubmitting}
        leftIcon={<LogIn className="w-4 h-4" />}
      >
        Sign In
      </Button>

      <p className="text-center text-xs text-[#667085] pt-3">
        Don't have an account yet?{' '}
        <Link to="/register" className="font-bold text-[#D92D45] hover:text-[#B42318] underline">
          Register as a Voluntary Donor
        </Link>
      </p>
    </form>
  );
};
