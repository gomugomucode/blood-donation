import React from 'react';
import { LoginForm } from '../components/auth/LoginForm.js';
import { ShieldCheck } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 animate-fade-in text-left">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] mb-1 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
            Coordinator Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#667085]">
            Authorized hospital transfusion teams and blood bank staff access only.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E7E5E4] shadow-card">
          <LoginForm isAdmin={true} />
        </div>
      </div>
    </div>
  );
};
