import React from 'react';
import { Droplet, MapPin, Calendar, FileText } from 'lucide-react';
import { Donation } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import { EmptyState } from '../common/EmptyState.js';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card.js';

export interface DonationHistoryProps {
  donations: Donation[];
  className?: string;
}

export const DonationHistory: React.FC<DonationHistoryProps> = ({ donations, className }) => {
  if (donations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplet className="w-4 h-4 text-crimson-600" />
            Donation Records & History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Droplet}
            title="No Donations Recorded Yet"
            description="When you participate in a blood drive or donate at an authorized blood bank, your clinical donation records will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplet className="w-4 h-4 text-crimson-600" />
            Donation Records & History
          </CardTitle>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {donations.length} Lifetime Donation{donations.length === 1 ? '' : 's'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Date Donated</th>
                <th className="py-3 px-4">Donation Facility / Center</th>
                <th className="py-3 px-4">Clinical Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donations.map((donation, index) => (
                <tr key={donation.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    {donations.length - index}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(donation.donatedAt)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-crimson-500 shrink-0" />
                      {donation.location}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {donation.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {donations.map((donation, index) => (
            <div key={donation.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(donation.donatedAt)}
                </span>
                <span className="font-mono text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  #{donations.length - index}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-crimson-500 shrink-0" />
                {donation.location}
              </p>

              {donation.notes && (
                <p className="text-2xs text-slate-500 flex items-start gap-1">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  {donation.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
