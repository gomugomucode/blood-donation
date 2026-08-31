import React from 'react';
import { User, Phone, MapPin, Calendar, Droplet, Clock } from 'lucide-react';
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
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-crimson-50 text-crimson-600 border border-crimson-100 flex items-center justify-center font-bold text-lg">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{profile.fullName}</h3>
                <BloodGroupBadge bloodGroup={profile.bloodGroup} />
              </div>
              <p className="text-xs text-slate-500">{profile.user?.email || 'Registered Donor'}</p>
            </div>
          </div>

          {profile.eligibility && (
            <EligibilityBadge isEligible={profile.eligibility.isEligible} />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date of Birth & Age
            </span>
            <p className="font-semibold text-slate-900">
              {formatDate(profile.dateOfBirth)} {age !== null && `(${age} yrs)`}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Contact Phone
            </span>
            <p className="font-semibold text-slate-900">{profile.contactNumber}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Last Donation
            </span>
            <p className="font-semibold text-slate-900">{formatDate(profile.lastDonationAt)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Location Address
            </span>
            <p className="font-semibold text-slate-900 truncate" title={profile.address}>
              {profile.address}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
