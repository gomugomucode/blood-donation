import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Droplets,
  ArrowRight,
  Activity,
  Hospital,
  Lock,
  Heart,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Calendar,
  Sparkles,
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
      title: 'Register & Basic Screening',
      desc: 'Create your secure account, declare your blood type and age eligibility, and set confidential contact preferences.',
    },
    {
      num: '02',
      title: 'Get Matched Locally',
      desc: 'When a verified regional hospital enters a matching blood request, you receive a direct notification.',
    },
    {
      num: '03',
      title: 'Confirm Your Availability',
      desc: 'Review request urgency, distance, and facility location, then accept the donation opportunity.',
    },
    {
      num: '04',
      title: 'Donate & Build Record',
      desc: 'Transfusion specialists verify your donation on-site, recording an immutable log in your donor history.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-10 text-[#1F2937]">
      {/* 1. Human-Centered Two-Column Hero (Warm Soft Rose Surface #FFF7F8) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FFF7F8] border border-[#FFE4E8] p-6 sm:p-10 lg:p-14 relative overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Left Column: Copy & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF0F2] border border-[#FFE4E8] text-[#D92D45] text-xs font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-[#D92D45]" />
                BLOOD DONATION • HEMACARE
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-[#1F2937] tracking-tight leading-[1.15]">
                Your donation can help someone when they{' '}
                <span className="text-[#D92D45]">need it most</span>.
              </h1>

              <p className="text-sm sm:text-base text-[#667085] leading-relaxed max-w-xl">
                HemaCare coordinates voluntary blood donors with regional blood banks and emergency hospital care teams. Fast, confidential, and verified.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link to="/register">
                  <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Become a Donor
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline">
                    How It Works
                  </Button>
                </a>
              </div>

              {/* Supported Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-[#FFE4E8] max-w-lg">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1F2937] font-mono tabular-nums">24/7</div>
                  <div className="text-2xs sm:text-xs text-[#667085] font-medium">Emergency coordination</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#D92D45] font-mono tabular-nums">8 Groups</div>
                  <div className="text-2xs sm:text-xs text-[#667085] font-medium">ABO/Rh compatibility</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#15803D] font-mono tabular-nums">Verified</div>
                  <div className="text-2xs sm:text-xs text-[#667085] font-medium">Transfusion registry</div>
                </div>
              </div>
            </div>

            {/* Right Column: Warm Human Healthcare Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E5E4] shadow-card space-y-5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF0F2] text-[#D92D45] flex items-center justify-center border border-[#FFE4E8]">
                      <Heart className="w-5 h-5 fill-[#D92D45]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1F2937] block">Regional Blood Bank Sync</span>
                      <span className="text-[11px] text-[#667085]">Verified Healthcare Facilities</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] text-[11px] font-bold">
                    Active Registry
                  </span>
                </div>

                {/* Simulated Real Request Card */}
                <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#E7E5E4] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F2] text-[#D92D45] font-extrabold font-mono text-xs border border-[#FFE4E8]">
                        O−
                      </span>
                      <span className="text-xs font-bold text-[#1F2937]">Emergency Trauma Request</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FEF2F2] text-[#B42318] border border-[#FEE2E2]">
                      High Urgency
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-2xs text-[#667085] pt-1">
                    <div className="flex items-center gap-1.5">
                      <Hospital className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                      <span className="truncate">Lumbini Zonal Hospital</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                      <span>Butwal, Nepal</span>
                    </div>
                  </div>

                  {/* Fulfillment Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-2xs font-semibold">
                      <span className="text-[#667085]">Fulfillment</span>
                      <span className="text-[#1F2937] font-mono">4 / 8 units (50%)</span>
                    </div>
                    <div className="h-2 w-full bg-[#E7E5E4] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D92D45] rounded-full w-1/2 transition-all duration-300" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-2xs text-[#667085] pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                    Zero Patient PHI Shared
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                    Needed within 24h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Blood Compatibility Explorer (id="compatibility") */}
      <section id="compatibility" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E7E5E4] shadow-card space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1.5 text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D92D45] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#D92D45]" />
                ABO & Rh(D) Compatibility
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                Which blood type do you have?
              </h2>
              <p className="text-xs sm:text-sm text-[#667085]">
                Select your blood group to see who you can help and which groups you can receive in an emergency.
              </p>
            </div>

            {/* Blood Selector Cards */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(compatibilityMap).map((bt) => (
                <button
                  key={bt}
                  onClick={() => setSelectedBlood(bt)}
                  className={`px-3.5 py-2 rounded-xl font-bold font-mono text-xs sm:text-sm transition-all border cursor-pointer ${
                    selectedBlood === bt
                      ? 'bg-[#D92D45] text-white border-[#D92D45] shadow-xs'
                      : 'bg-white text-[#1F2937] border-[#E7E5E4] hover:bg-[#FFF7F8] hover:border-[#FFE4E8]'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          {/* Compatibility Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF9F7] p-6 sm:p-8 rounded-2xl border border-[#E7E5E4]">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1.5 rounded-xl bg-[#FFF0F2] text-[#D92D45] font-extrabold font-mono text-base border border-[#FFE4E8]">
                  {selectedBlood}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1F2937]">
                  {compatibilityMap[selectedBlood].tag}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  You Can Safely Donate Red Blood Cells To:
                </p>
                <div className="flex flex-wrap gap-2">
                  {compatibilityMap[selectedBlood].canDonateTo.map((target) => (
                    <span
                      key={target}
                      className="px-3 py-1.5 rounded-xl bg-[#F0FDF4] text-[#15803D] font-bold font-mono text-xs sm:text-sm border border-[#DCFCE7]"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left md:border-l md:border-[#E7E5E4] md:pl-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Blood Types You Can Receive In An Emergency:
                </p>
                <div className="flex flex-wrap gap-2">
                  {compatibilityMap[selectedBlood].canReceiveFrom.map((source) => (
                    <span
                      key={source}
                      className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] font-bold font-mono text-xs sm:text-sm border border-[#DBEAFE]"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-2xs text-[#667085] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                <span>
                  This is an informational red-cell compatibility guide. Final compatibility and eligibility are confirmed by qualified transfusion professionals.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How HemaCare Works (id="how-it-works") */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D92D45] uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            Simple & Safe Process
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
            How HemaCare Works
          </h2>
          <p className="text-xs sm:text-sm text-[#667085]">
            A confidential, physician-guided coordination network connecting voluntary donors with regional blood needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card key={step.num} className="p-6 space-y-4 border-[#E7E5E4] hover:shadow-card-hover transition-all text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF0F2] text-[#D92D45] font-mono font-extrabold flex items-center justify-center text-sm border border-[#FFE4E8]">
                {step.num}
              </div>
              <h3 className="text-base font-bold text-[#1F2937]">{step.title}</h3>
              <p className="text-xs text-[#667085] leading-relaxed">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Active Blood Requests Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFF7F8] rounded-3xl p-6 sm:p-10 border border-[#FFE4E8] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <span className="text-xs font-bold text-[#D92D45] uppercase tracking-wider block">
                Regional Transfusion Needs
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2937]">
                Active Hospital Blood Requests
              </h2>
            </div>
            <Link to="/register">
              <Button size="sm" variant="primary">
                Register to Help
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Card 1 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-card space-y-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl bg-[#FFF0F2] text-[#D92D45] font-extrabold font-mono text-sm border border-[#FFE4E8]">
                    O−
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">Emergency Trauma Care</h3>
                    <p className="text-xs text-[#667085] flex items-center gap-1">
                      <Hospital className="w-3.5 h-3.5" /> Lumbini Zonal Hospital • Butwal
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B42318] border border-[#FEE2E2] text-2xs font-bold">
                  CRITICAL
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#667085]">Fulfillment</span>
                  <span className="text-[#1F2937] font-mono font-semibold">4 / 8 units fulfilled</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F7] border border-[#E7E5E4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D92D45] rounded-full w-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between text-2xs text-[#667085] pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Needed by: Today
                </span>
                <Link to="/login" className="text-[#D92D45] font-semibold hover:underline">
                  Respond to Request →
                </Link>
              </div>
            </div>

            {/* Request Card 2 */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-card space-y-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl bg-[#FFF0F2] text-[#D92D45] font-extrabold font-mono text-sm border border-[#FFE4E8]">
                    A+
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">Surgical Transfusion Need</h3>
                    <p className="text-xs text-[#667085] flex items-center gap-1">
                      <Hospital className="w-3.5 h-3.5" /> Kathmandu Medical Center • Kathmandu
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7] text-2xs font-bold">
                  HIGH
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#667085]">Fulfillment</span>
                  <span className="text-[#1F2937] font-mono font-semibold">2 / 4 units fulfilled</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F7] border border-[#E7E5E4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D92D45] rounded-full w-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between text-2xs text-[#667085] pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Needed by: Within 48 hours
                </span>
                <Link to="/login" className="text-[#D92D45] font-semibold hover:underline">
                  Respond to Request →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Clinical Governance & Privacy Safeguards Panel (Warm White Surfaces #FFFFFF) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E7E5E4] shadow-card grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center border border-[#DCFCE7]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">Privacy Redaction Guarantee</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Donors receive only necessary matching parameters (blood group, general facility, deadline). Patient diagnoses, medical record numbers, and identities are never exposed.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0F2] text-[#D92D45] flex items-center justify-center border border-[#FFE4E8]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">Anti-Fatigue Safeguards</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Our automated dispatch engine limits outreach frequency and enforces interval cooldowns (56 days for whole blood), ensuring donors are never overwhelmed.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center border border-[#DBEAFE]">
              <Hospital className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">Verified Clinical Facility Sync</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Donation records are verified only after physical collection by authorized transfusion staff, maintaining unbroken clinical integrity across all regional hospitals.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
