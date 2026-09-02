import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm.js';
import { Droplets } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Smart redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
        <LoadingSpinner size="md" label="Checking session..." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 animate-fade-in text-left">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] mb-1 shadow-xs">
            <Droplets className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
            Sign In to HemaCare
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] max-w-sm mx-auto">
            Enter your credentials to access your dashboard, donation records, or coordinator command center.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E7E5E4] shadow-card">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
