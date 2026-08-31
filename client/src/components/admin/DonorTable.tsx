import React from 'react';
import { Eye, Edit, PlusCircle, Trash2, Phone, Clock, MapPin } from 'lucide-react';
import { DonorProfile } from '../../types/index.js';
import { BloodGroupBadge, EligibilityBadge, Badge } from '../common/Badge.js';
import { formatDate, calculateAge } from '../../lib/utils.js';
import { Button } from '../common/Button.js';

export interface DonorTableProps {
  donors: DonorProfile[];
  onView: (donor: DonorProfile) => void;
  onEdit: (donor: DonorProfile) => void;
  onRecordDonation: (donor: DonorProfile) => void;
  onDeactivate: (donor: DonorProfile) => void;
}

export const DonorTable: React.FC<DonorTableProps> = ({
  donors,
  onView,
  onEdit,
  onRecordDonation,
  onDeactivate,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-2xs">
            <tr>
              <th className="py-3 px-4">Donor Name & Info</th>
              <th className="py-3 px-4">Blood Group</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Last Donation</th>
              <th className="py-3 px-4">Eligibility</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donors.map((donor) => {
              const age = calculateAge(donor.dateOfBirth);
              const isDeactivated = Boolean(donor.deletedAt);

              return (
                <tr
                  key={donor.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isDeactivated ? 'bg-slate-50/60 opacity-75' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-crimson-50 text-crimson-700 border border-crimson-100 flex items-center justify-center font-bold shrink-0">
                        {donor.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{donor.fullName}</span>
                          {isDeactivated && <Badge variant="danger" size="sm">Deactivated</Badge>}
                        </div>
                        <p className="text-2xs text-slate-500">
                          {donor.user?.email || 'Registered'} • {age} yrs
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                    {donor.contactNumber}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {formatDate(donor.lastDonationAt)}
                  </td>

                  <td className="py-3.5 px-4">
                    {donor.eligibility && (
                      <EligibilityBadge isEligible={donor.eligibility.isEligible} />
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(donor)}
                        title="View Full Profile & History"
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(donor)}
                        title="Edit Donor Information"
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRecordDonation(donor)}
                        title="Record Blood Donation"
                        disabled={isDeactivated}
                        className="h-7 w-7 p-0 text-crimson-600 hover:text-crimson-700 hover:bg-crimson-50"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </Button>

                      {!isDeactivated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeactivate(donor)}
                          title="Deactivate Donor"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="block lg:hidden divide-y divide-slate-100">
        {donors.map((donor) => {
          const age = calculateAge(donor.dateOfBirth);
          const isDeactivated = Boolean(donor.deletedAt);

          return (
            <div key={donor.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{donor.fullName}</h4>
                    <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                  </div>
                  <p className="text-xs text-slate-500">{donor.user?.email} • {age} yrs</p>
                </div>
                {donor.eligibility && (
                  <EligibilityBadge isEligible={donor.eligibility.isEligible} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{donor.contactNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last: {formatDate(donor.lastDonationAt)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-2xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {donor.address}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => onView(donor)}>
                    Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onRecordDonation(donor)}
                    disabled={isDeactivated}
                  >
                    + Donation
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
