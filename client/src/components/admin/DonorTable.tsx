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
    <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-card overflow-hidden text-left">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs text-[#667085]">
          <thead className="bg-[#FAF9F7] text-[#1F2937] font-bold border-b border-[#E7E5E4] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Donor Name & Info</th>
              <th className="py-3.5 px-4">Blood Group</th>
              <th className="py-3.5 px-4">Contact Phone</th>
              <th className="py-3.5 px-4">Last Donation</th>
              <th className="py-3.5 px-4">Eligibility</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4]/60">
            {donors.map((donor) => {
              const age = calculateAge(donor.dateOfBirth);
              const isDeactivated = Boolean(donor.deletedAt);

              return (
                <tr
                  key={donor.id}
                  className={`hover:bg-[#FAF9F7] transition-colors ${
                    isDeactivated ? 'bg-[#FAF9F7]/70 opacity-75' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] flex items-center justify-center font-bold shrink-0">
                        {donor.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F2937]">{donor.fullName}</span>
                          {isDeactivated && <Badge variant="danger" size="sm">Deactivated</Badge>}
                        </div>
                        <p className="text-2xs text-[#667085]">
                          {donor.user?.email || 'Registered'} • {age} yrs
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-[#1F2937]">
                    {donor.contactNumber}
                  </td>

                  <td className="py-3.5 px-4 text-[#1F2937] font-medium">
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
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4 text-[#667085]" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(donor)}
                        title="Edit Donor Information"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4 text-[#667085]" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRecordDonation(donor)}
                        title="Record Blood Donation"
                        disabled={isDeactivated}
                        className="h-8 w-8 p-0 text-[#D92D45] hover:text-[#B42318] hover:bg-[#FFF0F2]"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </Button>

                      {!isDeactivated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeactivate(donor)}
                          title="Deactivate Donor"
                          className="h-8 w-8 p-0 text-[#B42318] hover:text-[#7F1D1D] hover:bg-[#FEF2F2]"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className="block lg:hidden divide-y divide-[#E7E5E4]/60">
        {donors.map((donor) => {
          const age = calculateAge(donor.dateOfBirth);
          const isDeactivated = Boolean(donor.deletedAt);

          return (
            <div key={donor.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#1F2937]">{donor.fullName}</h4>
                    <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                  </div>
                  <p className="text-xs text-[#667085]">{donor.user?.email} • {age} yrs</p>
                </div>
                {donor.eligibility && (
                  <EligibilityBadge isEligible={donor.eligibility.isEligible} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#667085]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>{donor.contactNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Last: {formatDate(donor.lastDonationAt)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E4]">
                <span className="text-2xs text-[#667085] flex items-center gap-1 truncate max-w-[150px]">
                  <MapPin className="w-3 h-3 text-[#9CA3AF]" />
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
