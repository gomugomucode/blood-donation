import React from 'react';
import { LoginForm } from '../components/auth/LoginForm.js';
import { Card, CardContent } from '../components/common/Card.js';
import { Droplet } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-crimson-50 text-crimson-600 border border-crimson-100 mb-2">
            <Droplet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to your donor account to view eligibility and records</p>
        </div>

        <Card className="shadow-md border-slate-200/90">
          <CardContent className="p-6 sm:p-8">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
