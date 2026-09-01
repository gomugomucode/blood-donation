import React from 'react';
import { Droplets, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
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
      <div className={`bg-white rounded-2xl p-6 sm:p-8 border border-[#E7E5E4] shadow-card ${className || ''}`}>
        <EmptyState
          icon={Droplets}
          title="No Verified Donations Recorded Yet"
          description="When you complete a voluntary donation at an authorized regional blood drive or hospital collection center, clinical staff will register your verified record here."
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-[#E7E5E4] shadow-card overflow-hidden text-left ${className || ''}`}>
      <div className="p-5 sm:p-6 border-b border-[#E7E5E4]/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FFF0F2] text-[#D92D45] flex items-center justify-center border border-[#FFE4E8]">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2937]">Donation Records & Clinical Stamps</h2>
            <p className="text-2xs text-[#667085]">Verified by authorized transfusion coordinators</p>
          </div>
        </div>

        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#FAF9F7] text-[#1F2937] border border-[#E7E5E4] font-mono tabular-nums">
          {donations.length} Lifetime Donation{donations.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Desktop Table View with small crimson markers */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-[#667085]">
          <thead className="bg-[#FAF9F7] text-[#1F2937] font-bold border-b border-[#E7E5E4] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-6">Record #</th>
              <th className="py-3.5 px-6">Collection Date</th>
              <th className="py-3.5 px-6">Verified Facility</th>
              <th className="py-3.5 px-6">Clinical Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4]/60">
            {donations.map((donation, index) => (
              <tr key={donation.id} className="hover:bg-[#FAF9F7] transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-[#667085]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D92D45]" />
                    #{donations.length - index}
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-[#1F2937]">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    {formatDate(donation.donatedAt)}
                  </span>
                </td>
                <td className="py-4 px-6 text-[#1F2937] font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D92D45] shrink-0" />
                    {donation.location}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] font-semibold border border-[#DCFCE7] text-2xs">
                    <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                    Verified On-Site
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden divide-y divide-[#E7E5E4]/60">
        {donations.map((donation, index) => (
          <div key={donation.id} className="p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D92D45]" />
                <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                {formatDate(donation.donatedAt)}
              </span>
              <span className="font-mono text-2xs px-2 py-0.5 rounded-md bg-[#FAF9F7] text-[#667085] border border-[#E7E5E4] font-bold">
                Record #{donations.length - index}
              </span>
            </div>

            <p className="text-xs font-semibold text-[#1F2937] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D92D45] shrink-0" />
              {donation.location}
            </p>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] font-semibold border border-[#DCFCE7] text-2xs">
                <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                Verified Clinical Collection
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
