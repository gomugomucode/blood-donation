import React from 'react';
import { Droplet, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { Donation } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import { EmptyState } from '../common/EmptyState.js';

export interface DonationHistoryProps {
  donations: Donation[];
  className?: string;
}

export const DonationHistory: React.FC<DonationHistoryProps> = ({ donations, className }) => {
  if (donations.length === 0) {
    return (
      <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card ${className || ''}`}>
        <EmptyState
          icon={Droplet}
          title="No Verified Donations Recorded Yet"
          description="When you complete a voluntary donation at an authorized regional blood drive or hospital collection center, authorized staff will register your verified record here."
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden ${className || ''}`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Donation Records & Clinical Stamps</h2>
            <p className="text-2xs text-slate-500">Verified by authorized transfusion coordinators</p>
          </div>
        </div>

        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-mono">
          {donations.length} Lifetime Donation{donations.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-6">Record #</th>
              <th className="py-3.5 px-6">Collection Date</th>
              <th className="py-3.5 px-6">Verified Facility</th>
              <th className="py-3.5 px-6">Clinical Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donations.map((donation, index) => (
              <tr key={donation.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-slate-400">
                  #{donations.length - index}
                </td>
                <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(donation.donatedAt)}
                </td>
                <td className="py-4 px-6 text-slate-800 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    {donation.location}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified On-Site
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden divide-y divide-slate-100">
        {donations.map((donation, index) => (
          <div key={donation.id} className="p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(donation.donatedAt)}
              </span>
              <span className="font-mono text-2xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                Record #{donations.length - index}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              {donation.location}
            </p>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Clinical Collection
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
