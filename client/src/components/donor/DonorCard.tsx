import React from 'react';
import { Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { DonorProfile } from '../../types/index.js';
import { Card, CardContent } from '../common/Card.js';
import { BloodGroupBadge, EligibilityBadge } from '../common/Badge.js';
import { formatDate, calculateAge } from '../../lib/utils.js';

export interface DonorCardProps {
  profile: DonorProfile;
  className?: string;
}

export const DonorCard: React.FC<DonorCardProps> = ({ profile, className }) => {
  const age = calculateAge(profile.dateOfBirth);

  return (
    <Card className={className}>
      <CardContent className="p-6 text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E5E4]/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] flex items-center justify-center font-bold text-lg">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">{profile.fullName}</h3>
                <BloodGroupBadge bloodGroup={profile.bloodGroup} />
              </div>
              <p className="text-xs text-[#667085]">{profile.user?.email || 'Registered Donor'}</p>
            </div>
          </div>

          {profile.eligibility && (
            <EligibilityBadge isEligible={profile.eligibility.isEligible} />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
          <div className="space-y-1">
            <span className="text-[#667085] flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
              Date of Birth & Age
            </span>
            <p className="font-semibold text-[#1F2937]">
              {formatDate(profile.dateOfBirth)} {age !== null && `(${age} yrs)`}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[#667085] flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
              Contact Phone
            </span>
            <p className="font-semibold text-[#1F2937]">{profile.contactNumber}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[#667085] flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
              Last Donation
            </span>
            <p className="font-semibold text-[#1F2937]">{formatDate(profile.lastDonationAt)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[#667085] flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
              Location Address
            </span>
            <p className="font-semibold text-[#1F2937] truncate" title={profile.address}>
              {profile.address}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
