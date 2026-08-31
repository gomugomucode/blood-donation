import React from 'react';
import { RegistrationForm } from '../components/auth/RegistrationForm.js';
import { HeartHandshake } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 mb-1 shadow-xs">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Become a Voluntary Blood Donor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Join the regional blood network to save lives during critical shortages and emergencies.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
};
