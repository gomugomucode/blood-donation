import React from 'react';
import { LoginForm } from '../components/auth/LoginForm.js';
import { ShieldCheck } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-rose-500 border border-slate-800 mb-1 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Coordinator Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Authorized hospital transfusion teams and blood bank administrator access only.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          <LoginForm isAdmin={true} />
        </div>
      </div>
    </div>
  );
};
