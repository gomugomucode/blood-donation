import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Droplet,
  ArrowRight,
  Activity,
  Hospital,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';

export const HomePage: React.FC = () => {
  const [selectedBlood, setSelectedBlood] = useState('O-');

  const compatibilityMap: Record<string, { canDonateTo: string[]; canReceiveFrom: string[]; tag: string }> = {
    'O-': {
      canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      canReceiveFrom: ['O-'],
      tag: 'Universal Red-Cell Donor (Critical for trauma emergencies)',
    },
    'O+': {
      canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
      canReceiveFrom: ['O-', 'O+'],
      tag: 'Most Frequent Transfusion Demand',
    },
    'A-': {
      canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
      canReceiveFrom: ['O-', 'A-'],
      tag: 'Rare High-Demand Group',
    },
    'A+': {
      canDonateTo: ['A+', 'AB+'],
      canReceiveFrom: ['O-', 'O+', 'A-', 'A+'],
      tag: 'Second Most Common Blood Type',
    },
    'B-': {
      canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
      canReceiveFrom: ['O-', 'B-'],
      tag: 'Specialized Transfusion Match',
    },
    'B+': {
      canDonateTo: ['B+', 'AB+'],
      canReceiveFrom: ['O-', 'O+', 'B-', 'B+'],
      tag: 'Vital Platelet & Whole Blood Need',
    },
    'AB-': {
      canDonateTo: ['AB-', 'AB+'],
      canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'],
      tag: 'Universal Plasma & Rare Group',
    },
    'AB+': {
      canDonateTo: ['AB+'],
      canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      tag: 'Universal Red-Cell Recipient',
    },
  };

  const steps = [
    {
      num: '01',
      title: 'Register & Complete Basic Screening',
      desc: 'Create your secure account, declare your blood type and age eligibility, and set your outreach preferences.',
    },
    {
      num: '02',
      title: 'Receive Targeted Match Opportunities',
      desc: 'When a hospital care team in your region submits a compatible request, you receive a direct notification.',
    },
    {
      num: '03',
      title: 'Donate & Build Verified History',
      desc: 'Authorized clinical staff verify your donation on-site, recording an immutable record of your life-saving impact.',
    },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl border border-slate-800/80">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Verified Voluntary Blood Donor Registry
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              One voluntary donation can save up to <span className="text-rose-500 underline decoration-rose-500/40">three lives</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              HemaCare coordinates voluntary donors with regional blood banks and emergency hospital care teams. Fast, confidential, and verified.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/register">
                <Button size="lg" variant="critical" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register as a Donor
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800">
                  Donor Sign In
                </Button>
              </Link>
            </div>

            {/* Quick Live Stats Bar */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 max-w-lg text-left">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-white font-mono">100%</div>
                <div className="text-2xs text-slate-400 font-medium">Voluntary & Verified</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">56 Days</div>
                <div className="text-2xs text-slate-400 font-medium">Safe Donation Cadence</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-white font-mono">24/7</div>
                <div className="text-2xs text-slate-400 font-medium">Emergency Response</div>
              </div>
            </div>
          </div>

          {/* Decorative Droplet */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none hidden lg:block">
            <Droplet className="w-[420px] h-[420px] text-rose-500" />
          </div>
        </div>
      </section>

      {/* Interactive Blood Compatibility Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-card">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                ABO & Rh(D) Compatibility
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Interactive Blood Compatibility Explorer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Select your blood type to discover which patient groups you can safely help.
              </p>
            </div>

            {/* Blood Selector Pills */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {Object.keys(compatibilityMap).map((bt) => (
                <button
                  key={bt}
                  onClick={() => setSelectedBlood(bt)}
                  className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition-all ${
                    selectedBlood === bt
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold font-mono text-sm border border-rose-200">
                  {selectedBlood}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {compatibilityMap[selectedBlood].tag}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Patients Who Can Receive Your Red Blood Cells:
                </p>
                <div className="flex flex-wrap gap-2">
                  {compatibilityMap[selectedBlood].canDonateTo.map((target) => (
                    <span
                      key={target}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold font-mono text-xs border border-emerald-200 shadow-2xs"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 md:border-l md:border-slate-200 md:pl-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Blood Types You Can Receive In An Emergency:
              </p>
              <div className="flex flex-wrap gap-2">
                {compatibilityMap[selectedBlood].canReceiveFrom.map((source) => (
                  <span
                    key={source}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold font-mono text-xs border border-blue-200 shadow-2xs"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Donation Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">How HemaCare Works</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A secure clinical coordination loop connecting donors and hospitals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <Card key={step.num} className="p-6 space-y-4 border-slate-200/80 hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 font-mono font-extrabold flex items-center justify-center text-sm border border-rose-100">
                {step.num}
              </div>
              <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Security & Clinical Governance Trust Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Privacy Redaction Guarantee</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donors receive only necessary matching parameters (blood group, general facility, deadline). Patient diagnoses and identities are never exposed.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Anti-Fatigue Safeguards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our automated dispatch engine limits outreach frequency and enforces interval cooldowns, ensuring donors are never overwhelmed.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
              <Hospital className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Verified Medical Facility Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donation records are verified only after physical collection by authorized transfusion staff, maintaining unbroken clinical integrity.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
