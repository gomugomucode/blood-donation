import React from 'react';
import { RegistrationForm } from '../components/auth/RegistrationForm.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { HeartHandshake } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="py-8 px-4 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-crimson-50 text-crimson-600 border border-crimson-100 mb-2">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register as a Blood Donor</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Join the voluntary donor registry. Your contact and clinical details are kept strictly confidential.
        </p>
      </div>

      <Card className="shadow-md border-slate-200/90">
        <CardContent className="p-6 sm:p-8">
          <RegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
};
