import React from 'react';
import { LoginForm } from '../components/auth/LoginForm.js';
import { Card, CardContent } from '../components/common/Card.js';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 text-crimson-500 border border-slate-700 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Clinical Administration</h1>
          <p className="text-xs text-slate-400">Authorized medical personnel & system administrators only</p>
        </div>

        <Card className="bg-white/95 border-slate-700 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <LoginForm isAdmin={true} />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Not administrative staff?{' '}
          <Link to="/" className="text-slate-300 hover:text-white underline font-medium">
            Return to Public Portal
          </Link>
        </p>
      </div>
    </div>
  );
};
