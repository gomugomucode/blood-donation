import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Droplet, Users, CalendarCheck, ArrowRight, Activity } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';

export const HomePage: React.FC = () => {
  const bloodTypes = [
    { type: 'O-', role: 'Universal Red Cell Donor', desc: 'Can be given to patients of any blood type in emergency trauma.' },
    { type: 'O+', role: 'Most Common Blood Type', desc: 'Crucial for high-volume transfusions and scheduled surgeries.' },
    { type: 'A+', role: 'Second Most Common Type', desc: 'Critical for whole blood and targeted platelet donations.' },
    { type: 'AB+', role: 'Universal Plasma Donor', desc: 'Plasma can be safely received by patients with any blood group.' },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-600/30 border border-crimson-500/40 text-crimson-300 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-crimson-400" />
              Verified Voluntary Blood Donor Registry
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              One voluntary donation can save up to <span className="text-crimson-500">three lives</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              HemaCare provides a secure, clinically structured platform connecting voluntary donors with verified blood drives, tracking personal eligibility in real-time.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register as a Donor
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-800">
                  Donor Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative Background Accent */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden lg:flex items-center justify-center">
            <Droplet className="w-96 h-96 text-crimson-500" />
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Why Donate with HemaCare?</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A standard, medical-first digital infrastructure for blood registries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-crimson-50 text-crimson-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Real-Time Eligibility</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated standard 56-day interval tracking and age verification keep you informed exactly when you are safe to donate next.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Verified Clinical History</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every donation procedure is verified by authorized clinical staff, generating an immutable lifetime record for each donor.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Privacy & Security</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strict role-based authorization ensures your personal contact information and medical indicators remain strictly confidential.
            </p>
          </Card>
        </div>
      </section>

      {/* Blood Group Compatibility Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 rounded-2xl p-6 sm:p-10 border border-slate-200/80">
          <div className="max-w-2xl mb-8 space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Understanding Blood Compatibility</h2>
            <p className="text-xs text-slate-500">
              Every blood type plays an indispensable role in maintaining regional emergency reserves.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bloodTypes.map((item) => (
              <div key={item.type} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="inline-block px-2.5 py-1 rounded-md bg-crimson-50 text-crimson-700 font-extrabold text-sm border border-crimson-200">
                  {item.type}
                </div>
                <h4 className="text-xs font-bold text-slate-900">{item.role}</h4>
                <p className="text-2xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
