import React from 'react';
import { LoginForm } from '../components/auth/LoginForm.js';
import { HeartHandshake } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 mb-1 shadow-xs">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back, Donor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Sign in to check your donation eligibility, view opportunities, and review your history.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
